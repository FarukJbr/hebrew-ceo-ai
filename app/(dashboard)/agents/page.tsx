'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Bot, CheckCircle2, Clock, Activity, MessageSquare, X, Send, Filter, Sparkles } from 'lucide-react'

const departments = [
  { id: 1, name: 'הנהלה',        agent: 'אריאל', role: 'מנכ״ל AI',     description: 'מנהל אסטרטגיה, מקבל החלטות ניהוליות ומפקח על שאר המחלקות', status: 'active', tasksCompleted: 142, tasksOpen: 3, lastAction: 'ניתוח דוח רבעוני Q2 — לפני 12 דקות', specialty: ['אסטרטגיה','ניהול','דיווח'],        color: 'cyan' },
  { id: 2, name: 'כספים',        agent: 'נועה',  role: 'CFO AI',        description: 'מנהלת כספים, תזרים מזומנים, דוחות פיננסיים ותחזיות',       status: 'active', tasksCompleted: 98,  tasksOpen: 2, lastAction: 'עדכון תחזית תזרים יוני — לפני 28 דקות',  specialty: ['פיננסים','תקציב','השקעות'],      color: 'green' },
  { id: 3, name: 'שיווק',        agent: 'יובל',  role: 'שיווק AI',      description: 'מנהל שיווק, קמפיינים, אסטרטגיית מותג ומחקר שוק',          status: 'active', tasksCompleted: 67,  tasksOpen: 5, lastAction: 'הציע קמפיין לשוק האירופי — לפני 45 דקות', specialty: ['שיווק','מותג','מחקר שוק'],       color: 'purple' },
  { id: 4, name: 'משפטי',        agent: 'מיכל',  role: 'משפטי AI',      description: 'מייעצת משפטית, סוקרת חוזים, מנהלת ציות ורגולציה',         status: 'active', tasksCompleted: 54,  tasksOpen: 1, lastAction: 'סקר הסכם ספק חדש — לפני שעה',           specialty: ['חוזים','ציות','רגולציה'],        color: 'amber' },
  { id: 5, name: 'משאבי אנוש',   agent: 'דניאל', role: 'HR AI',         description: 'מנהל גיוס, הדרכה, ביצועי עובדים ותרבות ארגונית',          status: 'active', tasksCompleted: 78,  tasksOpen: 3, lastAction: 'פרסם 3 משרות חדשות — לפני 2 שעות',       specialty: ['גיוס','הדרכה','ביצועים'],        color: 'cyan' },
  { id: 6, name: 'נדל״ן',        agent: 'שירה',  role: 'נדל״ן AI',      description: 'מנהלת עסקאות נדל״ן, הערכות שווי ותיק נכסים',             status: 'active', tasksCompleted: 22,  tasksOpen: 2, lastAction: 'ניתוח עסקת נכס מסחרי — לפני 3 שעות',     specialty: ['נדל״ן','הערכות שווי','עסקאות'],  color: 'green' },
  { id: 7, name: 'טכנולוגיה',    agent: 'רון',   role: 'IT AI',         description: 'מנהל תשתיות, אוטומציה, אבטחת מידע ומערכות טכנולוגיות',  status: 'active',  tasksCompleted: 45, tasksOpen: 2, lastAction: 'בדיקת אבטחה חודשית — לפני 3 ימים',        specialty: ['תשתיות','אוטומציה','אבטחה'],    color: 'purple' },
  { id: 8, name: 'מכירות',       agent: 'תמר',   role: 'מכירות AI',     description: 'מנהלת מכירות, לידים, CRM וחיזוי הכנסות',                 status: 'standby', tasksCompleted: 31, tasksOpen: 0, lastAction: 'עדכון pipeline מכירות — לפני יום',         specialty: ['מכירות','CRM','לידים'],          color: 'red' },
  { id: 9,  name: 'תפעול',       agent: 'עמית',  role: 'COO AI',        description: 'מנהל ביצוע תפעולי, ייעול תהליכים ופיקוח על יעדי חברה',   status: 'active',  tasksCompleted: 38, tasksOpen: 4, lastAction: 'ייעול תהליך אישורי תשלום — לפני שעה',      specialty: ['תפעול','ביצוע','אופטימיזציה'],  color: 'amber' },
  { id: 10, name: 'אסטרטגיה',    agent: 'דן',    role: 'Strategy AI',   description: 'חשיבה אסטרטגית לטווח ארוך, ניתוח מתחרים ופיתוח עסקי',   status: 'active',  tasksCompleted: 29, tasksOpen: 2, lastAction: 'ניתוח מגמות שוק Q3 — לפני 4 שעות',          specialty: ['אסטרטגיה','פיתוח עסקי','מחקר'], color: 'cyan' },
  { id: 11, name: 'קריאייטיב',   agent: 'אלה',   role: 'Creative AI',   description: 'עיצוב, תוכן שיווקי, מיתוג ופתרונות יצירתיים',           status: 'active',  tasksCompleted: 17, tasksOpen: 3, lastAction: 'עיצוב חומרי מיתוג Q3 — לפני 2 שעות',       specialty: ['עיצוב','תוכן','מיתוג'],         color: 'purple' },
]

const colorMap: Record<string, { bg: string; border: string; text: string; avatar: string }> = {
  cyan:   { bg: 'bg-accent-cyan/10',   border: 'border-accent-cyan/20',   text: 'text-accent-cyan',   avatar: 'from-accent-cyan/40 to-accent-cyan/10' },
  green:  { bg: 'bg-accent-green/10',  border: 'border-accent-green/20',  text: 'text-accent-green',  avatar: 'from-accent-green/40 to-accent-green/10' },
  purple: { bg: 'bg-accent-purple/10', border: 'border-accent-purple/20', text: 'text-accent-purple', avatar: 'from-accent-purple/40 to-accent-purple/10' },
  amber:  { bg: 'bg-accent-amber/10',  border: 'border-accent-amber/20',  text: 'text-accent-amber',  avatar: 'from-accent-amber/40 to-accent-amber/10' },
  red:    { bg: 'bg-accent-red/10',    border: 'border-accent-red/20',    text: 'text-accent-red',    avatar: 'from-accent-red/40 to-accent-red/10' },
}

export default function AgentsPage() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'standby'>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [instructionTarget, setInstructionTarget] = useState<typeof departments[0] | null>(null)
  const [instructionText, setInstructionText] = useState('')
  const [sentDepts, setSentDepts] = useState<Set<number>>(new Set())

  const filtered = departments.filter(d => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false
    if (filterDept !== 'all' && d.name !== filterDept) return false
    return true
  })

  const sendInstruction = () => {
    if (!instructionText.trim() || !instructionTarget) return
    setSentDepts(prev => new Set([...prev, instructionTarget.id]))
    setInstructionText('')
    setInstructionTarget(null)
  }

  const active = departments.filter(d => d.status === 'active').length

  return (
    <div className="min-h-screen">
      <Header title="מחלקות" subtitle="ניהול וניטור מחלקות הבינה המלאכותית — גבר יזמות" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary */}
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
          <span className="text-sm text-text-secondary">{departments.reduce((s,d)=>s+d.tasksOpen,0)} משימות פתוחות</span>
          <div className="h-4 w-px bg-border-muted" />
          <span className="text-sm text-text-secondary">{departments.reduce((s,d)=>s+d.tasksCompleted,0)} משימות הושלמו</span>
        </div>

        {/* Filters */}
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
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterStatus===s ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted hover:text-text-secondary'}`}>
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
                {departments.map(d => <option key={d.name} value={d.name} className="bg-bg-card">{d.name}</option>)}
              </select>
            </div>
            <button onClick={() => { setFilterStatus('all'); setFilterDept('all') }}
              className="self-end text-xs text-text-muted hover:text-accent-red flex items-center gap-1">
              <X className="w-3 h-3" /> איפוס
            </button>
          </div>
        )}

        {/* Departments grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {filtered.map(dept => {
            const c = colorMap[dept.color]
            const sent = sentDepts.has(dept.id)
            return (
              <div key={dept.id} className={`glass-card rounded-2xl p-5 border ${c.border} transition-all group`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.avatar} flex items-center justify-center text-lg font-bold ${c.text} shrink-0`}>
                    {dept.agent[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="text-sm font-bold text-text-primary">מחלקת {dept.name}</h3>
                      <span className={`text-xs font-medium ${c.text}`}>{dept.agent} — {dept.role}</span>
                      <span className={`mr-auto text-xs px-2 py-0.5 rounded-full ${dept.status === 'active' ? 'bg-accent-green/10 text-accent-green' : 'bg-white/5 text-text-muted'}`}>
                        {dept.status === 'active' ? 'פעיל' : 'סטנדבי'}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{dept.description}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {dept.specialty.map(s => <span key={s} className="text-xs bg-white/5 text-text-muted px-2 py-0.5 rounded-lg">{s}</span>)}
                    </div>
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-muted">
                      <span className="flex items-center gap-1.5 text-xs text-text-muted">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />{dept.tasksCompleted} הושלמו
                      </span>
                      {dept.tasksOpen > 0 && (
                        <span className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Clock className="w-3.5 h-3.5 text-accent-amber" />{dept.tasksOpen} פתוחות
                        </span>
                      )}
                      <button onClick={() => { setInstructionTarget(dept); setInstructionText('') }}
                        className={`mr-auto flex items-center gap-1 text-xs ${c.text} hover:underline`}>
                        <MessageSquare className="w-3.5 h-3.5" />
                        {sent ? 'שלח הוראה נוספת' : 'שלח הוראה'}
                      </button>
                    </div>
                    <div className="flex items-start gap-1.5 mt-2">
                      <Activity className="w-3 h-3 text-text-muted mt-0.5 shrink-0" />
                      <p className="text-xs text-text-muted">{dept.lastAction}</p>
                    </div>
                    {sent && (
                      <div className="mt-2 flex items-center gap-1.5 bg-accent-green/5 border border-accent-green/20 rounded-xl px-3 py-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                        <span className="text-xs text-accent-green">ההוראה נשלחה בהצלחה</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Send instruction modal */}
      {instructionTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setInstructionTarget(null)}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-md w-full space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent-cyan" />
                הוראה למחלקת {instructionTarget.name}
              </h3>
              <button onClick={() => setInstructionTarget(null)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary bg-white/5 rounded-xl px-3 py-2">
              <Bot className="w-3.5 h-3.5" />
              <span>{instructionTarget.agent} — {instructionTarget.role}</span>
            </div>
            <textarea value={instructionText} onChange={e => setInstructionText(e.target.value)}
              placeholder={`תן הוראה למחלקת ${instructionTarget.name}...`} rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all resize-none" />
            <div className="flex gap-2">
              <button onClick={sendInstruction} disabled={!instructionText.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-accent-cyan text-bg-base font-semibold text-sm py-2.5 rounded-xl hover:bg-accent-cyan/90 disabled:opacity-40 transition-all">
                <Send className="w-4 h-4" /> שלח הוראה
              </button>
              <button onClick={() => setInstructionTarget(null)}
                className="px-4 bg-white/5 text-text-secondary text-sm rounded-xl hover:bg-white/8 transition-all">
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
