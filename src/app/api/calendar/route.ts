import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import StudyPlan from '@/models/StudyPlan'
import DailyTask from '@/models/DailyTask'
import mongoose from 'mongoose'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const month = parseInt(searchParams.get('month') ?? '1', 10)
    const year = parseInt(searchParams.get('year') ?? String(new Date().getFullYear()), 10)
    const planIdParam = searchParams.get('planId')

    await connectDB()
    const userId = new mongoose.Types.ObjectId(payload.userId)

    const planQuery = planIdParam
      ? { _id: new mongoose.Types.ObjectId(planIdParam), userId, status: 'active' }
      : { userId, status: 'active' }
    const plan = await StudyPlan.findOne(planQuery).lean()
    if (!plan) return NextResponse.json({ success: true, data: {} })

    const monthDate = new Date(year, month - 1, 1)
    const start = startOfMonth(monthDate)
    const end = endOfMonth(monthDate)

    const tasks = await DailyTask.find({
      planId: plan._id,
      scheduledDate: { $gte: start, $lte: end },
    }).sort({ scheduledDate: 1 }).lean()

    const grouped: Record<string, {
      tasks: object[]
      completedCount: number
      totalCount: number
      hasTest: boolean
    }> = {}

    for (const task of tasks) {
      const key = format(task.scheduledDate, 'yyyy-MM-dd')
      if (!grouped[key]) {
        grouped[key] = { tasks: [], completedCount: 0, totalCount: 0, hasTest: false }
      }
      grouped[key].tasks.push({
        ...task,
        _id: task._id.toString(),
        planId: task.planId.toString(),
        userId: task.userId.toString(),
        scheduledDate: task.scheduledDate.toISOString(),
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        subject: task.skillFocus,
        durationMinutes: task.durationMins,
      })
      grouped[key].totalCount++
      if (task.completed) grouped[key].completedCount++
      if (task.taskType === 'mock_test') grouped[key].hasTest = true
    }

    return NextResponse.json({ success: true, data: grouped })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
