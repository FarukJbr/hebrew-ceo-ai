import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const AGENTS: Record<string, { name: string; role: string; expertise: string }> = {
  'הנהלה':      { name: 'אריאל', role: 'מנכ״ל AI',       expertise: 'אסטרטגיה, ניהול כולל, קבלת החלטות' },
  'כספים':      { name: 'נועה',  role: 'CFO AI',          expertise: 'פיננסים, תקציב, תזרים, דוחות' },
  'שיווק':      { name: 'יובל',  role: 'CMO AI',          expertise: 'שיווק, קמפיינים, מותג, מחקר שוק' },
  'משפטי':      { name: 'מיכל', role: 'Legal AI',         expertise: 'חוזים, ציות, רגולציה' },
  'משאבי אנוש': { name: 'דניאל', role: 'HR AI',           expertise: 'גיוס, הדרכה, ביצועי עובדים' },
  'טכנולוגיה':  { name: 'רון',   role: 'IT AI',           expertise: 'תשתיות, אוטומציה, אבטחה' },
  'תפעול':      { name: 'עמית',  role: 'COO AI',          expertise: 'ביצוע תפעולי, ייעול תהליכים' },
  'אסטרטגיה':  { name: 'דן',    role: 'Strategy AI',     expertise: 'אסטרטגיה ארוכת טווח, פיתוח עסקי' },
  'קריאייטיב':  { name: 'אלה',   role: 'Creative AI',    expertise: 'עיצוב, תוכן שיווקי, מיתוג' },
  'מכירות':     { name: 'תמר',   role: 'Sales AI',        expertise: 'מכירות, לידים, CRM, הכנסות' },
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY חסר' }, { status: 500 })

  const { department, instruction } = await req.json()
  if (!department || !instruction) return NextResponse.json({ error: 'חסרים שדות' }, { status: 400 })

  const agent = AGENTS[department] || { name: 'סוכן', role: 'AI', expertise: 'כללי' }

  const prompt = `אתה ${agent.name}, ה-${agent.role} של חברת "גבר יזמות ייעוץ עסקי והשקעות".
תחום מומחיות: ${agent.expertise}

קיבלת הוראה מהיו״ר: "${instruction}"

ענה בעברית בגוף ראשון כאילו אתה המנהל של מחלקת ${department}.
אשר קבלת ההוראה, תאר בקצרה (3-4 משפטים) כיצד אתה מתכוון לטפל בה ומה הצעד הראשון שתעשה עכשיו.`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  const response = data.content?.[0]?.text || ''
  return NextResponse.json({ response, agent: agent.name, role: agent.role })
}
