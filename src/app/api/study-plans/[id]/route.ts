import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import StudyPlan from '@/models/StudyPlan'
import DailyTask from '@/models/DailyTask'
import Milestone from '@/models/Milestone'
import User from '@/models/User'
import mongoose from 'mongoose'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const plan = await StudyPlan.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(payload.userId),
    }).lean()

    if (!plan) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })

    const milestones = await Milestone.find({ planId: plan._id }).lean()

    return NextResponse.json({
      success: true,
      data: { plan: { ...plan, _id: plan._id.toString(), milestones } },
    })
  } catch (err) {
    const message =
      process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const payload = getCurrentUser(req)
    if (!payload) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await connectDB()

    const plan = await StudyPlan.findOne({
      _id: new mongoose.Types.ObjectId(id),
      userId: new mongoose.Types.ObjectId(payload.userId),
    })

    if (!plan) return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })

    await DailyTask.deleteMany({ planId: plan._id })
    await Milestone.deleteMany({ planId: plan._id })
    await StudyPlan.findByIdAndDelete(plan._id)

    // Only reset onboarding flag if no active plans remain
    const remaining = await StudyPlan.countDocuments({
      userId: new mongoose.Types.ObjectId(payload.userId),
      status: 'active',
    })
    if (remaining === 0) {
      await User.findByIdAndUpdate(payload.userId, { hasCompletedOnboarding: false })
    }

    return NextResponse.json({ success: true, data: { message: 'Plan deleted' } })
  } catch (err) {
    const message =
      process.env.NODE_ENV === 'development' && err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
