'use client'

import { Menu } from 'lucide-react'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Topbar({ title, subtitle, actions }: TopbarProps) {
  return (
    <header className="sticky top-0 z-10 h-16 bg-[#0A0F1E]/80 backdrop-blur-md border-b border-white/[0.06] flex items-center px-6 gap-4">
      {/* Mobile hamburger */}
      <button className="md:hidden text-slate-400 hover:text-white transition-colors">
        <Menu size={20} />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-white leading-tight truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-slate-400 leading-tight truncate">{subtitle}</p>
        )}
      </div>

      {/* Action slot */}
      {actions && <div className="flex items-center gap-3 shrink-0">{actions}</div>}
    </header>
  )
}
