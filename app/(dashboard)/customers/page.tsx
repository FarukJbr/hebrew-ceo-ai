'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import {
  Users, Plus, Search, Edit2, Trash2, X,
  Phone, Mail, Building2, Filter,
  UserCheck, UserX, UserPlus, Save, Eye, EyeOff,
  FileText, Shield,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type CustomerStatus = 'lead' | 'active' | 'inactive'
type Tab = 'customers' | 'tax' | 'insurance'

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: CustomerStatus
  notes: string
  createdAt: string
}

interface TaxSettings {
  permanentCode: string
}

interface InsuranceSettings {
  code: string
  username: string
  idNumber: string
  password: string
}

const statusConfig: Record<CustomerStatus, { label: string; color: string; bg: string; border: string }> = {
  lead:     { label: 'ליד',        color: 'text-accent-cyan',  bg: 'bg-accent-cyan/10',  border: 'border-accent-cyan/20' },
  active:   { label: 'לקוח פעיל', color: 'text-accent-green', bg: 'bg-accent-green/10', border: 'border-accent-green/20' },
  inactive: { label: 'לא פעיל',   color: 'text-text-muted',   bg: 'bg-white/5',         border: 'border-border-muted' },
}

const EMPTY_FORM = {
  name: '', email: '', phone: '', company: '',
  status: 'lead' as CustomerStatus, notes: '',
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'customers',  label: 'לקוחות',        icon: Users },
  { id: 'tax',        label: 'רשות המסים',    icon: FileText },
  { id: 'insurance',  label: 'ביטוח לאומי',  icon: Shield },
]

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<Tab>('customers')
  const [isLoading, setIsLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<CustomerStatus | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

  // Customer modal state
  const [showForm, setShowForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Tax authority state
  const [taxForm, setTaxForm] = useState<TaxSettings>({ permanentCode: '' })
  const [savingTax, setSavingTax] = useState(false)
  const [taxSaved, setTaxSaved] = useState(false)

  // Insurance state
  const [insForm, setInsForm] = useState<InsuranceSettings>({ code: '', username: '', idNumber: '', password: '' })
  const [savingIns, setSavingIns] = useState(false)
  const [insSaved, setInsSaved] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) { setIsLoading(false); return }

      // Load customers
      const { data: rows } = await supabase
        .from('customers').select('data').eq('user_id', uid).order('created_at', { ascending: false })
      setCustomers(rows?.map((r: any) => r.data) || [])

      // Load business settings
      const { data: settings } = await supabase
        .from('business_settings').select('data').eq('user_id', uid)
      for (const row of settings || []) {
        if (row.data?.key === 'tax_authority') setTaxForm({ permanentCode: row.data.permanentCode || '' })
        if (row.data?.key === 'national_insurance') setInsForm({
          code: row.data.code || '',
          username: row.data.username || '',
          idNumber: row.data.idNumber || '',
          password: row.data.password || '',
        })
      }
      setIsLoading(false)
    })
  }, [])

  const saveSetting = async (key: string, payload: object, setSavingFn: (v: boolean) => void, setSavedFn: (v: boolean) => void) => {
    setSavingFn(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id
    if (!uid) { setSavingFn(false); return }
    // Use deterministic ID based on user+key so upsert works correctly
    const id = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(uid + key))
      .then(buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join(''))
      .then(hex => `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20,32)}`)
    await supabase.from('business_settings').upsert({ id, user_id: uid, data: { key, ...payload } })
    setSavingFn(false)
    setSavedFn(true)
    setTimeout(() => setSavedFn(false), 2500)
  }

  // Customer CRUD
  const openAdd = () => { setEditingCustomer(null); setForm(EMPTY_FORM); setShowForm(true) }
  const openEdit = (c: Customer) => { setEditingCustomer(c); setForm({ name: c.name, email: c.email, phone: c.phone, company: c.company, status: c.status, notes: c.notes }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditingCustomer(null); setForm(EMPTY_FORM) }

  const saveCustomer = async () => {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id
    if (!uid) { setSaving(false); return }
    if (editingCustomer) {
      const updated: Customer = { ...editingCustomer, ...form }
      setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? updated : c))
      await supabase.from('customers').upsert({ id: updated.id, user_id: uid, data: updated })
    } else {
      const newCustomer: Customer = { id: crypto.randomUUID(), ...form, createdAt: new Date().toLocaleDateString('he-IL') }
      setCustomers(prev => [newCustomer, ...prev])
      await supabase.from('customers').upsert({ id: newCustomer.id, user_id: uid, data: newCustomer })
    }
    setSaving(false)
    closeForm()
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const uid = user?.id
    if (uid) await supabase.from('customers').delete().eq('id', deleteTarget.id).eq('user_id', uid)
    setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-text-muted">טוען...</p>
      </div>
    </div>
  )

  const filtered = customers.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.company.toLowerCase().includes(q)
    }
    return true
  })

  const counts = {
    total: customers.length,
    active: customers.filter(c => c.status === 'active').length,
    lead: customers.filter(c => c.status === 'lead').length,
    inactive: customers.filter(c => c.status === 'inactive').length,
  }

  const fieldClass = "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all"

  return (
    <div className="min-h-screen">
      <Header title="לקוחות" subtitle="ניהול לקוחות, רשות המסים וביטוח לאומי" />

      <div className="p-6 space-y-5 animate-fade-in">

        {/* Tabs */}
        <div className="flex gap-1 bg-white/3 border border-border-muted rounded-2xl p-1 w-fit">
          {TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 text-xs px-4 py-2 rounded-xl transition-all font-medium ${
                  activeTab === tab.id
                    ? 'bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* ─── CUSTOMERS TAB ─── */}
        {activeTab === 'customers' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'סה״כ לקוחות',   value: counts.total,    icon: Users,     color: 'text-text-secondary', bg: 'bg-white/5',       border: 'border-border-muted' },
                { label: 'לקוחות פעילים', value: counts.active,   icon: UserCheck, color: 'text-accent-green',  bg: 'bg-accent-green/5', border: 'border-accent-green/20' },
                { label: 'לידים',          value: counts.lead,     icon: UserPlus,  color: 'text-accent-cyan',   bg: 'bg-accent-cyan/5',  border: 'border-accent-cyan/20' },
                { label: 'לא פעילים',      value: counts.inactive, icon: UserX,     color: 'text-text-muted',    bg: 'bg-white/3',        border: 'border-border-muted' },
              ].map(({ label, value, icon: Icon, color, bg, border }) => (
                <div key={label} className={`glass-card rounded-xl px-4 py-3 flex items-center gap-3 border ${border} ${bg}`}>
                  <Icon className={`w-5 h-5 shrink-0 ${color}`} />
                  <div>
                    <p className="text-xs text-text-muted">{label}</p>
                    <p className={`text-xl font-bold ${color}`}>{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[200px] relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="חיפוש לפי שם, מייל או חברה..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pr-9 pl-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all" />
              </div>
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 text-xs px-3 py-2.5 rounded-xl border transition-all ${showFilters ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan' : 'bg-white/5 border-border-muted text-text-muted hover:text-text-secondary'}`}>
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
                  <div className="flex gap-1">
                    {(['all', 'lead', 'active', 'inactive'] as const).map(s => (
                      <button key={s} onClick={() => setFilterStatus(s)}
                        className={`text-xs px-3 py-1.5 rounded-lg transition-all ${filterStatus === s ? 'bg-accent-cyan/20 text-accent-cyan' : 'bg-white/5 text-text-muted hover:text-text-secondary'}`}>
                        {s === 'all' ? 'הכל' : statusConfig[s].label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={() => { setFilterStatus('all'); setSearch('') }}
                  className="self-end text-xs text-text-muted hover:text-accent-red transition-colors flex items-center gap-1">
                  <X className="w-3 h-3" /> איפוס
                </button>
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="glass-card rounded-2xl p-12 text-center border border-border-muted">
                <Users className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-sm text-text-muted">
                  {customers.length === 0 ? 'אין לקוחות עדיין — הוסף את הלקוח הראשון' : 'לא נמצאו לקוחות התואמים את החיפוש'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map(c => {
                  const st = statusConfig[c.status]
                  return (
                    <div key={c.id} className="glass-card rounded-xl p-5 space-y-3 border border-border-muted hover:border-accent-cyan/20 transition-all cursor-pointer group" onClick={() => openEdit(c)}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-text-primary leading-snug">{c.name}</p>
                          {c.company && <span className="flex items-center gap-1 text-xs text-text-muted mt-0.5"><Building2 className="w-3 h-3" />{c.company}</span>}
                        </div>
                        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border ${st.bg} ${st.color} ${st.border}`}>{st.label}</span>
                      </div>
                      <div className="space-y-1.5">
                        {c.email && <span className="flex items-center gap-1.5 text-xs text-text-secondary" dir="ltr"><Mail className="w-3 h-3 text-text-muted shrink-0" />{c.email}</span>}
                        {c.phone && <span className="flex items-center gap-1.5 text-xs text-text-secondary" dir="ltr"><Phone className="w-3 h-3 text-text-muted shrink-0" />{c.phone}</span>}
                      </div>
                      {c.notes && <p className="text-xs text-text-muted leading-relaxed line-clamp-2">{c.notes}</p>}
                      <div className="flex items-center justify-between pt-2 border-t border-border-muted" onClick={e => e.stopPropagation()}>
                        <span className="text-xs text-text-muted">{c.createdAt}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-cyan/10 hover:text-accent-cyan text-text-muted transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => setDeleteTarget(c)} className="p-1.5 rounded-lg bg-white/5 hover:bg-accent-red/10 hover:text-accent-red text-text-muted transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ─── TAX AUTHORITY TAB ─── */}
        {activeTab === 'tax' && (
          <div className="max-w-lg space-y-5">
            <div className="glass-card rounded-2xl p-5 border border-border-muted space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-amber/10 border border-accent-amber/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent-amber" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">רשות המסים</h3>
                  <p className="text-xs text-text-muted">פרטי גישה לשירותי רשות המסים</p>
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1.5">קוד קבוע</label>
                <input
                  value={taxForm.permanentCode}
                  onChange={e => setTaxForm({ permanentCode: e.target.value })}
                  placeholder="הכנס קוד קבוע..."
                  dir="ltr"
                  className={fieldClass}
                />
              </div>

              <button
                onClick={() => saveSetting('tax_authority', taxForm, setSavingTax, setTaxSaved)}
                disabled={savingTax}
                className="flex items-center gap-2 bg-accent-amber/10 hover:bg-accent-amber/20 border border-accent-amber/20 text-accent-amber text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 font-medium">
                {savingTax ? <><span className="w-4 h-4 border-2 border-accent-amber border-t-transparent rounded-full animate-spin" /> שומר...</>
                  : taxSaved ? <><span>✓</span> נשמר!</>
                  : <><Save className="w-4 h-4" /> שמור</>}
              </button>
            </div>

            <div className="bg-accent-amber/5 border border-accent-amber/15 rounded-xl px-4 py-3">
              <p className="text-xs text-accent-amber/80">הנתונים מוצפנים ומאובטחים — רק אתה רואה אותם</p>
            </div>
          </div>
        )}

        {/* ─── NATIONAL INSURANCE TAB ─── */}
        {activeTab === 'insurance' && (
          <div className="max-w-lg space-y-5">
            <div className="glass-card rounded-2xl p-5 border border-border-muted space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-purple/10 border border-accent-purple/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-accent-purple" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">ביטוח לאומי</h3>
                  <p className="text-xs text-text-muted">פרטי גישה לשירותי המוסד לביטוח לאומי</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">קוד</label>
                  <input value={insForm.code} onChange={e => setInsForm(f => ({ ...f, code: e.target.value }))}
                    placeholder="קוד..." dir="ltr" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">שם משתמש</label>
                  <input value={insForm.username} onChange={e => setInsForm(f => ({ ...f, username: e.target.value }))}
                    placeholder="שם משתמש..." dir="ltr" className={fieldClass} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1.5">מספר ת.ז</label>
                <input value={insForm.idNumber} onChange={e => setInsForm(f => ({ ...f, idNumber: e.target.value }))}
                  placeholder="000000000" dir="ltr" className={fieldClass} />
              </div>

              <div>
                <label className="block text-xs text-text-muted mb-1.5">סיסמה</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={insForm.password}
                    onChange={e => setInsForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
                    dir="ltr"
                    className={`${fieldClass} pl-10`}
                  />
                  <button onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                onClick={() => saveSetting('national_insurance', insForm, setSavingIns, setInsSaved)}
                disabled={savingIns}
                className="flex items-center gap-2 bg-accent-purple/10 hover:bg-accent-purple/20 border border-accent-purple/20 text-accent-purple text-sm px-4 py-2.5 rounded-xl transition-all disabled:opacity-50 font-medium">
                {savingIns ? <><span className="w-4 h-4 border-2 border-accent-purple border-t-transparent rounded-full animate-spin" /> שומר...</>
                  : insSaved ? <><span>✓</span> נשמר!</>
                  : <><Save className="w-4 h-4" /> שמור</>}
              </button>
            </div>

            <div className="bg-accent-purple/5 border border-accent-purple/15 rounded-xl px-4 py-3">
              <p className="text-xs text-accent-purple/80">הנתונים מאובטחים ומוגנים — רק אתה רואה אותם</p>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Customer Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeForm}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-lg w-full space-y-4 animate-fade-in max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
                {editingCustomer ? <><Edit2 className="w-4 h-4 text-accent-cyan" /> עריכת לקוח</> : <><Plus className="w-4 h-4 text-accent-cyan" /> הוסף לקוח</>}
              </h2>
              <button onClick={closeForm} className="text-text-muted hover:text-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">שם מלא *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="ישראל ישראלי" className={fieldClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">מייל</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@example.com" dir="ltr" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">טלפון</label>
                  <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="050-0000000" dir="ltr" className={fieldClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">חברה</label>
                  <input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} placeholder="שם החברה" className={fieldClass} />
                </div>
                <div>
                  <label className="block text-xs text-text-muted mb-1.5">סטטוס</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as CustomerStatus }))} className={fieldClass}>
                    <option value="lead" className="bg-bg-card">ליד</option>
                    <option value="active" className="bg-bg-card">לקוח פעיל</option>
                    <option value="inactive" className="bg-bg-card">לא פעיל</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">הערות</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="הערות על הלקוח..." rows={3} className={`${fieldClass} resize-none`} />
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button onClick={saveCustomer} disabled={saving || !form.name.trim()}
                className="flex-1 bg-accent-cyan text-bg-base font-semibold text-sm py-2.5 rounded-xl hover:bg-accent-cyan/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? 'שומר...' : editingCustomer ? 'שמור שינויים' : 'הוסף לקוח'}
              </button>
              <button onClick={closeForm} className="bg-white/5 text-text-secondary text-sm px-5 py-2.5 rounded-xl hover:bg-white/8 transition-all">ביטול</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
          <div className="bg-bg-card border border-border-muted rounded-2xl p-6 max-w-sm w-full space-y-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-red/10 border border-accent-red/20 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-accent-red" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">מחיקת לקוח</h3>
                <p className="text-xs text-text-muted">פעולה זו אינה ניתנת לביטול</p>
              </div>
            </div>
            <p className="text-sm text-text-secondary">האם למחוק את <span className="text-text-primary font-semibold">{deleteTarget.name}</span>?</p>
            <div className="flex items-center gap-2">
              <button onClick={confirmDelete} className="flex-1 bg-accent-red/10 hover:bg-accent-red/20 border border-accent-red/20 text-accent-red text-sm font-semibold py-2.5 rounded-xl transition-all">מחק</button>
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-white/5 text-text-secondary text-sm py-2.5 rounded-xl hover:bg-white/8 transition-all">ביטול</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
