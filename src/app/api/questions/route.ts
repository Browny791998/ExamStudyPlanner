import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import Question from '@/models/Question'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = req.nextUrl
    const examType = searchParams.get('examType')
    const section = searchParams.get('section')
    const questionType = searchParams.get('questionType')
    const difficulty = searchParams.get('difficulty')
    const limit = parseInt(searchParams.get('limit') ?? '10')
    const includeCustom = searchParams.get('includeCustom') === 'true'
    const exclude = searchParams.get('exclude')?.split(',').filter(Boolean) ?? []

    if (!examType) return NextResponse.json({ success: false, error: 'examType is required' }, { status: 400 })

    const filter: Record<string, unknown> = {
      examType,
      isDeleted: false,
    }

    if (section) filter.section = section
    if (questionType) filter.questionType = questionType
    if (difficulty) filter.difficulty = difficulty
    if (exclude.length) filter._id = { $nin: exclude.map(id => new mongoose.Types.ObjectId(id)) }

    if (includeCustom) {
      filter.$or = [
        { visibility: 'public' },
        { visibility: 'private', createdBy: new mongoose.Types.ObjectId(payload.userId) },
      ]
    } else {
      filter.visibility = 'public'
    }

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: limit } },
    ])

    return NextResponse.json({
      success: true,
      data: questions.map((q: Record<string, unknown>) => ({
        ...q,
        _id: (q._id as mongoose.Types.ObjectId).toString(),
        createdBy: q.createdBy ? (q.createdBy as mongoose.Types.ObjectId).toString() : undefined,
      })),
    })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
