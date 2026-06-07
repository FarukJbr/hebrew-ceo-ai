'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Bot, CheckCircle2, Clock, Activity, MessageSquare, X, Send, Filter, Sparkles, ChevronDown, ChevronUp, WifiOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const departments = [
  { id: 'הנהלה',      agent: 'אריאל', role: 'מנכ״ל AI',     description: 'מנהל אסטרטגיה, מקבל החלטות ניהוליות ומפקח על שאר המחלקות', status: 'active',  specialty: ['אסטרטגיה','ניהול','דיווח'],        color: 'cyan' },
  { id: 'כספים',      agent: 'נועה',  role: 'CFO AI',        description: 'מנהלת כספים, תזרים מזומנים, דוחות פיננסיים ותחזיות',       status: 'active',  specialty: ['פיננסים','תקציב','השקעות'],      color: 'green' },
  { id: 'שיווק',      agent: 'יובל',  role: 'CMO AI',        description: 'מנהל שיווק, קמפיינים, אסטרטגיית מותג ומחקר שוק',          status: 'active',  specialty: ['שיווק','מותג','מחקר שוק'],       color: 'purple' },
  { id: 'משפטי',      agent: 'מיכל',  role: 'Legal AI',      description: 'מייעצת משפטית, סוקרת חוזים, מנהלת ציות ורגולציה',         status: 'active',  specialty: ['חוזים','ציות','רגולציה'],        color: 'amber' },
  { id: 'משאבי אנוש', agent: 'דניאל', role: 'HR AI',         description: 'מנהל גיוס, הדרכה, ביצועי עובדים ותרבות ארגונית',          status: 'active',  specialty: ['גיוס','הדרכה','ביצועים'],        color: 'cyan' },
  { id: 'טכנולוגיה',  agent: 'רון',   role: 'IT AI',         description: 'מנהל תשתיות, אוטומציה, אבטחת מידע ומערכות טכנולוגיות',   status: 'active',  specialty: ['תשתיות','אוטומציה','אבטחה'],    color: 'purple' },
  { id: 'מכירות',     agent: 'תמר',   role: 'Sales AI',      description: 'מנהלת מכירות, לידים, CRM וחיזוי הכנסות',                 status: 'standby', specialty: ['מכירות','CRM','לידים'],          color: 'red' },
  { id: 'תפעול',      agent: 'עמית',  role: 'COO AI',        description: 'מנהל ביצוע תפעולי, ייעול תהליכים ופיקוח על יעדי חברה',   status: 'active',  specialty: ['תפעול','ביצוע','אופטימיזציה'],  color: 'amber' },
  { id: 'אסטרטגיה',  agent: 'דן',    role: 'Strategy AI',   description: 'חשיבה אסטרטגית לטווח ארוך, ניתוח מתחרים ופיתוח עסקי',   status: 'active',  specialty: ['אסטרטגיה','פיתוח עסקי','מחקר'], color: 'cyan' },
  { id: 'קריאייטיב',  agent: 'אלה',   role: 'Creative AI',   description: 'עיצוב, תוכן שיווקי, מיתוג ופתרונות יצירתיים',           status: 'active',  specialty: ['עיצוב','תוכן','מיתוג'],         color: 'purple' },
]

const colorMap: Record<string, { bg: string; border: string; text: string; avatar: string }> = {
  cyan:   { bg: 'bg-accent-cyan/10',   border: 'border-accent-cyan/20',   text: 'text-accent-cyan',   avatar: 'from-accent-cyan/40 to-accent-cyan/10' },
  green:  { bg: 'bg-accent-green/10',  border: 'border-accent-green/20',  text: 'text-accent-green',  avatar: 'from-accent-green/40 to-accent-green/10' },
  purple: { bg: 'bg-accent-purple/10', border: 'border-accent-purple/20', text: 'text-accent-purple', avatar: 'from-accent-purple/40 to-accent-purple/10' },
  amber:  { bg: 'bg-accent-amber/10',  border: 'border-accent-amber/20',  text: 'text-accent-amber',  avatar: 'from-accent-amber/40 to-accent-amber/10' },
  red:    { bg: 'bg-accent-red/10',    border: 'border-accent-red/20',    text: 'text-accent-red',    avatar: 'from-accent-red/40 to-accent-red/10' },
}

export default function AgentsPage() {
  const [userId, setUserId] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'standby'>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [instructionTarget, setInstructionTarget] = useState<typeof departments[0] | null>(null)
  const [instructionText, setInstructionText] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [activeInstructions, setActiveInstructions] = useState<Record<string, { text: string; response?: string; agentName?: string }>>({})
  const [expandedDept, setExpandedDept] = useState<string | null>(null)
  const [dbError, setDbError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) return
      setUserId(uid)
      const { data: rows } = await supabase
        .from('instructions')
        .select('data')
        .eq('user_id', uid)
        .eq('data->>source', 'department')
        .order('created_at', { ascending: false })
      const map: Record<string, { text: string; response?: string; agentName?: string }> = {}
      for (const row of rows || []) {
        const d = row.data
        if (d?.agent && !map[d.agent]) {
          map[d.agent] = { text: d.text, response: d.workProduct || d.agentResponse, agentName: d.agentName }
        }
      }
      setActiveInstructions(map)
    })
  }, [])

  const filtered = departments.filter(d => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false
    if (filterDept !== 'all' && d.id !== filterDept) return false
    return true
  })

  const sendInstruction = async () => {
    if (!instructionText.trim() || !instructionTarget || isSending) return
    setIsSending(true)

    const ts = () => new Date().toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    const supabase = createClient()

    const newInstruction: any = {
      id: crypto.randomUUID(),
      text: instructionText.trim(),
      agent: instructionTarget.id,
      priority: 'normal',
      createdAt: ts(),
      status: 'received',
      source: 'department',
      timeline: [{ timestamp: ts(), status: 'received', note: `ההוראה התקבלה במחלקת ${instructionTarget.id}` }],
    }
    const { error: e1 } = await supabase.from('instructions').upsert({ id: newInstruction.id, user_id: userId, data: newInstruction })
    if (e1) setDbError(`שגיאת שמירה (${e1.code}): ${e1.message}`)

    newInstruction.status = 'in_progress'
    newInstruction.timeline.push({ timestamp: ts(), status: 'in_progress', note: `${instructionTarget.agent} מתחיל לטפל בהוראה` })
    await supabase.from('instructions').upsert({ id: newInstruction.id, user_id: userId, data: newInstruction })

    try {
      const aiRes = await fetch('/api/dept-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: instructionTarget.id, instruction: instructionText.trim() }),
      })
      const aiData = await aiRes.json()
      newInstruction.status = 'completed'
      newInstruction.agentName = aiData.agent || instructionTarget.agent
      newInstruction.agentResponse = aiData.acknowledgment || ''
      newInstruction.workProduct = aiData.workProduct || ''
      newInstruction.timeline.push({ timestamp: ts(), status: 'completed', note: `${aiData.agent || instructionTarget.agent} סיים לטפל ויצר תוצר` })
      await supabase.from('instructions').upsert({ id: newInstruction.id, user_id: userId, data: newInstruction })
      setActiveInstructions(prev => ({
        ...prev,
        [instructionTarget.id]: { text: newInstruction.text, response: newInstruction.workProduct || newInstruction.agentResponse, agentName: newInstruction.agentName },
      }))
    } catch {
      newInstruction.status = 'failed'
      newInstruction.timeline.push({ timestamp: ts(), status: 'failed', note: 'שגיאה בעת טיפול בהוראה' })
      await supabase.from('instructions').upsert({ id: newInstruction.id, user_id: userId, data: newInstruction })
    } finally {
      setInstructionText('')
      setInstructionTarget(null)
      setIsSending(false)
    }
  }

  const active = departments.filter(d => d.status === 'active').length

  return (
    <div className="min-h-screen">
      <Header title="מחלקות" subtitle="ניהול וניטור מחלקות הבינה המלאכותית" />

      <div className="p-6 space-y-6 animate-fade-in">
        {dbError && (
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <WifiOff className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-400 mb-0.5">הנתונים לא נשמרו</p>
              <p className="text-xs text-red-300/80 break-all">{dbError}</p>
              <a href="/setup" className="text-xs text-red-400 underline mt-1 inline-block">לחץ כאן לתיקון מסד הנתונים</a>
            </div>
            <button onClick={() => setDbError(null)} className="text-red-400/60 hover:text-red-400"><X className="w-4 h-4" /></button>
          </div>
        )}
        <div className="glass-card rounded-2xl p-4 flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-green" />
            </span>
            <span className="text-sm font-semibold text-accent-green">{active} מחלקות פעילות</span>
          </div>
          <div className="h-4 w-px bg-border-muted" />
          <span className="text-sm text-text-secondary">{departments.length - active} בסטנדבי</span>
          <div className="h-4 w-px bg-border-muted" />
          <span className="text-sm text-text-secondary">{Object.keys(activeInstructions).length} מחלקות עם הוראות פעילות</span>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${showFilters ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' : 'bg-white/5 border-border-muted text-text-muted hover:text-text-secondary'}`}>
            <Filter className="w-3.5 h-3.5" /> פילטרים
          </button>
        </div>

        {showFilters && (
          <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 border border-accent-cyan/10">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">סטטוס</label>
              <div className="flex gap-1">
                {(['all','active','standby'] as const).map(s => (
                  <button key={s} onClick={() => setFilterStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterStatus===s ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted'}`}>
                    {s==='all'?'הכל':s==='active'?'פעיל':'סטנדבי'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">מחלקה</label>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none">
                <option value="all" className="bg-bg-card">כל המחלקות</option>
                {departments.map(d => <option key={d.id} value={d.id} className="bg-bg-card">{d.id}</option>)}
              </select>
            </div>
            <button onClick={() => { setFilterStatus('all'); setFilterDept('all') }}
              className="self-end text-xs text-text-muted hover:text-accent-red flex items-center gap-1">
              <X className="w-3 h-3" /> איפוס
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(dept => {
            const c = colorMap[dept.color]
            const instrInfo = activeInstructions[dept.id]
            const isExpanded = expandedDept === dept.id
            return (
              <div key={dept.id} className={`glass-card rounded-2xl p-5 border ${instrInfo ? 'border-accent-amber/30' : c.border} transition-all`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.avatar} flex items-center justify-center text-lg font-bold ${c.text} shrink-0`}>
                    {dept.agent[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="text-sm font-bold text-text-primary">מחלקת {dept.id}</h3>
                      <span className={`text-xs font-medium ${c.text}`}>{dept.agent} — {dept.role}</span>
                      <span className={`mr-auto text-xs px-2 py-0.5 rounded-full ${dept.status === 'active' ? 'bg-accent-green/10 text-accent-green' : 'bg-white/5 text-text-muted'}`}>
                        {dept.status === 'active' ? 'פעיל' : 'סטנדבי'}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{dept.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {dept.specialty.map(s => <span key={s} className="text-xs bg-white/5 text-text-muted px-2 py-0.5 rounded-lg">{s}</span>)}
                    </div>

                    {instrInfo && (
                      <div className="mt-3 rounded-xl border border-accent-amber/20 bg-accent-amber/5 p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-accent-amber flex items-center gap-1">
                            <Activity className="w-3 h-3" /> הוראה פעילה
                          </span>
                          <button onClick={() => setExpandedDept(isExpanded ? null : dept.id)}
                            className="text-text-muted hover:text-text-secondary">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        <p className="text-xs text-text-secondary line-clamp-1">{instrInfo.text}</p>
                        {isExpanded && instrInfo.response && (
                          <div className="pt-2 border-t border-accent-amber/10">
                            <p className="text-xs font-semibold text-text-secondary mb-1">{instrInfo.agentName} מגיב:</p>
                            <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">{instrInfo.response}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-end mt-3 pt-3 border-t border-border-muted">
                      <button onClick={() => { setInstructionTarget(dept); setInstructionText('') }}
                        className={`flex items-center gap-1 text-xs ${c.text} hover:underline`}>
                        <MessageSquare className="w-3.5 h-3.5" />
                        {instrInfo ? 'שלח הוראה נוספת' : 'שלח הוראה'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {instructionTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => !isSending && setInstructionTarget(null)}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-md w-full space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-cyan" />
                הוראה למחלקת {instructionTarget.id}
              </h3>
              {!isSending && <button onClick={() => setInstructionTarget(null)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>}
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary bg-white/5 rounded-xl px-3 py-2">
              <Bot className="w-3.5 h-3.5" />
              <span>{instructionTarget.agent} — {instructionTarget.role}</span>
            </div>
            <textarea value={instructionText} onChange={e => setInstructionText(e.target.value)}
              placeholder={`תן הוראה למחלקת ${instructionTarget.id}...`} rows={4} disabled={isSending}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all resize-none disabled:opacity-60" />
            <div className="flex gap-2">
              <button onClick={sendInstruction} disabled={!instructionText.trim() || isSending}
                className="flex-1 flex items-center justify-center gap-2 bg-accent-cyan text-bg-base font-semibold text-sm py-2.5 rounded-xl hover:bg-accent-cyan/90 disabled:opacity-40 transition-all">
                {isSending ? (
                  <><span className="w-4 h-4 border-2 border-bg-base border-t-transparent rounded-full animate-spin" /> ממתין לתגובת {instructionTarget.agent}...</>
                ) : (
                  <><Send className="w-4 h-4" /> שלח הוראה</>
                )}
              </button>
              {!isSending && (
                <button onClick={() => setInstructionTarget(null)} className="px-4 bg-white/5 text-text-secondary text-sm rounded-xl hover:bg-white/8 transition-all">
                  ביטול
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
