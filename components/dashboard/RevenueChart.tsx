'use client'

import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { DailySale } from '@/lib/mock-data/types'
import { formatCurrency } from '@/lib/utils'

interface RevenueChartProps {
  data: DailySale[]
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDay(dateStr: string) {
  const d = new Date(dateStr)
  return DAY_LABELS[d.getDay()]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload as DailySale
  return (
    <div className="bg-[#1E2A45] border border-white/10 rounded-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{formatCurrency(entry.amount)}</p>
      <p className="text-xs text-slate-400 mt-0.5">{entry.transactions} transactions</p>
    </div>
  )
}

function CustomDot(props: any) {
  const { cx, cy, index, data } = props
  if (index !== data.length - 1) return null
  return (
    <g>
      <circle cx={cx} cy={cy} r={6} fill="#6366F1" stroke="#0F1629" strokeWidth={2} />
      <circle cx={cx} cy={cy} r={10} fill="none" stroke="#6366F1" strokeWidth={1} opacity={0.4} />
    </g>
  )
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-[#0F1629] rounded-2xl p-6 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-white">Revenue Trend</p>
        <p className="text-xs text-slate-500">Last 7 days</p>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
              <stop offset="100%" stopColor="rgba(99,102,241,0.0)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDay}
            tick={{ fill: '#64748B', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(99,102,241,0.2)', strokeWidth: 1 }} />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="#6366F1"
            strokeWidth={2}
            fill="url(#revenueGradient)"
            dot={(props: any) => <CustomDot {...props} data={data} />}
            activeDot={{ r: 4, fill: '#6366F1', stroke: '#0F1629', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
