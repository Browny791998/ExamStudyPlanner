export interface GoogleCalendarEvent {
  summary: string
  description: string
  start: { date: string }
  end: { date: string }
  reminders: { useDefault: boolean; overrides: { method: string; minutes: number }[] }
  colorId: string
}

export const SKILL_COLOR_MAP: Record<string, string> = {
  'Reading': '9',
  'Writing': '2',
  'Listening': '7',
  'Speaking': '6',
  'Vocabulary': '5',
  'Grammar': '4',
  'Mock Test': '11',
  'Revision': '8',
  'Math': '3',
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar.events',
    access_type: 'offline',
    prompt: 'consent',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}

export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expiry_date: number
}> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
      grant_type: 'authorization_code',
    }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error_description || 'Token exchange failed')
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_date: Date.now() + data.expires_in * 1000,
  }
}

export async function createCalendarEvent(
  accessToken: string,
  event: GoogleCalendarEvent
): Promise<{ id: string }> {
  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/calendars/primary/events',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  )
  const data = await res.json()
  if (!res.ok) throw new Error(data.error?.message || 'Failed to create event')
  return { id: data.id }
}

export async function updateCalendarEvent(
  accessToken: string,
  eventId: string,
  event: GoogleCalendarEvent
): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    }
  )
  if (!res.ok) {
    const data = await res.json()
    throw new Error(data.error?.message || 'Failed to update event')
  }
}
