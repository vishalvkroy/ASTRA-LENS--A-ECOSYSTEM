import type { CustomerActivity as CustomerActivityType } from '@/lib/mock-data/types'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CustomerActivityProps {
  activity: CustomerActivityType[]
}

const avatarGradients = [
  'from-indigo-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-sky-500 to-blue-600',
]

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function actionColor(action: CustomerActivityType['action']) {
  if (action === 'New') return 'text-emerald-400'
  if (action === 'Return') return 'text-rose-400'
  return 'text-slate-400'
}

export default function CustomerActivity({ activity }: CustomerActivityProps) {
  return (
    <div className="bg-[#0F1629] rounded-2xl p-6 border border-white/[0.06]">
      <p className="text-sm font-semibold text-white mb-5">Recent Activity</p>

      <div className="space-y-0">
        {activity.map((entry, i) => (
          <div
            key={`${entry.customerId}-${i}`}
            className={cn(
              'flex items-center gap-3 py-3',
              i < activity.length - 1 && 'border-b border-white/[0.04]'
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-9 h-9 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shrink-0',
                avatarGradients[i % avatarGradients.length]
              )}
            >
              {getInitials(entry.name)}
            </div>

            {/* Name + action */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">{entry.name}</p>
              <p className="text-xs text-slate-500 truncate">
                <span className={actionColor(entry.action)}>{entry.action}</span>
                {entry.items.length > 0 && ` — ${entry.items.slice(0, 2).join(', ')}`}
              </p>
            </div>

            {/* Amount + time */}
            <div className="text-right shrink-0">
              <p className="text-sm font-semibold text-emerald-400">{formatCurrency(entry.amount)}</p>
              <p className="text-xs text-slate-600">{entry.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
