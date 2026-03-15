import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { requireAuth } from '@/lib/auth'
import DailyTask from '@/models/DailyTask'
import StudyPlan from '@/models/StudyPlan'
import mongoose from 'mongoose'
import { differenceInDays } from 'date-fns'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const body = await req.json()

    const task = await DailyTask.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(payload.userId),
    })

    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })

    // Handle complete/notes toggle (existing behavior)
    if (typeof body.completed === 'boolean') {
      task.completed = body.completed
      task.completedAt = body.completed ? new Date() : null
      if (body.notes !== undefined) task.notes = body.notes
      await task.save()

      const totalTasks = await DailyTask.countDocuments({ planId: task.planId })
      const completedCount = await DailyTask.countDocuments({ planId: task.planId, completed: true })
      const overallProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
      await StudyPlan.findByIdAndUpdate(task.planId, { overallProgress })

      return NextResponse.json({
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
          overallProgress,
        },
      })
    }

    // Handle full edit (title, description, skillFocus, taskType, durationMins, scheduledDate, notes)
    const { title, description, skillFocus, taskType, durationMins, scheduledDate, notes } = body

    if (title !== undefined) task.title = title
    if (description !== undefined) task.description = description
    if (skillFocus !== undefined) task.skillFocus = skillFocus
    if (taskType !== undefined) task.taskType = taskType
    if (durationMins !== undefined) task.durationMins = durationMins
    if (notes !== undefined) task.notes = notes

    if (scheduledDate !== undefined) {
      const plan = await StudyPlan.findById(task.planId)
      if (plan) {
        const scheduledDateObj = new Date(scheduledDate)
        const diffDays = differenceInDays(scheduledDateObj, new Date(plan.startDate))
        task.dayNumber = Math.max(1, diffDays + 1)
        task.weekNumber = Math.max(1, Math.ceil(task.dayNumber / 7))
        task.scheduledDate = scheduledDateObj
      }
    }

    await task.save()

    return NextResponse.json({
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
    })
  } catch (err) {
    const message =
      process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = requireAuth(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const task = await DailyTask.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(payload.userId),
    })

    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })

    const planId = task.planId

    await task.deleteOne()

    const totalTasks = await DailyTask.countDocuments({ planId })
    const completedCount = await DailyTask.countDocuments({ planId, completed: true })
    const newProgress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0
    await StudyPlan.findByIdAndUpdate(planId, { overallProgress: newProgress })

    return NextResponse.json({ success: true, data: { newProgress } })
  } catch (err) {
    const message =
      process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
