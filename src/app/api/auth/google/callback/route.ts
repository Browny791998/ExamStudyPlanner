import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { getCurrentUser } from '@/lib/auth'
import { exchangeCodeForTokens } from '@/lib/googleCalendar'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  if (!code) return NextResponse.redirect(new URL('/calendar?error=no_code', req.url))

  const payload = getCurrentUser(req)
  if (!payload) return NextResponse.redirect(new URL('/login', req.url))

  try {
    await connectDB()
    const tokens = await exchangeCodeForTokens(code)
    await User.findByIdAndUpdate(payload.userId, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token,
      googleTokenExpiry: tokens.expiry_date,
    })
    return NextResponse.redirect(new URL('/calendar?synced=true', req.url))
  } catch {
    return NextResponse.redirect(new URL('/calendar?error=auth_failed', req.url))
  }
}
