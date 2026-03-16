import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import MockResult from '@/models/MockResult'
import MockTest from '@/models/MockTest'
import DailyTask from '@/models/DailyTask'
import StudyPlan from '@/models/StudyPlan'
import Milestone from '@/models/Milestone'
import mongoose from 'mongoose'
import { differenceInDays, format, addDays, startOfDay, getDay } from 'date-fns'

const WEAK_AREA_RECOMMENDATIONS: Record<string, string> = {
  'Reading': 'Practice skimming and scanning techniques with timed exercises.',
  'Listening': 'Listen to podcasts and note specific details, then summarize.',
  'Writing': 'Study band descriptors, practice with model answers and cohesive devices.',
  'Speaking': 'Record yourself speaking on topics and compare to model answers.',
  'Vocabulary': 'Learn 10 new academic words daily using spaced repetition.',
  'Grammar': 'Focus on complex sentence structures and review common error patterns.',
}

function getRecommendation(area: string): string {
  for (const [key, rec] of Object.entries(WEAK_AREA_RECOMMENDATIONS)) {
    if (area.toLowerCase().includes(key.toLowerCase())) return rec
  }
  return `Review materials related to ${area} and practice regularly.`
}

function getRelatedSections(area: string): string[] {
  const lower = area.toLowerCase()
  if (lower.includes('reading')) return ['Reading']
  if (lower.includes('listening')) return ['Listening']
  if (lower.includes('writing')) return ['Writing']
  if (lower.includes('speaking')) return ['Speaking']
  if (lower.includes('grammar')) return ['Writing', 'Speaking']
  if (lower.includes('vocabulary')) return ['Reading', 'Writing']
  return []
}

function calcStreak(completedDates: Date[]): { current: number; longest: number } {
  if (completedDates.length === 0) return { current: 0, longest: 0 }

  const uniqueDays = [...new Set(completedDates.map(d => startOfDay(d).getTime()))].sort((a, b) => b - a)
  const today = startOfDay(new Date()).getTime()
  const yesterday = startOfDay(addDays(new Date(), -1)).getTime()

  let current = 0
  if (uniqueDays[0] === today || uniqueDays[0] === yesterday) {
    current = 1
    for (let i = 1; i < uniqueDays.length; i++) {
      const diff = Math.round((uniqueDays[i - 1] - uniqueDays[i]) / 86400000)
      if (diff === 1) current++
      else break
    }
  }

  let longest = 1
  let run = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const diff = Math.round((uniqueDays[i - 1] - uniqueDays[i]) / 86400000)
    if (diff === 1) { run++; if (run > longest) longest = run }
    else run = 1
  }

  return { current, longest: Math.max(current, longest) }
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const userId = new mongoose.Types.ObjectId(payload.userId)
    const { searchParams } = new URL(req.url)
    const planIdParam = searchParams.get('planId')
    const examTypeParam = searchParams.get('examType')

    const allPlans = await StudyPlan.find({ userId }).lean()
    if (allPlans.length === 0) {
      return NextResponse.json({ success: false, error: 'No study plans found' }, { status: 404 })
    }

    let plan = allPlans[0]
    if (planIdParam) {
      const found = allPlans.find(p => p._id.toString() === planIdParam)
      if (found) plan = found
    } else if (examTypeParam) {
      const found = allPlans.find(p => p.examType === examTypeParam)
      if (found) plan = found
    }

    const planObjectId = plan._id as mongoose.Types.ObjectId

    const resultFilter: Record<string, unknown> = { userId }
    if (planIdParam) resultFilter.planId = planObjectId

    const [results, allTasks, milestones] = await Promise.all([
      MockResult.find(resultFilter).sort({ createdAt: 1 }).lean(),
      DailyTask.find({ userId, planId: planObjectId }).lean(),
      Milestone.find({ userId, planId: planObjectId }).lean(),
    ])

    const testIds = results.map(r => r.testId)
    const mockTests = await MockTest.find({ _id: { $in: testIds } }, { _id: 1, examSetName: 1, isRetake: 1 }).lean()
    const mockTestMap = new Map(mockTests.map(t => [t._id.toString(), t]))

    // ── Overview ──────────────────────────────────────────────────────────
    const completedTasks = allTasks.filter(t => t.completed)
    const completedDates = completedTasks.map(t => new Date(t.completedAt ?? t.scheduledDate))
    const { current: currentStreak, longest: longestStreak } = calcStreak(completedDates)
    const totalStudyMins = completedTasks.reduce((sum, t) => sum + t.durationMins, 0)
    const uniqueStudyDays = new Set(completedDates.map(d => startOfDay(d).getTime())).size
    const daysUntilExam = plan.examDate ? Math.max(0, differenceInDays(new Date(plan.examDate), new Date())) : null

    const overview = {
      totalStudyMins,
      totalStudyHours: (totalStudyMins / 60).toFixed(1) + ' hrs',
      totalSessionDays: uniqueStudyDays,
      currentStreak,
      longestStreak,
      overallProgress: plan.overallProgress,
      daysUntilExam,
      examDate: plan.examDate ? new Date(plan.examDate).toISOString() : null,
      examType: plan.examType,
      targetScore: plan.targetScore,
    }

    // ── Score History ─────────────────────────────────────────────────────
    const scoreHistory = results.map(r => {
      const mt = mockTestMap.get(r.testId.toString())
      return {
        testId: r.testId.toString(),
        examSetName: mt?.examSetName ?? null,
        examType: r.examType,
        testMode: r.testMode,
        scaledScore: r.scaledScore,
        totalScore: r.totalScore,
        sectionScores: r.sectionScores.map(s => ({ section: s.section, percentage: s.percentage })),
        takenAt: r.createdAt.toISOString(),
        isRetake: mt?.isRetake ?? false,
      }
    })

    // ── Section Breakdown ─────────────────────────────────────────────────
    const sectionMap = new Map<string, number[]>()
    for (const r of results) {
      for (const s of r.sectionScores) {
        if (!sectionMap.has(s.section)) sectionMap.set(s.section, [])
        sectionMap.get(s.section)!.push(s.percentage)
      }
    }

    const sectionBreakdown = Array.from(sectionMap.entries())
      .filter(([, scores]) => scores.length > 0)
      .map(([section, scores]) => {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length
        const best = Math.max(...scores)
        const worst = Math.min(...scores)
        let trend: 'improving' | 'declining' | 'stable' = 'stable'
        if (scores.length >= 6) {
          const firstAvg = scores.slice(0, 3).reduce((a, b) => a + b, 0) / 3
          const lastAvg = scores.slice(-3).reduce((a, b) => a + b, 0) / 3
          const diff = lastAvg - firstAvg
          if (diff > 5) trend = 'improving'
          else if (diff < -5) trend = 'declining'
        }
        return { section, averageScore: Math.round(avg), bestScore: best, worstScore: worst, totalAttempts: scores.length, trend }
      })

    // ── Weak Area Analysis ────────────────────────────────────────────────
    const weakAreaMap = new Map<string, { count: number; lastSeen: Date }>()
    for (const r of results) {
      for (const area of r.weakAreas ?? []) {
        const existing = weakAreaMap.get(area)
        const date = r.createdAt
        if (!existing) {
          weakAreaMap.set(area, { count: 1, lastSeen: date })
        } else {
          existing.count++
          if (date > existing.lastSeen) existing.lastSeen = date
        }
      }
    }

    const weakAreaAnalysis = Array.from(weakAreaMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([area, { count, lastSeen }]) => ({
        area,
        frequency: count,
        lastSeen: lastSeen.toISOString(),
        recommendation: getRecommendation(area),
        relatedSections: getRelatedSections(area),
      }))

    // ── Study Time Stats ──────────────────────────────────────────────────
    const skillMap = new Map<string, number>()
    const dayMinsMap = new Map<number, number>()
    const weekMap = new Map<number, { completed: number; target: number }>()
    let longestSession = 0

    for (const t of allTasks) {
      const weekKey = t.weekNumber
      if (!weekMap.has(weekKey)) weekMap.set(weekKey, { completed: 0, target: 0 })
      weekMap.get(weekKey)!.target += t.durationMins

      if (t.completed) {
        skillMap.set(t.skillFocus, (skillMap.get(t.skillFocus) ?? 0) + t.durationMins)
        weekMap.get(weekKey)!.completed += t.durationMins
        if (t.durationMins > longestSession) longestSession = t.durationMins
        const completedDate = new Date(t.completedAt ?? t.scheduledDate)
        const dayOfWeek = getDay(completedDate)
        dayMinsMap.set(dayOfWeek, (dayMinsMap.get(dayOfWeek) ?? 0) + t.durationMins)
      }
    }

    const totalSkillMins = Array.from(skillMap.values()).reduce((a, b) => a + b, 0) || 1
    const bySkill = Array.from(skillMap.entries())
      .map(([skill, mins]) => ({ skill, mins, percentage: Math.round((mins / totalSkillMins) * 100) }))
      .sort((a, b) => b.mins - a.mins)

    const planStart = new Date(plan.startDate)
    const byWeek = Array.from(weekMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([week, { completed, target }]) => {
        const weekStart = addDays(planStart, (week - 1) * 7)
        const weekEnd = addDays(weekStart, 6)
        return {
          week,
          weekLabel: `Week ${week} · ${format(weekStart, 'MMM d')}–${format(weekEnd, 'd')}`,
          completedMins: completed,
          targetMins: target,
          completionRate: target > 0 ? Math.round((completed / target) * 100) : 0,
        }
      })

    const activeDays = uniqueStudyDays || 1
    const dailyAvgMins = Math.round(totalStudyMins / activeDays)
    let mostProductiveDay = 'Monday'
    let maxDayMins = 0
    dayMinsMap.forEach((mins, day) => { if (mins > maxDayMins) { maxDayMins = mins; mostProductiveDay = DAY_NAMES[day] } })

    const studyTimeStats = { totalMins: totalStudyMins, bySkill, byWeek, dailyAvgMins, mostProductiveDay, longestSession }

    // ── Milestones ────────────────────────────────────────────────────────
    const milestoneData = milestones.map(m => {
      const targetDate = new Date(m.targetDate)
      const achievedAt = m.achievedAt ? new Date(m.achievedAt) : null
      let daysEarly: number | undefined
      let daysLate: number | undefined
      if (achievedAt) {
        const diff = differenceInDays(targetDate, achievedAt)
        if (diff > 0) daysEarly = diff
        else if (diff < 0) daysLate = Math.abs(diff)
      }
      return {
        _id: m._id.toString(),
        title: m.title,
        description: m.description,
        weekNumber: m.weekNumber,
        targetDate: targetDate.toISOString(),
        achieved: m.achieved,
        achievedAt: achievedAt?.toISOString() ?? null,
        daysEarly,
        daysLate,
      }
    })

    // ── Plan Comparison ───────────────────────────────────────────────────
    let planComparison: object[] = []
    if (allPlans.length > 1) {
      const allResults = await MockResult.find({ userId }).lean()
      planComparison = allPlans.map(p => {
        const planResults = allResults.filter(r => r.planId.toString() === p._id.toString())
        const sorted = [...planResults].sort((a, b) => b.totalScore - a.totalScore)
        const best = sorted[0] ?? null
        const latest = planResults.length > 0 ? planResults[planResults.length - 1] : null
        return {
          planId: p._id.toString(),
          examType: p.examType,
          targetScore: p.targetScore,
          testsCount: planResults.length,
          bestScore: best?.scaledScore ?? '—',
          latestScore: latest?.scaledScore ?? '—',
          status: p.status,
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: { overview, scoreHistory, sectionBreakdown, weakAreaAnalysis, studyTimeStats, milestones: milestoneData, planComparison },
    })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
