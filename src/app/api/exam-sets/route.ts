import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import ExamSet from '@/models/ExamSet'

export async function GET(req: NextRequest) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = req.nextUrl
    const examType = searchParams.get('examType')
    const difficulty = searchParams.get('difficulty')

    const filter: Record<string, unknown> = { isPublished: true }
    if (examType) filter.examType = examType
    if (difficulty) filter.difficulty = difficulty

    const sets = await ExamSet.find(filter)
      .sort({ examType: 1, difficulty: 1, name: 1 })
      .lean()

    return NextResponse.json({ success: true, data: sets })
  } catch (err) {
    const msg = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: msg }, { status: 500 })
  }
}
