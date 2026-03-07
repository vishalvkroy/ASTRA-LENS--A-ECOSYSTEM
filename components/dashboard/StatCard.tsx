'use client'

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string
  change: number
  changeLabel: string
  icon: LucideIcon
  color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'purple'
  delay?: number
}

const colorMap = {
  indigo: {
    icon: 'bg-indigo-500/15 text-indigo-400',
    blob: 'bg-indigo-500',
    up: 'text-emerald-400',
    down: 'text-rose-400',
  },
  emerald: {
    icon: 'bg-emerald-500/15 text-emerald-400',
    blob: 'bg-emerald-500',
    up: 'text-emerald-400',
    down: 'text-rose-400',
  },
  amber: {
    icon: 'bg-amber-500/15 text-amber-400',
    blob: 'bg-amber-500',
    up: 'text-emerald-400',
    down: 'text-rose-400',
  },
  rose: {
    icon: 'bg-rose-500/15 text-rose-400',
    blob: 'bg-rose-500',
    up: 'text-emerald-400',
    down: 'text-rose-400',
  },
  purple: {
    icon: 'bg-purple-500/15 text-purple-400',
    blob: 'bg-purple-500',
    up: 'text-emerald-400',
    down: 'text-rose-400',
  },
}

export default function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  color,
  delay = 0,
}: StatCardProps) {
  const colors = colorMap[color]
  const isUp = change > 0
  const isDown = change < 0

  const ChangeIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus
  const changeColor = isUp ? 'text-emerald-400' : isDown ? 'text-rose-400' : 'text-slate-400'

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 border border-white/[0.06] bg-[#0F1629] transition-all duration-300 hover:scale-[1.02] hover:shadow-glow cursor-default animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className={cn('rounded-xl p-2.5', colors.icon)}>
          <Icon size={18} />
        </span>
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider text-right">
          {title}
        </span>
      </div>

      {/* Value */}
      <p className="text-3xl font-bold text-white mt-3 tracking-tight">{value}</p>

      {/* Change row */}
      <div className={cn('flex items-center gap-1 mt-2', changeColor)}>
        <ChangeIcon size={13} />
        <span className="text-xs font-medium">
          {isUp ? '+' : ''}{change.toFixed(1)}%
        </span>
        <span className="text-xs text-slate-500 ml-1">{changeLabel}</span>
      </div>

      {/* Decorative blob */}
      <div
        className={cn(
          'absolute bottom-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 pointer-events-none',
          colors.blob
        )}
      />
    </div>
  )
}
