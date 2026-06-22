'use client'

import { useState, useEffect, useMemo } from 'react'
import { Header } from '@/components/Header'
import {
  Users, Plus, Search, Edit2, Trash2, X,
  Phone, Mail, Building2, Filter,
  UserCheck, UserX, UserPlus, Eye, EyeOff,
  FileText, Shield, Briefcase, LayoutDashboard,
  ClipboardList, Handshake, CreditCard,
  CheckSquare, Square, MessageSquare, Bell,
  ChevronDown, ChevronUp, AlertCircle, Clock,
  CheckCircle2, Pause, Ban, TrendingUp,
  CalendarDays, DollarSign, AlertTriangle, Star,
  MoreVertical, StickyNote, RefreshCw,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ────────────────────────────────────────────────────────────────────

type CustomerStatus = 'lead' | 'active' | 'inactive'
type InquiryStatus  = 'open' | 'in_progress' | 'waiting' | 'done'
type DealStatus     = 'active' | 'paused' | 'completed' | 'cancelled'
type PaymentStatus  = 'paid' | 'pending' | 'overdue'
type Priority       = 'urgent' | 'high' | 'normal' | 'low'
type CrmTab         = 'dashboard' | 'customers' | 'inquiries' | 'deals' | 'payments'

interface Customer {
  id: string; name: string; email: string; phone: string; company: string
  status: CustomerStatus; serviceType: string; notes: string; createdAt: string
  taxCode?: string; insUsername?: string; insIdNumber?: string; insPassword?: string
}

interface CheckItem { id: string; text: string; done: boolean; doneAt?: string }
interface InquiryNote { id: string; text: string; createdAt: string; type: 'note' | 'update' }

interface Inquiry {
  id: string; customerId: string; customerName: string
  topic: string; serviceType: string; status: InquiryStatus; priority: Priority
  description: string; openedAt: string; dueDate: string; closedAt?: string
  checklist: CheckItem[]; notes: InquiryNote[]
}

interface Deal {
  id: string; customerId: string; customerName: string
  title: string; amount: number; frequency: 'monthly' | 'yearly' | 'one-time'
  startDate: string; endDate?: string; status: DealStatus
  serviceType: string; notes: string
}

interface Payment {
  id: string; dealId: string; customerId: string; customerName: string; dealTitle: string
  month: string; amount: number; status: PaymentStatus; paidAt?: string; notes: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SERVICE_TYPES = [
  'הנהלת חשבונות','החזר מס','משיכת כספי גמל','ייעוץ מס',
  'דוחות שנתיים','שכר ומשאבי אנוש','ביקורת חשבונות',
  'ייצוג מול רשויות','הקמת עסק','אחר',
]

const SERVICE_CHECKLISTS: Record<string, string[]> = {
  'הנהלת חשבונות': ['קבלת מסמכים חודשיים','הזנת נתונים למערכת','בדיקת דוחות חודשיים','שליחת סיכום ללקוח','ארכוב חודשי'],
  'החזר מס': ['קבלת טופס 106','קבלת אסמכתאות הוצאות','בדיקת זכאות להחזר','הגשת בקשת החזר','מעקב אחר קבלת כסף'],
  'משיכת כספי גמל': ['בדיקת זכאות ותנאים','קבלת טפסים מקופת גמל','מילוי ובדיקת טפסים','הגשה לקופת גמל','מעקב אחר קבלת תשלום'],
  'ייעוץ מס': ['איסוף נתונים רלוונטיים','ניתוח המצב הנוכחי','הכנת חוות דעת','שיחת ייעוץ עם הלקוח','מסמך המלצות'],
  'דוחות שנתיים': ['קבלת כל המסמכים','הכנת דוח רווח והפסד','הכנת מאזן','הגשה לרשויות','קבלת אישורים'],
  'שכר ומשאבי אנוש': ['קבלת נתוני שעות/נוכחות','חישוב שכר','הפקת תלושי שכר','העברת הפרשות לפנסיה','דיווח לביטוח לאומי'],
  'ביקורת חשבונות': ['קבלת ספרי חשבונות','בדיקת תיעוד','בחינת יתרות','כתיבת דוח ביקורת','חתימה על הדוחות'],
  'ייצוג מול רשויות': ['קבלת מסמכי הדרישה','בחינת נושא הדרישה','הכנת תגובה','הגשת ערעור/השגה','מעקב אחר התוצאה'],
  'הקמת עסק': ['בחירת מבנה עסקי (עוסק/חברה)','רישום ברשם החברות / מע"מ','פתיחת תיק במס הכנסה','פתיחת תיק בביטוח לאומי','פתיחת חשבון בנק עסקי','הנפקת אישורי ניהול ספרים','רישום למע"מ'],
  'אחר': ['הגדרת דרישות','ביצוע המשימה','בדיקה ואישור','סיכום ותיעוד'],
}

const MONTHS_HE = ["ינואר","פברואר","מרץ","אפריל","מאי","יוני","יולי","אוגוסט","ספטמבר","אוקטובר","נובמבר","דצמבר"]

const customerStatusCfg: Record<CustomerStatus, { label: string; color: string; bg: string; border: string }> = {
  lead:     { label: 'ליד',        color: 'text-accent-cyan',  bg: 'bg-accent-cyan/10',  border: 'border-accent-cyan/20' },
  active:   { label: 'לקוח פעיל', color: 'text-accent-green', bg: 'bg-accent-green/10', border: 'border-accent-green/20' },
  inactive: { label: 'לא פעיל',   color: 'text-text-muted',   bg: 'bg-white/5',         border: 'border-border-muted' },
}

const inquiryStatusCfg: Record<InquiryStatus, { label: string; color: string; bg: string; border: string; icon: any }> = {
  open:        { label: 'פתוחה',    color: 'text-accent-cyan',  bg: 'bg-accent-cyan/10',   border: 'border-accent-cyan/20',   icon: AlertCircle },
  in_progress: { label: 'בטיפול',   color: 'text-accent-amber', bg: 'bg-accent-amber/10',  border: 'border-accent-amber/20',  icon: Clock },
  waiting:     { label: 'ממתינה',   color: 'text-accent-purple',bg: 'bg-accent-purple/10', border: 'border-accent-purple/20', icon: Pause },
  done:        { label: 'טופלה',    color: 'text-accent-green', bg: 'bg-accent-green/10',  border: 'border-accent-green/20',  icon: CheckCircle2 },
}

const priorityCfg: Record<Priority, { label: string; color: string }> = {
  urgent: { label: 'דחוף',   color: 'text-accent-red' },
  high:   { label: 'גבוה',   color: 'text-accent-amber' },
  normal: { label: 'רגיל',   color: 'text-accent-cyan' },
  low:    { label: 'נמוך',   color: 'text-text-muted' },
}

const dealStatusCfg: Record<DealStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'פעיל',    color: 'text-accent-green',  bg: 'bg-accent-green/10',  border: 'border-accent-green/20' },
  paused:    { label: 'מושהה',   color: 'text-accent-amber',  bg: 'bg-accent-amber/10',  border: 'border-accent-amber/20' },
  completed: { label: 'הושלם',   color: 'text-accent-cyan',   bg: 'bg-accent-cyan/10',   border: 'border-accent-cyan/20' },
  cancelled: { label: 'בוטל',    color: 'text-text-muted',    bg: 'bg-white/5',          border: 'border-border-muted' },
}

const paymentStatusCfg: Record<PaymentStatus, { label: string; color: string; bg: string; border: string }> = {
  paid:    { label: 'שולם',    color: 'text-accent-green',  bg: 'bg-accent-green/10',  border: 'border-accent-green/20' },
  pending: { label: 'ממתין',   color: 'text-accent-amber',  bg: 'bg-accent-amber/10',  border: 'border-accent-amber/20' },
  overdue: { label: 'באיחור',  color: 'text-accent-red',    bg: 'bg-accent-red/10',    border: 'border-accent-red/20' },
}

const fmt = (n: number) => new Intl.NumberFormat('he-IL',{style:'currency',currency:'ILS',maximumFractionDigits:0}).format(n||0)

const EMPTY_CUSTOMER: Omit<Customer,'id'|'createdAt'> = {
  name:'', email:'', phone:'', company:'', status:'lead',
  serviceType:'', notes:'', taxCode:'', insUsername:'', insIdNumber:'', insPassword:'',
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function CustomersPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [activeTab, setActiveTab] = useState<CrmTab>('dashboard')

  // data
  const [customers,  setCustomers]  = useState<Customer[]>([])
  const [inquiries,  setInquiries]  = useState<Inquiry[]>([])
  const [deals,      setDeals]      = useState<Deal[]>([])
  const [payments,   setPayments]   = useState<Payment[]>([])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) { setIsLoading(false); return }
      setUserId(uid)
      const [c, i, d, p] = await Promise.all([
        supabase.from('customers').select('data').eq('user_id', uid).order('created_at',{ascending:false}),
        supabase.from('crm_inquiries').select('data').eq('user_id', uid).order('created_at',{ascending:false}),
        supabase.from('crm_deals').select('data').eq('user_id', uid).order('created_at',{ascending:false}),
        supabase.from('crm_payments').select('data').eq('user_id', uid).order('created_at',{ascending:false}),
      ])
      setCustomers(c.data?.map((r:any) => r.data) || [])
      setInquiries(i.data?.map((r:any) => r.data) || [])
      setDeals(d.data?.map((r:any) => r.data) || [])
      setPayments(p.data?.map((r:any) => r.data) || [])
      setIsLoading(false)
    })
  }, [])

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-text-muted">טוען...</p>
      </div>
    </div>
  )

  const tabs: { id: CrmTab; label: string; icon: any }[] = [
    { id: 'dashboard',  label: 'לוח בקרה',  icon: LayoutDashboard },
    { id: 'customers',  label: 'לקוחות',    icon: Users },
    { id: 'inquiries',  label: 'הפניות',    icon: ClipboardList },
    { id: 'deals',      label: 'עסקאות',    icon: Handshake },
    { id: 'payments',   label: 'תשלומים',   icon: CreditCard },
  ]

  const props = { userId, customers, setCustomers, inquiries, setInquiries, deals, setDeals, payments, setPayments }

  return (
    <div className="min-h-screen">
      <Header title="CRM — ניהול לקוחות" subtitle="לקוחות • הפניות • עסקאות • תשלומים" />

      <div className="px-6 pt-4 animate-fade-in">
        {/* Tab bar */}
        <div className="flex gap-1 bg-white/3 rounded-2xl p-1 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all
                ${activeTab === t.id ? 'bg-accent-cyan text-bg-base shadow-lg' : 'text-text-muted hover:text-text-secondary hover:bg-white/5'}`}>
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard'  && <DashboardTab  {...props} />}
        {activeTab === 'customers'  && <CustomersTab  {...props} />}
        {activeTab === 'inquiries'  && <InquiriesTab  {...props} />}
        {activeTab === 'deals'      && <DealsTab      {...props} />}
        {activeTab === 'payments'   && <PaymentsTab   {...props} />}
      </div>
    </div>
  )
}

// ─── Shared props type ────────────────────────────────────────────────────────

interface TabProps {
  userId: string
  customers:  Customer[];  setCustomers:  React.Dispatch<React.SetStateAction<Customer[]>>
  inquiries:  Inquiry[];   setInquiries:  React.Dispatch<React.SetStateAction<Inquiry[]>>
  deals:      Deal[];      setDeals:      React.Dispatch<React.SetStateAction<Deal[]>>
  payments:   Payment[];   setPayments:   React.Dispatch<React.SetStateAction<Payment[]>>
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ customers, inquiries, deals, payments }: TabProps) {
  const openInq      = inquiries.filter(i => i.status !== 'done')
  const overdueInq   = inquiries.filter(i => i.status !== 'done' && i.dueDate && new Date(i.dueDate) < new Date())
  const activeDeals  = deals.filter(d => d.status === 'active')
  const monthlyRev   = activeDeals.filter(d => d.frequency === 'monthly').reduce((s,d) => s + d.amount, 0)
  const overduePaym  = payments.filter(p => p.status === 'overdue')
  const pendingPaym  = payments.filter(p => p.status === 'pending')

  const kpis = [
    { label: 'לקוחות פעילים',   value: customers.filter(c=>c.status==='active').length, icon: UserCheck,      color: 'text-accent-green',  bg: 'bg-accent-green/5',  border: 'border-accent-green/20' },
    { label: 'הפניות פתוחות',   value: openInq.length,                                  icon: ClipboardList,  color: 'text-accent-cyan',   bg: 'bg-accent-cyan/5',   border: 'border-accent-cyan/20' },
    { label: 'הפניות דחופות',   value: overdueInq.length,                               icon: AlertTriangle,  color: 'text-accent-red',    bg: 'bg-accent-red/5',    border: 'border-accent-red/20' },
    { label: 'הכנסה חודשית',    value: fmt(monthlyRev),                                 icon: TrendingUp,     color: 'text-accent-amber',  bg: 'bg-accent-amber/5',  border: 'border-accent-amber/20', small: true },
    { label: 'עסקאות פעילות',   value: activeDeals.length,                              icon: Handshake,      color: 'text-accent-purple', bg: 'bg-accent-purple/5', border: 'border-accent-purple/20' },
    { label: 'תשלומים באיחור',  value: overduePaym.length,                              icon: AlertCircle,    color: 'text-accent-red',    bg: 'bg-accent-red/5',    border: 'border-accent-red/20' },
    { label: 'תשלומים ממתינים', value: pendingPaym.length,                              icon: Clock,          color: 'text-accent-amber',  bg: 'bg-accent-amber/5',  border: 'border-accent-amber/20' },
    { label: 'סה״כ לקוחות',     value: customers.length,                                icon: Users,          color: 'text-text-secondary',bg: 'bg-white/5',         border: 'border-border-muted' },
  ]

  return (
    <div className="space-y-6 pb-10">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpis.map(({ label, value, icon: Icon, color, bg, border, small }) => (
          <div key={label} className={`glass-card rounded-xl px-4 py-3 flex items-center gap-3 border ${border} ${bg}`}>
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div>
              <p className="text-xs text-text-muted">{label}</p>
              <p className={`${small ? 'text-base' : 'text-xl'} font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent open inquiries */}
      {openInq.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-border-muted">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-accent-cyan" /> הפניות פתוחות אחרונות
          </h3>
          <div className="space-y-2">
            {openInq.slice(0,5).map(inq => {
              const st = inquiryStatusCfg[inq.status]
              const done = inq.checklist.filter(c=>c.done).length
              const total = inq.checklist.length
              const isOverdue = inq.dueDate && new Date(inq.dueDate) < new Date()
              return (
                <div key={inq.id} className={`flex items-center gap-3 p-3 rounded-xl border ${isOverdue ? 'border-accent-red/20 bg-accent-red/5' : 'border-border-muted bg-white/3'}`}>
                  <st.icon className={`w-4 h-4 shrink-0 ${st.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-text-primary truncate">{inq.customerName} — {inq.topic}</p>
                    <p className="text-xs text-text-muted">{inq.serviceType}</p>
                  </div>
                  {total > 0 && (
                    <span className="text-xs text-text-muted shrink-0">{done}/{total} ✓</span>
                  )}
                  {isOverdue && <AlertTriangle className="w-3.5 h-3.5 text-accent-red shrink-0" />}
                  <span className={`shrink-0 text-xs px-2 py-0.5 rounded-lg border ${st.bg} ${st.color} ${st.border}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Overdue payments */}
      {overduePaym.length > 0 && (
        <div className="glass-card rounded-2xl p-5 border border-accent-red/20">
          <h3 className="text-sm font-semibold text-text-primary mb-4 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-accent-red" /> תשלומים באיחור
          </h3>
          <div className="space-y-2">
            {overduePaym.slice(0,5).map(p => (
              <div key={p.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-accent-red/20 bg-accent-red/5">
                <div>
                  <p className="text-xs font-medium text-text-primary">{p.customerName}</p>
                  <p className="text-xs text-text-muted">{p.dealTitle} — {formatMonth(p.month)}</p>
                </div>
                <span className="text-sm font-bold text-accent-red">{fmt(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {inquiries.length === 0 && deals.length === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center border border-border-muted">
          <LayoutDashboard className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">ברוך הבא ל-CRM — התחל ב"לקוחות" והוסף הפניות ועסקאות</p>
        </div>
      )}
    </div>
  )
}

// ─── Customers Tab ────────────────────────────────────────────────────────────

function CustomersTab({ userId, customers, setCustomers }: TabProps) {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<CustomerStatus|'all'>('all')
  const [filterService, setFilterService] = useState('all')
  const [showFilters, setShowFilters] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer|null>(null)
  const [form, setForm] = useState(EMPTY_CUSTOMER)
  const [saving, setSaving] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const fc = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all"

  const openAdd  = () => { setEditingId(null); setForm(EMPTY_CUSTOMER); setShowPass(false); setShowForm(true) }
  const openEdit = (c: Customer) => {
    setEditingId(c.id)
    setForm({ name:c.name,email:c.email,phone:c.phone,company:c.company,status:c.status,
      serviceType:c.serviceType||'',notes:c.notes,taxCode:c.taxCode||'',
      insUsername:c.insUsername||'',insIdNumber:c.insIdNumber||'',insPassword:c.insPassword||'' })
    setShowPass(false); setShowForm(true)
  }
  const close = () => { setShowForm(false); setEditingId(null); setForm(EMPTY_CUSTOMER) }

  const save = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    if (editingId) {
      const updated: Customer = { ...customers.find(c=>c.id===editingId)!, ...form }
      setCustomers(prev => prev.map(c => c.id===editingId ? updated : c))
      await supabase.from('customers').upsert({ id:updated.id, user_id:userId, data:updated })
    } else {
      const nc: Customer = { id:crypto.randomUUID(), ...form, createdAt:new Date().toLocaleDateString('he-IL') }
      setCustomers(prev => [nc, ...prev])
      await supabase.from('customers').upsert({ id:nc.id, user_id:userId, data:nc })
    }
    setSaving(false); close()
  }

  const del = async () => {
    if (!deleteTarget) return
    const supabase = createClient()
    await supabase.from('customers').delete().eq('id',deleteTarget.id).eq('user_id',userId)
    setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const filtered = customers.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (filterService !== 'all' && c.serviceType !== filterService) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q)||(c.email||'').toLowerCase().includes(q)||(c.company||'').toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-5 pb-10">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label:'סה״כ',       value: customers.length,                                    icon:Users,     color:'text-text-secondary', bg:'bg-white/5',        border:'border-border-muted' },
          { label:'פעילים',     value: customers.filter(c=>c.status==='active').length,      icon:UserCheck, color:'text-accent-green',   bg:'bg-accent-green/5', border:'border-accent-green/20' },
          { label:'לידים',      value: customers.filter(c=>c.status==='lead').length,        icon:UserPlus,  color:'text-accent-cyan',    bg:'bg-accent-cyan/5',  border:'border-accent-cyan/20' },
          { label:'לא פעילים',  value: customers.filter(c=>c.status==='inactive').length,    icon:UserX,     color:'text-text-muted',     bg:'bg-white/3',        border:'border-border-muted' },
        ].map(({ label,value,icon:Icon,color,bg,border }) => (
          <div key={label} className={`glass-card rounded-xl px-4 py-3 flex items-center gap-3 border ${border} ${bg}`}>
            <Icon className={`w-5 h-5 shrink-0 ${color}`} />
            <div><p className="text-xs text-text-muted">{label}</p><p className={`text-xl font-bold ${color}`}>{value}</p></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש לפי שם, מייל או חברה..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all" />
        </div>
        <button onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-xl border transition-all ${showFilters?'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan':'bg-white/5 border-border-muted text-text-muted hover:text-text-secondary'}`}>
          <Filter className="w-3.5 h-3.5" /> פילטרים
        </button>
        <button onClick={openAdd}
          className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-2.5 rounded-xl transition-all">
          <Plus className="w-3.5 h-3.5" /> הוסף לקוח
        </button>
      </div>

      {showFilters && (
        <div className="glass-card rounded-2xl p-4 flex flex-wrap gap-4 border border-accent-cyan/10">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">סטטוס</label>
            <div className="flex gap-1 flex-wrap">
              {(['all','lead','active','inactive'] as const).map(s => (
                <button key={s} onClick={() => setFilterStatus(s)}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterStatus===s?'bg-accent-cyan/20 text-accent-cyan':'bg-white/5 text-text-muted'}`}>
                  {s==='all'?'הכל':customerStatusCfg[s].label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">סוג שירות</label>
            <select value={filterService} onChange={e=>setFilterService(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none">
              <option value="all" className="bg-bg-card">הכל</option>
              {SERVICE_TYPES.map(s=><option key={s} value={s} className="bg-bg-card">{s}</option>)}
            </select>
          </div>
          <button onClick={()=>{setFilterStatus('all');setFilterService('all');setSearch('')}}
            className="self-end text-xs text-text-muted hover:text-accent-red flex items-center gap-1">
            <X className="w-3 h-3" /> איפוס
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-border-muted">
          <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
          <p className="text-sm text-text-muted">{customers.length===0?'אין לקוחות עדיין — הוסף את הלקוח הראשון':'לא נמצאו לקוחות התואמים'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(c => {
            const st = customerStatusCfg[c.status]
            return (
              <div key={c.id} className="glass-card rounded-xl p-5 space-y-3 border border-border-muted hover:border-accent-cyan/20 transition-all cursor-pointer group" onClick={()=>openEdit(c)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary leading-snug">{c.name}</p>
                    {c.company && <span className="flex items-center gap-1 text-xs text-text-muted mt-0.5"><Building2 className="w-3 h-3"/>{c.company}</span>}
                  </div>
                  <span className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border ${st.bg} ${st.color} ${st.border}`}>{st.label}</span>
                </div>
                {c.serviceType && (
                  <span className="inline-flex items-center gap-1 text-xs bg-accent-purple/10 text-accent-purple border border-accent-purple/20 px-2.5 py-1 rounded-lg">
                    <Briefcase className="w-3 h-3"/>{c.serviceType}
                  </span>
                )}
                <div className="space-y-1.5">
                  {c.email && <span className="flex items-center gap-1.5 text-xs text-text-secondary" dir="ltr"><Mail className="w-3 h-3 text-text-muted shrink-0"/>{c.email}</span>}
                  {c.phone && <span className="flex items-center gap-1.5 text-xs text-text-secondary" dir="ltr"><Phone className="w-3 h-3 text-text-muted shrink-0"/>{c.phone}</span>}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {c.taxCode && <span className="flex items-center gap-1 text-xs bg-accent-amber/10 text-accent-amber border border-accent-amber/20 px-2 py-0.5 rounded-md"><FileText className="w-3 h-3"/>מ.ה: {c.taxCode}</span>}
                  {c.insIdNumber && <span className="flex items-center gap-1 text-xs bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20 px-2 py-0.5 rounded-md"><Shield className="w-3 h-3"/>ת.ז: {c.insIdNumber}</span>}
                </div>
                {c.notes && <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{c.notes}</p>}
                <div className="flex items-center justify-between pt-2 border-t border-border-muted" onClick={e=>e.stopPropagation()}>
                  <span className="text-xs text-text-muted">{c.createdAt}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>openEdit(c)} className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-cyan/10 hover:text-accent-cyan text-text-muted transition-all"><Edit2 className="w-3.5 h-3.5"/></button>
                    <button onClick={()=>setDeleteTarget(c)} className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-red/10 hover:text-accent-red text-text-muted transition-all"><Trash2 className="w-3.5 h-3.5"/></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Customer form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={close}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-lg w-full space-y-5 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                {editingId ? <><Edit2 className="w-4 h-4 text-accent-cyan"/>עריכת לקוח</> : <><Plus className="w-4 h-4 text-accent-cyan"/>הוסף לקוח</>}
              </h2>
              <button onClick={close} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5"/></button>
            </div>

            <div className="space-y-3">
              <p className="text-xs font-semibold text-accent-cyan uppercase tracking-wider">פרטים בסיסיים</p>
              <div><label className="block text-xs text-text-muted mb-1.5">שם מלא *</label>
                <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="ישראל ישראלי" className={fc}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-text-muted mb-1.5">מייל</label>
                  <input type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="email@example.com" dir="ltr" className={fc}/></div>
                <div><label className="block text-xs text-text-muted mb-1.5">טלפון</label>
                  <input type="tel" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="050-0000000" dir="ltr" className={fc}/></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-text-muted mb-1.5">חברה / עסק</label>
                  <input value={form.company} onChange={e=>setForm(f=>({...f,company:e.target.value}))} placeholder="שם העסק" className={fc}/></div>
                <div><label className="block text-xs text-text-muted mb-1.5">סטטוס</label>
                  <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as CustomerStatus}))} className={fc}>
                    <option value="lead" className="bg-bg-card">ליד</option>
                    <option value="active" className="bg-bg-card">לקוח פעיל</option>
                    <option value="inactive" className="bg-bg-card">לא פעיל</option>
                  </select></div>
              </div>
              <div><label className="block text-xs text-text-muted mb-1.5">סוג שירות מבוקש</label>
                <select value={form.serviceType} onChange={e=>setForm(f=>({...f,serviceType:e.target.value}))} className={fc}>
                  <option value="" className="bg-bg-card">— בחר סוג שירות —</option>
                  {SERVICE_TYPES.map(s=><option key={s} value={s} className="bg-bg-card">{s}</option>)}
                </select></div>
              <div><label className="block text-xs text-text-muted mb-1.5">הערות</label>
                <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="הערות על הלקוח..." rows={2} className={`${fc} resize-none`}/></div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center">
                  <FileText className="w-3.5 h-3.5 text-accent-amber"/></div>
                <p className="text-xs font-semibold text-accent-amber">רשות המסים</p>
              </div>
              <div><label className="block text-xs text-text-muted mb-1.5">קוד קבוע</label>
                <input value={form.taxCode||''} onChange={e=>setForm(f=>({...f,taxCode:e.target.value}))} placeholder="קוד קבוע..." dir="ltr" className={fc}/></div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
                  <Shield className="w-3.5 h-3.5 text-accent-purple"/></div>
                <p className="text-xs font-semibold text-accent-purple">ביטוח לאומי</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-text-muted mb-1.5">שם משתמש</label>
                  <input value={form.insUsername||''} onChange={e=>setForm(f=>({...f,insUsername:e.target.value}))} placeholder="שם משתמש" dir="ltr" className={fc}/></div>
                <div><label className="block text-xs text-text-muted mb-1.5">מספר ת.ז</label>
                  <input value={form.insIdNumber||''} onChange={e=>setForm(f=>({...f,insIdNumber:e.target.value}))} placeholder="000000000" dir="ltr" className={fc}/></div>
              </div>
              <div><label className="block text-xs text-text-muted mb-1.5">סיסמה</label>
                <div className="relative">
                  <input type={showPass?'text':'password'} value={form.insPassword||''} onChange={e=>setForm(f=>({...f,insPassword:e.target.value}))} placeholder="••••••••" dir="ltr" className={`${fc} pl-10`}/>
                  <button type="button" onClick={()=>setShowPass(!showPass)} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                    {showPass?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button onClick={save} disabled={saving||!form.name.trim()}
                className="flex-1 bg-accent-cyan text-bg-base font-semibold text-sm py-2.5 rounded-xl hover:bg-accent-cyan/90 transition-all disabled:opacity-50">
                {saving?'שומר...':editingId?'שמור שינויים':'הוסף לקוח'}
              </button>
              <button onClick={close} className="bg-white/5 text-text-secondary text-sm px-5 py-2.5 rounded-xl hover:bg-white/8 transition-all">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setDeleteTarget(null)}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-sm w-full space-y-4 animate-fade-in" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-accent-red"/></div>
              <div><h3 className="text-sm font-bold text-text-primary">מחיקת לקוח</h3><p className="text-xs text-text-muted">פעולה זו אינה ניתנת לביטול</p></div>
            </div>
            <p className="text-sm text-text-secondary">האם למחוק את <span className="text-text-primary font-semibold">{deleteTarget.name}</span>?</p>
            <div className="flex items-center gap-2">
              <button onClick={del} className="flex-1 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 text-accent-red text-sm font-semibold py-2.5 rounded-xl transition-all">מחק</button>
              <button onClick={()=>setDeleteTarget(null)} className="flex-1 bg-white/5 text-text-secondary text-sm py-2.5 rounded-xl hover:bg-white/8 transition-all">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inquiries Tab ────────────────────────────────────────────────────────────

function InquiriesTab({ userId, customers, inquiries, setInquiries }: TabProps) {
  const [filterStatus, setFilterStatus] = useState<InquiryStatus|'all'>('all')
  const [filterCustomer, setFilterCustomer] = useState('all')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string|null>(null)
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customerId:'', topic:'', serviceType:'', priority:'normal' as Priority,
    description:'', dueDate:'', status:'open' as InquiryStatus,
  })

  const filtered = inquiries.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false
    if (filterCustomer !== 'all' && i.customerId !== filterCustomer) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return i.topic.toLowerCase().includes(q) || i.customerName.toLowerCase().includes(q)
    }
    return true
  })

  const openForm = () => {
    setForm({ customerId:'', topic:'', serviceType:'', priority:'normal', description:'', dueDate:'', status:'open' })
    setShowForm(true)
  }

  const saveInquiry = async () => {
    if (!form.customerId || !form.topic.trim()) return
    setSaving(true)
    const supabase = createClient()
    const cust = customers.find(c=>c.id===form.customerId)!
    const checklist: CheckItem[] = (SERVICE_CHECKLISTS[form.serviceType] || SERVICE_CHECKLISTS['אחר']).map(text => ({
      id: crypto.randomUUID(), text, done: false
    }))
    const ni: Inquiry = {
      id: crypto.randomUUID(),
      customerId: form.customerId,
      customerName: cust.name,
      topic: form.topic,
      serviceType: form.serviceType || cust.serviceType || '',
      status: form.status,
      priority: form.priority,
      description: form.description,
      openedAt: new Date().toISOString().slice(0,10),
      dueDate: form.dueDate,
      checklist,
      notes: [],
    }
    setInquiries(prev => [ni, ...prev])
    await supabase.from('crm_inquiries').upsert({ id:ni.id, user_id:userId, data:ni })
    setSaving(false); setShowForm(false)
  }

  const updateInquiry = async (inq: Inquiry) => {
    const supabase = createClient()
    setInquiries(prev => prev.map(i => i.id===inq.id ? inq : i))
    await supabase.from('crm_inquiries').upsert({ id:inq.id, user_id:userId, data:inq })
  }

  const toggleCheck = async (inq: Inquiry, itemId: string) => {
    const updated: Inquiry = {
      ...inq,
      checklist: inq.checklist.map(c => c.id===itemId ? {...c, done:!c.done, doneAt:!c.done?new Date().toISOString():undefined} : c)
    }
    await updateInquiry(updated)
  }

  const changeStatus = async (inq: Inquiry, status: InquiryStatus) => {
    const updated: Inquiry = { ...inq, status, ...(status==='done' ? {closedAt:new Date().toISOString().slice(0,10)} : {}) }
    await updateInquiry(updated)
  }

  const addNote = async (inq: Inquiry) => {
    if (!noteText.trim()) return
    const note: InquiryNote = { id:crypto.randomUUID(), text:noteText.trim(), createdAt:new Date().toISOString(), type:'note' }
    const updated: Inquiry = { ...inq, notes: [note, ...inq.notes] }
    await updateInquiry(updated)
    setNoteText('')
  }

  const deleteInquiry = async (id: string) => {
    const supabase = createClient()
    setInquiries(prev => prev.filter(i=>i.id!==id))
    await supabase.from('crm_inquiries').delete().eq('id',id).eq('user_id',userId)
  }

  const fc = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all"

  return (
    <div className="space-y-5 pb-10">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none"/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="חיפוש הפניה..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all"/>
        </div>
        <div className="flex gap-1">
          {(['all','open','in_progress','waiting','done'] as const).map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              className={`text-xs px-3 py-2 rounded-xl transition-all ${filterStatus===s?'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/20':'bg-white/5 text-text-muted border border-border-muted hover:text-text-secondary'}`}>
              {s==='all'?'הכל':inquiryStatusCfg[s].label}
            </button>
          ))}
        </div>
        <select value={filterCustomer} onChange={e=>setFilterCustomer(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none">
          <option value="all" className="bg-bg-card">כל הלקוחות</option>
          {customers.map(c=><option key={c.id} value={c.id} className="bg-bg-card">{c.name}</option>)}
        </select>
        <button onClick={openForm}
          className="flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-2.5 rounded-xl transition-all">
          <Plus className="w-3.5 h-3.5"/> הפניה חדשה
        </button>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 text-xs text-text-muted">
        {(['open','in_progress','waiting','done'] as const).map(s=>{
          const cnt = inquiries.filter(i=>i.status===s).length
          const cfg = inquiryStatusCfg[s]
          return (
            <span key={s} className={`flex items-center gap-1 px-3 py-1.5 rounded-lg border ${cfg.bg} ${cfg.border} ${cfg.color}`}>
              <cfg.icon className="w-3 h-3"/>{cfg.label}: {cnt}
            </span>
          )
        })}
      </div>

      {/* Inquiry list */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-border-muted">
          <ClipboardList className="w-10 h-10 text-text-muted mx-auto mb-3"/>
          <p className="text-sm text-text-muted">{inquiries.length===0?'אין הפניות עדיין — פתח הפניה ראשונה':'לא נמצאו הפניות'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(inq => {
            const st = inquiryStatusCfg[inq.status]
            const pr = priorityCfg[inq.priority]
            const doneCount = inq.checklist.filter(c=>c.done).length
            const totalCheck = inq.checklist.length
            const pct = totalCheck > 0 ? Math.round(doneCount/totalCheck*100) : 0
            const isExpanded = expandedId === inq.id
            const isOverdue = inq.dueDate && new Date(inq.dueDate) < new Date() && inq.status !== 'done'
            return (
              <div key={inq.id} className={`glass-card rounded-2xl border transition-all ${isOverdue?'border-accent-red/30':'border-border-muted'} hover:border-accent-cyan/20`}>
                {/* Header row */}
                <div className="p-4 flex items-start gap-3 cursor-pointer" onClick={()=>setExpandedId(isExpanded?null:inq.id)}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${st.bg} border ${st.border}`}>
                    <st.icon className={`w-4 h-4 ${st.color}`}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-text-primary">{inq.topic}</p>
                      <span className={`text-xs ${pr.color}`}>● {pr.label}</span>
                      {isOverdue && <span className="flex items-center gap-1 text-xs text-accent-red"><AlertTriangle className="w-3 h-3"/>חריג</span>}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-text-muted flex items-center gap-1"><Users className="w-3 h-3"/>{inq.customerName}</span>
                      {inq.serviceType && <span className="text-xs text-text-muted flex items-center gap-1"><Briefcase className="w-3 h-3"/>{inq.serviceType}</span>}
                      {inq.dueDate && <span className={`text-xs flex items-center gap-1 ${isOverdue?'text-accent-red':'text-text-muted'}`}><CalendarDays className="w-3 h-3"/>יעד: {inq.dueDate}</span>}
                    </div>
                    {totalCheck > 0 && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-cyan rounded-full transition-all" style={{width:`${pct}%`}}/>
                        </div>
                        <span className="text-xs text-text-muted shrink-0">{doneCount}/{totalCheck}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2.5 py-1 rounded-lg border ${st.bg} ${st.color} ${st.border}`}>{st.label}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-text-muted"/> : <ChevronDown className="w-4 h-4 text-text-muted"/>}
                  </div>
                </div>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="border-t border-border-muted p-4 space-y-4">
                    {/* Status changer */}
                    <div>
                      <p className="text-xs text-text-muted mb-2 font-medium">שינוי סטטוס</p>
                      <div className="flex gap-2 flex-wrap">
                        {(['open','in_progress','waiting','done'] as const).map(s=>{
                          const cfg = inquiryStatusCfg[s]
                          return (
                            <button key={s} onClick={()=>changeStatus(inq,s)}
                              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl border transition-all ${inq.status===s?`${cfg.bg} ${cfg.color} ${cfg.border}`:'bg-white/5 border-border-muted text-text-muted hover:text-text-secondary'}`}>
                              <cfg.icon className="w-3 h-3"/>{cfg.label}
                            </button>
                          )
                        })}
                        <button onClick={()=>deleteInquiry(inq.id)} className="mr-auto flex items-center gap-1 text-xs text-text-muted hover:text-accent-red px-2 py-1.5 rounded-xl hover:bg-accent-red/5 transition-all">
                          <Trash2 className="w-3.5 h-3.5"/>מחק
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    {inq.description && (
                      <div>
                        <p className="text-xs text-text-muted mb-1 font-medium">תיאור</p>
                        <p className="text-xs text-text-secondary leading-relaxed">{inq.description}</p>
                      </div>
                    )}

                    {/* Checklist */}
                    {inq.checklist.length > 0 && (
                      <div>
                        <p className="text-xs text-text-muted mb-2 font-medium flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-accent-cyan"/>רשימת משימות — {pct}% הושלם
                        </p>
                        <div className="space-y-1.5">
                          {inq.checklist.map(item => (
                            <button key={item.id} onClick={()=>toggleCheck(inq,item.id)}
                              className={`w-full flex items-center gap-2.5 p-2.5 rounded-xl border text-right transition-all ${item.done?'bg-accent-green/5 border-accent-green/20 opacity-70':'bg-white/3 border-border-muted hover:border-accent-cyan/20'}`}>
                              {item.done
                                ? <CheckSquare className="w-4 h-4 text-accent-green shrink-0"/>
                                : <Square className="w-4 h-4 text-text-muted shrink-0"/>}
                              <span className={`text-xs ${item.done?'line-through text-text-muted':'text-text-secondary'}`}>{item.text}</span>
                              {item.done && item.doneAt && (
                                <span className="mr-auto text-xs text-text-muted shrink-0">{new Date(item.doneAt).toLocaleDateString('he-IL')}</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <p className="text-xs text-text-muted mb-2 font-medium flex items-center gap-1.5">
                        <StickyNote className="w-3.5 h-3.5 text-accent-purple"/>הערות ועדכונים
                      </p>
                      <div className="flex gap-2 mb-3">
                        <input value={noteText} onChange={e=>setNoteText(e.target.value)}
                          onKeyDown={e=>{if(e.key==='Enter')addNote(inq)}}
                          placeholder="הוסף הערה או עדכון..."
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all"/>
                        <button onClick={()=>addNote(inq)}
                          className="bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs px-3 rounded-xl hover:bg-accent-cyan/20 transition-all">
                          הוסף
                        </button>
                      </div>
                      {inq.notes.length > 0 && (
                        <div className="space-y-1.5">
                          {inq.notes.map(n => (
                            <div key={n.id} className="flex items-start gap-2 p-2.5 rounded-xl bg-white/3 border border-border-muted">
                              <MessageSquare className="w-3.5 h-3.5 text-accent-purple mt-0.5 shrink-0"/>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs text-text-secondary">{n.text}</p>
                                <p className="text-xs text-text-muted mt-0.5">{new Date(n.createdAt).toLocaleDateString('he-IL')} {new Date(n.createdAt).toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* New inquiry modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowForm(false)}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-lg w-full space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2"><Plus className="w-4 h-4 text-accent-cyan"/>הפניה חדשה</h2>
              <button onClick={()=>setShowForm(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5"/></button>
            </div>

            <div><label className="block text-xs text-text-muted mb-1.5">לקוח *</label>
              <select value={form.customerId} onChange={e=>setForm(f=>({...f,customerId:e.target.value,serviceType:customers.find(c=>c.id===e.target.value)?.serviceType||''}))} className={fc}>
                <option value="" className="bg-bg-card">— בחר לקוח —</option>
                {customers.map(c=><option key={c.id} value={c.id} className="bg-bg-card">{c.name}{c.company?` — ${c.company}`:''}</option>)}
              </select></div>

            <div><label className="block text-xs text-text-muted mb-1.5">נושא הפניה *</label>
              <input value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))} placeholder="תאר בקצרה את הפניה" className={fc}/></div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-text-muted mb-1.5">סוג שירות</label>
                <select value={form.serviceType} onChange={e=>setForm(f=>({...f,serviceType:e.target.value}))} className={fc}>
                  <option value="" className="bg-bg-card">— בחר —</option>
                  {SERVICE_TYPES.map(s=><option key={s} value={s} className="bg-bg-card">{s}</option>)}
                </select></div>
              <div><label className="block text-xs text-text-muted mb-1.5">עדיפות</label>
                <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value as Priority}))} className={fc}>
                  <option value="urgent" className="bg-bg-card">דחוף</option>
                  <option value="high" className="bg-bg-card">גבוה</option>
                  <option value="normal" className="bg-bg-card">רגיל</option>
                  <option value="low" className="bg-bg-card">נמוך</option>
                </select></div>
            </div>

            <div><label className="block text-xs text-text-muted mb-1.5">תאריך יעד לסיום</label>
              <input type="date" value={form.dueDate} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} className={fc}/></div>

            <div><label className="block text-xs text-text-muted mb-1.5">תיאור מפורט</label>
              <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="פרטים נוספים..." rows={3} className={`${fc} resize-none`}/></div>

            {form.serviceType && (
              <div className="p-3 rounded-xl border border-accent-cyan/20 bg-accent-cyan/5">
                <p className="text-xs text-accent-cyan mb-2 font-medium flex items-center gap-1.5"><CheckSquare className="w-3.5 h-3.5"/>צ׳קליסט שייפתח אוטומטית:</p>
                <ul className="space-y-1">
                  {(SERVICE_CHECKLISTS[form.serviceType]||SERVICE_CHECKLISTS['אחר']).map((item,i)=>(
                    <li key={i} className="text-xs text-text-secondary flex items-center gap-1.5"><Square className="w-3 h-3 text-text-muted shrink-0"/>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={saveInquiry} disabled={saving||!form.customerId||!form.topic.trim()}
                className="flex-1 bg-accent-cyan text-bg-base font-semibold text-sm py-2.5 rounded-xl hover:bg-accent-cyan/90 transition-all disabled:opacity-50">
                {saving?'שומר...':'פתח הפניה'}
              </button>
              <button onClick={()=>setShowForm(false)} className="bg-white/5 text-text-secondary text-sm px-5 py-2.5 rounded-xl hover:bg-white/8 transition-all">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Deals Tab ────────────────────────────────────────────────────────────────

function DealsTab({ userId, customers, deals, setDeals, payments, setPayments }: TabProps) {
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<DealStatus|'all'>('all')
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    customerId:'', title:'', amount:'', frequency:'monthly' as 'monthly'|'yearly'|'one-time',
    startDate:new Date().toISOString().slice(0,10), endDate:'', serviceType:'', notes:'', status:'active' as DealStatus,
  })
  const [editingId, setEditingId] = useState<string|null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string|null>(null)

  const fc = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all"

  const openAdd = () => {
    setEditingId(null)
    setForm({ customerId:'',title:'',amount:'',frequency:'monthly',startDate:new Date().toISOString().slice(0,10),endDate:'',serviceType:'',notes:'',status:'active' })
    setShowForm(true)
  }

  const openEdit = (d: Deal) => {
    setEditingId(d.id)
    setForm({ customerId:d.customerId, title:d.title, amount:String(d.amount), frequency:d.frequency,
      startDate:d.startDate, endDate:d.endDate||'', serviceType:d.serviceType, notes:d.notes, status:d.status })
    setShowForm(true)
  }

  const saveDeal = async () => {
    if (!form.customerId || !form.title.trim() || !form.amount) return
    setSaving(true)
    const supabase = createClient()
    const cust = customers.find(c=>c.id===form.customerId)!
    if (editingId) {
      const updated: Deal = { id:editingId, customerId:form.customerId, customerName:cust.name,
        title:form.title, amount:parseFloat(form.amount)||0, frequency:form.frequency,
        startDate:form.startDate, endDate:form.endDate||undefined, status:form.status,
        serviceType:form.serviceType, notes:form.notes }
      setDeals(prev => prev.map(d => d.id===editingId ? updated : d))
      await supabase.from('crm_deals').upsert({ id:updated.id, user_id:userId, data:updated })
    } else {
      const nd: Deal = { id:crypto.randomUUID(), customerId:form.customerId, customerName:cust.name,
        title:form.title, amount:parseFloat(form.amount)||0, frequency:form.frequency,
        startDate:form.startDate, endDate:form.endDate||undefined, status:form.status,
        serviceType:form.serviceType, notes:form.notes }
      setDeals(prev => [nd, ...prev])
      await supabase.from('crm_deals').upsert({ id:nd.id, user_id:userId, data:nd })
      // Auto-generate pending payments for monthly deals (next 3 months)
      if (nd.frequency === 'monthly') {
        const today = new Date()
        const newPayments: Payment[] = []
        for (let m=0; m<3; m++) {
          const d = new Date(today.getFullYear(), today.getMonth()+m, 1)
          const monthKey = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
          const p: Payment = { id:crypto.randomUUID(), dealId:nd.id, customerId:nd.customerId,
            customerName:nd.customerName, dealTitle:nd.title, month:monthKey,
            amount:nd.amount, status:'pending', notes:'' }
          newPayments.push(p)
          await supabase.from('crm_payments').upsert({ id:p.id, user_id:userId, data:p })
        }
        setPayments(prev => [...newPayments, ...prev])
      }
    }
    setSaving(false); setShowForm(false)
  }

  const delDeal = async (id: string) => {
    const supabase = createClient()
    setDeals(prev => prev.filter(d=>d.id!==id))
    await supabase.from('crm_deals').delete().eq('id',id).eq('user_id',userId)
    setDeleteTarget(null)
  }

  const filtered = deals.filter(d => filterStatus==='all' || d.status===filterStatus)
  const freqLabel: Record<string,string> = { monthly:'חודשי', yearly:'שנתי', 'one-time':'חד פעמי' }

  return (
    <div className="space-y-5 pb-10">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(['all','active','paused','completed','cancelled'] as const).map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              className={`text-xs px-3 py-2 rounded-xl transition-all border ${filterStatus===s?'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/20':'bg-white/5 text-text-muted border-border-muted hover:text-text-secondary'}`}>
              {s==='all'?'הכל':dealStatusCfg[s].label}
            </button>
          ))}
        </div>
        <button onClick={openAdd}
          className="mr-auto flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-2.5 rounded-xl transition-all">
          <Plus className="w-3.5 h-3.5"/> עסקה חדשה
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-border-muted">
          <Handshake className="w-10 h-10 text-text-muted mx-auto mb-3"/>
          <p className="text-sm text-text-muted">{deals.length===0?'אין עסקאות עדיין — הוסף עסקה ראשונה':'לא נמצאו עסקאות'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(deal => {
            const st = dealStatusCfg[deal.status]
            const dealPayments = payments.filter(p=>p.dealId===deal.id)
            const paidCount = dealPayments.filter(p=>p.status==='paid').length
            const overdueCount = dealPayments.filter(p=>p.status==='overdue').length
            return (
              <div key={deal.id} className="glass-card rounded-xl p-5 space-y-3 border border-border-muted hover:border-accent-cyan/20 transition-all">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{deal.title}</p>
                    <span className="flex items-center gap-1 text-xs text-text-muted mt-0.5"><Users className="w-3 h-3"/>{deal.customerName}</span>
                  </div>
                  <span className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border ${st.bg} ${st.color} ${st.border}`}>{st.label}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1 text-sm font-bold text-accent-green"><DollarSign className="w-3.5 h-3.5"/>{fmt(deal.amount)}</span>
                  <span className="text-xs text-text-muted bg-white/5 border border-border-muted px-2 py-1 rounded-lg">{freqLabel[deal.frequency]}</span>
                  {deal.serviceType && <span className="text-xs text-accent-purple bg-accent-purple/10 border border-accent-purple/20 px-2 py-1 rounded-lg">{deal.serviceType}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs text-text-muted">
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3"/>התחלה: {deal.startDate}</span>
                  {deal.endDate && <span>סיום: {deal.endDate}</span>}
                </div>
                {dealPayments.length > 0 && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-accent-green">✓ {paidCount} שולמו</span>
                    {overdueCount > 0 && <span className="text-accent-red">⚠ {overdueCount} באיחור</span>}
                  </div>
                )}
                {deal.notes && <p className="text-xs text-text-muted line-clamp-2">{deal.notes}</p>}
                <div className="flex items-center gap-2 pt-2 border-t border-border-muted">
                  <button onClick={()=>openEdit(deal)} className="text-xs flex items-center gap-1 text-text-muted hover:text-accent-cyan px-2 py-1.5 rounded-lg hover:bg-accent-cyan/5 transition-all"><Edit2 className="w-3 h-3"/>עריכה</button>
                  <button onClick={()=>setDeleteTarget(deal.id)} className="text-xs flex items-center gap-1 text-text-muted hover:text-accent-red px-2 py-1.5 rounded-lg hover:bg-accent-red/5 transition-all"><Trash2 className="w-3 h-3"/>מחיקה</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Deal form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowForm(false)}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-lg w-full space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2"><Handshake className="w-4 h-4 text-accent-cyan"/>{editingId?'עריכת עסקה':'עסקה חדשה'}</h2>
              <button onClick={()=>setShowForm(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5"/></button>
            </div>

            <div><label className="block text-xs text-text-muted mb-1.5">לקוח *</label>
              <select value={form.customerId} onChange={e=>setForm(f=>({...f,customerId:e.target.value}))} className={fc}>
                <option value="" className="bg-bg-card">— בחר לקוח —</option>
                {customers.map(c=><option key={c.id} value={c.id} className="bg-bg-card">{c.name}{c.company?` — ${c.company}`:''}</option>)}
              </select></div>

            <div><label className="block text-xs text-text-muted mb-1.5">שם העסקה / שירות *</label>
              <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder='לדוגמה: "הנהלת חשבונות חודשית"' className={fc}/></div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-text-muted mb-1.5">סכום (₪) *</label>
                <input type="number" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="0" dir="ltr" className={fc}/></div>
              <div><label className="block text-xs text-text-muted mb-1.5">תדירות</label>
                <select value={form.frequency} onChange={e=>setForm(f=>({...f,frequency:e.target.value as any}))} className={fc}>
                  <option value="monthly" className="bg-bg-card">חודשי</option>
                  <option value="yearly" className="bg-bg-card">שנתי</option>
                  <option value="one-time" className="bg-bg-card">חד פעמי</option>
                </select></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-text-muted mb-1.5">תאריך התחלה</label>
                <input type="date" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} className={fc}/></div>
              <div><label className="block text-xs text-text-muted mb-1.5">תאריך סיום (אופציונלי)</label>
                <input type="date" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} className={fc}/></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-xs text-text-muted mb-1.5">סוג שירות</label>
                <select value={form.serviceType} onChange={e=>setForm(f=>({...f,serviceType:e.target.value}))} className={fc}>
                  <option value="" className="bg-bg-card">— בחר —</option>
                  {SERVICE_TYPES.map(s=><option key={s} value={s} className="bg-bg-card">{s}</option>)}
                </select></div>
              <div><label className="block text-xs text-text-muted mb-1.5">סטטוס</label>
                <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value as DealStatus}))} className={fc}>
                  <option value="active" className="bg-bg-card">פעיל</option>
                  <option value="paused" className="bg-bg-card">מושהה</option>
                  <option value="completed" className="bg-bg-card">הושלם</option>
                  <option value="cancelled" className="bg-bg-card">בוטל</option>
                </select></div>
            </div>

            <div><label className="block text-xs text-text-muted mb-1.5">הערות</label>
              <textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} rows={2} className={`${fc} resize-none`}/></div>

            {!editingId && form.frequency==='monthly' && (
              <p className="text-xs text-accent-cyan bg-accent-cyan/5 border border-accent-cyan/20 rounded-xl p-3">
                ✓ יישמרו אוטומטית 3 תשלומים ממתינים עבור 3 החודשים הקרובים
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={saveDeal} disabled={saving||!form.customerId||!form.title.trim()||!form.amount}
                className="flex-1 bg-accent-cyan text-bg-base font-semibold text-sm py-2.5 rounded-xl hover:bg-accent-cyan/90 transition-all disabled:opacity-50">
                {saving?'שומר...':editingId?'שמור שינויים':'הוסף עסקה'}
              </button>
              <button onClick={()=>setShowForm(false)} className="bg-white/5 text-text-secondary text-sm px-5 py-2.5 rounded-xl hover:bg-white/8 transition-all">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setDeleteTarget(null)}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-sm w-full space-y-4 animate-fade-in" onClick={e=>e.stopPropagation()}>
            <p className="text-sm text-text-secondary">האם למחוק עסקה זו?</p>
            <div className="flex gap-2">
              <button onClick={()=>delDeal(deleteTarget)} className="flex-1 bg-accent-red/10 border border-accent-red/20 text-accent-red text-sm font-semibold py-2.5 rounded-xl transition-all hover:bg-accent-red/20">מחק</button>
              <button onClick={()=>setDeleteTarget(null)} className="flex-1 bg-white/5 text-text-secondary text-sm py-2.5 rounded-xl hover:bg-white/8 transition-all">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Payments Tab ─────────────────────────────────────────────────────────────

function PaymentsTab({ userId, customers, deals, payments, setPayments }: TabProps) {
  const [filterCustomer, setFilterCustomer] = useState('all')
  const [filterStatus, setFilterStatus] = useState<PaymentStatus|'all'>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [addForm, setAddForm] = useState({ dealId:'', month: new Date().toISOString().slice(0,7), amount:'', notes:'' })

  const supabase = createClient()

  const setStatus = async (p: Payment, status: PaymentStatus) => {
    const updated: Payment = { ...p, status, ...(status==='paid' ? {paidAt:new Date().toISOString().slice(0,10)} : {paidAt:undefined}) }
    setPayments(prev => prev.map(x => x.id===p.id ? updated : x))
    await supabase.from('crm_payments').upsert({ id:updated.id, user_id:userId, data:updated })
  }

  const deletePayment = async (id: string) => {
    setPayments(prev => prev.filter(p=>p.id!==id))
    await supabase.from('crm_payments').delete().eq('id',id).eq('user_id',userId)
  }

  const addPayment = async () => {
    if (!addForm.dealId || !addForm.month) return
    setSaving(true)
    const deal = deals.find(d=>d.id===addForm.dealId)!
    const np: Payment = {
      id: crypto.randomUUID(), dealId:deal.id, customerId:deal.customerId,
      customerName:deal.customerName, dealTitle:deal.title,
      month:addForm.month, amount:parseFloat(addForm.amount)||deal.amount,
      status:'pending', notes:addForm.notes,
    }
    setPayments(prev => [np, ...prev])
    await supabase.from('crm_payments').upsert({ id:np.id, user_id:userId, data:np })
    setSaving(false); setShowAddModal(false)
    setAddForm({ dealId:'', month:new Date().toISOString().slice(0,7), amount:'', notes:'' })
  }

  const filtered = payments.filter(p => {
    if (filterCustomer !== 'all' && p.customerId !== filterCustomer) return false
    if (filterStatus !== 'all' && p.status !== filterStatus) return false
    return true
  })

  // Group by month for display
  const byMonth = useMemo(() => {
    const map: Record<string, Payment[]> = {}
    filtered.forEach(p => {
      if (!map[p.month]) map[p.month] = []
      map[p.month].push(p)
    })
    return Object.entries(map).sort((a,b) => b[0].localeCompare(a[0]))
  }, [filtered])

  const totalPaid    = payments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0)
  const totalPending = payments.filter(p=>p.status==='pending').reduce((s,p)=>s+p.amount,0)
  const totalOverdue = payments.filter(p=>p.status==='overdue').reduce((s,p)=>s+p.amount,0)

  const fc = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all"

  return (
    <div className="space-y-5 pb-10">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4 border border-accent-green/20 bg-accent-green/5">
          <p className="text-xs text-text-muted mb-1">שולם</p>
          <p className="text-lg font-bold text-accent-green">{fmt(totalPaid)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-accent-amber/20 bg-accent-amber/5">
          <p className="text-xs text-text-muted mb-1">ממתין</p>
          <p className="text-lg font-bold text-accent-amber">{fmt(totalPending)}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-accent-red/20 bg-accent-red/5">
          <p className="text-xs text-text-muted mb-1">באיחור</p>
          <p className="text-lg font-bold text-accent-red">{fmt(totalOverdue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(['all','paid','pending','overdue'] as const).map(s=>(
            <button key={s} onClick={()=>setFilterStatus(s)}
              className={`text-xs px-3 py-2 rounded-xl transition-all border ${filterStatus===s?'bg-accent-cyan/20 text-accent-cyan border-accent-cyan/20':'bg-white/5 text-text-muted border-border-muted hover:text-text-secondary'}`}>
              {s==='all'?'הכל':paymentStatusCfg[s].label}
            </button>
          ))}
        </div>
        <select value={filterCustomer} onChange={e=>setFilterCustomer(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none">
          <option value="all" className="bg-bg-card">כל הלקוחות</option>
          {customers.map(c=><option key={c.id} value={c.id} className="bg-bg-card">{c.name}</option>)}
        </select>
        <button onClick={()=>setShowAddModal(true)}
          className="mr-auto flex items-center gap-1.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/20 text-accent-cyan text-xs px-3 py-2.5 rounded-xl transition-all">
          <Plus className="w-3.5 h-3.5"/> הוסף תשלום
        </button>
      </div>

      {byMonth.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center border border-border-muted">
          <CreditCard className="w-10 h-10 text-text-muted mx-auto mb-3"/>
          <p className="text-sm text-text-muted">{payments.length===0?'אין תשלומים — הוסף עסקה ותשלומים ייווצרו אוטומטית':'לא נמצאו תשלומים'}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {byMonth.map(([month, monthPayments]) => {
            const [y, m] = month.split('-')
            const monthLabel = `${MONTHS_HE[parseInt(m)-1]} ${y}`
            const monthTotal = monthPayments.reduce((s,p)=>s+p.amount,0)
            const monthPaid = monthPayments.filter(p=>p.status==='paid').reduce((s,p)=>s+p.amount,0)
            return (
              <div key={month} className="glass-card rounded-2xl border border-border-muted overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-white/3 border-b border-border-muted">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-accent-cyan"/>
                    <h3 className="text-sm font-semibold text-text-primary">{monthLabel}</h3>
                    <span className="text-xs text-text-muted">{monthPayments.length} תשלומים</span>
                  </div>
                  <div className="text-xs text-text-muted">
                    שולם: <span className="text-accent-green font-semibold">{fmt(monthPaid)}</span>
                    {' / '}סה״כ: <span className="font-semibold text-text-secondary">{fmt(monthTotal)}</span>
                  </div>
                </div>
                <div className="divide-y divide-border-muted">
                  {monthPayments.map(p => {
                    const st = paymentStatusCfg[p.status]
                    return (
                      <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-text-primary truncate">{p.customerName}</p>
                          <p className="text-xs text-text-muted truncate">{p.dealTitle}</p>
                        </div>
                        <span className="text-sm font-bold text-text-primary shrink-0">{fmt(p.amount)}</span>
                        {/* Status buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          {(['paid','pending','overdue'] as const).map(s=>(
                            <button key={s} onClick={()=>setStatus(p,s)}
                              className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${p.status===s?`${paymentStatusCfg[s].bg} ${paymentStatusCfg[s].color} ${paymentStatusCfg[s].border}`:'bg-white/5 border-border-muted text-text-muted hover:text-text-secondary'}`}>
                              {paymentStatusCfg[s].label}
                            </button>
                          ))}
                          <button onClick={()=>deletePayment(p.id)} className="p-1.5 text-text-muted hover:text-accent-red rounded-lg hover:bg-accent-red/5 transition-all">
                            <Trash2 className="w-3.5 h-3.5"/>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={()=>setShowAddModal(false)}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-sm w-full space-y-4 animate-fade-in" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2"><CreditCard className="w-4 h-4 text-accent-cyan"/>הוסף תשלום ידני</h2>
              <button onClick={()=>setShowAddModal(false)} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5"/></button>
            </div>
            <div><label className="block text-xs text-text-muted mb-1.5">עסקה *</label>
              <select value={addForm.dealId} onChange={e=>setAddForm(f=>({...f,dealId:e.target.value,amount:String(deals.find(d=>d.id===e.target.value)?.amount||'')}))} className={fc}>
                <option value="" className="bg-bg-card">— בחר עסקה —</option>
                {deals.map(d=><option key={d.id} value={d.id} className="bg-bg-card">{d.customerName} — {d.title}</option>)}
              </select></div>
            <div><label className="block text-xs text-text-muted mb-1.5">חודש *</label>
              <input type="month" value={addForm.month} onChange={e=>setAddForm(f=>({...f,month:e.target.value}))} className={fc}/></div>
            <div><label className="block text-xs text-text-muted mb-1.5">סכום (₪)</label>
              <input type="number" value={addForm.amount} onChange={e=>setAddForm(f=>({...f,amount:e.target.value}))} placeholder="אוטומטי לפי עסקה" dir="ltr" className={fc}/></div>
            <div><label className="block text-xs text-text-muted mb-1.5">הערה</label>
              <input value={addForm.notes} onChange={e=>setAddForm(f=>({...f,notes:e.target.value}))} className={fc}/></div>
            <div className="flex gap-2">
              <button onClick={addPayment} disabled={saving||!addForm.dealId||!addForm.month}
                className="flex-1 bg-accent-cyan text-bg-base font-semibold text-sm py-2.5 rounded-xl hover:bg-accent-cyan/90 transition-all disabled:opacity-50">
                {saving?'שומר...':'הוסף'}
              </button>
              <button onClick={()=>setShowAddModal(false)} className="bg-white/5 text-text-secondary text-sm px-5 py-2.5 rounded-xl hover:bg-white/8 transition-all">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatMonth(m: string) {
  const [y, mo] = m.split('-')
  return `${MONTHS_HE[parseInt(mo)-1]} ${y}`
}
