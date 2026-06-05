'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { Plus, Flag, User, Calendar, CheckCircle2, Circle, Clock } from 'lucide-react'

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

const initialTasks: Task[] = [
  { id: 1, title: 'ניתוח שוק — Q3 2026', description: 'ניתוח מגמות שוק לרבעון השלישי', priority: 'high', assignee: 'אריאל AI', dueDate: '10/06', status: 'inprogress', category: 'אסטרטגיה' },
  { id: 2, title: 'דוח כספי חצי שנתי', description: 'הכנת דוח כספי מלא לחצי שנה', priority: 'high', assignee: 'נועה AI', dueDate: '15/06', status: 'todo', category: 'פיננסים' },
  { id: 3, title: 'בדיקת חוזי ספקים', description: 'סקירה משפטית של חוזי ספקים', priority: 'medium', assignee: 'מיכל AI', dueDate: '12/06', status: 'inprogress', category: 'משפטי' },
  { id: 4, title: 'קמפיין שיווקי Q3', description: 'תכנון קמפיין לשוק האירופי', priority: 'medium', assignee: 'יובל AI', dueDate: '20/06', status: 'todo', category: 'שיווק' },
  { id: 5, title: 'גיוס מנהל פיתוח', description: 'פרסום משרה וסינון מועמדים', priority: 'medium', assignee: 'דניאל AI', dueDate: '30/06', status: 'todo', category: 'HR' },
  { id: 6, title: 'אופטימיזציה תהליכים', description: 'מיפוי ושיפור תהליכים פנימיים', priority: 'low', assignee: 'אריאל AI', dueDate: '25/06', status: 'done', category: 'תפעול' },
  { id: 7, title: 'דוח השקעות Q2', description: 'סיכום תיק ההשקעות לרבעון', priority: 'high', assignee: 'נועה AI', dueDate: '05/06', status: 'done', category: 'פיננסים' },
  { id: 8, title: 'הדרכת צוות חדש', description: 'הכנת חומרי הדרכה ל-5 עובדים חדשים', priority: 'low', assignee: 'דניאל AI', dueDate: '18/06', status: 'inprogress', category: 'HR' },
]

const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  high:   { label: 'גבוהה', color: 'text-accent-red',   bg: 'bg-accent-red/10' },
  medium: { label: 'בינונית', color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
  low:    { label: 'נמוכה', color: 'text-accent-green',  bg: 'bg-accent-green/10' },
}

const columns: { id: Status; label: string; color: string }[] = [
  { id: 'todo',       label: 'לביצוע',   color: 'text-text-secondary' },
  { id: 'inprogress', label: 'בתהליך',   color: 'text-accent-amber' },
  { id: 'done',       label: 'הושלם',    color: 'text-accent-green' },
]

function TaskCard({ task }: { task: Task }) {
  const p = priorityConfig[task.priority]
  return (
    <div className="glass-card rounded-xl p-4 space-y-3 cursor-pointer hover:border-accent-cyan/20 border border-border-muted transition-all">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-text-primary leading-snug">{task.title}</p>
        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-lg ${p.bg} ${p.color}`}>
          {p.label}
        </span>
      </div>
      <p className="text-xs text-text-muted leading-relaxed">{task.description}</p>
      <div className="flex items-center justify-between pt-1 border-t border-border-muted">
        <span className="text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded-lg">{task.category}</span>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <User className="w-3 h-3" />{task.assignee}
          </span>
          <span className="flex items-center gap-1 text-xs text-text-muted">
            <Calendar className="w-3 h-3" />{task.dueDate}
          </span>
        </div>
      </div>
    </div>
  )
}

export default function TasksPage() {
  const [tasks] = useState<Task[]>(initialTasks)

  const counts = {
    todo: tasks.filter(t => t.status === 'todo').length,
    inprogress: tasks.filter(t => t.status === 'inprogress').length,
    done: tasks.filter(t => t.status === 'done').length,
  }

  return (
    <div className="min-h-screen">
      <Header title="משימות" subtitle="ניהול משימות צוות וסוכני AI" />

      <div className="p-6 space-y-5 animate-fade-in">
        {/* Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1.5"><Circle className="w-3.5 h-3.5 text-text-muted" />{counts.todo} לביצוע</span>
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-accent-amber" />{counts.inprogress} בתהליך</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />{counts.done} הושלמו</span>
          </div>
          <button className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
            <Plus className="w-3.5 h-3.5" /> משימה חדשה
          </button>
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {columns.map(col => (
            <div key={col.id} className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <h3 className={`text-sm font-semibold ${col.color}`}>{col.label}</h3>
                  <span className="text-xs bg-white/5 text-text-muted px-2 py-0.5 rounded-full">
                    {tasks.filter(t => t.status === col.id).length}
                  </span>
                </div>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {tasks.filter(t => t.status === col.id).map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
