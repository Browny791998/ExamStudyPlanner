import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import StudyPlan from '@/models/StudyPlan'
import DailyTask from '@/models/DailyTask'
import Milestone from '@/models/Milestone'
import User from '@/models/User'
import ExamSet from '@/models/ExamSet'
import { createStudyPlanSchema } from '@/validations/studyPlanSchema'
import { generateStudyPlan } from '@/lib/planGenerator'
import mongoose from 'mongoose'

export async function POST(req: NextRequest) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const parsed = createStudyPlanSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    await connectDB()

    const userId = payload.userId
    const data = parsed.data
    const isCustom = data.planMode === 'custom'

    // Resolve display name and exam type key
    const examType = isCustom ? 'CUSTOM' : data.examType
    const displayName = isCustom ? data.customExamName : data.examType
    const targetScore = data.targetScore
    const examDate = !isCustom ? data.examDate : (data.examDate ?? null)
    const planDays = isCustom ? data.planDays : 90

    // Check for duplicate active plan with same display name
    const existing = await StudyPlan.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      examType: displayName,
      status: 'active',
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: `You already have an active ${displayName} study plan` },
        { status: 409 }
      )
    }

    // Fetch published exam sets (only for standard plans)
    const availableSets = isCustom ? [] : await ExamSet.find({ examType, isPublished: true })
      .select('_id name difficulty')
      .lean()
      .then(sets => sets.map(s => ({
        _id: s._id.toString(),
        name: s.name,
        difficulty: s.difficulty as 'easy' | 'medium' | 'hard',
      })))

    const startDate = new Date()
    const generated = generateStudyPlan({
      userId,
      examType: examType as 'IELTS' | 'TOEFL' | 'JLPT' | 'SAT' | 'CUSTOM',
      displayName,
      targetScore,
      examDate: examDate ? new Date(examDate) : null,
      startDate,
      planDays,
      availableSets,
    })

    // Save plan
    const plan = await StudyPlan.create({
      ...generated.plan,
      userId: new mongoose.Types.ObjectId(userId),
    })

    // Bulk insert tasks
    const taskDocs = generated.tasks.map((t) => ({
      ...t,
      planId: plan._id,
      userId: new mongoose.Types.ObjectId(userId),
      scheduledDate: new Date(t.scheduledDate as string),
    }))
    await DailyTask.insertMany(taskDocs)

    // Bulk insert milestones
    const milestoneDocs = generated.milestones.map((m) => ({
      ...m,
      planId: plan._id,
      userId: new mongoose.Types.ObjectId(userId),
      targetDate: new Date(m.targetDate as string),
    }))
    await Milestone.insertMany(milestoneDocs)

    // Update user (only update examType/examDate for standard plans)
    await User.findByIdAndUpdate(userId, {
      ...(isCustom ? {} : {
        examType: displayName,
        examDate: examDate ? new Date(examDate) : null,
      }),
      targetScore,
      hasCompletedOnboarding: true,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          plan: {
            _id: plan._id.toString(),
            title: plan.title,
            examType: plan.examType,
            targetScore: plan.targetScore,
            examDate: plan.examDate,
            startDate: plan.startDate,
            endDate: plan.endDate,
            status: plan.status,
            overallProgress: plan.overallProgress,
            weeklyGoals: plan.weeklyGoals,
          },
          tasksCount: taskDocs.length,
          milestonesCount: milestoneDocs.length,
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

export async function GET(req: NextRequest) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    await connectDB()

    const plans = await StudyPlan.find({
      userId: new mongoose.Types.ObjectId(payload.userId),
      status: 'active',
    }).lean()

    if (plans.length === 0) {
      return NextResponse.json({ success: true, data: { plans: [] } })
    }

    // Recalculate progress for each plan and attach milestones
    const enriched = await Promise.all(
      plans.map(async (plan) => {
        const totalTasks = await DailyTask.countDocuments({ planId: plan._id })
        const completedTasks = await DailyTask.countDocuments({ planId: plan._id, completed: true })
        const overallProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
        if (plan.overallProgress !== overallProgress) {
          await StudyPlan.findByIdAndUpdate(plan._id, { overallProgress })
        }
        const milestones = await Milestone.find({ planId: plan._id }).lean()
        return { ...plan, _id: plan._id.toString(), overallProgress, milestones }
      })
    )

    return NextResponse.json({ success: true, data: { plans: enriched } })
  } catch (err) {
    const message =
      process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
