'use client'

import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import { useSidebar } from '@/lib/hooks/useSidebar'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

function LiveClock() {
  const [time, setTime] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()
      const day = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      const hrs = now.getHours()
      const mins = now.getMinutes().toString().padStart(2, '0')
      const ampm = hrs >= 12 ? 'PM' : 'AM'
      const hour12 = (hrs % 12 || 12).toString()
      setTime(`${day} · ${hour12}:${mins} ${ampm}`)
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  return <span className="text-xs text-slate-500 hidden sm:block whitespace-nowrap">{time}</span>
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { setOpen } = useSidebar()

  return (
    <header className="sticky top-0 z-10 h-16 bg-[#0A0F1E]/80 backdrop-blur-md border-b border-white/[0.06] flex items-center px-6 gap-4">
      {/* Mobile hamburger */}
      <button
        className="md:hidden text-slate-400 hover:text-white transition-colors"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-white leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-400 leading-tight truncate">{subtitle}</p>
        )}
      </div>

      {/* Live clock */}
      <LiveClock />

      {/* Action slot */}
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </header>
  )
}
