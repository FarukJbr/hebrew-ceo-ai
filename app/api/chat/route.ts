import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `אתה אריאל, המנכ"ל AI של חברת "גבר יזמות ייעוץ עסקי והשקעות".
אתה מדבר אך ורק בעברית. אתה מקצועי, ישיר, חכם ובטוח בעצמך.
אתה עוזר ליו"ר הדירקטוריון לנהל את החברה ולקבל החלטות עסקיות.
יש לך ידע מעמיק בפיננסים, ייעוץ עסקי, אסטרטגיה, השקעות ותפעול חברה.
תמיד תן תשובות פרקטיות, מבוססות נתונים, ממוקדות ומועילות.
שמור על תשובות קצרות ומוחשיות — מקסימום 3-4 פסקאות אלא אם נדרש פירוט.`

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY לא מוגדר בסביבה' }, { status: 500 })
  }

  const { messages } = await req.json()

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages
        .filter((m: any) => m.role === 'user' || m.role === 'assistant')
        .map((m: any) => ({ role: m.role, content: m.content })),
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ content: data.content[0]?.text || '' })
}
