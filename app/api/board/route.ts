import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const COMPANY = 'גבר יזמות ייעוץ עסקי והשקעות'

function buildPrompt(directorName: string, expertise: string, title: string, description: string) {
  return `אתה ${directorName} בדירקטוריון של חברת "${COMPANY}".
תחום מומחיות: ${expertise}

הצעה לדיון: ${title}
פירוט: ${description}

ענה בעברית בלבד. ספק:
1. עמדה: בעד / נגד / נמנע
2. שלושה נימוקים קצרים
3. המלצה או אזהרה אחת

היה תכליתי וענייני כחבר דירקטוריון מקצועי.`
}

async function askClaude(title: string, description: string): Promise<{ vote: string; opinion: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { vote: 'נמנע', opinion: 'ANTHROPIC_API_KEY חסר' }

  const prompt = buildPrompt('דירקטור קלוד', 'אסטרטגיה, משפט, ממשל תאגידי', title, description)
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 512, messages: [{ role: 'user', content: prompt }] }),
  })
  const data = await res.json()
  const opinion = data.content?.[0]?.text || ''
  const vote = opinion.includes('בעד') ? 'for' : opinion.includes('נגד') ? 'against' : 'abstain'
  return { vote, opinion }
}

async function askOpenAI(title: string, description: string): Promise<{ vote: string; opinion: string }> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return { vote: 'נמנע', opinion: 'OPENAI_API_KEY חסר' }

  const prompt = buildPrompt('דירקטור GPT', 'פיננסים, השקעות, ניהול סיכונים', title, description)
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'gpt-4o', max_tokens: 512, messages: [{ role: 'user', content: prompt }] }),
  })
  const data = await res.json()
  const opinion = data.choices?.[0]?.message?.content || ''
  const vote = opinion.includes('בעד') ? 'for' : opinion.includes('נגד') ? 'against' : 'abstain'
  return { vote, opinion }
}

async function askGemini(title: string, description: string): Promise<{ vote: string; opinion: string }> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!apiKey) return { vote: 'נמנע', opinion: 'GOOGLE_GEMINI_API_KEY חסר' }

  const prompt = buildPrompt('דירקטור ג׳מיני', 'שיווק, מיתוג, צמיחה דיגיטלית', title, description)
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
  })
  const data = await res.json()
  const opinion = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  const vote = opinion.includes('בעד') ? 'for' : opinion.includes('נגד') ? 'against' : 'abstain'
  return { vote, opinion }
}

export async function POST(req: NextRequest) {
  const { title, description } = await req.json()
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })

  const [claude, gpt, gemini] = await Promise.all([
    askClaude(title, description || ''),
    askOpenAI(title, description || ''),
    askGemini(title, description || ''),
  ])

  return NextResponse.json({
    directors: [
      { director: 'Claude', vote: claude.vote, opinion: claude.opinion },
      { director: 'OpenAI', vote: gpt.vote, opinion: gpt.opinion },
      { director: 'Gemini', vote: gemini.vote, opinion: gemini.opinion },
    ],
  })
}
