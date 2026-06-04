'use client'

import { Bell, Search } from 'lucide-react'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const now = new Date()
  const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border-muted bg-bg-base/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Title */}
      <div>
        <h1 className="text-lg font-bold text-text-primary">{title}</h1>
        {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Date/Time */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs text-text-secondary">{dateStr}</span>
          <span className="text-xs font-mono text-accent-cyan">{timeStr}</span>
        </div>

        {/* Search */}
        <button className="flex items-center gap-2 bg-white/5 hover:bg-white/8 border border-white/10
                           rounded-xl px-3 py-2 text-text-muted hover:text-text-secondary
                           transition-all duration-200 text-sm">
          <Search className="w-4 h-4" />
          <span className="hidden md:block text-xs">חיפוש...</span>
        </button>

        {/* Notifications */}
        <button className="relative w-9 h-9 flex items-center justify-center rounded-xl
                           bg-white/5 hover:bg-white/8 border border-white/10
                           text-text-secondary hover:text-text-primary transition-all duration-200">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full" />
        </button>
      </div>
    </header>
  )
}
