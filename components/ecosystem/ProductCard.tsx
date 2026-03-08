import { Check, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  name: string
  tagline: string
  color: 'blue' | 'indigo' | 'orange'
  icon: LucideIcon
  features: string[]
  stats: { label: string; value: string }[]
  link: string | null
  isCenter?: boolean
  isDesktopApp?: boolean
  delay?: number
}

const colorMap = {
  blue: {
    container: 'border-blue-500/20 bg-blue-950/20 hover:border-blue-500/40',
    icon: 'bg-blue-500/15 text-blue-400',
    tagline: 'text-blue-400',
    check: 'text-blue-400',
    link: 'text-blue-400 hover:text-blue-300',
  },
  indigo: {
    container: 'border-indigo-500/30 bg-indigo-950/30 hover:border-indigo-500/50 shadow-glow',
    icon: 'bg-indigo-500/15 text-indigo-400',
    tagline: 'text-indigo-400',
    check: 'text-indigo-400',
    link: 'text-indigo-400 hover:text-indigo-300',
  },
  orange: {
    container: 'border-orange-500/20 bg-orange-950/20 hover:border-orange-500/40',
    icon: 'bg-orange-500/15 text-orange-400',
    tagline: 'text-orange-400',
    check: 'text-orange-400',
    link: 'text-orange-400 hover:text-orange-300',
  },
}

export default function ProductCard({
  name,
  tagline,
  color,
  icon: Icon,
  features,
  stats,
  link,
  isCenter,
  isDesktopApp,
  delay = 0,
}: ProductCardProps) {
  const c = colorMap[color]

  return (
    <div
      className={cn(
        'relative rounded-2xl border p-6 transition-all duration-300 animate-fade-in',
        c.container,
        isCenter && 'scale-105'
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={cn('rounded-xl p-2 shrink-0', c.icon)}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-base font-bold text-white leading-tight">{name}</p>
          <p className={cn('text-xs font-medium mt-0.5', c.tagline)}>{tagline}</p>
        </div>
      </div>

      {/* Features */}
      <div className="space-y-2">
        {features.map((f) => (
          <div key={f} className="flex items-center gap-2">
            <Check size={12} className={cn('shrink-0', c.check)} />
            <span className="text-xs text-slate-400">{f}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-white/[0.06] grid grid-cols-2 gap-2">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="text-sm font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Link */}
      <div className="mt-4">
        {isDesktopApp || !link ? (
          <span className={cn('text-xs font-medium opacity-50 cursor-default select-none', c.link)}>
            Desktop Application
          </span>
        ) : (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className={cn('text-xs font-medium transition-colors hover:underline', c.link)}
          >
            Open {name} ↗
          </a>
        )}
      </div>
    </div>
  )
}
