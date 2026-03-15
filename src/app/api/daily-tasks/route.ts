import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import DailyTask from '@/models/DailyTask'
import StudyPlan from '@/models/StudyPlan'
import mongoose from 'mongoose'
import { startOfDay, endOfDay, differenceInDays } from 'date-fns'
import { dailyTaskSchema } from '@/validations/questionSchema'

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const { searchParams } = new URL(req.url)
    const dateParam = searchParams.get('date')
    const weekParam = searchParams.get('week')
    const planIdParam = searchParams.get('planId')
    const taskTypeParam = searchParams.get('taskType')
    const fromParam = searchParams.get('from')
    const toParam = searchParams.get('to')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { userId: new mongoose.Types.ObjectId(payload.userId) }

    if (dateParam) {
      const d = new Date(dateParam)
      filter.scheduledDate = { $gte: startOfDay(d), $lte: endOfDay(d) }
    } else if (fromParam || toParam) {
      filter.scheduledDate = {}
      if (fromParam) filter.scheduledDate.$gte = startOfDay(new Date(fromParam))
      if (toParam) filter.scheduledDate.$lte = endOfDay(new Date(toParam))
    }

    if (weekParam) {
      filter.weekNumber = parseInt(weekParam, 10)
    }

    if (planIdParam) {
      filter.planId = new mongoose.Types.ObjectId(planIdParam)
    }

    if (taskTypeParam) {
      filter.taskType = taskTypeParam
    }

    const tasks = await DailyTask.find(filter).sort({ scheduledDate: 1 }).lean()

    const serialized = tasks.map((t) => ({
      ...t,
      _id: t._id.toString(),
      planId: t.planId.toString(),
      userId: t.userId.toString(),
      scheduledDate: t.scheduledDate.toISOString(),
      subject: t.skillFocus,
      durationMinutes: t.durationMins,
      examSetId: t.examSetId?.toString() ?? null,
      examSetName: t.examSetName ?? null,
    }))

    return NextResponse.json({ success: true, data: serialized })
  } catch (err) {
    const message =
      process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const body = await req.json()
    const parsed = dailyTaskSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { planId, scheduledDate, title, description, skillFocus, taskType, durationMins } = parsed.data

    const plan = await StudyPlan.findOne({
      _id: new mongoose.Types.ObjectId(planId),
      userId: new mongoose.Types.ObjectId(payload.userId),
    })

    if (!plan) {
      return NextResponse.json({ success: false, error: 'Study plan not found' }, { status: 404 })
    }

    const scheduledDateObj = new Date(scheduledDate)
    const diffDays = differenceInDays(scheduledDateObj, new Date(plan.startDate))
    const dayNumber = Math.max(1, diffDays + 1)
    const weekNumber = Math.max(1, Math.ceil(dayNumber / 7))

    const task = await DailyTask.create({
      planId: plan._id,
      userId: new mongoose.Types.ObjectId(payload.userId),
      scheduledDate: scheduledDateObj,
      dayNumber,
      weekNumber,
      title,
      description: description ?? '',
      skillFocus,
      taskType,
      durationMins,
      isCustom: true,
    })

    // Recalculate progress
    const totalTasks = await DailyTask.countDocuments({ planId: plan._id })
    const completedCount = await DailyTask.countDocuments({ planId: plan._id, completed: true })
    const overallProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
    await StudyPlan.findByIdAndUpdate(plan._id, { overallProgress })

    return NextResponse.json(
      {
        success: true,
        data: {
          task: {
            ...task.toObject(),
            _id: task._id.toString(),
            planId: task.planId.toString(),
            userId: task.userId.toString(),
            scheduledDate: task.scheduledDate.toISOString(),
            subject: task.skillFocus,
            durationMinutes: task.durationMins,
          },
        },
      },
      { status: 201 }
    )
  } catch (err) {
    const message =
      process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
