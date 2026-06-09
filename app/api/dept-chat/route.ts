import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const COMPANY = 'גבר יזמות ייעוץ עסקי והשקעות'

const AGENTS: Record<string, { name: string; role: string; expertise: string; outputType: string }> = {
  'הנהלה':      { name: 'אריאל', role: 'מנכ״ל AI',     expertise: 'אסטרטגיה, ניהול כולל, קבלת החלטות',         outputType: 'תוכנית אסטרטגית מפורטת' },
  'כספים':      { name: 'נועה',  role: 'CFO AI',        expertise: 'פיננסים, תקציב, תזרים, דוחות',              outputType: 'דוח פיננסי עם מספרים והמלצות' },
  'שיווק':      { name: 'יובל',  role: 'CMO AI',        expertise: 'שיווק, קמפיינים, מותג, מחקר שוק',           outputType: 'תוכנית שיווקית עם פעולות ספציפיות' },
  'משפטי':      { name: 'מיכל', role: 'Legal AI',       expertise: 'חוזים, ציות, רגולציה',                      outputType: 'חוות דעת משפטית עם סיכונים והמלצות' },
  'משאבי אנוש': { name: 'דניאל', role: 'HR AI',         expertise: 'גיוס, הדרכה, ביצועי עובדים',                outputType: 'תוכנית HR עם שלבים ומדדים' },
  'טכנולוגיה':  { name: 'רון',   role: 'IT AI',         expertise: 'תשתיות, אוטומציה, אבטחה',                  outputType: 'מפרט טכני עם שלבי ביצוע' },
  'תפעול':      { name: 'עמית',  role: 'COO AI',        expertise: 'ביצוע תפעולי, ייעול תהליכים',               outputType: 'תוכנית תפעול עם לוח זמנים' },
  'אסטרטגיה':  { name: 'דן',    role: 'Strategy AI',   expertise: 'אסטרטגיה ארוכת טווח, פיתוח עסקי',          outputType: 'ניתוח אסטרטגי עם המלצות לטווח קצר וארוך' },
  'קריאייטיב':  { name: 'אלה',   role: 'Creative AI',   expertise: 'עיצוב, תוכן שיווקי, מיתוג',               outputType: 'הצעה קריאייטיבית עם רעיונות ספציפיים' },
  'מכירות':     { name: 'תמר',   role: 'Sales AI',      expertise: 'מכירות, לידים, CRM, הכנסות',               outputType: 'תוכנית מכירות עם יעדים ותסריטים' },
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY חסר' }, { status: 500 })

  const { department, instruction, thread } = await req.json()
  if (!department || !instruction) return NextResponse.json({ error: 'חסרים שדות' }, { status: 400 })

  const agent = AGENTS[department] || { name: 'סוכן', role: 'AI', expertise: 'כללי', outputType: 'דוח' }

  let prompt: string

  if (thread && thread.length > 0) {
    const threadText = thread.map((t: any) =>
      `${t.role === 'user' ? 'יו״ר' : agent.name}: ${t.text}`
    ).join('\n\n---\n\n')
    const lastMsg = thread[thread.length - 1]?.text || ''
    prompt = `אתה ${agent.name}, ה-${agent.role} של חברת "${COMPANY}".
תחום מומחיות: ${agent.expertise}

ההוראה המקורית שקיבלת: "${instruction}"

היסטוריית השיחה עד כה:
${threadText}

הבקשה האחרונה של היו״ר: "${lastMsg}"

ענה בעברית בגוף ראשון כ-${agent.name}. היה ממוקד ומקצועי. אם נשאלת שאלה — ענה עליה ישירות. אם ביקשו שינוי — בצע אותו ותאר מה שינית. אל תחזור על מה שכבר אמרת.`
  } else {
    prompt = `אתה ${agent.name}, ה-${agent.role} של חברת "${COMPANY}".
תחום מומחיות: ${agent.expertise}

קיבלת הוראה מהיו״ר: "${instruction}"

המשימה שלך: טפל בהוראה זו ויצר ${agent.outputType}.

ענה בעברית בגוף ראשון. המבנה:

**קבלת ההוראה:**
משפט אחד — אשר שקיבלת ואתה מתחיל לעבוד.

**תוצר העבודה:**
${agent.outputType} מפורט ומקצועי — לפחות 5-8 נקודות עבודה ספציפיות שביצעת או מתכנן לבצע. תן מידע אמיתי ושימושי, לא כללי.

**סטטוס ומה הלאה:**
מה הצעד הבא ומה אתה צריך מהיו״ר כדי להמשיך.`
  }

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
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const data = await res.json()
  const workProduct = data.content?.[0]?.text || ''

  const firstLine = workProduct.split('\n').find((l: string) => l.trim()) || ''
  const acknowledgment = firstLine.replace(/\*\*/g, '').slice(0, 120)

  return NextResponse.json({
    acknowledgment,
    workProduct,
    agent: agent.name,
    role: agent.role,
  })
}
