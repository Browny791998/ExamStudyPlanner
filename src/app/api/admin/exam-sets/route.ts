import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth, requireAdmin } from '@/lib/auth'
import ExamSet from '@/models/ExamSet'
import { examSetSchema } from '@/validations/examSetSchema'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    await connectDB()

    const { searchParams } = req.nextUrl
    const examType = searchParams.get('examType')
    const difficulty = searchParams.get('difficulty')
    const isPublished = searchParams.get('isPublished')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'))

    const filter: Record<string, unknown> = {}
    if (examType) filter.examType = examType
    if (difficulty) filter.difficulty = difficulty
    if (isPublished !== null && isPublished !== '') filter.isPublished = isPublished === 'true'

    const [sets, total] = await Promise.all([
      ExamSet.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ExamSet.countDocuments(filter),
    ])

    return NextResponse.json({
      success: true,
      data: { sets, total, page, limit },
    })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const payload = requireAuth(req)!
    await connectDB()

    const body = await req.json()
    const parsed = examSetSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map(i => i.message).join('; ') },
        { status: 400 }
      )
    }

    const { sections, ...rest } = parsed.data
    const examSet = await ExamSet.create({
      ...rest,
      sections: sections.map(s => ({
        section: s.section,
        questions: s.questions.map(id => new mongoose.Types.ObjectId(id)),
      })),
      createdBy: new mongoose.Types.ObjectId(payload.userId),
    })

    return NextResponse.json({ success: true, data: examSet }, { status: 201 })
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ success: false, error: 'An exam set with this name already exists for this exam type' }, { status: 409 })
    }
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
