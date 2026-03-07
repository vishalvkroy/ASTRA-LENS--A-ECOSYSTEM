'use client'

import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Sparkles } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import InsightFeed from '@/components/insights/InsightFeed'
import type { Insight } from '@/components/insights/InsightCard'
import { cn } from '@/lib/utils'

type FilterType = 'all' | 'opportunity' | 'warning' | 'achievement' | 'recommendation'

const filterTabs: { label: string; value: FilterType }[] = [
  { label: 'All', value: 'all' },
  { label: 'Opportunity', value: 'opportunity' },
  { label: 'Warning', value: 'warning' },
  { label: 'Achievement', value: 'achievement' },
  { label: 'Recommendation', value: 'recommendation' },
]

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterType>('all')

  const fetchInsights = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/insights', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Failed to generate insights')
      setInsights(data.insights)
      setLastGenerated(data.generatedAt)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchInsights() }, [fetchInsights])

  const countByType = (type: FilterType) =>
    type === 'all' ? insights.length : insights.filter((i) => i.type === type).length

  return (
    <>
      <Topbar
        title="AI Insights"
        subtitle="Powered by Claude AI"
        actions={
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 text-sm font-medium transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={cn(loading && 'animate-spin')} />
            Regenerate
          </button>
        }
      />
      <div className="p-6 max-w-6xl mx-auto w-full space-y-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-400 font-medium">
            <Sparkles size={10} /> Claude AI
          </span>
          <span className="text-xs text-slate-500">
            {lastGenerated ? `Last updated: ${formatTime(lastGenerated)}` : 'Generating insights…'}
          </span>
        </div>
        {!loading && !error && (
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                  filter === tab.value
                    ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    : 'text-slate-400 hover:text-white border-transparent'
                )}
              >
                {tab.label}
                <span className="text-xs opacity-60">({countByType(tab.value)})</span>
              </button>
            ))}
          </div>
        )}
        <InsightFeed insights={insights} loading={loading} error={error} onRetry={fetchInsights} filter={filter} />
      </div>
    </>
  )
}
