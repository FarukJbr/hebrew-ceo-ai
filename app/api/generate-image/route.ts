import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'OPENAI_API_KEY חסר' }, { status: 500 })

  const { prompt, department } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'prompt חסר' }, { status: 400 })

  // Build a clean DALL-E prompt from the work product text
  const cleanText = prompt.replace(/\*\*/g, '').replace(/#+/g, '').slice(0, 600)
  const imagePrompt = `Professional marketing visual for Israeli business, ${department} department. Modern clean design suitable for TikTok and Instagram. Based on: ${cleanText}. Style: bold colors, modern typography, professional business aesthetic, no text in image.`

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

  const data = await res.json()
  const imageUrl = data.data?.[0]?.url

  if (!imageUrl) {
    return NextResponse.json({ error: data.error?.message || 'שגיאה ביצירת תמונה' }, { status: 500 })
  }

  return NextResponse.json({ imageUrl })
}
