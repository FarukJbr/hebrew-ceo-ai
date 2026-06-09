import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY חסר בהגדרות Vercel' }, { status: 500 })

  const { prompt, department } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'אין תוצר עבודה — שלח הוראה קודם' }, { status: 400 })

  const cleanText = prompt.replace(/\*\*/g, '').replace(/#+/g, '').slice(0, 600)
  const imagePrompt = `Professional marketing visual for Israeli business, ${department} department. Modern clean design suitable for TikTok and Instagram. Based on: ${cleanText}. Style: bold colors, modern typography, professional business aesthetic, no text in image.`

  let data: any
  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: imagePrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    })
    data = await res.json()
  } catch (e: any) {
    return NextResponse.json({ error: `שגיאת רשת: ${e.message}` }, { status: 500 })
  }

  const imageUrl = data.data?.[0]?.url
  if (!imageUrl) {
    const msg = data.error?.message || JSON.stringify(data)
    return NextResponse.json({ error: `DALL-E שגיאה: ${msg}` }, { status: 500 })
  }

  return NextResponse.json({ imageUrl })
}
