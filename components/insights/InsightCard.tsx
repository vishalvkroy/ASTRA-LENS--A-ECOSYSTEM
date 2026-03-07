import { Lightbulb, AlertTriangle, Trophy, Sparkles, ArrowUpRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Insight {
  type: 'opportunity' | 'warning' | 'achievement' | 'recommendation'
  priority: 'high' | 'medium' | 'low'
  title: string
  body: string
  action?: string | null
  actionLink?: string | null
}

interface InsightCardProps {
  insight: Insight
  index: number
}

const typeConfig = {
  opportunity: {
    container: 'bg-indigo-950/40 border-indigo-500/20 hover:border-indigo-500/40',
    badge: 'bg-indigo-500/15 text-indigo-400',
    label: 'OPPORTUNITY',
    icon: Lightbulb,
    iconColor: 'text-indigo-400',
    action: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 group-hover:translate-x-0.5',
  },
  warning: {
    container: 'bg-amber-950/30 border-amber-500/20 hover:border-amber-500/40',
    badge: 'bg-amber-500/15 text-amber-400',
    label: 'WARNING',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
    action: 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20',
  },
  achievement: {
    container: 'bg-emerald-950/30 border-emerald-500/20 hover:border-emerald-500/40',
    badge: 'bg-emerald-500/15 text-emerald-400',
    label: 'ACHIEVEMENT',
    icon: Trophy,
    iconColor: 'text-emerald-400',
    action: 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20',
  },
  recommendation: {
    container: 'bg-slate-800/40 border-white/[0.06] hover:border-white/10',
    badge: 'bg-slate-500/15 text-slate-400',
    label: 'RECOMMENDATION',
    icon: Sparkles,
    iconColor: 'text-slate-400',
    action: 'bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 group-hover:translate-x-0.5',
  },
}

const priorityDot = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-500',
}

export default function InsightCard({ insight, index }: InsightCardProps) {
  const config = typeConfig[insight.type]
  const Icon = config.icon

  return (
    <div
      className={cn(
        'rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.015] hover:shadow-glow group animate-fade-in',
        config.container
      )}
      style={{ animationDelay: `${index * 100}ms`, opacity: 0, animationFillMode: 'forwards' }}
    >
      {/* Top row */}
      <div className="flex items-center justify-between">
        <span className={cn('text-xs font-bold px-2.5 py-1 rounded-full', config.badge)}>
          {config.label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={cn('w-1.5 h-1.5 rounded-full', priorityDot[insight.priority])} />
          <span className="text-xs text-slate-500 capitalize">{insight.priority}</span>
        </div>
      </div>

      {/* Icon */}
      <div className={cn('mt-3', config.iconColor)}>
        <Icon size={20} />
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-white mt-2 leading-snug">{insight.title}</p>

      {/* Body */}
      <p className="text-xs text-slate-400 mt-2 leading-relaxed">{insight.body}</p>

      {/* Action */}
      {insight.action && insight.actionLink && (
        <a
          href={insight.actionLink}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'mt-4 inline-flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-2 transition-all',
            config.action
          )}
        >
          {insight.action}
          <ArrowUpRight size={14} />
        </a>
      )}
    </div>
  )
}
