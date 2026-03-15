import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { connectDB } from '@/lib/mongodb'
import User from '@/models/User'
import { passwordSchema } from '@/validations/settingsSchema'

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
    const parsed = passwordSchema.safeParse(body)

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

    const { currentPassword, newPassword } = parsed.data

    const user = await User.findOne({ _id: payload.userId }).select('+passwordHash')

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const isCorrect = await user.comparePassword(currentPassword)
    if (!isCorrect) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect' },
        { status: 401 }
      )
    }

    // Assign plain text — the pre-save hook will bcrypt hash it when passwordHash isModified
    user.passwordHash = newPassword
    await user.save()

    return NextResponse.json({
      success: true,
      message: 'Password updated',
    })
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
