import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import MockTest from '@/models/MockTest'
import MockResult from '@/models/MockResult'
import Question from '@/models/Question'
import mongoose from 'mongoose'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const test = await MockTest.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(payload.userId),
    }).lean()

    if (!test) return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })

    // Populate questions
    const questionIds = test.questions.map(q => q.questionId)
    const questions = await Question.find({ _id: { $in: questionIds } }).lean()
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]))

    const populatedQuestions = test.questions
      .sort((a, b) => a.order - b.order)
      .map(q => ({
        ...questionMap.get(q.questionId.toString()),
        _id: q.questionId.toString(),
      }))

    // Get result if completed
    let result = null
    if (test.status === 'completed') {
      result = await MockResult.findOne({ testId: test._id }).lean()
    }

    return NextResponse.json({
      success: true,
      data: {
        test: {
          ...test,
          _id: test._id.toString(),
          userId: test.userId.toString(),
          planId: test.planId.toString(),
        },
        questions: populatedQuestions,
        result,
      },
    })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const testId = new mongoose.Types.ObjectId(id)
    const userId = new mongoose.Types.ObjectId(payload.userId)

    const test = await MockTest.findOne({ _id: testId, userId })
    if (!test) return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 })

    if (test.status === 'completed') {
      // Hard delete completed test and its result
      await MockResult.deleteOne({ testId })
      await MockTest.deleteOne({ _id: testId, userId })
    } else {
      await MockTest.findOneAndUpdate({ _id: testId, userId }, { status: 'abandoned' })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
