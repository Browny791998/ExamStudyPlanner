import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import StudyPlan from '@/models/StudyPlan'
import DailyTask from '@/models/DailyTask'
import Milestone from '@/models/Milestone'
import mongoose from 'mongoose'
import { startOfDay, endOfDay, startOfWeek, endOfWeek, differenceInDays, subDays, format } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const planIdParam = searchParams.get('planId')

    await connectDB()
    const userId = new mongoose.Types.ObjectId(payload.userId)

    const planQuery = planIdParam
      ? { _id: new mongoose.Types.ObjectId(planIdParam), userId, status: 'active' }
      : { userId, status: 'active' }
    const plan = await StudyPlan.findOne(planQuery).lean()
    if (!plan) {
      return NextResponse.json({ success: true, data: null })
    }

    const now = new Date()
    const todayStart = startOfDay(now)
    const todayEnd = endOfDay(now)
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })

    const [
      todayTasks,
      allTasks,
      upcomingTasks,
      currentWeekTasks,
      milestones,
    ] = await Promise.all([
      DailyTask.find({ planId: plan._id, scheduledDate: { $gte: todayStart, $lte: todayEnd } }).sort({ scheduledDate: 1 }).lean(),
      DailyTask.find({ planId: plan._id }).lean(),
      DailyTask.find({ planId: plan._id, scheduledDate: { $gt: todayEnd }, completed: false }).sort({ scheduledDate: 1 }).limit(7).lean(),
      DailyTask.find({ planId: plan._id, scheduledDate: { $gte: weekStart, $lte: weekEnd } }).sort({ scheduledDate: 1 }).lean(),
      Milestone.find({ planId: plan._id }).sort({ weekNumber: 1 }).lean(),
    ])

    const totalTasks = allTasks.length
    const completedTasks = allTasks.filter(t => t.completed).length
    const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const weekTasks = currentWeekTasks
    const weekCompleted = weekTasks.filter(t => t.completed).length
    const weeklyProgress = weekTasks.length > 0 ? Math.round((weekCompleted / weekTasks.length) * 100) : 0

    const totalStudyMins = allTasks.filter(t => t.completed).reduce((sum, t) => sum + t.durationMins, 0)

    const examDate = plan.examDate ? new Date(plan.examDate) : null
    const daysUntilExam = examDate ? Math.max(0, differenceInDays(examDate, now)) : 0

    // Streak calculation
    const completedDates = new Set(
      allTasks
        .filter(t => t.completed && t.completedAt)
        .map(t => format(new Date(t.completedAt!), 'yyyy-MM-dd'))
    )

    let currentStreak = 0
    let longestStreak = 0
    let streakDay = completedDates.has(format(now, 'yyyy-MM-dd')) ? now : subDays(now, 1)

    while (completedDates.has(format(streakDay, 'yyyy-MM-dd'))) {
      currentStreak++
      streakDay = subDays(streakDay, 1)
    }

    // Longest streak
    let tempStreak = 0
    const sortedDates = Array.from(completedDates).sort()
    for (let i = 0; i < sortedDates.length; i++) {
      if (i === 0) {
        tempStreak = 1
      } else {
        const prev = new Date(sortedDates[i - 1])
        const curr = new Date(sortedDates[i])
        if (differenceInDays(curr, prev) === 1) {
          tempStreak++
        } else {
          tempStreak = 1
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak)
    }

    type RawTask = (typeof allTasks)[number]
    const serialize = (tasks: RawTask[]) => tasks.map(t => ({
      ...t,
      _id: t._id.toString(),
      planId: t.planId.toString(),
      userId: t.userId.toString(),
      scheduledDate: t.scheduledDate.toISOString(),
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      subject: t.skillFocus,
      durationMinutes: t.durationMins,
    }))

    return NextResponse.json({
      success: true,
      data: {
        todayTasks: serialize(todayTasks),
        upcomingTasks: serialize(upcomingTasks),
        currentWeekTasks: serialize(currentWeekTasks),
        milestones: milestones.map(m => ({
          ...m,
          _id: m._id.toString(),
          planId: m.planId.toString(),
          userId: m.userId.toString(),
          targetDate: m.targetDate.toISOString(),
          achievedAt: m.achievedAt ? m.achievedAt.toISOString() : null,
        })),
        recentMockScores: [],
        stats: {
          totalTasks,
          completedTasks,
          currentStreak,
          longestStreak,
          totalStudyMins,
          daysUntilExam,
          overallProgress,
          weeklyProgress,
        },
      },
    })
  } catch (err) {
    const message = process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
