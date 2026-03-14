'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Users, Megaphone, MessageSquare } from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import StatCard from '@/components/dashboard/StatCard'
import RevenueChart from '@/components/dashboard/RevenueChart'
import TopProducts from '@/components/dashboard/TopProducts'
import CustomerActivity from '@/components/dashboard/CustomerActivity'
import InsightPreview from '@/components/dashboard/InsightPreview'
import { formatCurrency, formatNumber } from '@/lib/utils'
import type { BusinessSnapshot } from '@/lib/mock-data/types'

function SkeletonCard() {
  return (
    <div className="rounded-2xl p-5 border border-white/[0.06] bg-[#0F1629] animate-pulse">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl bg-white/[0.05]" />
        <div className="w-20 h-3 rounded bg-white/[0.05]" />
      </div>
      <div className="w-24 h-8 rounded bg-white/[0.05] mt-3" />
      <div className="w-32 h-3 rounded bg-white/[0.05] mt-3" />
    </div>
  )
}

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<BusinessSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/summary')
      .then((r) => {
        if (!r.ok) throw new Error(`Server error ${r.status}`)
        return r.json()
      })
      .then((data) => {
        setSnapshot(data)
        setLoading(false)
      })
      .catch((err) => {
        setError(err?.message ?? 'Failed to load dashboard data')
        setLoading(false)
      })
  }, [])

  const sales = snapshot?.atlas.sales
  const customers = snapshot?.atlas.customers
  const inventory = snapshot?.atlas.inventory
  const spark = snapshot?.spark

  const revenueChange = sales
    ? ((sales.today - sales.yesterday) / sales.yesterday) * 100
    : 0
  const weekChange = sales
    ? ((sales.thisWeek - sales.lastWeek) / sales.lastWeek) * 100
    : 0

  return (
    <>
      <Topbar
        title="Dashboard"
        subtitle={
          snapshot?.atlas?.business
            ? [
                snapshot.atlas.business.name,
                snapshot.atlas.business.city,
                snapshot.atlas.business.state,
              ]
                .filter(Boolean)
                .join(', ')
            : loading
            ? 'Loading…'
            : 'Your Business'
        }
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Error banner */}
        {error && !loading && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-300">
              Unable to load dashboard data — {error}.{' '}
              <button onClick={() => { setLoading(true); setError(null); fetch('/api/summary').then(r => r.json()).then(d => { setSnapshot(d); setLoading(false) }).catch(e => { setError(e?.message ?? 'Failed'); setLoading(false) }) }} className="underline hover:no-underline">
                Retry
              </button>
            </p>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <StatCard
                title="Today's Revenue"
                value={formatCurrency(sales?.today ?? 0)}
                change={revenueChange}
                changeLabel="vs yesterday"
                icon={TrendingUp}
                color="indigo"
                delay={0}
              />
              <StatCard
                title="Customers"
                value={formatNumber(customers?.total ?? 0)}
                change={((customers?.newThisMonth ?? 0) / (customers?.total ?? 1)) * 100}
                changeLabel="new this month"
                icon={Users}
                color="emerald"
                delay={100}
              />
              <StatCard
                title="Active Campaigns"
                value={String(spark?.campaigns.running ?? 0)}
                change={weekChange}
                changeLabel="vs last week"
                icon={Megaphone}
                color="purple"
                delay={200}
              />
              <StatCard
                title="WA Messages"
                value={formatNumber(spark?.whatsapp.messagesSentThisMonth ?? 0)}
                change={spark?.whatsapp.deliveryRate ?? 0}
                changeLabel="delivery rate"
                icon={MessageSquare}
                color="amber"
                delay={300}
              />
            </>
          )}
        </div>

        {/* Holi Campaign Banner */}
        {!loading && (
          <div className="bg-gradient-to-r from-pink-950/50 to-purple-950/50 border border-pink-500/20 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-white">
                Holi is 7 days away!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Launch a special offer campaign on Spark to boost sales. Last year shops saw 40% higher footfall.
              </p>
            </div>
            <a
              href={process.env.NEXT_PUBLIC_SPARK_URL || 'https://spark.astrastudio.in'}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 px-4 py-2 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-medium hover:bg-pink-500/20 transition-colors whitespace-nowrap"
            >
              Create Holi Campaign →
            </a>
          </div>
        )}

        {/* Chart + Insights Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            {loading ? (
              <div className="rounded-2xl bg-[#0F1629] border border-white/[0.06] h-64 animate-pulse" />
            ) : (
              <RevenueChart data={sales?.trend ?? []} />
            )}
          </div>
          <div>
            <InsightPreview />
          </div>
        </div>

        {/* Products + Activity Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading ? (
            <>
              <div className="rounded-2xl bg-[#0F1629] border border-white/[0.06] h-72 animate-pulse" />
              <div className="rounded-2xl bg-[#0F1629] border border-white/[0.06] h-72 animate-pulse" />
            </>
          ) : (
            <>
              <TopProducts products={inventory?.topProducts ?? []} />
              <CustomerActivity activity={customers?.recentActivity ?? []} />
            </>
          )}
        </div>
      </div>
    </>
  )
}
