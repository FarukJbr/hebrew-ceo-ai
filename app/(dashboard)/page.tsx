import { Header } from '@/components/Header'
import { StatCard } from '@/components/StatCard'
import { DashboardCharts } from '@/components/DashboardCharts'
import { Wallet, Users, ListChecks, Bot, Activity, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

const recentActivity = [
  { time: '09:12', agent: 'אריאל — מנכ״ל AI', action: 'סיים ניתוח דוח רבעוני Q2' },
  { time: '09:15', agent: 'נועה — CFO AI', action: 'עדכן תחזית תזרים יוני' },
  { time: '09:31', agent: 'יובל — שיווק AI', action: 'הציע קמפיין לשוק האירופי' },
  { time: '10:00', agent: 'מיכל — משפטי AI', action: 'סקר הסכם ספק חדש' },
  { time: '10:22', agent: 'דניאל — HR AI', action: 'פרסם 3 משרות גיוס חדשות' },
]

const agentStatus = [
  { name: 'אריאל', role: 'מנכ״ל AI', status: 'פעיל', tasks: 3 },
  { name: 'נועה', role: 'CFO AI', status: 'פעיל', tasks: 2 },
  { name: 'יובל', role: 'שיווק AI', status: 'פעיל', tasks: 5 },
  { name: 'תמר', role: 'מכירות AI', status: 'בסטנדבי', tasks: 0 },
]

export default function DashboardPage() {
  return (
    <div className="min-h-screen">
      <Header title="לוח בקרה" subtitle="שלום, יו״ר הדירקטוריון" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Welcome banner */}
        <div className="relative overflow-hidden glass-card rounded-2xl p-6 border border-accent-cyan/10">
          <div className="absolute inset-0 bg-gradient-to-l from-accent-cyan/5 to-transparent pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
              </span>
              <span className="text-xs text-accent-cyan font-medium uppercase tracking-wider">מערכת פעילה</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary">
              גבר יזמות — {new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </h2>
            <p className="text-text-secondary text-sm mt-1">כל סוכני ה-AI פעילים. 8 סוכנים, 12 משימות פתוחות.</p>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="הכנסות החודש" value="₪842K" change={8.4} changeLabel="מהחודש שעבר" icon={Wallet} color="cyan" />
          <StatCard title="עובדים פעילים" value="128" change={3} changeLabel="מהחודש שעבר" icon={Users} color="purple" />
          <StatCard title="משימות פתוחות" value="47" change={-12} changeLabel="מהשבוע שעבר" icon={ListChecks} color="amber" />
          <StatCard title="סוכני AI פעילים" value="8" icon={Bot} color="green" suffix="/ 8" />
        </div>

        {/* Charts */}
        <DashboardCharts />

        {/* Bottom grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent-cyan" />
                <h3 className="text-sm font-semibold text-text-primary">פעילות אחרונה</h3>
              </div>
              <button className="text-xs text-accent-cyan hover:underline flex items-center gap-1">
                הכל <ArrowLeft className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {recentActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-border-muted last:border-0">
                  <span className="text-xs text-text-muted font-mono mt-0.5 shrink-0">{item.time}</span>
                  <div>
                    <p className="text-xs font-medium text-accent-cyan">{item.agent}</p>
                    <p className="text-xs text-text-secondary mt-0.5">{item.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Agent Status */}
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-accent-purple" />
              <h3 className="text-sm font-semibold text-text-primary">סטטוס סוכני AI</h3>
            </div>
            <div className="space-y-3">
              {agentStatus.map((agent, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-border-muted last:border-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan/30 to-accent-purple/30 flex items-center justify-center text-xs font-bold text-text-primary shrink-0">
                    {agent.name[0]}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-text-primary">{agent.name}</p>
                    <p className="text-xs text-text-muted">{agent.role}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${agent.status === 'פעיל' ? 'bg-accent-green/10 text-accent-green' : 'bg-white/5 text-text-muted'}`}>
                      {agent.status}
                    </span>
                    {agent.tasks > 0 && <span className="text-xs text-text-muted">{agent.tasks} משימות</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
