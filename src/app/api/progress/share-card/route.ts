import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import MockResult from '@/models/MockResult'
import DailyTask from '@/models/DailyTask'
import StudyPlan from '@/models/StudyPlan'
import mongoose from 'mongoose'
import { differenceInDays, startOfDay, addDays } from 'date-fns'

function calcCurrentStreak(completedDates: Date[]): number {
  if (completedDates.length === 0) return 0
  const uniqueDays = [...new Set(completedDates.map(d => startOfDay(d).getTime()))].sort((a, b) => b - a)
  const today = startOfDay(new Date()).getTime()
  const yesterday = startOfDay(addDays(new Date(), -1)).getTime()
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0
  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    if (Math.round((uniqueDays[i - 1] - uniqueDays[i]) / 86400000) === 1) streak++
    else break
  }
  return streak
}

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()
    const userId = new mongoose.Types.ObjectId(payload.userId)
    const { searchParams } = new URL(req.url)
    const planIdParam = searchParams.get('planId')

    const allPlans = await StudyPlan.find({ userId }).lean()
    if (allPlans.length === 0) return NextResponse.json({ success: false, error: 'No plans found' }, { status: 404 })

    let plan = allPlans[0]
    if (planIdParam) {
      const found = allPlans.find(p => p._id.toString() === planIdParam)
      if (found) plan = found
    }

    const planObjectId = plan._id as mongoose.Types.ObjectId

    const [results, completedTasks] = await Promise.all([
      MockResult.find({ userId, planId: planObjectId }).sort({ createdAt: 1 }).lean(),
      DailyTask.find({ userId, planId: planObjectId, completed: true }).lean(),
    ])

    const totalStudyMins = completedTasks.reduce((sum, t) => sum + t.durationMins, 0)
    const completedDates = completedTasks.map(t => new Date(t.completedAt ?? t.scheduledDate))
    const currentStreak = calcCurrentStreak(completedDates)
    const daysUntilExam = Math.max(0, differenceInDays(new Date(plan.examDate), new Date()))

    const sortedByScore = [...results].sort((a, b) => b.totalScore - a.totalScore)
    const best = sortedByScore[0]

    const allWeakAreas = results.flatMap(r => r.weakAreas ?? [])
    const weakAreaCounts = new Map<string, number>()
    for (const area of allWeakAreas) weakAreaCounts.set(area, (weakAreaCounts.get(area) ?? 0) + 1)
    const latestWeakAreas = [...weakAreaCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([area]) => area)

    // Get user name from User model via auth
    const User = (await import('@/models/User')).default
    const user = await User.findById(userId).lean()

    return NextResponse.json({
      success: true,
      data: {
        userName: (user as { name?: string })?.name ?? 'Student',
        examType: plan.examType,
        targetScore: plan.targetScore,
        currentBestScore: best?.scaledScore ?? '—',
        overallProgress: plan.overallProgress,
        currentStreak,
        totalStudyHours: (totalStudyMins / 60).toFixed(1) + 'h',
        testsCompleted: results.length,
        latestWeakAreas,
        daysUntilExam,
        planStartDate: new Date(plan.startDate).toISOString(),
      },
    })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
