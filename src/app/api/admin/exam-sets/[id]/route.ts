import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/auth'
import ExamSet from '@/models/ExamSet'
import Question from '@/models/Question'
import { examSetUpdateSchema } from '@/validations/examSetSchema'
import mongoose from 'mongoose'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { id } = await params
    await connectDB()

    const examSet = await ExamSet.findById(id).lean()
    if (!examSet) return NextResponse.json({ success: false, error: 'Exam set not found' }, { status: 404 })

    // Populate questions in each section
    const allQuestionIds = examSet.sections.flatMap(s => s.questions)
    const questions = await Question.find({ _id: { $in: allQuestionIds } }).lean()
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]))

    const populated = {
      ...examSet,
      sections: examSet.sections.map(s => ({
        ...s,
        questions: s.questions.map(qid => questionMap.get(qid.toString())).filter(Boolean),
      })),
    }

    return NextResponse.json({ success: true, data: populated })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { id } = await params
    await connectDB()

    const body = await req.json()
    const parsed = examSetUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues.map(i => i.message).join('; ') },
        { status: 400 }
      )
    }

    const { sections, ...rest } = parsed.data
    const update: Record<string, unknown> = { ...rest }
    if (sections) {
      update.sections = sections.map(s => ({
        section: s.section,
        questions: s.questions.map(qid => new mongoose.Types.ObjectId(qid)),
      }))
    }

    const examSet = await ExamSet.findByIdAndUpdate(id, update, { new: true, runValidators: true })
    if (!examSet) return NextResponse.json({ success: false, error: 'Exam set not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: examSet })
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      return NextResponse.json({ success: false, error: 'An exam set with this name already exists for this exam type' }, { status: 409 })
    }
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { id } = await params
    await connectDB()

    const examSet = await ExamSet.findByIdAndDelete(id)
    if (!examSet) return NextResponse.json({ success: false, error: 'Exam set not found' }, { status: 404 })

    const questionIds = examSet.sections.flatMap(s => s.questions)
    if (questionIds.length > 0) {
      await Question.updateMany(
        { _id: { $in: questionIds } },
        { $pull: { usedInSets: examSet._id } }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}

// PATCH: toggle publish/unpublish OR add/remove questions from a section
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    const { id } = await params
    await connectDB()

    const body = await req.json()
    const { action, section, questionIds } = body as {
      action: 'publish' | 'unpublish' | 'add_questions' | 'remove_questions' | 'add_section' | 'remove_section'
      section?: string
      questionIds?: string[]
    }

    if (!['publish', 'unpublish', 'add_questions', 'remove_questions', 'add_section', 'remove_section'].includes(action)) {
      return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }

    const examSet = await ExamSet.findById(id)
    if (!examSet) return NextResponse.json({ success: false, error: 'Exam set not found' }, { status: 404 })

    if (action === 'publish' || action === 'unpublish') {
      if (action === 'publish') {
        const hasQuestions = examSet.sections.some(s => s.questions.length > 0)
        if (!hasQuestions) {
          return NextResponse.json({ success: false, error: 'Cannot publish an exam set with no questions' }, { status: 400 })
        }
      }
      examSet.isPublished = action === 'publish'
    }

    if (action === 'add_section' && section) {
      const exists = examSet.sections.some(s => s.section === section)
      if (!exists) {
        examSet.sections.push({ section, questions: [], questionCount: 0 })
      }
    }

    if (action === 'remove_section' && section) {
      examSet.sections = examSet.sections.filter(s => s.section !== section)
    }

    if ((action === 'add_questions' || action === 'remove_questions') && section && questionIds?.length) {
      const sec = examSet.sections.find(s => s.section === section)
      if (!sec) return NextResponse.json({ success: false, error: 'Section not found' }, { status: 404 })

      const qObjectIds = questionIds.map(qid => new mongoose.Types.ObjectId(qid))
      if (action === 'add_questions') {
        // Add only IDs not already present
        const existing = new Set(sec.questions.map(q => q.toString()))
        for (const qid of qObjectIds) {
          if (!existing.has(qid.toString())) sec.questions.push(qid)
        }
        // Update usedInSets on questions
        await Question.updateMany(
          { _id: { $in: qObjectIds } },
          { $addToSet: { usedInSets: examSet._id } }
        )
      } else {
        const removeSet = new Set(questionIds)
        sec.questions = sec.questions.filter(q => !removeSet.has(q.toString()))
        await Question.updateMany(
          { _id: { $in: qObjectIds } },
          { $pull: { usedInSets: examSet._id } }
        )
      }
    }

    await examSet.save()
    return NextResponse.json({ success: true, data: examSet })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
