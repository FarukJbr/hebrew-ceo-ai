'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Search, X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
}

const NOTIFICATIONS = [
  { id: 1, type: 'info',    text: 'אריאל AI סיים ניתוח דוח רבעוני Q2',        time: 'לפני 12 דקות', read: false },
  { id: 2, type: 'success', text: 'הצבעה אושרה: תקציב שיווק Q3 — ₪240K',      time: 'לפני 1 שעה',   read: false },
  { id: 3, type: 'warning', text: 'תשלום ספק ממתין לאישורך — ₪45,000',         time: 'לפני 2 שעות',  read: false },
  { id: 4, type: 'info',    text: 'נועה AI עדכנה תחזית תזרים יוני',           time: 'לפני 3 שעות',  read: true  },
  { id: 5, type: 'success', text: 'משימה הושלמה: בדיקת Due Diligence נכס',    time: 'אתמול',        read: true  },
]

export function Header({ title, subtitle }: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState(NOTIFICATIONS)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })))

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
          <span className="text-xs font-mono text-accent-cyan">{timeStr}</span>
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
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute left-0 top-11 w-80 bg-bg-card border border-border-muted rounded-2xl shadow-card overflow-hidden z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-muted">
                <span className="text-sm font-semibold text-text-primary">התראות</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-accent-cyan hover:underline">
                      סמן הכל כנקרא
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="text-text-muted hover:text-text-secondary">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-muted">אין התראות חדשות</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`flex items-start gap-3 px-4 py-3 border-b border-border-muted last:border-0 transition-colors hover:bg-white/3 ${!n.read ? 'bg-white/2' : ''}`}>
                      <div className="mt-0.5 shrink-0">{iconMap[n.type as keyof typeof iconMap]}</div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs leading-relaxed ${n.read ? 'text-text-secondary' : 'text-text-primary font-medium'}`}>{n.text}</p>
                        <p className="text-xs text-text-muted mt-0.5">{n.time}</p>
                      </div>
                      {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan mt-1.5 shrink-0" />}
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
