'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Zap, CheckCircle2, XCircle, RefreshCw,
  LayoutDashboard, Package, Users, FileText, BarChart3,
  MessageSquare, Megaphone, Video, Calendar, CreditCard,
  ExternalLink, AlertTriangle, Key, Eye, EyeOff, Link2, Unlink,
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

interface Credentials {
  atlas: { hasKey: boolean }
  spark: { hasKey: boolean }
}

function ApiKeyInput({
  label, icon: Icon, color, placeholder, instructions,
  hasKey, onSave, onDisconnect,
}: {
  label: string
  icon: any
  color: 'blue' | 'orange'
  placeholder: string
  instructions: string
  hasKey: boolean
  onSave: (key: string) => Promise<void>
  onDisconnect: () => Promise<void>
}) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const colors = {
    blue: { border: 'border-blue-500/20', text: 'text-blue-400', bg: 'bg-blue-500/10', btn: 'bg-blue-500 hover:bg-blue-600' },
    orange: { border: 'border-orange-500/20', text: 'text-orange-400', bg: 'bg-orange-500/10', btn: 'bg-orange-500 hover:bg-orange-600' },
  }
  const c = colors[color]

  async function handleSave() {
    if (!value.trim()) { setError('Please enter your API key'); return }
    setSaving(true); setError('')
    try {
      await onSave(value.trim())
      setValue('')
    } catch {
      setError('Failed to save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  if (hasKey) {
    return (
      <div className={cn('rounded-xl border p-4 flex items-center justify-between gap-3', c.border, c.bg)}>
        <div className="flex items-center gap-3">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <div>
            <p className={cn('text-sm font-medium', c.text)}>{label} Connected</p>
            <p className="text-xs text-slate-500 mt-0.5">API key is active · resets on server restart</p>
          </div>
        </div>
        <button
          onClick={onDisconnect}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors shrink-0"
        >
          <Unlink size={12} />
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Icon size={14} className={c.text} />
        <p className="text-sm font-medium text-white">{label}</p>
      </div>
      <p className="text-xs text-slate-400">{instructions}</p>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={(e) => { setValue(e.target.value); setError('') }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder={placeholder}
            className="w-full bg-[#080D1A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-white/20 pr-8"
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {show ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={cn('px-4 py-2 rounded-lg text-xs font-medium text-white transition-colors shrink-0 flex items-center gap-1.5', c.btn)}
        >
          <Link2 size={12} />
          {saving ? 'Saving...' : 'Connect'}
        </button>
      </div>
      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

export default function ConnectPage() {
  const [status, setStatus] = useState<ServiceStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [creds, setCreds] = useState<Credentials>({ atlas: { hasKey: false }, spark: { hasKey: false } })

  async function checkStatus() {
    setLoading(true)
    try {
      const [statusRes, credsRes] = await Promise.all([
        fetch('/api/connect'),
        fetch('/api/connect/setup'),
      ])
      const [statusData, credsData] = await Promise.all([statusRes.json(), credsRes.json()])
      setStatus(statusData)
      setCreds(credsData)
      setLastChecked(new Date())
    } catch {
      // keep previous status
    } finally {
      setLoading(false)
    }
  }

  async function saveKey(service: 'atlas' | 'spark', key: string) {
    const body = service === 'atlas' ? { atlasApiKey: key } : { sparkApiKey: key }
    const res = await fetch('/api/connect/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.success) {
      setCreds(data)
      await checkStatus()
    }
  }

  async function clearKey(service: 'atlas' | 'spark') {
    const body = service === 'atlas' ? { atlasApiKey: '' } : { sparkApiKey: '' }
    const res = await fetch('/api/connect/setup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    const data = await res.json()
    if (data.success) {
      setCreds(data)
      await checkStatus()
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

        {/* Link Account */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-[#0F1629] rounded-2xl border border-white/[0.06] p-5 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Key size={14} className="text-slate-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
              Link Your Accounts
            </p>
          </div>

          <ApiKeyInput
            label="Astra Atlas"
            icon={Building2}
            color="blue"
            placeholder="Paste your Atlas API key..."
            instructions="Open Atlas → Settings → Integrations → Generate API Key → Copy it here"
            hasKey={creds.atlas.hasKey}
            onSave={(key) => saveKey('atlas', key)}
            onDisconnect={() => clearKey('atlas')}
          />

          <ApiKeyInput
            label="Astra Spark"
            icon={Zap}
            color="orange"
            placeholder="Paste your Spark API key..."
            instructions="Open Spark → Settings → API Access → Generate Key → Copy it here"
            hasKey={creds.spark.hasKey}
            onSave={(key) => saveKey('spark', key)}
            onDisconnect={() => clearKey('spark')}
          />

          <p className="text-[10px] text-slate-600 leading-relaxed">
            Keys are stored in memory on the server and cleared on restart. For permanent storage, add them to your Render environment variables as <span className="font-mono">ATLAS_API_KEY</span> and <span className="font-mono">SPARK_API_KEY</span>.
          </p>
        </motion.div>

      </div>
    </>
  )
}
