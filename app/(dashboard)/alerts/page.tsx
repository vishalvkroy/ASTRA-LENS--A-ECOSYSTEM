'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import AlertCard from '@/components/alerts/AlertCard'
import type { Alert } from '@/app/api/alerts/route'
import { cn } from '@/lib/utils'

type FilterLevel = 'all' | 'high' | 'medium' | 'low'

interface AlertsResponse {
  alerts: Alert[]
  counts: { high: number; medium: number; low: number; total: number }
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 border border-white/[0.06] bg-[#0F1629] animate-pulse h-28" />
  )
}

const filterTabs: { label: string; value: FilterLevel }[] = [
  { label: 'All', value: 'all' },
  { label: 'High', value: 'high' },
  { label: 'Medium', value: 'medium' },
  { label: 'Low', value: 'low' },
]

const levelDotColor = {
  high: 'bg-rose-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

const levelHeaderColor = {
  high: 'text-rose-400',
  medium: 'text-amber-400',
  low: 'text-slate-400',
}

export default function AlertsPage() {
  const [data, setData] = useState<AlertsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterLevel>('all')

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = data?.alerts.filter(
    (a) => filter === 'all' || a.level === filter
  ) ?? []

  const grouped = {
    high: filtered.filter((a) => a.level === 'high'),
    medium: filtered.filter((a) => a.level === 'medium'),
    low: filtered.filter((a) => a.level === 'low'),
  }

  return (
    <>
      <Topbar
        title="Smart Alerts"
        subtitle="Rule-based monitoring from your business data"
      />

      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Summary bar */}
        <div className="flex flex-wrap items-center gap-3">
          {(['high', 'medium', 'low'] as const).map((level) => (
            <div
              key={level}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]"
            >
              <span className={cn('w-1.5 h-1.5 rounded-full', levelDotColor[level])} />
              <span className="text-xs text-slate-300 font-medium capitalize">
                {data?.counts[level] ?? 0} {level}
              </span>
            </div>
          ))}
          <span className="text-sm text-slate-400 ml-auto">
            {data?.counts.total ?? 0} Active Alerts
          </span>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'px-4 py-1.5 rounded-lg text-sm font-medium transition-all',
                filter === tab.value
                  ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              )}
            >
              {tab.label}
              {tab.value !== 'all' && data && (
                <span className="ml-1.5 text-xs opacity-60">
                  ({data.counts[tab.value]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldCheck size={48} className="text-emerald-400 mb-4" />
            <p className="text-white font-semibold text-lg">All clear! No active alerts.</p>
            <p className="text-slate-400 text-sm mt-1">Your business is running smoothly.</p>
          </div>
        )}

        {/* Grouped alert sections */}
        {!loading && filtered.length > 0 && (
          <div className="space-y-6">
            {(['high', 'medium', 'low'] as const).map((level) =>
              grouped[level].length === 0 ? null : (
                <div key={level}>
                  <p className={cn('text-xs font-bold uppercase tracking-wider mb-3', levelHeaderColor[level])}>
                    {level} Priority
                  </p>
                  <div className="space-y-3">
                    {grouped[level].map((alert, i) => (
                      <AlertCard key={alert.id} alert={alert} index={i} />
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </>
  )
}
