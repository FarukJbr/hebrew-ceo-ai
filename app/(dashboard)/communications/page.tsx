'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import {
  Send, Mail, MessageSquare, Phone, Users,
  CheckCircle2, XCircle, Clock, Filter, Search,
  ChevronDown, ChevronUp, X, Wifi, WifiOff,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types ───────────────────────────────────────────────────────────────────

type CustomerStatus = 'lead' | 'active' | 'inactive'

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

interface CommLog {
  id: string
  subject: string
  body: string
  channels: string[]
  recipientCount: number
  status: 'sent' | 'partial' | 'failed'
  sentAt: string
}

type RecipientFilter = 'all' | 'active' | 'leads' | 'manual'

// ─── Channel config ──────────────────────────────────────────────────────────

const channelConfig = {
  email: {
    label: 'אימייל',
    icon: Mail,
    color: 'text-accent-cyan',
    bg: 'bg-accent-cyan/10',
    border: 'border-accent-cyan/20',
    // connected if env var injected at build time; for now always false
    connected: false,
    statusLabel: 'ממתין לחיבור',
  },
  sms: {
    label: 'SMS',
    icon: Phone,
    color: 'text-accent-purple',
    bg: 'bg-accent-purple/10',
    border: 'border-accent-purple/20',
    connected: false,
    statusLabel: 'ממתין לחיבור Twilio',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: MessageSquare,
    color: 'text-accent-green',
    bg: 'bg-accent-green/10',
    border: 'border-accent-green/20',
    connected: false,
    statusLabel: 'ממתין לחיבור WhatsApp Business',
  },
} as const

type ChannelKey = keyof typeof channelConfig

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusLabel(s: 'sent' | 'partial' | 'failed') {
  if (s === 'sent')    return { text: 'נשלח',       color: 'text-accent-green',  bg: 'bg-accent-green/10',  border: 'border-accent-green/20',  Icon: CheckCircle2 }
  if (s === 'partial') return { text: 'חלקי',       color: 'text-accent-amber',  bg: 'bg-accent-amber/10',  border: 'border-accent-amber/20',  Icon: Clock }
  return                      { text: 'נכשל',       color: 'text-accent-red',    bg: 'bg-accent-red/10',    border: 'border-accent-red/20',    Icon: XCircle }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('he-IL', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function CommunicationsPage() {
  // Data
  const [customers, setCustomers]     = useState<Customer[]>([])
  const [logs, setLogs]               = useState<CommLog[]>([])
  const [loadingCustomers, setLoadingCustomers] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(true)
  const [uid, setUid]                 = useState<string | null>(null)

  // Compose
  const [subject, setSubject]         = useState('')
  const [body, setBody]               = useState('')
  const [channels, setChannels]       = useState<ChannelKey[]>([])
  const [recipientFilter, setRecipientFilter] = useState<RecipientFilter>('all')
  const [manualSearch, setManualSearch] = useState('')
  const [manualSelected, setManualSelected] = useState<Set<string>>(new Set())
  const [showManualList, setShowManualList] = useState(false)

  // Send
  const [sending, setSending]         = useState(false)
  const [sendResult, setSendResult]   = useState<{ sent: number; failed: number; results: { channel: string; recipient: string; ok: boolean; error?: string }[] } | null>(null)
  const [sendError, setSendError]     = useState<string | null>(null)

  // Log expand
  const [expandedLog, setExpandedLog] = useState<string | null>(null)

  // ── Load data ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      const userId = data.user?.id
      if (!userId) { setLoadingCustomers(false); setLoadingLogs(false); return }
      setUid(userId)

      // Load customers
      const { data: custRows } = await supabase
        .from('customers')
        .select('data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      setCustomers(custRows?.map((r: any) => r.data) || [])
      setLoadingCustomers(false)

      // Load communications log
      const { data: logRows } = await supabase
        .from('communications_log')
        .select('data')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      setLogs(logRows?.map((r: any) => r.data) || [])
      setLoadingLogs(false)
    })
  }, [])

  // ── Derived recipients ─────────────────────────────────────────────────────

  const resolvedRecipients: Customer[] = (() => {
    if (recipientFilter === 'all')    return customers
    if (recipientFilter === 'active') return customers.filter(c => c.status === 'active')
    if (recipientFilter === 'leads')  return customers.filter(c => c.status === 'lead')
    if (recipientFilter === 'manual') return customers.filter(c => manualSelected.has(c.id))
    return []
  })()

  const filteredManualList = customers.filter(c => {
    if (!manualSearch.trim()) return true
    const q = manualSearch.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q)
  })

  // ── Toggles ────────────────────────────────────────────────────────────────

  const toggleChannel = (ch: ChannelKey) => {
    setChannels(prev => prev.includes(ch) ? prev.filter(c => c !== ch) : [...prev, ch])
    setSendResult(null)
    setSendError(null)
  }

  const toggleManual = (id: string) => {
    setManualSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  // ── Send ───────────────────────────────────────────────────────────────────

  const handleSend = async () => {
    if (!body.trim() || channels.length === 0 || resolvedRecipients.length === 0) return
    setSending(true)
    setSendResult(null)
    setSendError(null)

    try {
      const res = await fetch('/api/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          body,
          channels,
          recipients: resolvedRecipients.map(c => ({ name: c.name, email: c.email, phone: c.phone })),
        }),
      })
      const json = await res.json()
      if (!res.ok) { setSendError(json.error || 'שגיאה בשליחה'); setSending(false); return }

      setSendResult(json)

      // Save to communications_log
      if (uid) {
        const supabase = createClient()
        const logEntry: CommLog = {
          id: crypto.randomUUID(),
          subject,
          body,
          channels,
          recipientCount: resolvedRecipients.length,
          status: json.failed === 0 ? 'sent' : json.sent === 0 ? 'failed' : 'partial',
          sentAt: new Date().toISOString(),
        }
        await supabase.from('communications_log').upsert({ id: logEntry.id, user_id: uid, data: logEntry })
        setLogs(prev => [logEntry, ...prev])
      }
    } catch (err: any) {
      setSendError(err?.message || 'שגיאה לא ידועה')
    }
    setSending(false)
  }

  // ── Can send guard ─────────────────────────────────────────────────────────

  const canSend = body.trim() && channels.length > 0 && resolvedRecipients.length > 0 && !sending

  // ──────────────────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" dir="rtl">
      <Header title="תקשורת לקוחות" subtitle="שלח הודעות ועקוב אחר תכתובות" />

      <div className="p-6 space-y-6 animate-fade-in max-w-5xl mx-auto">

        {/* ── Channel status bar ───────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {(Object.entries(channelConfig) as [ChannelKey, typeof channelConfig[ChannelKey]][]).map(([key, cfg]) => {
            const Icon = cfg.icon
            return (
              <div key={key} className={`glass-card rounded-xl px-4 py-3 flex items-center justify-between border ${cfg.border}`}>
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${cfg.color}`} />
                  <span className="text-sm font-medium text-text-primary">{cfg.label}</span>
                </div>
                <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border ${cfg.connected ? 'bg-accent-green/10 border-accent-green/20 text-accent-green' : 'bg-white/5 border-border-muted text-text-muted'}`}>
                  {cfg.connected ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {cfg.statusLabel}
                </span>
              </div>
            )
          })}
        </div>

        {/* ── Compose card ─────────────────────────────────────────────────── */}
        <div className="glass-card rounded-2xl p-6 border border-border-muted space-y-5">
          <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
            <Send className="w-4 h-4 text-accent-cyan" />
            כתוב הודעה
          </h2>

          {/* Subject */}
          <div>
            <label className="block text-xs text-text-muted mb-1.5">נושא (לאימייל)</label>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="נושא ההודעה..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all"
            />
          </div>

          {/* Body */}
          <div>
            <label className="block text-xs text-text-muted mb-1.5">תוכן ההודעה *</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="כתוב את תוכן ההודעה כאן..."
              rows={5}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/50 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Channel selector */}
          <div>
            <label className="block text-xs text-text-muted mb-2">ערוצי שליחה *</label>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(channelConfig) as [ChannelKey, typeof channelConfig[ChannelKey]][]).map(([key, cfg]) => {
                const Icon = cfg.icon
                const active = channels.includes(key)
                return (
                  <button
                    key={key}
                    onClick={() => toggleChannel(key)}
                    className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border transition-all ${
                      active
                        ? `${cfg.bg} ${cfg.border} ${cfg.color} font-medium`
                        : 'bg-white/5 border-border-muted text-text-muted hover:text-text-secondary'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                    {active && <CheckCircle2 className="w-3 h-3 opacity-70" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Recipients selector */}
          <div>
            <label className="block text-xs text-text-muted mb-2">נמענים *</label>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'all',    label: 'כולם',            count: customers.length },
                { value: 'active', label: 'לקוחות פעילים',  count: customers.filter(c => c.status === 'active').length },
                { value: 'leads',  label: 'לידים',           count: customers.filter(c => c.status === 'lead').length },
                { value: 'manual', label: 'בחר ידנית',       count: manualSelected.size },
              ] as { value: RecipientFilter; label: string; count: number }[]).map(opt => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setRecipientFilter(opt.value)
                    if (opt.value === 'manual') setShowManualList(true)
                    else setShowManualList(false)
                  }}
                  className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl border transition-all ${
                    recipientFilter === opt.value
                      ? 'bg-accent-cyan/10 border-accent-cyan/20 text-accent-cyan font-medium'
                      : 'bg-white/5 border-border-muted text-text-muted hover:text-text-secondary'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  {opt.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-md ${recipientFilter === opt.value ? 'bg-accent-cyan/20' : 'bg-white/10'}`}>
                    {opt.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Manual customer checklist */}
            {recipientFilter === 'manual' && (
              <div className="mt-3 border border-border-muted rounded-xl overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 bg-white/3 border-b border-border-muted">
                  <button
                    onClick={() => setShowManualList(v => !v)}
                    className="flex items-center gap-2 flex-1 text-xs text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {showManualList ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    בחר לקוחות ({manualSelected.size} נבחרו)
                  </button>
                  {manualSelected.size > 0 && (
                    <button
                      onClick={() => setManualSelected(new Set())}
                      className="text-xs text-text-muted hover:text-accent-red transition-colors flex items-center gap-0.5"
                    >
                      <X className="w-3 h-3" /> נקה
                    </button>
                  )}
                </div>

                {showManualList && (
                  <div className="max-h-56 overflow-y-auto bg-bg-card">
                    {/* Search */}
                    <div className="px-3 py-2 border-b border-border-muted sticky top-0 bg-bg-card z-10">
                      <div className="relative">
                        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-text-muted pointer-events-none" />
                        <input
                          value={manualSearch}
                          onChange={e => setManualSearch(e.target.value)}
                          placeholder="חיפוש לקוח..."
                          className="w-full bg-white/5 border border-white/10 rounded-lg pr-7 pl-3 py-1.5 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan/40 transition-all"
                        />
                      </div>
                    </div>

                    {loadingCustomers ? (
                      <div className="py-6 text-center text-xs text-text-muted">טוען לקוחות...</div>
                    ) : filteredManualList.length === 0 ? (
                      <div className="py-6 text-center text-xs text-text-muted">לא נמצאו לקוחות</div>
                    ) : (
                      filteredManualList.map(c => {
                        const checked = manualSelected.has(c.id)
                        return (
                          <label
                            key={c.id}
                            className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-white/4 transition-colors border-b border-border-muted last:border-0 ${checked ? 'bg-accent-cyan/5' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleManual(c.id)}
                              className="w-3.5 h-3.5 accent-cyan-400 rounded"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-text-primary truncate">{c.name}</p>
                              {c.company && <p className="text-xs text-text-muted truncate">{c.company}</p>}
                            </div>
                            <span className={`text-xs ${
                              c.status === 'active'   ? 'text-accent-green' :
                              c.status === 'lead'     ? 'text-accent-cyan' :
                              'text-text-muted'
                            }`}>
                              {c.status === 'active' ? 'פעיל' : c.status === 'lead' ? 'ליד' : 'לא פעיל'}
                            </span>
                          </label>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border-muted">
            <p className="text-xs text-text-muted">
              {resolvedRecipients.length > 0
                ? `${resolvedRecipients.length} נמענים · ${channels.length} ערוצים`
                : 'בחר ערוץ ונמענים לשליחה'}
            </p>
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="flex items-center gap-2 bg-accent-cyan text-bg-base text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-accent-cyan/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {sending
                ? <><div className="w-4 h-4 border-2 border-bg-base/40 border-t-bg-base rounded-full animate-spin" /> שולח...</>
                : <><Send className="w-4 h-4" /> שלח הודעה</>
              }
            </button>
          </div>

          {/* Send result banner */}
          {sendResult && (
            <div className={`rounded-xl px-4 py-3 border text-sm flex items-start gap-2 ${
              sendResult.failed === 0
                ? 'bg-accent-green/10 border-accent-green/20 text-accent-green'
                : sendResult.sent === 0
                ? 'bg-accent-red/10 border-accent-red/20 text-accent-red'
                : 'bg-accent-amber/10 border-accent-amber/20 text-accent-amber'
            }`}>
              {sendResult.failed === 0
                ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                : sendResult.sent === 0
                ? <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
                : <Clock className="w-4 h-4 shrink-0 mt-0.5" />
              }
              <div>
                <p className="font-medium">
                  {sendResult.sent > 0 && `${sendResult.sent} הודעות נשלחו בהצלחה`}
                  {sendResult.failed > 0 && ` · ${sendResult.failed} נכשלו`}
                </p>
                {sendResult.results.filter(r => !r.ok).map((r, i) => (
                  <p key={i} className="text-xs mt-0.5 opacity-80">{r.recipient} ({r.channel}): {r.error}</p>
                ))}
              </div>
            </div>
          )}

          {sendError && (
            <div className="rounded-xl px-4 py-3 border bg-accent-red/10 border-accent-red/20 text-accent-red text-sm flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              {sendError}
            </div>
          )}
        </div>

        {/* ── Message log ──────────────────────────────────────────────────── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-muted" />
              היסטוריית שליחות
            </h2>
            {loadingLogs && (
              <div className="w-4 h-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
            )}
          </div>

          {!loadingLogs && logs.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center border border-border-muted">
              <Send className="w-9 h-9 text-text-muted mx-auto mb-3 opacity-40" />
              <p className="text-sm text-text-muted">עדיין לא נשלחו הודעות</p>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => {
                const st = statusLabel(log.status)
                const StIcon = st.Icon
                const isExpanded = expandedLog === log.id
                return (
                  <div
                    key={log.id}
                    className="glass-card rounded-xl border border-border-muted overflow-hidden"
                  >
                    {/* Row */}
                    <button
                      onClick={() => setExpandedLog(isExpanded ? null : log.id)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-white/3 transition-colors text-right"
                    >
                      <StIcon className={`w-4 h-4 shrink-0 ${st.color}`} />

                      <div className="flex-1 min-w-0 text-right">
                        <p className="text-xs font-semibold text-text-primary truncate">
                          {log.subject || log.body.slice(0, 60) || 'ללא נושא'}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5 truncate">{log.body.slice(0, 80)}</p>
                      </div>

                      {/* Channel icons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {log.channels.map(ch => {
                          const cfg = channelConfig[ch as ChannelKey]
                          if (!cfg) return null
                          const ChIcon = cfg.icon
                          return <ChIcon key={ch} className={`w-3.5 h-3.5 ${cfg.color}`} />
                        })}
                      </div>

                      {/* Recipient count */}
                      <span className="text-xs text-text-muted shrink-0 flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {log.recipientCount}
                      </span>

                      {/* Status badge */}
                      <span className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border ${st.bg} ${st.color} ${st.border}`}>
                        {st.text}
                      </span>

                      {/* Date */}
                      <span className="text-xs text-text-muted shrink-0 hidden sm:block">
                        {formatDate(log.sentAt)}
                      </span>

                      {isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-text-muted shrink-0" />
                        : <ChevronDown className="w-3.5 h-3.5 text-text-muted shrink-0" />
                      }
                    </button>

                    {/* Expanded body */}
                    {isExpanded && (
                      <div className="px-5 py-4 border-t border-border-muted bg-white/2 space-y-2">
                        {log.subject && (
                          <p className="text-xs text-text-muted">
                            <span className="font-semibold text-text-secondary">נושא: </span>{log.subject}
                          </p>
                        )}
                        <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-line">{log.body}</p>
                        <div className="flex flex-wrap gap-2 pt-1">
                          {log.channels.map(ch => {
                            const cfg = channelConfig[ch as ChannelKey]
                            if (!cfg) return null
                            const ChIcon = cfg.icon
                            return (
                              <span key={ch} className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                                <ChIcon className="w-3 h-3" />{cfg.label}
                              </span>
                            )
                          })}
                        </div>
                        <p className="text-xs text-text-muted">{formatDate(log.sentAt)}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
