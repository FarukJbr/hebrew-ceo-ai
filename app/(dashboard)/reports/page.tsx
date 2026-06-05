import { Header } from '@/components/Header'
import { StatCard } from '@/components/StatCard'
import { BarChart2, TrendingUp, Download, FileText, Calendar } from 'lucide-react'
import { DashboardCharts } from '@/components/DashboardCharts'

const quarterlyReports = [
  { id: 1, title: 'דוח רבעוני Q2 2026', date: '01/06/2026', type: 'רבעוני', status: 'מוכן', size: '2.4 MB', color: 'cyan' },
  { id: 2, title: 'דוח חצי שנתי H1 2026', date: '01/06/2026', type: 'חצי שנתי', status: 'בהכנה', size: '—', color: 'amber' },
  { id: 3, title: 'דוח רבעוני Q1 2026', date: '01/03/2026', type: 'רבעוני', status: 'מוכן', size: '2.1 MB', color: 'green' },
  { id: 4, title: 'דוח שנתי 2025', date: '15/01/2026', type: 'שנתי', status: 'מוכן', size: '5.8 MB', color: 'purple' },
  { id: 5, title: 'דוח רבעוני Q4 2025', date: '01/12/2025', type: 'רבעוני', status: 'מוכן', size: '2.3 MB', color: 'green' },
]

const kpiData = [
  { label: 'צמיחת הכנסות YTD', value: '+24.3%', trend: 'up', vs: 'יעד: 20%' },
  { label: 'רווחיות ממוצעת', value: '36.8%', trend: 'up', vs: 'מהחצי הקודם: 31.2%' },
  { label: 'לקוחות פעילים', value: '47', trend: 'up', vs: 'רבעון קודם: 39' },
  { label: 'ROI ממוצע השקעות', value: '18.4%', trend: 'up', vs: 'יעד: 15%' },
  { label: 'עלויות תפעוליות', value: '₪820K', trend: 'down', vs: 'קיצוץ: -8.2%' },
  { label: 'NPS לקוחות', value: '72', trend: 'up', vs: 'קודם: 65' },
]

export default function ReportsPage() {
  return (
    <div className="min-h-screen">
      <Header title="דוחות" subtitle="ניתוח ביצועים, מדדים ודוחות ניהוליים" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* KPI grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {kpiData.map((kpi, i) => (
            <div key={i} className="glass-card rounded-2xl p-4">
              <p className="text-xs text-text-muted mb-2">{kpi.label}</p>
              <div className="flex items-end justify-between">
                <p className={`text-2xl font-bold ${kpi.trend === 'up' ? 'text-accent-cyan' : 'text-accent-green'}`}>
                  {kpi.value}
                </p>
                <TrendingUp className={`w-4 h-4 mb-1 ${kpi.trend === 'up' ? 'text-accent-green' : 'text-accent-red rotate-180'}`} />
              </div>
              <p className="text-xs text-text-muted mt-1">{kpi.vs}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <DashboardCharts />

        {/* Reports list */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-accent-cyan" />
              <h3 className="text-sm font-semibold text-text-primary">דוחות שמורים</h3>
            </div>
            <button className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
              <FileText className="w-3.5 h-3.5" /> דוח חדש
            </button>
          </div>

          <div className="space-y-2">
            {quarterlyReports.map(report => (
              <div key={report.id} className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-white/3 transition-colors border border-transparent hover:border-border-muted">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  report.color === 'cyan' ? 'bg-accent-cyan/10 text-accent-cyan' :
                  report.color === 'green' ? 'bg-accent-green/10 text-accent-green' :
                  report.color === 'purple' ? 'bg-accent-purple/10 text-accent-purple' :
                  'bg-accent-amber/10 text-accent-amber'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{report.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="flex items-center gap-1 text-xs text-text-muted">
                      <Calendar className="w-3 h-3" />{report.date}
                    </span>
                    <span className="text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded-lg">{report.type}</span>
                    {report.size !== '—' && <span className="text-xs text-text-muted">{report.size}</span>}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg ${
                  report.status === 'מוכן'
                    ? 'bg-accent-green/10 text-accent-green'
                    : 'bg-accent-amber/10 text-accent-amber'
                }`}>
                  {report.status}
                </span>
                {report.status === 'מוכן' && (
                  <button className="flex items-center gap-1 text-xs text-text-muted hover:text-text-secondary transition-colors">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
