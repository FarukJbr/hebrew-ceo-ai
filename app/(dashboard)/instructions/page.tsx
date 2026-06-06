'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Sparkles, Plus, Trash2, CheckCircle2, Clock, X, ChevronDown, ChevronUp, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Priority = 'urgent' | 'high' | 'normal'

const DEPARTMENTS = ['הנהלה','כספים','שיווק','משפטי','משאבי אנוש','טכנולוגיה','תפעול','אסטרטגיה','קריאייטיב','מכירות']

const DEPT_ROLE: Record<string, string> = {
  'הנהלה':        'CEO AI — אריאל',
  'כספים':        'CFO AI — נועה',
  'שיווק':        'CMO AI — יובל',
  'משפטי':        'Legal AI — מיכל',
  'משאבי אנוש':   'HR AI — דניאל',
  'טכנולוגיה':    'IT AI — רון',
  'תפעול':        'COO AI — עמית',
  'אסטרטגיה':     'Strategy AI — דן',
  'קריאייטיב':    'Creative AI — אלה',
  'מכירות':       'מכירות AI — תמר',
  'כולם':         'כל המחלקות',
}

interface Instruction {
  id: string
  text: string
  agent: string
  priority: Priority
  createdAt: string
  status: 'active' | 'done'
}

const priorityConfig: Record<Priority, { label: string; color: string; bg: string; border: string }> = {
  urgent: { label: 'דחוף',   color: 'text-accent-red',   bg: 'bg-accent-red/10',   border: 'border-accent-red/20' },
  high:   { label: 'גבוה',   color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  normal: { label: 'רגיל',   color: 'text-text-muted',   bg: 'bg-white/5',         border: 'border-border-muted' },
}

export default function InstructionsPage() {
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [instructions, setInstructions] = useState<Instruction[]>([])
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [agent, setAgent] = useState('הנהלה')
  const [priority, setPriority] = useState<Priority>('normal')

  // Filters
  const [showFilters, setShowFilters] = useState(false)
  const [fStatus, setFStatus] = useState<'all' | 'active' | 'done'>('all')
  const [fPriority, setFPriority] = useState<Priority | 'all'>('all')
  const [fDept, setFDept] = useState<string>('all')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) { setIsLoading(false); return }
      setUserId(uid)
      const { data: rows } = await supabase
        .from('instructions')
        .select('data')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      setInstructions(rows?.map((r: any) => r.data) || [])
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-3"/>
        <p className="text-sm text-text-muted">טוען נתונים...</p>
      </div>
    </div>
  )

  const filtered = instructions.filter(i => {
    if (fStatus !== 'all' && i.status !== fStatus) return false
    if (fPriority !== 'all' && i.priority !== fPriority) return false
    if (fDept !== 'all' && i.agent !== fDept) return false
    return true
  })

  const active = filtered.filter(i => i.status === 'active')
  const done = filtered.filter(i => i.status === 'done')

  const addInstruction = async () => {
    if (!text.trim()) return
    const newInstruction: Instruction = {
      id: 'instruction-' + Date.now(),
      text: text.trim(),
      agent,
      priority,
      createdAt: 'עכשיו',
      status: 'active',
    }
    setInstructions(prev => [newInstruction, ...prev])
    setText(''); setAgent('הנהלה'); setPriority('normal'); setShowForm(false)
    const supabase = createClient()
    await supabase.from('instructions').insert({ id: newInstruction.id, user_id: userId, data: newInstruction })
  }

  const markDone = async (id: string) => {
    setInstructions(prev => prev.map(i => i.id === id ? { ...i, status: 'done' } : i))
    const updated = instructions.find(i => i.id === id)
    if (!updated) return
    const supabase = createClient()
    await supabase.from('instructions').update({ data: { ...updated, status: 'done' } }).eq('id', id).eq('user_id', userId)
  }

  const markActive = async (id: string) => {
    setInstructions(prev => prev.map(i => i.id === id ? { ...i, status: 'active' } : i))
    const updated = instructions.find(i => i.id === id)
    if (!updated) return
    const supabase = createClient()
    await supabase.from('instructions').update({ data: { ...updated, status: 'active' } }).eq('id', id).eq('user_id', userId)
  }

  const deleteI = async (id: string) => {
    setInstructions(prev => prev.filter(i => i.id !== id))
    const supabase = createClient()
    await supabase.from('instructions').delete().eq('id', id).eq('user_id', userId)
  }

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id)

  return (
    <div className="min-h-screen">
      <Header title="הוראות AI" subtitle="תן הוראות ישירות לסוכני הבינה המלאכותית במחלקות" />

      <div className="p-6 space-y-5 animate-fade-in">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-accent-cyan" />{active.length} פעילות</span>
            <span className="text-text-muted">|</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />{done.length} הושלמו</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${showFilters ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' : 'bg-white/5 border-border-muted text-text-muted hover:text-text-secondary'}`}>
              <Filter className="w-3.5 h-3.5" /> פילטרים
            </button>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
              <Plus className="w-3.5 h-3.5" /> הוראה חדשה
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 border border-accent-cyan/10">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">סטטוס</label>
              <div className="flex gap-1">
                {(['all','active','done'] as const).map(s => (
                  <button key={s} onClick={() => setFStatus(s)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${fStatus===s ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted hover:text-text-secondary'}`}>
                    {s==='all'?'הכל':s==='active'?'פעילות':'הושלמו'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">דחיפות</label>
              <div className="flex gap-1">
                {(['all','urgent','high','normal'] as const).map(p => (
                  <button key={p} onClick={() => setFPriority(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${fPriority===p ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted hover:text-text-secondary'}`}>
                    {p==='all'?'הכל':p==='urgent'?'דחוף':p==='high'?'גבוה':'רגיל'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">מחלקה</label>
              <select value={fDept} onChange={e => setFDept(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none">
                <option value="all" className="bg-bg-card">כל המחלקות</option>
                {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-bg-card">{d}</option>)}
              </select>
            </div>
            <button onClick={() => { setFStatus('all'); setFPriority('all'); setFDept('all') }}
              className="self-end text-xs text-text-muted hover:text-accent-red transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> איפוס
            </button>
          </div>
        )}

        {/* New instruction form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-5 border border-accent-cyan/20 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-cyan" /> הוראה חדשה לסוכן AI
            </h3>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="תאר את המשימה בצורה ברורה ומפורטת..." rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all resize-none" />
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-text-muted mb-1.5">מחלקה</label>
                <select value={agent} onChange={e => setAgent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none">
                  <option value="כולם" className="bg-bg-card">כולם — כל המחלקות</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-bg-card">{d} — {DEPT_ROLE[d]}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-text-muted mb-1.5">דחיפות</label>
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none">
                  <option value="urgent" className="bg-bg-card">דחוף</option>
                  <option value="high" className="bg-bg-card">גבוה</option>
                  <option value="normal" className="bg-bg-card">רגיל</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button onClick={addInstruction}
                  className="bg-accent-cyan text-bg-base font-semibold text-xs px-4 py-2 rounded-xl hover:bg-accent-cyan/90 transition-all">
                  שלח הוראה
                </button>
                <button onClick={() => setShowForm(false)}
                  className="bg-white/5 text-text-secondary text-xs px-3 py-2 rounded-xl hover:bg-white/8 transition-all">
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Active */}
        {active.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-accent-cyan uppercase tracking-wider">הוראות פעילות ({active.length})</h3>
            {active.map(inst => {
              const p = priorityConfig[inst.priority]
              const isExpanded = expandedId === inst.id
              return (
                <div key={inst.id} className={`glass-card rounded-2xl border ${p.border} transition-all`}>
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-cyan">
                        {inst.agent[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-bold text-accent-cyan">{inst.agent}</span>
                          <span className="text-xs text-text-muted">{DEPT_ROLE[inst.agent]}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-lg ${p.bg} ${p.color}`}>{p.label}</span>
                          <span className="text-xs text-text-muted mr-auto flex items-center gap-1">
                            <Clock className="w-3 h-3" />{inst.createdAt}
                          </span>
                        </div>
                        <p className={`text-sm text-text-primary leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                          {inst.text}
                        </p>
                        {inst.text.length > 100 && (
                          <button onClick={() => toggleExpand(inst.id)} className="flex items-center gap-1 text-xs text-accent-cyan mt-1 hover:underline">
                            {isExpanded ? <><ChevronUp className="w-3 h-3" />הצג פחות</> : <><ChevronDown className="w-3 h-3" />קרא עוד</>}
                          </button>
                        )}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button onClick={() => markDone(inst.id)}
                          title="סמן כטופל"
                          className="w-7 h-7 rounded-lg bg-accent-green/10 text-accent-green flex items-center justify-center hover:bg-accent-green/20 transition-all">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => deleteI(inst.id)}
                          title="מחק"
                          className="w-7 h-7 rounded-lg bg-accent-red/10 text-accent-red flex items-center justify-center hover:bg-accent-red/20 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Done */}
        {done.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">טופלו ({done.length})</h3>
            {done.map(inst => (
              <div key={inst.id} className="glass-card rounded-2xl p-4 opacity-60 hover:opacity-80 transition-all group">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent-green mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-xs font-bold text-text-secondary">{inst.agent}</span>
                      <span className="text-xs text-text-muted">{DEPT_ROLE[inst.agent]}</span>
                      <span className="text-xs text-text-muted mr-auto">{inst.createdAt}</span>
                    </div>
                    <p className={`text-sm text-text-secondary line-through leading-relaxed ${expandedId === inst.id ? '' : 'line-clamp-2'}`}>
                      {inst.text}
                    </p>
                    {inst.text.length > 100 && (
                      <button onClick={() => toggleExpand(inst.id)} className="flex items-center gap-1 text-xs text-text-muted mt-1 hover:text-text-secondary">
                        {expandedId === inst.id ? <><ChevronUp className="w-3 h-3" />פחות</> : <><ChevronDown className="w-3 h-3" />קרא עוד</>}
                      </button>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => markActive(inst.id)} title="הפעל מחדש"
                      className="w-7 h-7 rounded-lg bg-accent-cyan/10 text-accent-cyan flex items-center justify-center hover:bg-accent-cyan/20 transition-all">
                      <Sparkles className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteI(inst.id)}
                      className="w-7 h-7 rounded-lg bg-white/5 text-text-muted flex items-center justify-center hover:bg-accent-red/10 hover:text-accent-red transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-text-muted text-sm">אין הוראות התואמות את הפילטר</div>
        )}
      </div>
    </div>
  )
}
