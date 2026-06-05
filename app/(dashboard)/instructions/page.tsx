'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Sparkles, Plus, Trash2, Bot, Flag, Clock, CheckCircle2 } from 'lucide-react'

type Priority = 'urgent' | 'high' | 'normal'
type AgentName = 'אריאל' | 'נועה' | 'יובל' | 'מיכל' | 'דניאל' | 'שירה' | 'רון' | 'תמר' | 'כולם'

interface Instruction {
  id: number
  text: string
  agent: AgentName
  priority: Priority
  createdAt: string
  status: 'active' | 'done'
}

const agents: AgentName[] = ['כולם', 'אריאל', 'נועה', 'יובל', 'מיכל', 'דניאל', 'שירה', 'רון', 'תמר']

const initialInstructions: Instruction[] = [
  { id: 1, text: 'הכן ניתוח מקיף של שוק הנדל״ן המסחרי בתל אביב לרבעון Q3 — כולל מגמות מחירים, ביקוש והיצע', agent: 'שירה', priority: 'urgent', createdAt: 'היום, 09:15', status: 'active' },
  { id: 2, text: 'בצע הערכת סיכונים לתיק ההשקעות הנוכחי ותן המלצות לאיזון מחדש', agent: 'נועה', priority: 'high', createdAt: 'היום, 08:30', status: 'active' },
  { id: 3, text: 'פרסם 3 משרות: מנהל פיתוח עסקי, אנליסט פיננסי, רכז שיווק — כולל תיאור תפקיד מלא', agent: 'דניאל', priority: 'normal', createdAt: 'אתמול, 16:00', status: 'active' },
  { id: 4, text: 'תכן קמפיין שיווקי לשוק האירופי — תקציב ₪80K, יעד: 20 לידים מוסדיים', agent: 'יובל', priority: 'high', createdAt: 'אתמול, 14:20', status: 'active' },
  { id: 5, text: 'סקור את כל חוזי הספקים שפג תוקפם ב-2026 והכן המלצות לחידוש/החלפה', agent: 'מיכל', priority: 'normal', createdAt: 'לפני יומיים', status: 'done' },
  { id: 6, text: 'הכן דוח ביצועים שבועי לכל המחלקות ושלח לי סיכום מנהלים עד יום א׳', agent: 'אריאל', priority: 'normal', createdAt: 'לפני יומיים', status: 'done' },
]

const priorityConfig: Record<Priority, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  urgent: { label: 'דחוף',   color: 'text-accent-red',   bg: 'bg-accent-red/10',   icon: Flag },
  high:   { label: 'גבוה',   color: 'text-accent-amber', bg: 'bg-accent-amber/10', icon: Flag },
  normal: { label: 'רגיל',   color: 'text-text-muted',   bg: 'bg-white/5',         icon: Flag },
}

export default function InstructionsPage() {
  const [instructions, setInstructions] = useState<Instruction[]>(initialInstructions)
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')
  const [agent, setAgent] = useState<AgentName>('אריאל')
  const [priority, setPriority] = useState<Priority>('normal')

  const active = instructions.filter(i => i.status === 'active')
  const done = instructions.filter(i => i.status === 'done')

  const addInstruction = () => {
    if (!text.trim()) return
    const newI: Instruction = {
      id: Date.now(),
      text: text.trim(),
      agent,
      priority,
      createdAt: 'עכשיו',
      status: 'active',
    }
    setInstructions(prev => [newI, ...prev])
    setText('')
    setAgent('אריאל')
    setPriority('normal')
    setShowForm(false)
  }

  const markDone = (id: number) => {
    setInstructions(prev => prev.map(i => i.id === id ? { ...i, status: 'done' } : i))
  }

  const deleteInstruction = (id: number) => {
    setInstructions(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div className="min-h-screen">
      <Header title="הוראות AI" subtitle="תן הוראות ישירות לסוכני הבינה המלאכותית" />

      <div className="p-6 space-y-5 animate-fade-in">
        {/* Header bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-accent-cyan" />{active.length} הוראות פעילות</span>
            <span className="text-text-muted">|</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />{done.length} הושלמו</span>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
            <Plus className="w-3.5 h-3.5" /> הוראה חדשה
          </button>
        </div>

        {/* New instruction form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-5 border border-accent-cyan/20 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-cyan" />
              הוראה חדשה לסוכן AI
            </h3>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="תאר את המשימה בצורה ברורה ומפורטת..."
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3
                         text-text-primary placeholder-text-muted text-sm resize-none
                         focus:outline-none focus:border-accent-cyan/50 transition-all"
            />
            <div className="flex gap-3 flex-wrap">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-text-muted mb-1.5">לסוכן</label>
                <select value={agent} onChange={e => setAgent(e.target.value as AgentName)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan/50 transition-all">
                  {agents.map(a => <option key={a} value={a} className="bg-bg-card">{a}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-text-muted mb-1.5">עדיפות</label>
                <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-cyan/50 transition-all">
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

        {/* Active instructions */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-accent-cyan uppercase tracking-wider">הוראות פעילות</h3>
          {active.map(inst => {
            const p = priorityConfig[inst.priority]
            return (
              <div key={inst.id} className="glass-card rounded-2xl p-4 border border-border-muted hover:border-accent-cyan/20 transition-all group">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 flex items-center justify-center shrink-0 text-xs font-bold text-accent-cyan">
                    {inst.agent[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-accent-cyan">{inst.agent}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-lg ${p.bg} ${p.color}`}>{p.label}</span>
                      <span className="text-xs text-text-muted mr-auto flex items-center gap-1">
                        <Clock className="w-3 h-3" />{inst.createdAt}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary leading-relaxed">{inst.text}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button onClick={() => markDone(inst.id)}
                      className="w-7 h-7 rounded-lg bg-accent-green/10 text-accent-green flex items-center justify-center hover:bg-accent-green/20 transition-all">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => deleteInstruction(inst.id)}
                      className="w-7 h-7 rounded-lg bg-accent-red/10 text-accent-red flex items-center justify-center hover:bg-accent-red/20 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Done instructions */}
        {done.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">הושלמו</h3>
            {done.map(inst => (
              <div key={inst.id} className="glass-card rounded-2xl p-4 opacity-50 group hover:opacity-70 transition-all">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-accent-green mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-text-muted">{inst.agent}</span>
                      <span className="text-xs text-text-muted mr-auto">{inst.createdAt}</span>
                    </div>
                    <p className="text-sm text-text-secondary line-through leading-relaxed">{inst.text}</p>
                  </div>
                  <button onClick={() => deleteInstruction(inst.id)}
                    className="w-7 h-7 rounded-lg bg-white/5 text-text-muted flex items-center justify-center hover:bg-accent-red/10 hover:text-accent-red transition-all opacity-0 group-hover:opacity-100">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
