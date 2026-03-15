'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Lightbulb,
  MessageCircle,
  Bell,
  Network,
  Plug,
  X,
} from 'lucide-react'
import { LensMark } from '@/components/LensLogo'
import { cn } from '@/lib/utils'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'AI Insights', icon: Lightbulb, href: '/dashboard/insights' },
  { label: 'Chat Advisor', icon: MessageCircle, href: '/dashboard/chat' },
  { label: 'Smart Alerts', icon: Bell, href: '/dashboard/alerts', showAlertBadge: true },
  { label: 'Ecosystem', icon: Network, href: '/dashboard/ecosystem' },
  { label: 'Connect', icon: Plug, href: '/dashboard/connect', showConnectStatus: true },
]

function NavContent({
  pathname,
  alertCount,
  connected,
  onLinkClick,
}: {
  pathname: string
  alertCount: number | null
  connected: boolean | null
  onLinkClick?: () => void
}) {
  return (
    <>
      {/* Logo */}
      <div className="py-6 px-5">
        <div className="flex items-center gap-3">
          <LensMark size={32} />
          <span className="text-white font-semibold text-sm tracking-tight">Astra Lens</span>
        </div>
        <div className="mt-5 border-t border-white/[0.06]" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          const badge = item.showAlertBadge && alertCount ? alertCount : null

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onLinkClick}
              className={cn(
                'flex items-center gap-3 py-2.5 rounded-lg text-sm transition-all duration-200 group',
                isActive
                  ? 'text-indigo-400 bg-indigo-500/10 border-l-2 border-indigo-500 pl-[10px] pr-3'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.05] px-3'
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="flex-1">{item.label}</span>
              {badge && (
                <span className="ml-auto bg-rose-500/20 text-rose-400 text-xs px-1.5 py-0.5 rounded-full font-medium">
                  {badge}
                </span>
              )}
              {item.showConnectStatus && connected !== null && (
                <span className={cn(
                  'ml-auto w-2 h-2 rounded-full shrink-0',
                  connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                )} />
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
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-slate-500 cursor-default select-none">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
            Atlas
          </span>
          <span className="text-slate-700 text-xs">·</span>
          <a
            href={process.env.NEXT_PUBLIC_SPARK_URL || 'https://spark.astrastudio.in'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-orange-400 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60" />
            Spark ↗
          </a>
          <span className="ml-auto text-[10px] text-slate-600">
            {connected === null ? '' : connected ? 'Live' : 'Demo'}
          </span>
        </div>
      </div>
    </>
  )
}

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname()
  const [alertCount, setAlertCount] = useState<number | null>(null)
  const [connected, setConnected] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/alerts')
      .then((r) => r.json())
      .then((d) => setAlertCount(d?.counts?.total ?? 0))
      .catch(() => {})

    fetch('/api/connect')
      .then((r) => r.json())
      .then((d) => setConnected(d?.atlas?.reachable && d?.spark?.reachable))
      .catch(() => setConnected(false))
  }, [])

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-60 bg-[#0A0F1E]/90 backdrop-blur-xl border-r border-white/[0.06] flex-col z-20">
        <NavContent pathname={pathname} alertCount={alertCount} connected={connected} />
      </aside>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-screen w-72 bg-[#0A0F1E] border-r border-white/[0.06] flex flex-col z-50 transition-transform duration-300 md:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/[0.05] transition-colors"
        >
          <X size={18} />
        </button>
        <NavContent pathname={pathname} alertCount={alertCount} connected={connected} onLinkClick={onClose} />
      </aside>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0A0F1E]/95 backdrop-blur-md border-t border-white/[0.06] flex items-center">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          const badge = item.showAlertBadge && alertCount ? alertCount : null

          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex-1 flex flex-col items-center py-3 gap-1 relative"
            >
              <Icon
                size={20}
                className={cn(
                  'transition-colors',
                  isActive ? 'text-indigo-400' : 'text-slate-500'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-medium transition-colors',
                  isActive ? 'text-indigo-400' : 'text-slate-600'
                )}
              >
                {item.label.split(' ')[0]}
              </span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-indigo-500 rounded-full" />
              )}
              {badge && !isActive && (
                <span className="absolute top-2 right-[calc(50%-14px)] w-2 h-2 bg-rose-500 rounded-full" />
              )}
              {item.showConnectStatus && connected === false && !isActive && (
                <span className="absolute top-2 right-[calc(50%-14px)] w-2 h-2 bg-amber-400 rounded-full" />
              )}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
