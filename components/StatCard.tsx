import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { type LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  change?: number
  changeLabel?: string
  icon: LucideIcon
  color?: 'cyan' | 'purple' | 'green' | 'amber'
  suffix?: string
}

const colorMap = {
  cyan: {
    bg: 'bg-accent-cyan/10',
    border: 'border-accent-cyan/20',
    icon: 'text-accent-cyan',
    glow: 'rgba(34,211,238,0.1)',
  },
  purple: {
    bg: 'bg-accent-purple/10',
    border: 'border-accent-purple/20',
    icon: 'text-accent-purple',
    glow: 'rgba(167,139,250,0.1)',
  },
  green: {
    bg: 'bg-accent-green/10',
    border: 'border-accent-green/20',
    icon: 'text-accent-green',
    glow: 'rgba(52,211,153,0.1)',
  },
  amber: {
    bg: 'bg-accent-amber/10',
    border: 'border-accent-amber/20',
    icon: 'text-accent-amber',
    glow: 'rgba(251,191,36,0.1)',
  },
}

export function StatCard({
  title, value, change, changeLabel, icon: Icon, color = 'cyan', suffix,
}: StatCardProps) {
  const colors = colorMap[color]
  const isPositive = (change ?? 0) >= 0

  return (
    <div
      className="stat-card cursor-default"
      style={{ boxShadow: `0 0 30px ${colors.glow}` }}
    >
      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-text-secondary font-medium mb-1">{title}</p>
          <p className="text-2xl font-bold text-text-primary tracking-tight">
            {value}
            {suffix && <span className="text-sm text-text-secondary font-normal mr-1">{suffix}</span>}
          </p>
        </div>
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', colors.bg, `border ${colors.border}`)}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
      </div>

      {/* Change indicator */}
      {change !== undefined && (
        <div className="flex items-center gap-1.5">
          <div className={cn(
            'flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-lg',
            isPositive ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'
          )}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositive ? '+' : ''}{change}%
          </div>
          {changeLabel && <span className="text-xs text-text-muted">{changeLabel}</span>}
        </div>
      )}

      {/* Decorative gradient line */}
      <div
        className={cn('absolute bottom-0 left-0 right-0 h-0.5 rounded-b-2xl opacity-50', colors.bg)}
        style={{ background: `linear-gradient(90deg, transparent, ${colors.icon.replace('text-', '')}40, transparent)` }}
      />
    </div>
  )
}
