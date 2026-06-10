import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(req: NextRequest) {
  // Forward to the cron endpoint internally
  const baseUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const cronSecret = process.env.CRON_SECRET || 'manual-trigger'

  const res = await fetch(`${baseUrl}/api/cron/departments`, {
    headers: { 'Authorization': `Bearer ${cronSecret}` },
  })
  const data = await res.json()
  return NextResponse.json(data)
}
