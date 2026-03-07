import { AlertCircle } from 'lucide-react'
import InsightCard, { type Insight } from './InsightCard'

interface InsightFeedProps {
  insights: Insight[]
  loading: boolean
  error: string | null
  onRetry: () => void
  filter: string
}

function SkeletonCard({ delay }: { delay: number }) {
  return (
    <div
      className="rounded-2xl p-5 border border-white/[0.06] bg-[#0F1629] animate-pulse space-y-3"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="w-28 h-5 rounded-full bg-white/[0.05]" />
        <div className="w-12 h-3 rounded bg-white/[0.05]" />
      </div>
      <div className="w-5 h-5 rounded bg-white/[0.05] mt-3" />
      <div className="w-4/5 h-4 rounded bg-white/[0.05]" />
      <div className="w-full h-3 rounded bg-white/[0.05]" />
      <div className="w-3/4 h-3 rounded bg-white/[0.05]" />
      <div className="w-24 h-7 rounded-lg bg-white/[0.05] mt-2" />
    </div>
  )
}

export default function InsightFeed({ insights, loading, error, onRetry, filter }: InsightFeedProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} delay={i * 80} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-rose-400 mb-4" />
        <p className="text-white font-semibold">Failed to generate insights</p>
        <p className="text-slate-400 text-sm mt-1 max-w-sm">{error}</p>
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-sm font-medium hover:bg-indigo-500/20 transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  const filtered = filter === 'all'
    ? insights
    : insights.filter((i) => i.type === filter)

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-slate-400 text-sm">No {filter} insights found.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filtered.map((insight, i) => (
        <InsightCard key={i} insight={insight} index={i} />
      ))}
    </div>
  )
}
