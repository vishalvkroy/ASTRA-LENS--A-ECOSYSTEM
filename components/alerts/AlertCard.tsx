import { ChevronRight, Package, Users, TrendingDown, Megaphone, CreditCard, Monitor } from 'lucide-react'
import type { Alert } from '@/app/api/alerts/route'
import { cn } from '@/lib/utils'

interface AlertCardProps {
  alert: Alert
  index: number
}

const levelConfig = {
  high: {
    container: 'bg-rose-950/30 border-rose-500/20 hover:border-rose-500/40',
    badge: 'bg-rose-500/20 text-rose-400',
    action: 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20',
  },
  medium: {
    container: 'bg-amber-950/30 border-amber-500/20 hover:border-amber-500/40',
    badge: 'bg-amber-500/20 text-amber-400',
    action: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
  },
  low: {
    container: 'bg-slate-800/40 border-white/[0.06] hover:border-white/10',
    badge: 'bg-slate-500/20 text-slate-400',
    action: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20',
  },
}

const categoryIcon = {
  inventory: { Icon: Package, color: 'text-amber-400' },
  customers: { Icon: Users, color: 'text-indigo-400' },
  sales: { Icon: TrendingDown, color: 'text-rose-400' },
  campaigns: { Icon: Megaphone, color: 'text-purple-400' },
  credits: { Icon: CreditCard, color: 'text-slate-400' },
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function AlertCard({ alert, index }: AlertCardProps) {
  const config = levelConfig[alert.level]
  const { Icon, color } = categoryIcon[alert.category]

  return (
    <div
      className={cn(
        'rounded-2xl p-5 border transition-all duration-200 hover:scale-[1.01] animate-fade-in',
        config.container
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Top row */}
      <div className="flex items-center gap-2">
        <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold uppercase', config.badge)}>
          {alert.level}
        </span>
        <span className={cn('ml-1', color)}>
          <Icon size={14} />
        </span>
        <span className="ml-auto text-xs text-slate-600">{formatTime(alert.createdAt)}</span>
      </div>

      {/* Content */}
      <p className="text-sm font-semibold text-white mt-2">{alert.title}</p>
      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{alert.description}</p>

      {/* Action */}
      {alert.action && (
        alert.actionLink ? (
          <a
            href={alert.actionLink}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'mt-3 inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 transition-colors',
              config.action
            )}
          >
            {alert.action}
            <ChevronRight size={12} />
          </a>
        ) : (
          <span className={cn(
            'mt-3 inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 opacity-60 cursor-default select-none',
            config.action
          )}>
            <Monitor size={11} />
            {alert.action}
          </span>
        )
      )}
    </div>
  )
}
