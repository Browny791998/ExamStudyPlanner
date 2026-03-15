import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import ExamSet from '@/models/ExamSet'
import Question from '@/models/Question'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const examSet = await ExamSet.findOne({ _id: id, isPublished: true }).lean()
    if (!examSet) return NextResponse.json({ success: false, error: 'Exam set not found' }, { status: 404 })

    // Populate questions for each section
    const allQuestionIds = examSet.sections.flatMap(s => s.questions)
    const questions = await Question.find({ _id: { $in: allQuestionIds }, isDeleted: false }).lean()
    const questionMap = new Map(questions.map(q => [q._id.toString(), q]))

    const populatedSections = examSet.sections.map(s => ({
      ...s,
      questions: s.questions
        .map(id => questionMap.get(id.toString()))
        .filter(Boolean),
    }))

    return NextResponse.json({
      success: true,
      data: { ...examSet, sections: populatedSections },
    })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
