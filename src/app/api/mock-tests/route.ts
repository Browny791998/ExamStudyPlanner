import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import MockTest from '@/models/MockTest'
import MockResult from '@/models/MockResult'
import Question from '@/models/Question'
import ExamSet from '@/models/ExamSet'
import StudyPlan from '@/models/StudyPlan'
import User from '@/models/User'
import mongoose from 'mongoose'
import { TEST_CONFIG } from '@/constants/questionTypes'

type ExamTypeKey = keyof typeof TEST_CONFIG

export async function POST(req: NextRequest) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const body = await req.json()
    const {
      examType,
      testMode,
      section,
      taskId,
      examSetId,
      includeCustomQuestions,
      isScheduled,
      isRetake,
    } = body as {
      examType: ExamTypeKey
      testMode: 'full' | 'section' | 'drill'
      section?: string
      taskId?: string
      examSetId?: string
      includeCustomQuestions?: boolean
      isScheduled?: boolean
      isRetake?: boolean
    }

    if (!examType || !testMode) {
      return NextResponse.json({ success: false, error: 'examType and testMode are required' }, { status: 400 })
    }

    const config = TEST_CONFIG[examType]
    if (!config) return NextResponse.json({ success: false, error: 'Invalid examType' }, { status: 400 })

    const user = await User.findById(payload.userId).lean()
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })

    const activePlan =
      await StudyPlan.findOne({ userId: payload.userId, examType, status: 'active' }).lean() ??
      await StudyPlan.findOne({ userId: payload.userId, status: 'active' }).lean()
    if (!activePlan) return NextResponse.json({ success: false, error: 'No active study plan' }, { status: 400 })

    let questions: Record<string, unknown>[]
    let timeMins: number
    let resolvedExamSetId: mongoose.Types.ObjectId | null = null
    let resolvedExamSetName: string | null = null

    if (examSetId) {
      // Exam-set based test: load questions from the exam set
      const examSet = await ExamSet.findOne({ _id: examSetId, isPublished: true }).lean()
      if (!examSet) return NextResponse.json({ success: false, error: 'Exam set not found or not published' }, { status: 404 })

      const allQuestionIds = examSet.sections.flatMap(s => s.questions)
      questions = await Question.find({
        _id: { $in: allQuestionIds },
        isDeleted: false,
      }).lean() as Record<string, unknown>[]

      timeMins = examSet.timeLimitMins
      resolvedExamSetId = examSet._id as mongoose.Types.ObjectId
      resolvedExamSetName = examSet.name
    } else {
      // Random pool based test
      const modeConfig = config[testMode]
      const { questions: questionCount, timeMins: modeMins } = modeConfig
      timeMins = modeMins

      const filter: Record<string, unknown> = { examType, isDeleted: false }
      if (testMode === 'section' && section) filter.section = section

      if (includeCustomQuestions) {
        filter.$or = [
          { visibility: 'public' },
          { visibility: 'private', createdBy: new mongoose.Types.ObjectId(payload.userId) },
        ]
      } else {
        filter.visibility = 'public'
      }

      questions = await Question.aggregate([
        { $match: filter },
        { $sample: { size: questionCount } },
      ])
    }

    if (questions.length === 0) {
      return NextResponse.json({ success: false, error: 'No questions available for this configuration' }, { status: 400 })
    }

    const totalPoints = questions.reduce((sum: number, q: { points?: number }) => sum + (q.points ?? 1), 0)
    const questionEmbeds = questions.map((q: { _id: mongoose.Types.ObjectId }, i: number) => ({
      questionId: q._id,
      order: i + 1,
      userAnswer: null,
      isCorrect: null,
      pointsEarned: 0,
      timeSpentSecs: 0,
      flagged: false,
    }))

    const mockTest = await MockTest.create({
      userId: payload.userId,
      planId: activePlan._id,
      ...(taskId ? { taskId: new mongoose.Types.ObjectId(taskId) } : {}),
      examType,
      testMode,
      section,
      status: 'in_progress',
      questions: questionEmbeds,
      timeLimitMins: timeMins,
      timeRemainingMins: timeMins,
      totalPoints,
      earnedPoints: 0,
      examSetId: resolvedExamSetId,
      examSetName: resolvedExamSetName,
      isScheduled: isScheduled ?? false,
      isRetake: isRetake ?? false,
    })

    const populatedQuestions = questions.map((q: Record<string, unknown>) => ({
      ...q,
      _id: (q._id as mongoose.Types.ObjectId).toString(),
      createdBy: q.createdBy ? (q.createdBy as mongoose.Types.ObjectId).toString() : undefined,
    }))

    return NextResponse.json({
      success: true,
      data: {
        test: {
          _id: mockTest._id.toString(),
          userId: mockTest.userId.toString(),
          planId: mockTest.planId.toString(),
          examType: mockTest.examType,
          testMode: mockTest.testMode,
          section: mockTest.section,
          status: mockTest.status,
          timeLimitMins: mockTest.timeLimitMins,
          timeRemainingMins: mockTest.timeRemainingMins,
          totalPoints: mockTest.totalPoints,
          earnedPoints: mockTest.earnedPoints,
          examSetId: mockTest.examSetId?.toString() ?? null,
          examSetName: mockTest.examSetName,
          isScheduled: mockTest.isScheduled,
          isRetake: mockTest.isRetake,
          startedAt: mockTest.startedAt.toISOString(),
          completedAt: null,
          questions: mockTest.questions,
          createdAt: mockTest.createdAt.toISOString(),
        },
        questions: populatedQuestions,
      },
    }, { status: 201 })

  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = req.nextUrl
    const planId = searchParams.get('planId')
    const examType = searchParams.get('examType')
    const isScheduled = searchParams.get('isScheduled')
    const limit = parseInt(searchParams.get('limit') ?? '10')

    const filter: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(payload.userId),
      status: 'completed',
    }
    if (planId) filter.planId = new mongoose.Types.ObjectId(planId)
    if (examType) filter.examType = examType
    if (isScheduled !== null && isScheduled !== '') filter.isScheduled = isScheduled === 'true'

    const tests = await MockTest.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()

    const testIds = tests.map(t => t._id)
    const results = await MockResult.find({ testId: { $in: testIds } }).lean()
    const resultMap = new Map(results.map(r => [r.testId.toString(), r]))

    const data = tests.map(t => ({
      ...t,
      _id: t._id.toString(),
      userId: t.userId.toString(),
      planId: t.planId.toString(),
      result: resultMap.get(t._id.toString()) ?? null,
    }))

    return NextResponse.json({ success: true, data })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
