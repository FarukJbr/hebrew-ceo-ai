'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Sparkles, Plus, Trash2, CheckCircle2, Clock, X, ChevronDown, ChevronUp, Filter, Bot, FileText, Inbox, AlertCircle, Loader2, WifiOff, Send, ImageIcon, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Priority = 'urgent' | 'high' | 'normal'
type InstructionStatus = 'received' | 'in_progress' | 'completed' | 'failed'

const DEPARTMENTS = ['הנהלה','כספים','שיווק','משפטי','משאבי אנוש','טכנולוגיה','תפעול','אסטרטגיה','קריאייטיב','מכירות']

const DEPT_ROLE: Record<string, string> = {
  'הנהלה': 'CEO AI — אריאל', 'כספים': 'CFO AI — נועה', 'שיווק': 'CMO AI — יובל',
  'משפטי': 'Legal AI — מיכל', 'משאבי אנוש': 'HR AI — דניאל', 'טכנולוגיה': 'IT AI — רון',
  'תפעול': 'COO AI — עמית', 'אסטרטגיה': 'Strategy AI — דן', 'קריאייטיב': 'Creative AI — אלה',
  'מכירות': 'Sales AI — תמר', 'כולם': 'כל המחלקות',
}

interface ThreadMessage {
  role: 'user' | 'agent'
  text: string
  timestamp: string
}

interface TimelineEntry {
  timestamp: string
  status: InstructionStatus
  note: string
}

interface Instruction {
  id: string
  text: string
  agent: string
  priority: Priority
  createdAt: string
  status: InstructionStatus | 'active' | 'done'
  agentName?: string
  agentResponse?: string
  workProduct?: string
  source?: string
  timeline?: TimelineEntry[]
  thread?: ThreadMessage[]
  imageUrl?: string
}

const normalizeStatus = (s: string): InstructionStatus => {
  if (s === 'active') return 'received'
  if (s === 'done') return 'completed'
  return s as InstructionStatus
}

const statusConfig: Record<InstructionStatus, { label: string; color: string; bg: string; border: string; Icon: any }> = {
  received:    { label: 'התקבל',     color: 'text-accent-cyan',   bg: 'bg-accent-cyan/10',   border: 'border-accent-cyan/20',   Icon: Inbox },
  in_progress: { label: 'בטיפול',    color: 'text-accent-amber',  bg: 'bg-accent-amber/10',  border: 'border-accent-amber/20',  Icon: Loader2 },
  completed:   { label: 'הושלם',     color: 'text-accent-green',  bg: 'bg-accent-green/10',  border: 'border-accent-green/20',  Icon: CheckCircle2 },
  failed:      { label: 'לא הושלם', color: 'text-accent-red',    bg: 'bg-accent-red/10',    border: 'border-accent-red/20',    Icon: AlertCircle },
}

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  urgent: { label: 'דחוף', color: 'text-accent-red',   bg: 'bg-accent-red/10' },
  high:   { label: 'גבוה', color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
  normal: { label: 'רגיל', color: 'text-text-muted',   bg: 'bg-white/5' },
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
  const [showFilters, setShowFilters] = useState(false)
  const [fStatus, setFStatus] = useState<InstructionStatus | 'all'>('all')
  const [fPriority, setFPriority] = useState<Priority | 'all'>('all')
  const [fDept, setFDept] = useState<string>('all')
  const [dbError, setDbError] = useState<string | null>(null)
  const [followUpInputs, setFollowUpInputs] = useState<Record<string, string>>({})
  const [followUpLoading, setFollowUpLoading] = useState<Record<string, boolean>>({})
  const [imageLoading, setImageLoading] = useState<Record<string, boolean>>({})
  const [imageError, setImageError] = useState<Record<string, string>>({})

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
      <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin"/>
    </div>
  )

  const normalized = instructions.map(i => ({ ...i, status: normalizeStatus(i.status as string) }))
  const filtered = normalized.filter(i => {
    if (fStatus !== 'all' && i.status !== fStatus) return false
    if (fPriority !== 'all' && i.priority !== fPriority) return false
    if (fDept !== 'all' && i.agent !== fDept) return false
    return true
  })

  const counts = {
    received:    normalized.filter(i => i.status === 'received').length,
    in_progress: normalized.filter(i => i.status === 'in_progress').length,
    completed:   normalized.filter(i => i.status === 'completed').length,
    failed:      normalized.filter(i => i.status === 'failed').length,
  }

  const upsertInstruction = async (inst: Instruction) => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id || userId
    if (!uid) return
    const { error } = await supabase.from('instructions').upsert({ id: inst.id, user_id: uid, data: inst })
    if (error) setDbError(`שגיאת שמירה (${error.code}): ${error.message}`)
    else setDbError(null)
  }

  const addInstruction = async () => {
    if (!text.trim()) return
    const ts = () => new Date().toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    const instText = text.trim()
    const instAgent = agent
    const newInstruction: Instruction = {
      id: crypto.randomUUID(),
      text: instText,
      agent: instAgent,
      priority,
      createdAt: ts(),
      status: 'received',
      timeline: [{ timestamp: ts(), status: 'received', note: 'ההוראה התקבלה במערכת' }],
    }
    setInstructions(prev => [newInstruction, ...prev])
    setText(''); setAgent('הנהלה'); setPriority('normal'); setShowForm(false)
    await upsertInstruction(newInstruction)

    if (instAgent === 'כולם') return

    // Auto-process with AI
    const inProgress: Instruction = { ...newInstruction, status: 'in_progress',
      timeline: [...newInstruction.timeline, { timestamp: ts(), status: 'in_progress', note: `מועבר לטיפול ${instAgent}` }] }
    setInstructions(prev => prev.map(i => i.id === newInstruction.id ? inProgress : i))
    await upsertInstruction(inProgress)

    try {
      const aiRes = await fetch('/api/dept-chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: instAgent, instruction: instText }),
      })
      const aiData = await aiRes.json()
      const completed: Instruction = { ...inProgress, status: 'completed',
        agentName: aiData.agent, agentResponse: aiData.acknowledgment, workProduct: aiData.workProduct,
        timeline: [...inProgress.timeline, { timestamp: ts(), status: 'completed', note: `${aiData.agent || instAgent} סיים לטפל ויצר תוצר` }] }
      setInstructions(prev => prev.map(i => i.id === newInstruction.id ? completed : i))
      await upsertInstruction(completed)
    } catch {
      const failed: Instruction = { ...inProgress, status: 'failed',
        timeline: [...inProgress.timeline, { timestamp: ts(), status: 'failed', note: 'שגיאה בעת טיפול' }] }
      setInstructions(prev => prev.map(i => i.id === newInstruction.id ? failed : i))
      await upsertInstruction(failed)
    }
  }

  const updateStatus = async (id: string, newStatus: InstructionStatus, note: string) => {
    const now = new Date().toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    setInstructions(prev => prev.map(i => {
      if (i.id !== id) return i
      const entry: TimelineEntry = { timestamp: now, status: newStatus, note }
      return { ...i, status: newStatus, timeline: [...(i.timeline || []), entry] }
    }))
    const inst = instructions.find(i => i.id === id)
    if (!inst) return
    const entry: TimelineEntry = { timestamp: now, status: newStatus, note }
    const updated = { ...inst, status: newStatus, timeline: [...(inst.timeline || []), entry] }
    await upsertInstruction(updated)
  }

  const deleteI = async (id: string) => {
    setInstructions(prev => prev.filter(i => i.id !== id))
    const supabase = createClient()
    await supabase.from('instructions').delete().eq('id', id).eq('user_id', userId)
  }

  const sendFollowUp = async (inst: Instruction) => {
    const text = (followUpInputs[inst.id] || '').trim()
    if (!text || followUpLoading[inst.id]) return
    const ts = () => new Date().toLocaleString('he-IL', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
    const userMsg: ThreadMessage = { role: 'user', text, timestamp: ts() }
    const withUser: Instruction = { ...inst, thread: [...(inst.thread || []), userMsg] }
    setInstructions(prev => prev.map(i => i.id === inst.id ? withUser : i))
    setFollowUpInputs(prev => ({ ...prev, [inst.id]: '' }))
    setFollowUpLoading(prev => ({ ...prev, [inst.id]: true }))
    try {
      const res = await fetch('/api/dept-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: inst.agent, instruction: inst.text, thread: withUser.thread }),
      })
      const data = await res.json()
      const agentMsg: ThreadMessage = { role: 'agent', text: data.workProduct || data.acknowledgment || '', timestamp: ts() }
      const final: Instruction = { ...withUser, thread: [...(withUser.thread || []), agentMsg] }
      setInstructions(prev => prev.map(i => i.id === inst.id ? final : i))
      await upsertInstruction(final)
    } catch {
      await upsertInstruction(withUser)
    } finally {
      setFollowUpLoading(prev => ({ ...prev, [inst.id]: false }))
    }
  }

  const generateImage = async (inst: Instruction) => {
    setImageLoading(prev => ({ ...prev, [inst.id]: true }))
    setImageError(prev => ({ ...prev, [inst.id]: '' }))
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: inst.workProduct, department: inst.agent }),
      })
      const data = await res.json()
      if (data.imageUrl) {
        const updated: Instruction = { ...inst, imageUrl: data.imageUrl }
        setInstructions(prev => prev.map(i => i.id === inst.id ? updated : i))
        await upsertInstruction(updated)
      } else {
        setImageError(prev => ({ ...prev, [inst.id]: data.error || 'שגיאה לא ידועה' }))
      }
    } catch (e: any) {
      setImageError(prev => ({ ...prev, [inst.id]: e.message || 'שגיאת רשת' }))
    } finally {
      setImageLoading(prev => ({ ...prev, [inst.id]: false }))
    }
  }

  return (
    <div className="min-h-screen">
      <Header title="הוראות AI" subtitle="מעקב הוראות ומשימות לסוכני הבינה המלאכותית" />

      <div className="p-6 space-y-5 animate-fade-in">
        {/* DB error banner */}
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

        {/* Status summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {(Object.entries(statusConfig) as [InstructionStatus, typeof statusConfig[InstructionStatus]][]).map(([key, cfg]) => (
            <button key={key} onClick={() => setFStatus(fStatus === key ? 'all' : key)}
              className={`glass-card rounded-2xl p-4 text-right transition-all border ${fStatus === key ? cfg.border : 'border-border-muted'}`}>
              <div className="flex items-center justify-between mb-1">
                <cfg.Icon className={`w-4 h-4 ${cfg.color} ${key === 'in_progress' ? 'animate-spin' : ''}`} />
                <span className={`text-2xl font-bold ${cfg.color}`}>{counts[key]}</span>
              </div>
              <p className="text-xs text-text-muted">{cfg.label}</p>
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${showFilters ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' : 'bg-white/5 border-border-muted text-text-muted'}`}>
            <Filter className="w-3.5 h-3.5" /> פילטרים
          </button>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
            <Plus className="w-3.5 h-3.5" /> הוראה חדשה
          </button>
        </div>

        {showFilters && (
          <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 border border-accent-cyan/10">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">דחיפות</label>
              <div className="flex gap-1">
                {(['all','urgent','high','normal'] as const).map(p => (
                  <button key={p} onClick={() => setFPriority(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${fPriority===p ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted'}`}>
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
              className="self-end text-xs text-text-muted hover:text-accent-red flex items-center gap-1">
              <X className="w-3 h-3" /> איפוס
            </button>
          </div>
        )}

        {/* New instruction form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-5 border border-accent-cyan/20 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-cyan" /> הוראה חדשה
            </h3>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="תאר את המשימה בצורה ברורה..." rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 resize-none" />
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[160px]">
                <label className="block text-xs text-text-muted mb-1.5">מחלקה</label>
                <select value={agent} onChange={e => setAgent(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none">
                  <option value="כולם" className="bg-bg-card">כולם</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-bg-card">{d} — {DEPT_ROLE[d]}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[130px]">
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
                  className="bg-accent-cyan text-bg-base font-semibold text-xs px-4 py-2 rounded-xl hover:bg-accent-cyan/90">
                  שלח
                </button>
                <button onClick={() => setShowForm(false)}
                  className="bg-white/5 text-text-secondary text-xs px-3 py-2 rounded-xl">
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Instructions list */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-text-muted text-sm">אין הוראות להצגה</div>
          )}
          {filtered.map(inst => {
            const st = statusConfig[inst.status as InstructionStatus] || statusConfig.received
            const pr = priorityConfig[inst.priority] || priorityConfig.normal
            const isExpanded = expandedId === inst.id
            const StIcon = st.Icon

            return (
              <div key={inst.id} className={`glass-card rounded-2xl border ${st.border} transition-all`}>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full ${st.bg} flex items-center justify-center shrink-0`}>
                      <StIcon className={`w-4 h-4 ${st.color} ${inst.status === 'in_progress' ? 'animate-spin' : ''}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-xs font-bold text-text-primary">{inst.agent}</span>
                        <span className="text-xs text-text-muted">{DEPT_ROLE[inst.agent]}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg ${pr.bg} ${pr.color}`}>{pr.label}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${st.bg} ${st.color}`}>{st.label}</span>
                        <span className="text-xs text-text-muted mr-auto flex items-center gap-1">
                          <Clock className="w-3 h-3" />{inst.createdAt}
                        </span>
                      </div>
                      <p className="text-sm text-text-primary leading-relaxed">{inst.text}</p>

                      {/* Timeline + Work product toggle */}
                      {((inst.timeline && inst.timeline.length > 0) || inst.workProduct) && (
                        <button onClick={() => setExpandedId(isExpanded ? null : inst.id)}
                          className="flex items-center gap-1 text-xs text-text-muted hover:text-accent-cyan mt-2 transition-colors">
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          {isExpanded ? 'הסתר פרטים' : 'הצג מעקב ותוצאות'}
                        </button>
                      )}

                      {isExpanded && (
                        <div className="mt-3 space-y-3">
                          {/* Timeline */}
                          {inst.timeline && inst.timeline.length > 0 && (
                            <div className="border border-border-muted rounded-xl p-3">
                              <p className="text-xs font-semibold text-text-secondary mb-2 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" /> ציר זמן
                              </p>
                              <div className="space-y-2">
                                {inst.timeline.map((entry, i) => {
                                  const esc = statusConfig[entry.status] || statusConfig.received
                                  const EIcon = esc.Icon
                                  return (
                                    <div key={i} className="flex items-start gap-2 text-xs">
                                      <EIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${esc.color}`} />
                                      <div className="flex-1">
                                        <span className={`font-semibold ${esc.color}`}>{esc.label}</span>
                                        <span className="text-text-muted mx-1.5">—</span>
                                        <span className="text-text-secondary">{entry.note}</span>
                                      </div>
                                      <span className="text-text-muted shrink-0">{entry.timestamp}</span>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )}

                          {/* Work product */}
                          {inst.workProduct && (
                            <div className="bg-white/3 border border-accent-cyan/15 rounded-xl p-4 space-y-3">
                              <p className="text-xs font-semibold text-accent-cyan mb-2 flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                {inst.agentName || inst.agent} — תוצר עבודה
                              </p>
                              <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{inst.workProduct}</p>

                              {/* Generate image button */}
                              {!inst.imageUrl ? (
                                <div className="space-y-1.5">
                                  <button
                                    onClick={() => generateImage(inst)}
                                    disabled={imageLoading[inst.id]}
                                    className="flex items-center gap-1.5 text-xs bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/20 text-accent-purple px-3 py-2 rounded-xl transition-all disabled:opacity-40">
                                    {imageLoading[inst.id] ? (
                                      <><span className="w-3 h-3 border border-accent-purple border-t-transparent rounded-full animate-spin shrink-0" /> יוצר תמונה עם DALL·E... (עד 30 שניות)</>
                                    ) : (
                                      <><ImageIcon className="w-3.5 h-3.5" /> צור תמונה לפרסום (DALL·E)</>
                                    )}
                                  </button>
                                  {imageError[inst.id] && (
                                    <p className="text-xs text-accent-red bg-accent-red/5 border border-accent-red/20 rounded-lg px-3 py-2">{imageError[inst.id]}</p>
                                  )}
                                </div>
                              ) : (
                                <div className="rounded-xl overflow-hidden border border-accent-purple/20">
                                  <img src={inst.imageUrl} alt="תמונה שנוצרה" className="w-full" />
                                  <div className="p-2 flex justify-between items-center bg-accent-purple/5">
                                    <span className="text-xs text-text-muted">נוצר עם DALL·E 3 — הורד לפני שה-URL יפוג</span>
                                    <div className="flex items-center gap-2">
                                      <a href={`/api/download-image?url=${encodeURIComponent(inst.imageUrl!)}`}
                                        download="marketing-image.png"
                                        className="text-xs bg-accent-purple/20 hover:bg-accent-purple/30 border border-accent-purple/30 text-accent-purple px-2 py-1 rounded-lg transition-all">
                                        הורד
                                      </a>
                                      <a href={inst.imageUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-purple underline">פתח מלא</a>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Follow-up thread */}
                          {inst.workProduct && (
                            <div className="border border-border-muted rounded-xl p-3 space-y-2">
                              <p className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
                                <MessageCircle className="w-3.5 h-3.5" /> המשך שיחה עם {inst.agentName || inst.agent}
                              </p>

                              {inst.thread?.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] rounded-xl px-3 py-2 ${msg.role === 'user' ? 'bg-accent-cyan/10 border border-accent-cyan/20' : 'bg-white/5 border border-border-muted'}`}>
                                    <p className={`text-xs font-semibold mb-0.5 ${msg.role === 'user' ? 'text-accent-cyan' : 'text-text-secondary'}`}>
                                      {msg.role === 'user' ? 'יו״ר' : (inst.agentName || inst.agent)}
                                    </p>
                                    <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                    <p className="text-xs text-text-muted mt-1 text-left">{msg.timestamp}</p>
                                  </div>
                                </div>
                              ))}

                              {followUpLoading[inst.id] && (
                                <div className="flex justify-start">
                                  <div className="bg-white/5 border border-border-muted rounded-xl px-4 py-3 flex items-center gap-2">
                                    <span className="w-3 h-3 border border-text-muted border-t-transparent rounded-full animate-spin" />
                                    <span className="text-xs text-text-muted">{inst.agentName || inst.agent} מגיב...</span>
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-2 pt-1">
                                <input
                                  value={followUpInputs[inst.id] || ''}
                                  onChange={e => setFollowUpInputs(prev => ({ ...prev, [inst.id]: e.target.value }))}
                                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFollowUp(inst) } }}
                                  placeholder={`שאל שאלת המשך את ${inst.agentName || inst.agent}...`}
                                  disabled={followUpLoading[inst.id]}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all disabled:opacity-50" />
                                <button
                                  onClick={() => sendFollowUp(inst)}
                                  disabled={!followUpInputs[inst.id]?.trim() || followUpLoading[inst.id]}
                                  className="bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan px-3 py-2 rounded-xl transition-all disabled:opacity-40">
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      {inst.status !== 'completed' && (
                        <button onClick={() => updateStatus(inst.id, 'completed', 'סומן כהושלם על ידי היו״ר')}
                          title="סמן כהושלם"
                          className="w-7 h-7 rounded-lg bg-accent-green/10 text-accent-green flex items-center justify-center hover:bg-accent-green/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {inst.status !== 'failed' && inst.status !== 'received' && (
                        <button onClick={() => updateStatus(inst.id, 'failed', 'סומן כלא הושלם על ידי היו״ר')}
                          title="סמן כלא הושלם"
                          className="w-7 h-7 rounded-lg bg-accent-red/10 text-accent-red flex items-center justify-center hover:bg-accent-red/20">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button onClick={() => deleteI(inst.id)}
                        title="מחק"
                        className="w-7 h-7 rounded-lg bg-white/5 text-text-muted flex items-center justify-center hover:bg-accent-red/10 hover:text-accent-red">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
