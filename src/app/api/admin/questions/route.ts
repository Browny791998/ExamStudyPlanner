import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth, requireAdmin } from '@/lib/auth'
import Question from '@/models/Question'
import { questionSchema } from '@/validations/questionSchema'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    await connectDB()

    const { searchParams } = new URL(req.url)
    const examType = searchParams.get('examType')
    const section = searchParams.get('section')
    const questionType = searchParams.get('questionType')
    const difficulty = searchParams.get('difficulty')
    const search = searchParams.get('search')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {}

    if (!includeDeleted) filter.isDeleted = false
    if (examType) filter.examType = examType
    if (section) filter.section = section
    if (questionType) filter.questionType = questionType
    if (difficulty) filter.difficulty = difficulty
    if (search) filter.question = { $regex: search, $options: 'i' }

    const [total, questions] = await Promise.all([
      Question.countDocuments(filter),
      Question.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ])

    const serialized = questions.map((q) => ({
      ...q,
      _id: q._id.toString(),
      createdBy: q.createdBy.toString(),
    }))

    return NextResponse.json({
      success: true,
      data: {
        questions: serialized,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const payload = requireAuth(req)!

    await connectDB()

    const body = await req.json()
    const parsed = questionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const question = await Question.create({
      ...parsed.data,
      createdBy: new mongoose.Types.ObjectId(payload.userId),
      isCustom: false,
      visibility: 'public',
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          question: {
            ...question.toObject(),
            _id: question._id.toString(),
            createdBy: question.createdBy.toString(),
          },
        },
      },
      { status: 201 }
    )
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
