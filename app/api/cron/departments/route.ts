import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const DEPARTMENTS = ['הנהלה','כספים','שיווק','משפטי','משאבי אנוש','טכנולוגיה','תפעול','אסטרטגיה','קריאייטיב','מכירות']

const DEFAULT_GOALS: Record<string, string> = {
  'הנהלה':      'סקור את מצב החברה הכולל, זהה אתגרים ואת הזדמנויות, והכן סיכום ניהולי שבועי עם המלצות אסטרטגיות',
  'כספים':      'הכן סיכום פיננסי שבועי: בדוק תזרים מזומנים, עדכן תחזיות, וזהה הוצאות שניתן לייעל',
  'שיווק':      'צור עדכון שיווקי שבועי: ניתוח ביצועי קמפיינים, רעיונות לתוכן חדש, והמלצות לשיפור נוכחות דיגיטלית',
  'משפטי':      'בדוק עדכונים רגולטוריים רלוונטיים לחברה, זהה סיכונים משפטיים פוטנציאליים, והכן עדכון ציות שבועי',
  'משאבי אנוש': 'הכן עדכון HR שבועי: בדוק מדדי עובדים, זהה צרכי הכשרה, והמלץ על שיפורים בתרבות ארגונית',
  'טכנולוגיה':  'בצע סקירה טכנולוגית שבועית: בדוק ביצועי מערכות, זהה פגיעויות אבטחה, והמלץ על שיפורים',
  'תפעול':      'הכן דוח תפעולי שבועי: בדוק יעילות תהליכים, זהה צווארי בקבוק, והמלץ על אופטימיזציות',
  'אסטרטגיה':  'ערוך ניתוח אסטרטגי שבועי: עקוב אחר מתחרים, זהה מגמות שוק, והמלץ על פעולות אסטרטגיות',
  'קריאייטיב':  'צור סיכום קריאייטיב שבועי: הצע רעיונות לתוכן, עדכן מדריך מותג, והמלץ על קמפיינים יצירתיים',
  'מכירות':     'הכן עדכון מכירות שבועי: נתח ביצועי מכירות, עדכן תחזיות הכנסות, וזהה הזדמנויות מכירה חדשות',
}

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anthropicKey = process.env.ANTHROPIC_API_KEY

  if (!supabaseUrl || !serviceKey || !anthropicKey) {
    return NextResponse.json({ error: 'Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Get all users who have at least one instruction
  const { data: allInstructions } = await supabase
    .from('instructions')
    .select('user_id, data')
    .order('created_at', { ascending: false })

  if (!allInstructions?.length) {
    return NextResponse.json({ message: 'No instructions found', processed: 0 })
  }

  // Group by user
  const userMap: Record<string, any[]> = {}
  for (const row of allInstructions) {
    if (!userMap[row.user_id]) userMap[row.user_id] = []
    userMap[row.user_id].push(row.data)
  }

  // Get department goals from settings table
  const { data: goalRows } = await supabase
    .from('department_goals')
    .select('user_id, data')

  const goalMap: Record<string, Record<string, string>> = {}
  for (const row of goalRows || []) {
    if (!goalMap[row.user_id]) goalMap[row.user_id] = {}
    if (row.data?.department && row.data?.goal) {
      goalMap[row.user_id][row.data.department] = row.data.goal
    }
  }

  let totalProcessed = 0
  const ts = () => new Date().toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })

  for (const [userId, userInstructions] of Object.entries(userMap)) {
    for (const dept of DEPARTMENTS) {
      // Find pending instruction for this department
      const pending = userInstructions.find(i => i.agent === dept && (i.status === 'received' || i.status === 'in_progress'))

      let instructionText: string | null = null
      let isNew = false

      if (pending) {
        instructionText = pending.text
      } else {
        // No pending — use department goal or last completed instruction
        const userGoal = goalMap[userId]?.[dept]
        if (userGoal) {
          instructionText = userGoal
          isNew = true
        } else {
          const lastCompleted = userInstructions.find(i => i.agent === dept && i.status === 'completed')
          if (lastCompleted) {
            instructionText = lastCompleted.text
            isNew = true
          } else {
            // Use default goal
            instructionText = DEFAULT_GOALS[dept]
            isNew = true
          }
        }
      }

      if (!instructionText) continue

      // Call AI
      try {
        const AGENTS: Record<string, { name: string; role: string; expertise: string; outputType: string }> = {
          'הנהלה':      { name: 'אריאל', role: 'מנכ״ל AI',     expertise: 'אסטרטגיה, ניהול כולל',          outputType: 'תוכנית אסטרטגית' },
          'כספים':      { name: 'נועה',  role: 'CFO AI',        expertise: 'פיננסים, תקציב, תזרים',          outputType: 'דוח פיננסי' },
          'שיווק':      { name: 'יובל',  role: 'CMO AI',        expertise: 'שיווק, קמפיינים, מותג',          outputType: 'תוכנית שיווקית' },
          'משפטי':      { name: 'מיכל', role: 'Legal AI',       expertise: 'חוזים, ציות, רגולציה',           outputType: 'חוות דעת משפטית' },
          'משאבי אנוש': { name: 'דניאל', role: 'HR AI',         expertise: 'גיוס, הדרכה, ביצועים',           outputType: 'תוכנית HR' },
          'טכנולוגיה':  { name: 'רון',   role: 'IT AI',         expertise: 'תשתיות, אוטומציה, אבטחה',       outputType: 'מפרט טכני' },
          'תפעול':      { name: 'עמית',  role: 'COO AI',        expertise: 'ביצוע תפעולי, ייעול תהליכים',   outputType: 'תוכנית תפעול' },
          'אסטרטגיה':  { name: 'דן',    role: 'Strategy AI',   expertise: 'אסטרטגיה ארוכת טווח',           outputType: 'ניתוח אסטרטגי' },
          'קריאייטיב':  { name: 'אלה',   role: 'Creative AI',   expertise: 'עיצוב, תוכן, מיתוג',            outputType: 'הצעה קריאייטיבית' },
          'מכירות':     { name: 'תמר',   role: 'Sales AI',      expertise: 'מכירות, לידים, CRM',             outputType: 'תוכנית מכירות' },
        }
        const agent = AGENTS[dept]
        const prompt = `אתה ${agent.name}, ה-${agent.role} של חברת "גבר יזמות ייעוץ עסקי והשקעות".
תחום מומחיות: ${agent.expertise}

משימתך האוטומטית: ${instructionText}

ענה בעברית בגוף ראשון. צור ${agent.outputType} מפורט ומקצועי עם 5-7 נקודות ספציפיות. זהו עדכון אוטומטי שבועי.`

        const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': anthropicKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] }),
        })
        const aiData = await aiRes.json()
        const workProduct = aiData.content?.[0]?.text || ''

        const newInstruction = {
          id: crypto.randomUUID(),
          text: instructionText,
          agent: dept,
          priority: 'normal',
          createdAt: ts(),
          status: 'completed',
          agentName: agent.name,
          workProduct,
          source: 'auto',
          isAutomatic: true,
          timeline: [
            { timestamp: ts(), status: 'received', note: 'הופעל אוטומטית על ידי המערכת' },
            { timestamp: ts(), status: 'completed', note: `${agent.name} סיים עבודה אוטומטית` },
          ],
        }

        if (pending) {
          // Update existing pending instruction
          await supabase.from('instructions').upsert({ id: pending.id, user_id: userId, data: { ...pending, ...newInstruction, id: pending.id } })
        } else {
          // Insert new auto instruction
          await supabase.from('instructions').upsert({ id: newInstruction.id, user_id: userId, data: newInstruction })
        }

        totalProcessed++
      } catch (e) {
        console.error(`Cron error for ${dept}:`, e)
      }
    }
  }

  return NextResponse.json({ message: 'Cron completed', processed: totalProcessed, timestamp: new Date().toISOString() })
}
