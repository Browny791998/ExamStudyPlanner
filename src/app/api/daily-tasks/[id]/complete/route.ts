import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import DailyTask from '@/models/DailyTask'
import StudyPlan from '@/models/StudyPlan'
import Milestone from '@/models/Milestone'
import mongoose from 'mongoose'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const { completed, notes } = await req.json()

    await connectDB()
    const task = await DailyTask.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(payload.userId),
    })
    if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 })

    task.completed = completed
    task.completedAt = completed ? new Date() : null
    if (notes !== undefined) task.notes = notes
    await task.save()

    // Recalculate progress
    const [total, done] = await Promise.all([
      DailyTask.countDocuments({ planId: task.planId }),
      DailyTask.countDocuments({ planId: task.planId, completed: true }),
    ])
    const overallProgress = total > 0 ? Math.round((done / total) * 100) : 0
    await StudyPlan.findByIdAndUpdate(task.planId, { overallProgress })

    // Check milestones: mark achieved if week is done
    const weekTasks = await DailyTask.find({ planId: task.planId, weekNumber: task.weekNumber })
    const allWeekDone = weekTasks.every(t => t._id.toString() === id ? completed : t.completed)
    if (allWeekDone) {
      await Milestone.findOneAndUpdate(
        { planId: task.planId, weekNumber: task.weekNumber, achieved: false },
        { achieved: true, achievedAt: new Date() }
      )
    }

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
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
