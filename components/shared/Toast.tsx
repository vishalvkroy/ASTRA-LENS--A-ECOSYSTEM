'use client'

import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Toast as ToastItem } from '@/lib/hooks/useToast'

const typeStyles = {
  success: {
    container: 'bg-emerald-950/90 border-emerald-500/30',
    icon: 'text-emerald-400',
    text: 'text-emerald-100',
    Icon: CheckCircle,
  },
  error: {
    container: 'bg-rose-950/90 border-rose-500/30',
    icon: 'text-rose-400',
    text: 'text-rose-100',
    Icon: AlertCircle,
  },
  info: {
    container: 'bg-indigo-950/90 border-indigo-500/30',
    icon: 'text-indigo-400',
    text: 'text-indigo-100',
    Icon: Info,
  },
}

interface ToastListProps {
  toasts: ToastItem[]
  dismiss: (id: string) => void
}

export default function ToastList({ toasts, dismiss }: ToastListProps) {
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => {
        const s = typeStyles[t.type]
        const Icon = s.Icon
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-xl',
              'pointer-events-auto',
              'animate-[slideIn_0.3s_ease_forwards]',
              s.container
            )}
          >
            <Icon size={16} className={s.icon} />
            <span className={cn('text-sm font-medium flex-1', s.text)}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="text-white/40 hover:text-white/80 transition-colors ml-1"
            >
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
