import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(request: NextRequest) {
  try {
    const payload = requireAuth(request)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    await connectDB()

    const user = await User.findById(payload.userId)
      .select('name email role createdAt')
      .lean()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const { _id, name, email, role, createdAt } = user as {
      _id: unknown
      name: string
      email: string
      role: string
      createdAt: Date
    }

    return NextResponse.json({
      success: true,
      data: {
        user: { _id, name, email, role, createdAt },
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
