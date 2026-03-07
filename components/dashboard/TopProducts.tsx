import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Product } from '@/lib/mock-data/types'
import { formatCurrency } from '@/lib/utils'

interface TopProductsProps {
  products: Product[]
}

function TrendBadge({ trend }: { trend: Product['trend'] }) {
  if (trend === 'up') return <TrendingUp size={12} className="text-emerald-400" />
  if (trend === 'down') return <TrendingDown size={12} className="text-rose-400" />
  return <Minus size={12} className="text-slate-400" />
}

export default function TopProducts({ products }: TopProductsProps) {
  const maxRevenue = Math.max(...products.map((p) => p.revenue))

  return (
    <div className="bg-[#0F1629] rounded-2xl p-6 border border-white/[0.06]">
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm font-semibold text-white">Top Products</p>
        <p className="text-xs text-slate-500">This month</p>
      </div>

      <div className="space-y-4">
        {products.map((product, i) => (
          <div key={product.id}>
            <div className="flex items-center gap-3 mb-1.5">
              <span className="text-xs text-slate-600 font-mono w-4 shrink-0">{i + 1}</span>
              <span className="text-sm text-white font-medium flex-1 min-w-0 truncate">
                {product.name}
              </span>
              <TrendBadge trend={product.trend} />
              <span className="text-sm text-slate-400 shrink-0">{formatCurrency(product.revenue)}</span>
            </div>
            <div className="ml-7 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                style={{ width: `${(product.revenue / maxRevenue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
