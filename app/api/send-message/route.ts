import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Recipient {
  name: string
  email?: string
  phone?: string
}

async function sendEmail(subject: string, body: string, recipient: Recipient) {
  const apiKey = process.env.SENDGRID_API_KEY || process.env.EMAIL_API_KEY
  const fromEmail = process.env.EMAIL_FROM || process.env.GMAIL_USER
  if (!apiKey || !fromEmail) return { ok: false, error: 'EMAIL לא מחובר — הוסף EMAIL_API_KEY ו-EMAIL_FROM בהגדרות Vercel' }
  if (!recipient.email) return { ok: false, error: 'אין כתובת מייל ללקוח' }

  // Nodemailer SMTP approach (works with Gmail App Password)
  // TODO: implement with actual credentials
  return { ok: false, error: 'EMAIL_API_KEY חסר' }
}

async function sendSMS(body: string, recipient: Recipient) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN
  const fromNumber = process.env.TWILIO_PHONE_NUMBER
  if (!accountSid || !authToken || !fromNumber) return { ok: false, error: 'Twilio לא מחובר — הוסף TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER בהגדרות Vercel' }
  if (!recipient.phone) return { ok: false, error: 'אין מספר טלפון ללקוח' }

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: recipient.phone, From: fromNumber, Body: body }).toString(),
  })
  const data = await res.json()
  if (data.sid) return { ok: true }
  return { ok: false, error: data.message || 'שגיאת Twilio' }
}

async function sendWhatsApp(body: string, recipient: Recipient) {
  const token = process.env.WHATSAPP_TOKEN
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneNumberId) return { ok: false, error: 'WhatsApp Business לא מחובר — הוסף WHATSAPP_TOKEN ו-WHATSAPP_PHONE_NUMBER_ID בהגדרות Vercel' }
  if (!recipient.phone) return { ok: false, error: 'אין מספר טלפון ללקוח' }

  const res = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient.phone.replace(/\D/g, ''),
      type: 'text',
      text: { body },
    }),
  })
  const data = await res.json()
  if (data.messages?.[0]?.id) return { ok: true }
  return { ok: false, error: data.error?.message || 'שגיאת WhatsApp' }
}

export async function POST(req: NextRequest) {
  const { subject, body, channels, recipients } = await req.json()
  if (!body || !channels?.length || !recipients?.length) {
    return NextResponse.json({ error: 'חסרים שדות: body, channels, recipients' }, { status: 400 })
  }

  const results: { channel: string; recipient: string; ok: boolean; error?: string }[] = []

  for (const recipient of recipients as Recipient[]) {
    for (const channel of channels as string[]) {
      let result: { ok: boolean; error?: string }
      if (channel === 'email') result = await sendEmail(subject || 'עדכון מהחברה', body, recipient)
      else if (channel === 'sms') result = await sendSMS(body, recipient)
      else if (channel === 'whatsapp') result = await sendWhatsApp(body, recipient)
      else result = { ok: false, error: `ערוץ לא מוכר: ${channel}` }
      results.push({ channel, recipient: recipient.name, ...result })
    }
  }

  const sent = results.filter(r => r.ok).length
  const failed = results.filter(r => !r.ok).length
  return NextResponse.json({ sent, failed, results })
}
