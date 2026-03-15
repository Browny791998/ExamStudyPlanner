import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/auth'
import Question from '@/models/Question'
import { questionUpdateSchema } from '@/validations/questionSchema'
import mongoose from 'mongoose'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { id } = await params
    await connectDB()

    const question = await Question.findOne({
      _id: new mongoose.Types.ObjectId(id),
      isDeleted: false,
    })

    if (!question) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })

    const body = await req.json()
    const parsed = questionUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    Object.assign(question, parsed.data)
    await question.save()

    return NextResponse.json({
      success: true,
      data: {
        question: {
          ...question.toObject(),
          _id: question._id.toString(),
          createdBy: question.createdBy.toString(),
        },
      },
    })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { id } = await params
    await connectDB()

    const question = await Question.findById(new mongoose.Types.ObjectId(id))
    if (!question) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })

    question.isDeleted = true
    question.deletedAt = new Date()
    await question.save()

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
