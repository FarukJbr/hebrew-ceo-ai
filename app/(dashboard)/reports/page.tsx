'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { BarChart2, TrendingUp, Download, FileText, Calendar, Plus, X, Filter, CheckCircle2, Clock } from 'lucide-react'
import { DashboardCharts } from '@/components/DashboardCharts'
import { createClient } from '@/lib/supabase/client'

interface Report {
  id: string
  title: string
  date: string
  type: string
  status: 'ready' | 'generating'
  size: string
  format: 'pdf' | 'excel'
  dateRange?: string
}

const kpiData = [
  { label: 'צמיחת הכנסות YTD', value: '+24.3%', trend: 'up', vs: 'יעד שנתי: 20% ✓' },
  { label: 'רווחיות ממוצעת', value: '36.8%', trend: 'up', vs: 'H1 2025: 31.2%' },
  { label: 'עסקאות שנסגרו', value: '14', trend: 'up', vs: 'Q1: 9 עסקאות' },
  { label: 'ROI ממוצע השקעות', value: '18.4%', trend: 'up', vs: 'יעד: 15% ✓' },
  { label: 'עלויות תפעוליות', value: '₪820K', trend: 'down', vs: 'קיצוץ של 8.2%' },
  { label: 'NPS לקוחות ועסקים', value: '72', trend: 'up', vs: 'קודם: 65' },
]

const REPORT_TYPES = ['שבועי','רבעוני','חצי שנתי','שנתי','מחלקתי — כספים','מחלקתי — שיווק','מחלקתי — נדל״ן','מחלקתי — הנהלה','תפעולי — ישיבות','תפעולי — משימות','תפעולי — מחלקות']

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [showForm, setShowForm] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterFormat, setFilterFormat] = useState<'all'|'pdf'|'excel'>('all')
  const [showFilters, setShowFilters] = useState(false)
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  const [nTitle, setNTitle] = useState('')
  const [nType, setNType] = useState(REPORT_TYPES[0])
  const [nFormat, setNFormat] = useState<'pdf'|'excel'>('pdf')
  const [nFrom, setNFrom] = useState('')
  const [nTo, setNTo] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) { setIsLoading(false); return }
      setUserId(uid)
      const { data: rows } = await supabase
        .from('reports')
        .select('data')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
      setReports(rows?.map((r: any) => r.data) || [])
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

  const filtered = reports.filter(r => {
    if (filterType !== 'all' && !r.type.includes(filterType)) return false
    if (filterFormat !== 'all' && r.format !== filterFormat) return false
    return true
  })

  const generateReport = async () => {
    if (!nTitle.trim()) return
    const newReport: Report = {
      id: crypto.randomUUID(), title: nTitle, date: new Date().toLocaleDateString('he-IL').replace(/\./g,'/'),
      type: nType, status: 'generating', size: '—', format: nFormat,
      dateRange: nFrom && nTo ? `${nFrom} — ${nTo}` : undefined
    }
    setReports(prev => [newReport, ...prev])
    setNTitle(''); setNFrom(''); setNTo(''); setShowForm(false)

    const supabase = createClient()
    await supabase.from('reports').insert({ id: newReport.id, user_id: userId, data: newReport })

    // Simulate report generation
    setTimeout(async () => {
      const updatedReport: Report = { ...newReport, status: 'ready', size: `${(Math.random()*3+0.5).toFixed(1)} MB` }
      setReports(prev => prev.map(r => r.id === newReport.id ? updatedReport : r))
      await supabase.from('reports').update({ data: updatedReport }).eq('id', newReport.id).eq('user_id', userId)
    }, 3000)
  }

  const handleDownload = async (report: Report) => {
    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id
    const t = report.type

    const isGeneral = ['שבועי','רבעוני','חצי שנתי','שנתי'].includes(t)

    // ── Cover sheet ──
    const coverWS = XLSX.utils.aoa_to_sheet([
      ['שם הדוח', report.title],
      ['סוג', t],
      ['תאריך הפקה', report.date],
      ['טווח תאריכים', report.dateRange || '—'],
      ['הופק על ידי', 'מערכת ניהול'],
    ])
    coverWS['!cols'] = [{ wch: 22 }, { wch: 44 }]
    XLSX.utils.book_append_sheet(wb, coverWS, 'כללי')

    if (uid) {
      // ── Tasks ──
      if (isGeneral || t.includes('משימות') || t.includes('הנהלה') || t.includes('מחלקות')) {
        const { data: rows } = await supabase.from('tasks').select('data').eq('user_id', uid)
        const tasks = rows?.map((r: any) => r.data) || []
        if (tasks.length) {
          const ws = XLSX.utils.aoa_to_sheet([
            ['כותרת', 'סטטוס', 'עדיפות', 'מחלקה', 'תאריך יעד'],
            ...tasks.map((t: any) => [t.title || t.text || '—', t.status || '—', t.priority || '—', t.department || '—', t.dueDate || '—']),
          ])
          ws['!cols'] = [{ wch: 30 }, { wch: 14 }, { wch: 12 }, { wch: 18 }, { wch: 14 }]
          XLSX.utils.book_append_sheet(wb, ws, 'משימות')
        }
      }

      // ── Meetings ──
      if (isGeneral || t.includes('ישיבות')) {
        const { data: rows } = await supabase.from('meetings').select('data').eq('user_id', uid)
        const meetings = rows?.map((r: any) => r.data) || []
        if (meetings.length) {
          const ws = XLSX.utils.aoa_to_sheet([
            ['כותרת', 'תאריך', 'שעה', 'משך', 'סוג', 'מיקום', 'משתתפים', 'סטטוס'],
            ...meetings.map((m: any) => [m.title, m.date, m.time, m.duration, m.type === 'video' ? 'וידאו' : 'פיזי', m.location, (m.participants || []).join(', '), m.status === 'upcoming' ? 'קרוב' : 'עבר']),
          ])
          ws['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 8 }, { wch: 10 }, { wch: 8 }, { wch: 20 }, { wch: 40 }, { wch: 8 }]
          XLSX.utils.book_append_sheet(wb, ws, 'ישיבות')
        }
      }

      // ── Customers ──
      if (isGeneral || t.includes('שיווק') || t.includes('מכירות')) {
        const { data: rows } = await supabase.from('customers').select('data').eq('user_id', uid)
        const customers = rows?.map((r: any) => r.data) || []
        if (customers.length) {
          const statusMap: Record<string, string> = { lead: 'ליד', active: 'פעיל', inactive: 'לא פעיל' }
          const ws = XLSX.utils.aoa_to_sheet([
            ['שם', 'חברה', 'אימייל', 'טלפון', 'סטטוס', 'תאריך הוספה'],
            ...customers.map((c: any) => [c.name, c.company || '—', c.email || '—', c.phone || '—', statusMap[c.status] || c.status, c.createdAt || '—']),
          ])
          ws['!cols'] = [{ wch: 22 }, { wch: 22 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 14 }]
          XLSX.utils.book_append_sheet(wb, ws, 'לקוחות')
        }
      }

      // ── Department work products ──
      if (isGeneral || t.includes('מחלקות') || t.includes('הנהלה') || t.includes('שיווק') || t.includes('נדל') || t.includes('כספים')) {
        const { data: rows } = await supabase.from('instructions').select('data').eq('user_id', uid)
        const instructions = rows?.map((r: any) => r.data) || []
        const filtered = t.includes('כספים') ? instructions.filter((i: any) => i.department === 'finance')
          : t.includes('שיווק') ? instructions.filter((i: any) => i.department === 'marketing')
          : t.includes('נדל') ? instructions.filter((i: any) => i.department === 'realestate')
          : t.includes('הנהלה') ? instructions.filter((i: any) => i.department === 'management')
          : instructions
        if (filtered.length) {
          const ws = XLSX.utils.aoa_to_sheet([
            ['מחלקה', 'הוראה', 'תוצר עבודה', 'תאריך'],
            ...filtered.map((i: any) => [i.department || '—', (i.instruction || '').slice(0, 120), (i.result || '').slice(0, 300), i.createdAt ? new Date(i.createdAt).toLocaleDateString('he-IL') : '—']),
          ])
          ws['!cols'] = [{ wch: 14 }, { wch: 40 }, { wch: 70 }, { wch: 14 }]
          XLSX.utils.book_append_sheet(wb, ws, 'תוצרי מחלקות')
        }
      }

      // ── Finance ──
      if (isGeneral || t.includes('כספים')) {
        const { data: cf } = await supabase.from('cf_data').select('accounts,records,bank_rows').eq('user_id', uid).single()
        if (cf) {
          const accounts: any[] = cf.accounts || []
          const records: any[] = cf.records || []
          const bankRows: any[] = cf.bank_rows || []
          if (accounts.length) {
            const ws = XLSX.utils.aoa_to_sheet([
              ['שם חשבון', 'סוג', 'יתרת פתיחה (₪)', 'מסגרת (₪)'],
              ...accounts.map((a: any) => [a.name, a.type === 'bank' ? 'חשבון בנק' : 'כרטיס אשראי', a.opening, a.limit || 0]),
            ])
            ws['!cols'] = [{ wch: 22 }, { wch: 16 }, { wch: 18 }, { wch: 14 }]
            XLSX.utils.book_append_sheet(wb, ws, 'חשבונות')
          }
          if (records.length) {
            const ws = XLSX.utils.aoa_to_sheet([
              ['תאריך', 'תיאור', 'סוג', 'קטגוריה', 'עסקי/פרטי', 'סכום (₪)'],
              ...records.map((r: any) => [r.date, r.description, r.type, r.category, r.bp === 'biz' ? 'עסקי' : 'פרטי', r.amount]),
            ])
            ws['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 8 }, { wch: 20 }, { wch: 10 }, { wch: 12 }]
            XLSX.utils.book_append_sheet(wb, ws, 'רישומים פיננסיים')
          }
          if (bankRows.length) {
            const ws = XLSX.utils.aoa_to_sheet([
              ['תאריך', 'תיאור', 'חיוב (₪)', 'זיכוי (₪)', 'עסקי/פרטי'],
              ...bankRows.map((r: any) => [r.date, r.description, r.debit || 0, r.credit || 0, r.bp === 'biz' ? 'עסקי' : 'פרטי']),
            ])
            ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 10 }]
            XLSX.utils.book_append_sheet(wb, ws, 'תנועות בנק')
          }
        }
      }
    }

    XLSX.writeFile(wb, `${report.title}.xlsx`)
    setDownloadedIds(prev => new Set([...prev, report.id]))
  }

  const allTypes = ['all', ...Array.from(new Set(reports.map(r => r.type.split(' — ')[0])))]

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
                <p className="text-2xl font-bold text-accent-cyan">{kpi.value}</p>
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
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-accent-cyan" />
              <h3 className="text-sm font-semibold text-text-primary">דוחות שמורים והיסטוריה</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${showFilters ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' : 'bg-white/5 border-border-muted text-text-muted'}`}>
                <Filter className="w-3.5 h-3.5" /> פילטרים
              </button>
              <button onClick={() => setShowForm(!showForm)}
                className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-1.5 rounded-xl transition-all">
                <Plus className="w-3.5 h-3.5" /> דוח חדש
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-4 mb-4 p-3 bg-white/3 rounded-xl border border-border-muted">
              <div>
                <label className="block text-xs text-text-muted mb-1">סוג</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none">
                  <option value="all" className="bg-bg-card">הכל</option>
                  {allTypes.filter(t=>t!=='all').map(t => <option key={t} value={t} className="bg-bg-card">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1">פורמט</label>
                <div className="flex gap-1">
                  {(['all','pdf','excel'] as const).map(f => (
                    <button key={f} onClick={() => setFilterFormat(f)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterFormat===f ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted'}`}>
                      {f==='all'?'הכל':f.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => { setFilterType('all'); setFilterFormat('all') }}
                className="self-end text-xs text-text-muted hover:text-accent-red flex items-center gap-1">
                <X className="w-3 h-3" /> איפוס
              </button>
            </div>
          )}

          {showForm && (
            <div className="mb-4 p-4 bg-accent-cyan/5 border border-accent-cyan/20 rounded-xl space-y-3">
              <h4 className="text-sm font-semibold text-text-primary">יצירת דוח חדש</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input value={nTitle} onChange={e=>setNTitle(e.target.value)} placeholder="שם הדוח *"
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50" />
                <select value={nType} onChange={e=>setNType(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-text-primary focus:outline-none">
                  {REPORT_TYPES.map(t => <option key={t} value={t} className="bg-bg-card">{t}</option>)}
                </select>
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-text-muted mb-1">מתאריך</label>
                  <input value={nFrom} onChange={e=>setNFrom(e.target.value)} placeholder="01/01/2026"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none" dir="ltr" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-text-muted mb-1">עד תאריך</label>
                  <input value={nTo} onChange={e=>setNTo(e.target.value)} placeholder="30/06/2026"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-text-primary focus:outline-none" dir="ltr" />
                </div>
                <div className="flex-1 min-w-[120px]">
                  <label className="block text-xs text-text-muted mb-1">פורמט</label>
                  <div className="flex gap-1">
                    {(['pdf','excel'] as const).map(f => (
                      <button key={f} onClick={() => setNFormat(f)}
                        className={`flex-1 text-xs py-2 rounded-xl transition-all border ${nFormat===f ? 'bg-accent-cyan/20 border-accent-cyan/30 text-accent-cyan' : 'bg-white/5 border-border-muted text-text-muted'}`}>
                        {f.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={generateReport}
                  className="bg-accent-cyan text-bg-base font-semibold text-xs px-4 py-2 rounded-xl hover:bg-accent-cyan/90 transition-all">
                  צור דוח
                </button>
                <button onClick={() => setShowForm(false)}
                  className="bg-white/5 text-text-secondary text-xs px-3 py-2 rounded-xl hover:bg-white/8 transition-all">
                  ביטול
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {filtered.map(report => (
              <div key={report.id} className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-white/3 transition-colors border border-transparent hover:border-border-muted">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${report.format === 'pdf' ? 'bg-accent-red/10 text-accent-red' : 'bg-accent-green/10 text-accent-green'}`}>
                  <FileText className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-text-primary">{report.title}</p>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-text-muted"><Calendar className="w-3 h-3" />{report.date}</span>
                    <span className="text-xs bg-white/5 text-text-secondary px-2 py-0.5 rounded-lg">{report.type}</span>
                    <span className={`text-xs uppercase font-mono ${report.format === 'pdf' ? 'text-accent-red/70' : 'text-accent-green/70'}`}>{report.format}</span>
                    {report.size !== '—' && <span className="text-xs text-text-muted">{report.size}</span>}
                    {report.dateRange && <span className="text-xs text-text-muted" dir="ltr">{report.dateRange}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {report.status === 'generating' ? (
                    <span className="flex items-center gap-1.5 text-xs text-accent-amber">
                      <Clock className="w-3.5 h-3.5 animate-pulse" /> מייצר...
                    </span>
                  ) : downloadedIds.has(report.id) ? (
                    <span className="flex items-center gap-1 text-xs text-accent-green">
                      <CheckCircle2 className="w-3.5 h-3.5" /> הורד
                    </span>
                  ) : (
                    <button onClick={() => handleDownload(report)}
                      className="flex items-center gap-1.5 text-xs text-text-muted hover:text-accent-cyan transition-colors bg-white/5 hover:bg-white/8 px-3 py-1.5 rounded-lg">
                      <Download className="w-3.5 h-3.5" /> הורד
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
