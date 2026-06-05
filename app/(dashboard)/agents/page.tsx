import { Header } from '@/components/Header'
import { Bot, Zap, CheckCircle2, Clock, Activity, MessageSquare, Settings } from 'lucide-react'

const agents = [
  {
    id: 1,
    name: 'אריאל',
    role: 'מנכ״ל AI',
    description: 'מנהל אסטרטגיה, מקבל החלטות ניהוליות ומפקח על שאר הסוכנים',
    status: 'active',
    tasksCompleted: 142,
    tasksOpen: 3,
    lastAction: 'ניתוח דוח רבעוני Q2 — לפני 12 דקות',
    specialty: ['אסטרטגיה', 'ניהול', 'דיווח'],
    color: 'cyan',
  },
  {
    id: 2,
    name: 'נועה',
    role: 'CFO AI',
    description: 'מנהלת כספים, תזרים מזומנים, דוחות פיננסיים ותחזיות',
    status: 'active',
    tasksCompleted: 98,
    tasksOpen: 2,
    lastAction: 'עדכון תחזית תזרים יוני — לפני 28 דקות',
    specialty: ['פיננסים', 'תקציב', 'השקעות'],
    color: 'green',
  },
  {
    id: 3,
    name: 'יובל',
    role: 'שיווק AI',
    description: 'מנהל שיווק, קמפיינים, אסטרטגיית מותג ומחקר שוק',
    status: 'active',
    tasksCompleted: 67,
    tasksOpen: 5,
    lastAction: 'הציע קמפיין לשוק האירופי — לפני 45 דקות',
    specialty: ['שיווק', 'מותג', 'מחקר שוק'],
    color: 'purple',
  },
  {
    id: 4,
    name: 'מיכל',
    role: 'משפטי AI',
    description: 'מייעצת משפטית, סוקרת חוזים, מנהלת ציות ורגולציה',
    status: 'active',
    tasksCompleted: 54,
    tasksOpen: 1,
    lastAction: 'סקר הסכם ספק חדש — לפני שעה',
    specialty: ['חוזים', 'ציות', 'רגולציה'],
    color: 'amber',
  },
  {
    id: 5,
    name: 'דניאל',
    role: 'HR AI',
    description: 'מנהל גיוס, הדרכה, ביצועי עובדים ותרבות ארגונית',
    status: 'active',
    tasksCompleted: 78,
    tasksOpen: 3,
    lastAction: 'פרסם 3 משרות חדשות — לפני 2 שעות',
    specialty: ['גיוס', 'הדרכה', 'ביצועים'],
    color: 'cyan',
  },
  {
    id: 6,
    name: 'תמר',
    role: 'מכירות AI',
    description: 'מנהלת מכירות, לידים, CRM וחיזוי הכנסות',
    status: 'standby',
    tasksCompleted: 31,
    tasksOpen: 0,
    lastAction: 'עדכון pipeline מכירות — לפני יום',
    specialty: ['מכירות', 'CRM', 'לידים'],
    color: 'red',
  },
  {
    id: 7,
    name: 'רון',
    role: 'IT AI',
    description: 'מנהל תשתיות, אבטחת מידע ומערכות טכנולוגיות',
    status: 'standby',
    tasksCompleted: 45,
    tasksOpen: 0,
    lastAction: 'בדיקת אבטחה חודשית — לפני 3 ימים',
    specialty: ['תשתיות', 'אבטחה', 'טכנולוגיה'],
    color: 'purple',
  },
  {
    id: 8,
    name: 'שירה',
    role: 'נדל״ן AI',
    description: 'מנהלת עסקאות נדל״ן, הערכות שווי ותיק נכסים',
    status: 'active',
    tasksCompleted: 22,
    tasksOpen: 2,
    lastAction: 'ניתוח עסקת נכס מסחרי — לפני 3 שעות',
    specialty: ['נדל״ן', 'הערכות שווי', 'עסקאות'],
    color: 'green',
  },
]

const colorMap: Record<string, { bg: string; border: string; text: string; avatar: string }> = {
  cyan:   { bg: 'bg-accent-cyan/10',   border: 'border-accent-cyan/20',   text: 'text-accent-cyan',   avatar: 'from-accent-cyan/40 to-accent-cyan/10' },
  green:  { bg: 'bg-accent-green/10',  border: 'border-accent-green/20',  text: 'text-accent-green',  avatar: 'from-accent-green/40 to-accent-green/10' },
  purple: { bg: 'bg-accent-purple/10', border: 'border-accent-purple/20', text: 'text-accent-purple', avatar: 'from-accent-purple/40 to-accent-purple/10' },
  amber:  { bg: 'bg-accent-amber/10',  border: 'border-accent-amber/20',  text: 'text-accent-amber',  avatar: 'from-accent-amber/40 to-accent-amber/10' },
  red:    { bg: 'bg-accent-red/10',    border: 'border-accent-red/20',    text: 'text-accent-red',    avatar: 'from-accent-red/40 to-accent-red/10' },
}

export default function AgentsPage() {
  const active = agents.filter(a => a.status === 'active').length
  const totalTasks = agents.reduce((s, a) => s + a.tasksOpen, 0)

  return (
    <div className="min-h-screen">
      <Header title="סוכני AI" subtitle="ניהול וניטור סוכני הבינה המלאכותית של גבר יזמות" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Summary bar */}
        <div className="glass-card rounded-2xl p-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent-green" />
            </span>
            <span className="text-sm font-semibold text-accent-green">{active} סוכנים פעילים</span>
          </div>
          <div className="h-4 w-px bg-border-muted" />
          <span className="text-sm text-text-secondary">{agents.length - active} בסטנדבי</span>
          <div className="h-4 w-px bg-border-muted" />
          <span className="text-sm text-text-secondary">{totalTasks} משימות פתוחות</span>
          <div className="h-4 w-px bg-border-muted" />
          <span className="text-sm text-text-secondary">{agents.reduce((s,a)=>s+a.tasksCompleted,0)} משימות הושלמו</span>
        </div>

        {/* Agents grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-5">
          {agents.map(agent => {
            const c = colorMap[agent.color]
            return (
              <div key={agent.id} className={`glass-card rounded-2xl p-5 border ${c.border} hover:${c.bg} transition-all group`}>
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.avatar} flex items-center justify-center text-lg font-bold ${c.text} shrink-0`}>
                    {agent.name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-text-primary">{agent.name}</h3>
                      <span className={`text-xs font-medium ${c.text}`}>— {agent.role}</span>
                      <span className={`mr-auto text-xs px-2 py-0.5 rounded-full ${
                        agent.status === 'active'
                          ? 'bg-accent-green/10 text-accent-green'
                          : 'bg-white/5 text-text-muted'
                      }`}>
                        {agent.status === 'active' ? 'פעיל' : 'סטנדבי'}
                      </span>
                    </div>
                    <p className="text-xs text-text-secondary leading-relaxed">{agent.description}</p>

                    {/* Specialties */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {agent.specialty.map(s => (
                        <span key={s} className="text-xs bg-white/5 text-text-muted px-2 py-0.5 rounded-lg">{s}</span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border-muted">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />
                        {agent.tasksCompleted} הושלמו
                      </div>
                      {agent.tasksOpen > 0 && (
                        <div className="flex items-center gap-1.5 text-xs text-text-muted">
                          <Clock className="w-3.5 h-3.5 text-accent-amber" />
                          {agent.tasksOpen} פתוחות
                        </div>
                      )}
                      <div className="flex items-center gap-1 mr-auto opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className={`text-xs ${c.text} hover:underline flex items-center gap-1`}>
                          <MessageSquare className="w-3.5 h-3.5" /> שלח הוראה
                        </button>
                      </div>
                    </div>

                    {/* Last action */}
                    <div className="flex items-start gap-1.5 mt-2">
                      <Activity className="w-3 h-3 text-text-muted mt-0.5 shrink-0" />
                      <p className="text-xs text-text-muted">{agent.lastAction}</p>
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
