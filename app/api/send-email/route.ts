import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const gmailUser = process.env.GMAIL_USER
  const gmailPass = process.env.GMAIL_APP_PASSWORD
  if (!gmailUser || !gmailPass) {
    return NextResponse.json({ error: 'Gmail לא מחובר — הוסף GMAIL_USER ו-GMAIL_APP_PASSWORD בהגדרות Vercel' }, { status: 503 })
  }
  const { to, subject, body } = await req.json()
  // TODO: implement with nodemailer when credentials added
  return NextResponse.json({ message: 'Gmail מחובר — מממש שליחה בקרוב' })
}
