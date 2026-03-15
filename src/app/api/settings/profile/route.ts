import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { profileSchema } from '@/validations/settingsSchema'

export async function PATCH(request: NextRequest) {
  try {
    const payload = requireAuth(request)
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = profileSchema.safeParse(body)

    if (!parsed.success) {
      const fieldErrors = parsed.error.issues.reduce<Record<string, string>>(
        (acc, issue) => {
          const key = issue.path[0]?.toString() ?? 'form'
          acc[key] = issue.message
          return acc
        },
        {}
      )
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message, fieldErrors },
        { status: 400 }
      )
    }

    await connectDB()

    const { name } = parsed.data

    const user = await User.findByIdAndUpdate(
      payload.userId,
      { name },
      { new: true }
    ).select('name email role createdAt')

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: { user },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
