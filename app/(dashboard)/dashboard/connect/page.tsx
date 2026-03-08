'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Zap, CheckCircle2, XCircle, RefreshCw,
  LayoutDashboard, Package, Users, FileText, BarChart3,
  MessageSquare, Megaphone, Video, Calendar, CreditCard,
  ExternalLink, AlertTriangle,
} from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { cn } from '@/lib/utils'

const ATLAS_URL = process.env.NEXT_PUBLIC_ATLAS_URL || 'https://atlas.astrastudio.in'
const SPARK_URL = process.env.NEXT_PUBLIC_SPARK_URL || 'https://spark.astrastudio.in'

interface ServiceStatus {
  devMode: boolean
  atlas: { reachable: boolean; url: string; usingMock: boolean }
  spark: { reachable: boolean; url: string; usingMock: boolean }
}

const atlasActions = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Inventory', icon: Package, path: '/inventory' },
  { label: 'Customers', icon: Users, path: '/customers' },
  { label: 'Invoices', icon: FileText, path: '/billing' },
  { label: 'Sales Report', icon: BarChart3, path: '/reports/sales' },
  { label: 'GST Report', icon: FileText, path: '/reports/gst' },
]

const sparkActions = [
  { label: 'Campaigns', icon: Megaphone, path: '/whatsapp/campaigns' },
  { label: 'New Campaign', icon: MessageSquare, path: '/whatsapp/campaigns/new' },
  { label: 'Reel Scripts', icon: Video, path: '/reelscript' },
  { label: 'Schedule Post', icon: Calendar, path: '/social/schedule' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Buy Credits', icon: CreditCard, path: '/whatsapp/bundles' },
]

function StatusBadge({ reachable, usingMock }: { reachable: boolean; usingMock: boolean }) {
  if (reachable) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live Data
      </span>
    )
  }
  if (usingMock) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Demo Data
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
      <XCircle size={11} />
      Unreachable
    </span>
  )
}

function PlatformCard({
  name, tagline, icon: Icon, color, baseUrl, status, actions, delay, isDesktopApp,
}: {
  name: string
  tagline: string
  icon: any
  color: 'blue' | 'orange'
  baseUrl: string
  status: { reachable: boolean; url: string; usingMock: boolean } | null
  actions: { label: string; icon: any; path: string }[]
  delay: number
  isDesktopApp?: boolean
}) {
  const colors = {
    blue: {
      border: 'border-blue-500/20',
      icon: 'from-blue-500 to-blue-600',
      text: 'text-blue-400',
      bg: 'bg-blue-500/10',
      hover: 'hover:bg-blue-500/15 hover:border-blue-500/30',
      actionHover: 'hover:bg-blue-500/10 hover:text-blue-300',
    },
    orange: {
      border: 'border-orange-500/20',
      icon: 'from-orange-500 to-orange-600',
      text: 'text-orange-400',
      bg: 'bg-orange-500/10',
      hover: 'hover:bg-orange-500/15 hover:border-orange-500/30',
      actionHover: 'hover:bg-orange-500/10 hover:text-orange-300',
    },
  }
  const c = colors[color]

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn('bg-[#0F1629] rounded-2xl border p-6 flex flex-col gap-5', c.border)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shadow-lg', c.icon)}>
            <Icon size={20} />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-slate-500">{tagline}</p>
          </div>
        </div>
        {status ? (
          <StatusBadge reachable={status.reachable} usingMock={status.usingMock} />
        ) : (
          <div className="w-20 h-6 rounded-full bg-white/[0.04] animate-pulse" />
        )}
      </div>

      {/* API URL */}
      {status && (
        <div className="bg-[#080D1A] rounded-lg px-3 py-2.5 border border-white/[0.05]">
          <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-widest">API Endpoint</p>
          <p className="text-xs text-slate-300 font-mono truncate">{status.url}</p>
        </div>
      )}

      {/* Status detail */}
      {status && (
        <div className="flex items-center gap-2">
          {status.reachable ? (
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
          )}
          <p className="text-xs text-slate-400">
            {status.reachable
              ? 'Connected — reading live data from your account'
              : status.usingMock
              ? 'Using demo data — connect your account to see real numbers'
              : 'Cannot reach API — check if the service is running'}
          </p>
        </div>
      )}

      {/* Divider */}
      <div className="border-t border-white/[0.05]" />

      {/* Quick actions */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">
          {isDesktopApp ? 'Available in App' : 'Quick Actions'}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => {
            const AIcon = action.icon
            if (isDesktopApp) {
              return (
                <div
                  key={action.path}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-xs text-slate-500 cursor-default select-none"
                >
                  <AIcon size={13} className="shrink-0" />
                  <span className="truncate">{action.label}</span>
                </div>
              )
            }
            return (
              <a
                key={action.path}
                href={`${baseUrl}${action.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg border border-white/[0.06] text-xs text-slate-400 transition-all duration-200 group',
                  c.actionHover
                )}
              >
                <AIcon size={13} className="shrink-0" />
                <span className="truncate">{action.label}</span>
                <ExternalLink size={10} className="ml-auto opacity-0 group-hover:opacity-60 shrink-0" />
              </a>
            )
          })}
        </div>
      </div>

      {/* Open platform button */}
      {isDesktopApp ? (
        <div className={cn(
          'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border cursor-default select-none',
          c.bg, c.border, c.text
        )}>
          <svg xmlns="http://www.w3.org/2000/svg" width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          Desktop Application
        </div>
      ) : (
        <a
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-medium border transition-all duration-200',
            c.bg, c.border, c.text, c.hover
          )}
        >
          <ExternalLink size={13} />
          Open {name}
        </a>
      )}
    </motion.div>
  )
}

export default function ConnectPage() {
  const [status, setStatus] = useState<ServiceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  async function checkStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/connect')
      const data = await res.json()
      setStatus(data)
      setLastChecked(new Date())
    } catch {
      // keep previous status
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { checkStatus() }, [])

  const bothConnected = status?.atlas.reachable && status?.spark.reachable
  const anyConnected = status?.atlas.reachable || status?.spark.reachable

  return (
    <>
      <Topbar
        title="Connect Platforms"
        subtitle="Link Astra Atlas and Spark to see your live business data"
      />

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">

        {/* Data source banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-xl border px-4 py-3 flex items-center justify-between gap-4',
            bothConnected
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : 'bg-amber-500/5 border-amber-500/20'
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn('w-2 h-2 rounded-full shrink-0', bothConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400')} />
            <p className="text-sm text-slate-300">
              {loading
                ? 'Checking connections...'
                : bothConnected
                ? 'Both platforms connected — Astra Lens is reading your live business data'
                : anyConnected
                ? 'Partial connection — some data is live, some is demo'
                : 'Running on demo data — connect your Atlas and Spark accounts to unlock live insights'}
            </p>
          </div>
          <button
            onClick={checkStatus}
            disabled={loading}
            className="shrink-0 flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
            {lastChecked ? `Checked ${lastChecked.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Refresh'}
          </button>
        </motion.div>

        {/* Platform cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <PlatformCard
            name="Astra Atlas"
            tagline="Billing · Inventory · Customers"
            icon={Building2}
            color="blue"
            baseUrl={ATLAS_URL}
            status={status?.atlas ?? null}
            actions={atlasActions}
            delay={0.1}
            isDesktopApp
          />
          <PlatformCard
            name="Astra Spark"
            tagline="WhatsApp · Campaigns · Reels"
            icon={Zap}
            color="orange"
            baseUrl={SPARK_URL}
            status={status?.spark ?? null}
            actions={sparkActions}
            delay={0.2}
          />
        </div>

        {/* How to connect */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#0F1629] rounded-2xl border border-white/[0.06] p-5"
        >
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
            How to connect
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: '1',
                title: 'Set API URLs',
                desc: 'Add your Atlas and Spark server URLs to server/.env — ATLAS_API_URL and SPARK_API_URL.',
                color: 'from-blue-500 to-indigo-500',
              },
              {
                step: '2',
                title: 'Set DEV_MODE=false',
                desc: 'In server/.env, change DEV_MODE to false so the backend calls real APIs instead of mock data.',
                color: 'from-indigo-500 to-purple-500',
              },
              {
                step: '3',
                title: 'Restart & Refresh',
                desc: 'Restart the Express server and click Refresh above. Green dots mean live data is flowing.',
                color: 'from-purple-500 to-orange-500',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-3">
                <div className={cn('w-7 h-7 rounded-full bg-gradient-to-br shrink-0 flex items-center justify-center text-white text-xs font-bold', item.color)}>
                  {item.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">{item.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

      </div>
    </>
  )
}
