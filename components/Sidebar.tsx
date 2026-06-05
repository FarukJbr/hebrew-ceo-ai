'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, Wallet, MessageSquare,
  ListChecks, Bot, Calendar, BarChart3, Building2,
  Sparkles, LogOut, Vote,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/',            label: 'לוח בקרה',     icon: LayoutDashboard },
  { href: '/instructions',label: 'הוראות AI',    icon: Sparkles },
  { href: '/board',       label: 'דירקטוריון',   icon: Vote },
  { href: '/finance',     label: 'פיננסים',      icon: Wallet },
  { href: '/tasks',       label: 'משימות',       icon: ListChecks },
  { href: '/chat',        label: 'צ׳אט AI',      icon: MessageSquare },
  { href: '/agents',      label: 'סוכני AI',     icon: Bot },
  { href: '/meetings',    label: 'ישיבות',       icon: Calendar },
  { href: '/reports',     label: 'דוחות',        icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <aside className="fixed right-0 top-0 h-full w-60 bg-bg-sidebar border-l border-border-muted z-40
                      flex flex-col overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-3 p-5 border-b border-border-muted">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent-cyan/10 border border-accent-cyan/20">
          <Building2 className="w-5 h-5 text-accent-cyan" />
        </div>
        <div>
          <p className="text-sm font-bold text-text-primary">Prime Ledger</p>
          <p className="text-xs text-text-muted">גבר יזמות</p>
        </div>
      </div>

      {/* Status bar */}
      <div className="mx-4 mt-4 px-3 py-2 rounded-xl bg-accent-green/5 border border-accent-green/20 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green" />
        </span>
        <span className="text-xs text-accent-green font-medium">מערכת פעילה</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto mt-2">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn('sidebar-item', isActive(item.href) && 'active')}
          >
            <item.icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border-muted space-y-1">
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-xs font-bold text-bg-base">
            יו
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-text-primary truncate">יו״ר הדירקטוריון</p>
            <p className="text-xs text-text-muted truncate">מנהל ראשי</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="sidebar-item w-full text-accent-red hover:text-accent-red hover:bg-accent-red/5"
        >
          <LogOut className="w-4 h-4" />
          <span>התנתקות</span>
        </button>
      </div>
    </aside>
  )
}
