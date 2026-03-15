import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAdmin } from '@/lib/auth'
import Question from '@/models/Question'
import User from '@/models/User'
import StudyPlan from '@/models/StudyPlan'

export async function GET(req: NextRequest) {
  try {
    const guard = await requireAdmin(req)
    if (guard) return guard

    await connectDB()

    const [
      totalQuestions,
      questionsByExamAgg,
      questionsByTypeAgg,
      totalUsers,
      activeStudyPlans,
      recentQuestions,
    ] = await Promise.all([
      Question.countDocuments({ isDeleted: false }),
      Question.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$examType', count: { $sum: 1 } } },
        { $project: { examType: '$_id', count: 1, _id: 0 } },
      ]),
      Question.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: '$questionType', count: { $sum: 1 } } },
        { $project: { questionType: '$_id', count: 1, _id: 0 } },
      ]),
      User.countDocuments(),
      StudyPlan.countDocuments({ status: 'active' }),
      Question.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ])

    const serializedRecent = recentQuestions.map((q) => ({
      ...q,
      _id: q._id.toString(),
      createdBy: q.createdBy.toString(),
    }))

    return NextResponse.json({
      success: true,
      data: {
        totalQuestions,
        questionsByExam: questionsByExamAgg,
        questionsByType: questionsByTypeAgg,
        totalUsers,
        activeStudyPlans,
        totalMockTests: 0,
        recentQuestions: serializedRecent,
      },
    })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
