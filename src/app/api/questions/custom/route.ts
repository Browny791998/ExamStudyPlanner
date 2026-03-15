import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import Question from '@/models/Question'
import { z } from 'zod'
import mongoose from 'mongoose'

const customQuestionSchema = z.object({
  examType: z.enum(['IELTS', 'TOEFL', 'JLPT', 'SAT']),
  section: z.string().min(1),
  questionType: z.enum(['multiple_choice', 'fill_blank']),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  question: z.string().min(5).max(2000),
  passage: z.string().max(5000).optional(),
  options: z.array(z.string()).min(2).max(6).optional(),
  correctAnswer: z.string().optional(),
  blanks: z
    .array(z.object({ index: z.number(), answer: z.string().min(1), hint: z.string().optional() }))
    .optional(),
  explanation: z.string().min(5).max(1000),
  tags: z.array(z.string()).default([]),
  includeInDrills: z.boolean().default(false),
})

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const questions = await Question.find({
      createdBy: new mongoose.Types.ObjectId(payload.userId),
      isCustom: true,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .lean()

    const serialized = questions.map((q) => ({
      ...q,
      _id: q._id.toString(),
      createdBy: q.createdBy.toString(),
    }))

    return NextResponse.json({
      success: true,
      data: { questions: serialized, count: serialized.length },
    })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const body = await req.json()
    const parsed = customQuestionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { includeInDrills, ...questionData } = parsed.data

    const question = await Question.create({
      ...questionData,
      points: 1,
      createdBy: new mongoose.Types.ObjectId(payload.userId),
      isCustom: true,
      visibility: 'private',
      tags: [...(questionData.tags ?? []), ...(includeInDrills ? ['include-in-drills'] : [])],
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
