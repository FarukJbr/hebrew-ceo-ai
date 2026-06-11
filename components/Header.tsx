'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Search, X, CheckCircle2, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Notification {
  id: string
  type: string
  text: string
  read: boolean
  created_at: string
}

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const supabase = createClient()
    let userId = ''

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      userId = user.id
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30)
      setNotifications(data || [])
    }

    load()

    const channel = supabase
      .channel('header-notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, payload => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    const supabase = createClient()
    const ids = notifications.filter(n => !n.read).map(n => n.id)
    if (!ids.length) return
    await supabase.from('notifications').update({ read: true }).in('id', ids)
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setExpandedId(null)
  }

  const markRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ read: true }).eq('id', id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const formatTime = (created_at: string) => {
    const diff = Date.now() - new Date(created_at).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'עכשיו'
    if (mins < 60) return `לפני ${mins} דקות`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `לפני ${hours} שעות`
    return 'אתמול'
  }

  const now = new Date()
  const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

  const iconMap = {
    info:    <Info className="w-3.5 h-3.5 text-accent-cyan" />,
    success: <CheckCircle2 className="w-3.5 h-3.5 text-accent-green" />,
    warning: <AlertCircle className="w-3.5 h-3.5 text-accent-amber" />,
  }

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border-muted bg-bg-base/80 backdrop-blur-sm sticky top-0 z-30">
      <div>
        <h1 className="text-lg font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs text-text-secondary">{dateStr}</span>
          <span className="text-xs font-mono" style={{ color: '#d4af37' }}>{timeStr}</span>
        </div>

        <button className="flex items-center gap-2 bg-white/5 hover:bg-white/8 border border-white/10 rounded-xl px-3 py-2 text-text-muted hover:text-text-secondary transition-all duration-200 text-sm">
          <Search className="w-4 h-4" />
          <span className="hidden md:block text-xs">חיפוש...</span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={ref}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/8 border border-white/10 text-text-secondary hover:text-text-primary transition-all duration-200"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-accent-red rounded-full text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 top-11 w-80 bg-bg-card border border-border-muted rounded-2xl shadow-card overflow-hidden z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-muted">
                <span className="text-sm font-semibold text-text-primary">
                  התראות {unreadCount > 0 && <span className="text-xs text-accent-red font-normal">({unreadCount} חדשות)</span>}
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs hover:underline" style={{ color: '#d4af37' }}>
                      סמן הכל כנקרא
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-text-muted hover:text-text-secondary">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-muted">אין התראות</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id}
                      onClick={() => setExpandedId(expandedId === n.id ? null : n.id)}
                      className={`cursor-pointer flex flex-col px-4 py-3 border-b border-border-muted last:border-0 transition-colors ${
                        expandedId === n.id ? 'bg-white/5' : !n.read ? 'bg-white/2 hover:bg-white/4' : 'hover:bg-white/3'
                      }`}>
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">{iconMap[n.type as keyof typeof iconMap] ?? iconMap.info}</div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs leading-relaxed ${n.read ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>
                            {n.text}
                          </p>
                          <p className="text-xs text-text-muted mt-0.5">{formatTime(n.created_at)}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-accent-red" />}
                          {expandedId === n.id
                            ? <ChevronUp className="w-3 h-3 text-text-muted" />
                            : <ChevronDown className="w-3 h-3 text-text-muted" />}
                        </div>
                      </div>
                      {expandedId === n.id && (
                        <div className="mt-2 pt-2 border-t border-border-muted mr-6 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          {!n.read ? (
                            <button onClick={() => markRead(n.id)}
                              className="text-xs rounded-lg px-2.5 py-1 transition-all"
                              style={{ background: 'rgba(212,175,55,0.1)', color: '#d4af37', border: '1px solid rgba(212,175,55,0.2)' }}>
                              סמן כנקרא
                            </button>
                          ) : (
                            <span className="text-xs text-accent-green flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> נקרא
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
