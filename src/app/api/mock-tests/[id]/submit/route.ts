import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import MockTest from '@/models/MockTest'
import MockResult from '@/models/MockResult'
import Question from '@/models/Question'
import DailyTask from '@/models/DailyTask'
import StudyPlan from '@/models/StudyPlan'
import mongoose from 'mongoose'
import { SCORE_SCALING, WEAK_AREA_RECOMMENDATIONS } from '@/constants/questionTypes'

function calcScaledScore(examType: string, pct: number): string {
  if (examType === 'IELTS') {
    const mapping = SCORE_SCALING.IELTS
    for (const entry of mapping) {
      if (pct >= entry.minPct && pct < entry.maxPct) return entry.band
    }
    return '9.0'
  }
  if (examType === 'TOEFL') {
    return String(Math.round((pct / 100) * 120))
  }
  if (examType === 'SAT') {
    return String(Math.round((pct / 100) * 1600 / 10) * 10)
  }
  if (examType === 'JLPT') {
    // Simple pass/fail based on 60% threshold
    return pct >= 60 ? 'PASS' : 'FAIL'
  }
  return `${Math.round(pct)}%`
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const test = await MockTest.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(payload.userId),
      status: 'in_progress',
    })
    if (!test) return NextResponse.json({ success: false, error: 'Test not found or already submitted' }, { status: 404 })

    const now = new Date()
    const timeTakenMins = Math.round((now.getTime() - test.startedAt.getTime()) / 60000)

    // Mark complete
    test.status = 'completed'
    test.completedAt = now

    // Populate questions for section scoring
    const questionIds = test.questions.map(q => q.questionId)
    const questions = await Question.find({ _id: { $in: questionIds } }).lean()
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]))

    // Build section scores
    const sectionMap = new Map<string, { earned: number; total: number }>()
    let totalCorrect = 0
    const essayCount = questions.filter(q => q.questionType === 'essay').length
    const gradableTotal = questions.length - essayCount

    for (const qEmbed of test.questions) {
      const q = questionMap.get(qEmbed.questionId.toString())
      if (!q) continue
      const section = q.section ?? 'General'
      if (!sectionMap.has(section)) sectionMap.set(section, { earned: 0, total: 0 })
      const sec = sectionMap.get(section)!
      if (q.questionType !== 'essay') {
        sec.total += q.points ?? 1
        if (qEmbed.isCorrect === true) {
          sec.earned += q.points ?? 1
          totalCorrect++
        }
      }
    }

    const sectionScores = Array.from(sectionMap.entries()).map(([section, { earned, total }]) => {
      const pct = total > 0 ? Math.round((earned / total) * 100) : 0
      return {
        section,
        score: earned,
        maxScore: total,
        percentage: pct,
        weakAreas: pct < 60 ? [section] : [],
      }
    })

    const totalScore = gradableTotal > 0 ? Math.round((totalCorrect / gradableTotal) * 100) : 0
    const scaledScore = calcScaledScore(test.examType, totalScore)

    const weakAreas = sectionScores.filter(s => s.percentage < 60).map(s => s.section)
    const strongAreas = sectionScores.filter(s => s.percentage >= 80).map(s => s.section)

    const recommendations = weakAreas
      .slice(0, 5)
      .map(area => WEAK_AREA_RECOMMENDATIONS[area] ?? `Focus on ${area} practice`)

    await test.save()

    const result = await MockResult.create({
      userId: payload.userId,
      planId: test.planId,
      testId: test._id,
      examType: test.examType,
      testMode: test.testMode,
      totalScore,
      scaledScore,
      sectionScores,
      totalQuestions: questions.length,
      correctAnswers: totalCorrect,
      timeTakenMins,
      weakAreas,
      strongAreas,
      recommendations,
    })

    // Mark linked task completed
    if (test.taskId) {
      await DailyTask.findByIdAndUpdate(test.taskId, {
        completed: true,
        completedAt: now,
      })
      // Recalculate plan progress
      const allTasks = await DailyTask.find({ planId: test.planId }).lean()
      const done = allTasks.filter(t => t.completed).length
      const pct = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0
      await StudyPlan.findByIdAndUpdate(test.planId, { overallProgress: pct })
    }

    return NextResponse.json({
      success: true,
      data: {
        ...result.toObject(),
        _id: result._id.toString(),
        userId: result.userId.toString(),
        planId: result.planId.toString(),
        testId: result.testId.toString(),
      },
    })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
