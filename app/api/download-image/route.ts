import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'url חסר' }, { status: 400 })

  const res = await fetch(url)
  if (!res.ok) return NextResponse.json({ error: 'לא ניתן להוריד את התמונה' }, { status: 500 })

  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="marketing-image.png"',
    },
  })
}
