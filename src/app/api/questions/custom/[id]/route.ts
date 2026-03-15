import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import Question from '@/models/Question'
import mongoose from 'mongoose'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const question = await Question.findOne({
      _id: new mongoose.Types.ObjectId(id),
      createdBy: new mongoose.Types.ObjectId(payload.userId),
      isCustom: true,
    })

    if (!question) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })

    await question.deleteOne()

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
