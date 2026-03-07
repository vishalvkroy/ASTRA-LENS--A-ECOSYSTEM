'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Lightbulb,
  MessageCircle,
  Bell,
  Network,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'AI Insights', icon: Lightbulb, href: '/dashboard/insights' },
  { label: 'Chat Advisor', icon: MessageCircle, href: '/dashboard/chat' },
  { label: 'Smart Alerts', icon: Bell, href: '/dashboard/alerts', badge: 4 },
  { label: 'Ecosystem', icon: Network, href: '/dashboard/ecosystem' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-[#0A0F1E]/90 backdrop-blur-xl border-r border-white/[0.06] flex flex-col z-20">
      {/* Logo */}
      <div className="py-6 px-5">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-400 flex items-center justify-center text-white font-bold text-sm shadow-glow">
            L
          </div>
          <span className="text-white font-semibold text-sm tracking-tight">Astra Lens</span>
        </div>
        <div className="mt-5 border-t border-white/[0.06]" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 py-2.5 rounded-lg text-sm transition-all duration-200 group',
                isActive
                  ? 'text-indigo-400 bg-indigo-500/10 border-l-2 border-indigo-500 pl-[10px] pr-3'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05] px-3'
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-indigo-500/20 text-indigo-400 text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="border-t border-white/[0.06] p-4 mt-auto">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            RS
          </div>
          <div className="min-w-0">
            <p className="text-sm text-white font-medium truncate">Sharma General Store</p>
            <p className="text-xs text-slate-500">Kanpur, UP</p>
          </div>
        </div>
        <div className="flex gap-2">
          <a
            href={process.env.NEXT_PUBLIC_ATLAS_URL || 'https://atlas.astrastudio.in'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-indigo-400 transition-colors"
          >
            Atlas ↗
          </a>
          <span className="text-slate-700 text-xs">·</span>
          <a
            href={process.env.NEXT_PUBLIC_SPARK_URL || 'https://spark.astrastudio.in'}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 hover:text-indigo-400 transition-colors"
          >
            Spark ↗
          </a>
        </div>
      </div>
    </aside>
  )
}
