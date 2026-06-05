'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Plus, Flag, User, Calendar, CheckCircle2, Circle, Clock, X, ChevronDown, ChevronUp, Filter } from 'lucide-react'

type Priority = 'high' | 'medium' | 'low'
type Status = 'todo' | 'inprogress' | 'done'

interface Task {
  id: number
  title: string
  description: string
  priority: Priority
  assignee: string
  dueDate: string
  status: Status
  category: string
}

const DEPARTMENTS = ['הנהלה','כספים','שיווק','משפטי','משאבי אנוש','נדל״ן','טכנולוגיה','מכירות']

const initialTasks: Task[] = [
  { id: 1, title: 'ניתוח שוק — Q3 2026',       description: 'ניתוח מגמות שוק לרבעון השלישי כולל מתחרים, הזדמנויות ואיומים', priority: 'high',   assignee: 'הנהלה',          dueDate: '10/06', status: 'inprogress', category: 'אסטרטגיה' },
  { id: 2, title: 'דוח כספי חצי שנתי',         description: 'הכנת דוח כספי מלא לחצי השנה הראשונה כולל מאזן ודוח רווח והפסד', priority: 'high',   assignee: 'כספים',           dueDate: '15/06', status: 'todo',       category: 'פיננסים' },
  { id: 3, title: 'בדיקת חוזי ספקים',          description: 'סקירה משפטית מקיפה של כל חוזי הספקים הפעילים', priority: 'medium', assignee: 'משפטי',           dueDate: '12/06', status: 'inprogress', category: 'משפטי' },
  { id: 4, title: 'קמפיין שיווקי Q3',           description: 'תכנון וביצוע קמפיין שיווקי לשוק האירופי עם תקציב ₪80K', priority: 'medium', assignee: 'שיווק',           dueDate: '20/06', status: 'todo',       category: 'שיווק' },
  { id: 5, title: 'גיוס מנהל פיתוח',           description: 'פרסום משרה, סינון מועמדים וראיונות למשרת מנהל פיתוח עסקי', priority: 'medium', assignee: 'משאבי אנוש',     dueDate: '30/06', status: 'todo',       category: 'HR' },
  { id: 6, title: 'אופטימיזציה תהליכים',       description: 'מיפוי ושיפור תהליכים פנימיים לצמצום עלויות תפעול', priority: 'low',    assignee: 'הנהלה',          dueDate: '25/06', status: 'done',       category: 'תפעול' },
  { id: 7, title: 'דוח השקעות Q2',             description: 'סיכום תיק ההשקעות לרבעון השני כולל ביצועים ותחזית', priority: 'high',   assignee: 'כספים',           dueDate: '05/06', status: 'done',       category: 'פיננסים' },
  { id: 8, title: 'הדרכת צוות חדש',            description: 'הכנת חומרי הדרכה וביצוע הדרכה ל-5 עובדים חדשים', priority: 'low',    assignee: 'משאבי אנוש',     dueDate: '18/06', status: 'inprogress', category: 'HR' },
]

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: 'גבוהה',  color: 'text-accent-red',   bg: 'bg-accent-red/10' },
  medium: { label: 'בינונית',color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
  low:    { label: 'נמוכה',  color: 'text-accent-green', bg: 'bg-accent-green/10' },
}

const columns: { id: Status; label: string; color: string }[] = [
  { id: 'todo',       label: 'לביצוע',  color: 'text-text-secondary' },
  { id: 'inprogress', label: 'בתהליך',  color: 'text-accent-amber' },
  { id: 'done',       label: 'הושלם',   color: 'text-accent-green' },
]

function TaskCard({ task, onExpand }: { task: Task; onExpand: (t: Task) => void }) {
  const p = priorityConfig[task.priority]
  return (
    <div
      className="glass-card rounded-xl p-4 space-y-3 cursor-pointer hover:border-accent-cyan/20 border border-border-muted transition-all"
      onClick={() => onExpand(task)}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary leading-snug">{task.title}</p>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-lg ${p.bg} ${p.color}`}>{p.label}</span>
      </div>
      <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{task.description}</p>
      <div className="flex items-center justify-between pt-1 border-t border-border-muted">
        <span className="text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded-lg">{task.category}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-text-muted"><User className="w-3 h-3" />{task.assignee}</span>
          <span className="flex items-center gap-1 text-xs text-text-muted"><Calendar className="w-3 h-3" />{task.dueDate}</span>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks)
  const [showForm, setShowForm] = useState(false)
  const [expandedTask, setExpandedTask] = useState<Task | null>(null)
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')
  const [filterDept, setFilterDept] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  // New task form state
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newPriority, setNewPriority] = useState<Priority>('medium')
  const [newAssignee, setNewAssignee] = useState(DEPARTMENTS[0])
  const [newDue, setNewDue] = useState('')
  const [newCategory, setNewCategory] = useState('')

  const filtered = tasks.filter(t => {
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false
    if (filterDept !== 'all' && t.assignee !== filterDept) return false
    return true
  })

  const addTask = () => {
    if (!newTitle.trim()) return
    setTasks(prev => [{
      id: Date.now(),
      title: newTitle.trim(),
      description: newDesc.trim(),
      priority: newPriority,
      assignee: newAssignee,
      dueDate: newDue || '—',
      status: 'todo',
      category: newCategory || 'כללי',
    }, ...prev])
    setNewTitle(''); setNewDesc(''); setNewPriority('medium')
    setNewAssignee(DEPARTMENTS[0]); setNewDue(''); setNewCategory('')
    setShowForm(false)
  }

  const counts = {
    todo: filtered.filter(t => t.status === 'todo').length,
    inprogress: filtered.filter(t => t.status === 'inprogress').length,
    done: filtered.filter(t => t.status === 'done').length,
  }

  return (
    <div className="min-h-screen">
      <Header title="משימות" subtitle="ניהול משימות צוות ומחלקות" />

      <div className="p-6 space-y-5 animate-fade-in">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><Circle className="w-3.5 h-3.5 text-text-muted" />{counts.todo} לביצוע</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-accent-amber" />{counts.inprogress} בתהליך</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />{counts.done} הושלמו</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${showFilters ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' : 'bg-white/5 border-border-muted text-text-muted hover:text-text-secondary'}`}>
              <Filter className="w-3.5 h-3.5" /> פילטרים
            </button>
            <button onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
              <Plus className="w-3.5 h-3.5" /> משימה חדשה
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 border border-accent-cyan/10">
            <div>
              <label className="block text-xs text-text-muted mb-1.5">עדיפות</label>
              <div className="flex gap-1">
                {(['all','high','medium','low'] as const).map(p => (
                  <button key={p} onClick={() => setFilterPriority(p)}
                    className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterPriority===p ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted hover:text-text-secondary'}`}>
                    {p==='all'?'הכל':p==='high'?'גבוהה':p==='medium'?'בינונית':'נמוכה'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-1.5">מחלקה</label>
              <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none">
                <option value="all" className="bg-bg-card">כל המחלקות</option>
                {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-bg-card">{d}</option>)}
              </select>
            </div>
            <button onClick={() => { setFilterPriority('all'); setFilterDept('all') }}
              className="self-end text-xs text-text-muted hover:text-accent-red transition-colors flex items-center gap-1">
              <X className="w-3 h-3" /> איפוס
            </button>
          </div>
        )}

        {/* New task form */}
        {showForm && (
          <div className="glass-card rounded-2xl p-5 border border-accent-cyan/20 space-y-4">
            <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <Plus className="w-4 h-4 text-accent-cyan" /> משימה חדשה
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="כותרת המשימה *"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all" />
              <input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="קטגוריה"
                className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all" />
            </div>
            <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="תיאור מפורט..." rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all resize-none" />
            <div className="flex flex-wrap gap-3">
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-text-muted mb-1">מחלקה</label>
                <select value={newAssignee} onChange={e => setNewAssignee(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none">
                  {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-bg-card">{d}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[140px]">
                <label className="block text-xs text-text-muted mb-1">עדיפות</label>
                <select value={newPriority} onChange={e => setNewPriority(e.target.value as Priority)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none">
                  <option value="high" className="bg-bg-card">גבוהה</option>
                  <option value="medium" className="bg-bg-card">בינונית</option>
                  <option value="low" className="bg-bg-card">נמוכה</option>
                </select>
              </div>
              <div className="flex-1 min-w-[120px]">
                <label className="block text-xs text-text-muted mb-1">תאריך יעד</label>
                <input type="text" value={newDue} onChange={e => setNewDue(e.target.value)} placeholder="dd/mm"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none" dir="ltr" />
              </div>
              <div className="flex items-end gap-2">
                <button onClick={addTask}
                  className="bg-accent-cyan text-bg-base font-semibold text-xs px-4 py-2 rounded-xl hover:bg-accent-cyan/90 transition-all">
                  הוסף
                </button>
                <button onClick={() => setShowForm(false)}
                  className="bg-white/5 text-text-secondary text-xs px-3 py-2 rounded-xl hover:bg-white/8 transition-all">
                  ביטול
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Kanban */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {columns.map(col => (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                <span className="text-xs bg-white/5 text-text-muted px-2 py-0.5 rounded-full">
                  {filtered.filter(t => t.status === col.id).length}
                </span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {filtered.filter(t => t.status === col.id).map(task => (
                  <TaskCard key={task.id} task={task} onExpand={setExpandedTask} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task expand modal */}
      {expandedTask && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setExpandedTask(null)}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-lg w-full space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-text-primary">{expandedTask.title}</h2>
              <button onClick={() => setExpandedTask(null)} className="text-text-muted hover:text-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed">{expandedTask.description}</p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'מחלקה', value: expandedTask.assignee },
                { label: 'קטגוריה', value: expandedTask.category },
                { label: 'עדיפות', value: priorityConfig[expandedTask.priority].label },
                { label: 'תאריך יעד', value: expandedTask.dueDate },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white/5 rounded-xl p-3">
                  <p className="text-text-muted mb-0.5">{label}</p>
                  <p className="text-text-primary font-medium">{value}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              {(['todo','inprogress','done'] as Status[]).map(s => (
                <button key={s} onClick={() => { setTasks(prev => prev.map(t => t.id === expandedTask.id ? {...t, status: s} : t)); setExpandedTask({...expandedTask, status: s}) }}
                  className={`flex-1 text-xs py-2 rounded-xl transition-all border ${expandedTask.status === s ? 'bg-accent-cyan/20 border-accent-cyan/30 text-accent-cyan' : 'bg-white/5 border-border-muted text-text-muted hover:text-text-secondary'}`}>
                  {s === 'todo' ? 'לביצוע' : s === 'inprogress' ? 'בתהליך' : 'הושלם'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
