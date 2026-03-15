import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import StudyPlan from '@/models/StudyPlan'
import DailyTask from '@/models/DailyTask'
import User from '@/models/User'
import { createCalendarEvent, updateCalendarEvent, SKILL_COLOR_MAP, type GoogleCalendarEvent } from '@/lib/googleCalendar'
import mongoose from 'mongoose'
import { format } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { planId } = await req.json()
    await connectDB()

    const user = await User.findById(payload.userId).select('+googleAccessToken +googleRefreshToken').lean()
    if (!user?.googleAccessToken) {
      return NextResponse.json({ success: false, error: 'Google Calendar not connected' }, { status: 400 })
    }

    const plan = await StudyPlan.findOne({
      _id: new mongoose.Types.ObjectId(planId),
      userId: new mongoose.Types.ObjectId(payload.userId),
    }).lean()
    if (!plan) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })

    const tasks = await DailyTask.find({ planId: plan._id }).lean()
    let synced = 0
    let failed = 0

    for (const task of tasks) {
      const dateStr = format(task.scheduledDate, 'yyyy-MM-dd')
      const event: GoogleCalendarEvent = {
        summary: task.title,
        description: task.description || '',
        start: { date: dateStr },
        end: { date: dateStr },
        reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: 30 }] },
        colorId: SKILL_COLOR_MAP[task.skillFocus] ?? '1',
      }
      try {
        let eventId = task.gcalEventId
        if (eventId) {
          await updateCalendarEvent(user.googleAccessToken!, eventId, event)
        } else {
          const result = await createCalendarEvent(user.googleAccessToken!, event)
          eventId = result.id
          await DailyTask.findByIdAndUpdate(task._id, { gcalEventId: eventId })
        }
        synced++
      } catch {
        failed++
      }
    }

    return NextResponse.json({ success: true, data: { synced, failed } })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
