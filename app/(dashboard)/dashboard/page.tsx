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

  useEffect(() => {
    fetch('/api/summary')
      .then((r) => r.json())
      .then((data) => {
        setSnapshot(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
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
        subtitle="Sharma General Store — Kanpur, UP"
      />

      <div className="p-6 space-y-6 max-w-7xl mx-auto w-full">
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
