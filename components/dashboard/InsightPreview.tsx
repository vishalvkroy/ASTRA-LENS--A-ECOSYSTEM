import Link from 'next/link'
import { AlertTriangle, Zap, ArrowRight, Monitor } from 'lucide-react'

const previewInsights = [
  {
    id: 'p1',
    type: 'warning' as const,
    title: 'Basmati Rice runs out in 3 days',
    body: 'Sirf 5 bags bache hain. Friday se pehle restock kar lijiye warna sales miss ho sakti hai.',
    action: 'Restock in Atlas',
    actionLink: null as string | null,
    isDesktopAction: true,
  },
  {
    id: 'p2',
    type: 'opportunity' as const,
    title: '535 inactive customers need attention',
    body: 'Re-engagement campaign launch karne se 15-20% customers wapas aa sakte hain. Holi perfect timing hai.',
    action: 'Launch Campaign',
    actionLink: 'https://spark.astrastudio.in/whatsapp/campaigns/new',
    isDesktopAction: false,
  },
]

const typeConfig = {
  warning: {
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/[0.03]',
    dot: 'bg-amber-400',
    action: 'text-amber-400 hover:text-amber-300',
    icon: AlertTriangle,
    iconColor: 'text-amber-400',
  },
  opportunity: {
    border: 'border-indigo-500/20',
    bg: 'bg-indigo-500/[0.03]',
    dot: 'bg-indigo-400',
    action: 'text-indigo-400 hover:text-indigo-300',
    icon: Zap,
    iconColor: 'text-indigo-400',
  },
}

export default function InsightPreview() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white">AI Insights</p>
        <Link
          href="/dashboard/insights"
          className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          View All <ArrowRight size={11} />
        </Link>
      </div>

      {previewInsights.map((insight) => {
        const config = typeConfig[insight.type]
        const Icon = config.icon
        return (
          <div
            key={insight.id}
            className={`rounded-xl p-4 border ${config.border} ${config.bg}`}
          >
            <div className="flex items-start gap-2">
              <span className={`mt-0.5 shrink-0 ${config.iconColor}`}>
                <Icon size={14} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white leading-snug">{insight.title}</p>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{insight.body}</p>
                {insight.action && (
                  insight.isDesktopAction ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-medium mt-2 ${config.action} opacity-70`}>
                      <Monitor size={10} />
                      {insight.action}
                    </span>
                  ) : (
                    <a
                      href={insight.actionLink!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 text-xs font-medium mt-2 transition-colors ${config.action}`}
                    >
                      {insight.action} <ArrowRight size={10} />
                    </a>
                  )
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
