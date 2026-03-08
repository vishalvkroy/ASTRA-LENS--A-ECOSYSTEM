'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Building2, Zap, CheckCircle2, XCircle, RefreshCw,
  LayoutDashboard, Package, Users, FileText, BarChart3,
  MessageSquare, Megaphone, Video, Calendar, CreditCard,
  ExternalLink, AlertTriangle, Key, Eye, EyeOff, Link2, Unlink,
  Loader2, Wifi, WifiOff, ChevronRight, Copy, Check, Info,
} from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { cn } from '@/lib/utils'

const SPARK_WEB_URL = process.env.NEXT_PUBLIC_SPARK_URL || 'https://spark.astrastudio.in'
const TENANT_ID_PATTERN = /^[a-zA-Z0-9._-]{2,64}$/

// ── Types ──────────────────────────────────────────────────────────────────────

interface ServiceStatus {
  tenantId?: string
  devMode: boolean
  atlas: { reachable: boolean; url: string; usingMock: boolean; configured: boolean }
  spark: { reachable: boolean; url: string; usingMock: boolean; configured: boolean }
}

interface Credentials {
  tenantId?: string
  atlas: { hasKey: boolean; lastUpdatedAt?: string | null; url?: string | null }
  spark: { hasKey: boolean; lastUpdatedAt?: string | null; url?: string | null; businessId?: string | null }
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function normalizeTenantId(raw: string): string {
  const value = raw.trim().toLowerCase()
  if (!value || !TENANT_ID_PATTERN.test(value)) return 'default'
  return value
}

function StatusBadge({
  reachable, configured, usingMock,
}: { reachable: boolean; configured: boolean; usingMock: boolean }) {
  if (reachable) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        Live Data
      </span>
    )
  }
  if (configured && !reachable) {
    return (
      <span className="flex items-center gap-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
        <WifiOff size={10} />
        Unreachable
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
    <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-full">
      <XCircle size={10} />
      Not Connected
    </span>
  )
}

// ── Copy Button ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors px-2 py-1 rounded border border-white/[0.06] hover:border-white/20"
    >
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ── Field Input ────────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, mono, secret, hint, disabled,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  mono?: boolean
  secret?: boolean
  hint?: string
  disabled?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] text-slate-400 font-medium">{label}</label>
      <div className="relative">
        <input
          type={secret && !show ? 'password' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'w-full bg-[#080D1A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white',
            'placeholder:text-slate-600 focus:outline-none focus:border-white/20 transition-colors',
            mono && 'font-mono',
            secret && 'pr-8',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        />
        {secret && (
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
          >
            {show ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-slate-500 leading-relaxed">{hint}</p>}
    </div>
  )
}

// ── Test Connection Button ─────────────────────────────────────────────────────

function TestButton({
  service, tenantId, onResult,
}: { service: 'atlas' | 'spark'; tenantId: string; onResult: (ok: boolean) => void }) {
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<boolean | null>(null)

  async function test() {
    setTesting(true)
    setResult(null)
    try {
      const res = await fetch('/api/connect/setup', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ service }),
      })
      const data = await res.json()
      setResult(data.reachable === true)
      onResult(data.reachable === true)
    } catch {
      setResult(false)
      onResult(false)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={test}
        disabled={testing}
        className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] px-3 py-2 rounded-lg transition-all"
      >
        {testing ? <Loader2 size={12} className="animate-spin" /> : <Wifi size={12} />}
        {testing ? 'Testing...' : 'Test Connection'}
      </button>
      {result === true && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 size={13} /> Connected!
        </span>
      )}
      {result === false && (
        <span className="flex items-center gap-1.5 text-xs text-rose-400">
          <XCircle size={13} /> Unreachable
        </span>
      )}
    </div>
  )
}

// ── Atlas Setup Section ────────────────────────────────────────────────────────

function AtlasSetup({
  tenantId, creds, onSaved,
}: {
  tenantId: string
  creds: Credentials
  onSaved: () => void
}) {
  const [url, setUrl] = useState(creds.atlas.url || '')
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [testOk, setTestOk] = useState<boolean | null>(null)

  useEffect(() => {
    setUrl(creds.atlas.url || '')
    setKey('')
    setTestOk(null)
  }, [creds.atlas.url, creds.atlas.hasKey])

  async function save() {
    if (!url.trim()) { setError('Server URL is required'); return }
    setSaving(true)
    setError('')
    try {
      const body: any = { tenantId, atlasUrl: url.trim() }
      if (key.trim()) body.atlasApiKey = key.trim()
      const res = await fetch('/api/connect/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setKey('')
        onSaved()
      } else {
        setError(data.error || 'Save failed')
      }
    } catch {
      setError('Backend unreachable. Is the server running?')
    } finally {
      setSaving(false)
    }
  }

  async function disconnect() {
    setSaving(true)
    try {
      await fetch('/api/connect/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ tenantId, atlasApiKey: '', atlasUrl: '' }),
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-[#0F1629] rounded-2xl border border-blue-500/20 p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Astra Atlas</p>
            <p className="text-xs text-slate-500">Billing · Inventory · Customers</p>
          </div>
        </div>
        {creds.atlas.hasKey && (
          <span className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
            <CheckCircle2 size={11} /> Key Saved
          </span>
        )}
      </div>

      {/* How to get key */}
      <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 space-y-2">
        <p className="text-xs font-medium text-blue-400 flex items-center gap-2">
          <Info size={12} /> How to get your Atlas API key
        </p>
        <ol className="space-y-1">
          {[
            'Open Astra Atlas on your desktop',
            'Go to Settings → Integrations',
            'Click "Generate API Key"',
            'Copy the key and paste it below',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
              <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <Field
          label="Atlas Server URL"
          value={url}
          onChange={setUrl}
          placeholder="http://your-atlas-server:4000"
          mono
          hint="The URL where your Atlas server is running. For local: http://localhost:4000"
        />
        <Field
          label={creds.atlas.hasKey ? 'API Key (leave blank to keep current)' : 'API Key'}
          value={key}
          onChange={setKey}
          placeholder={creds.atlas.hasKey ? '••••• leave blank to keep saved key •••••' : 'Paste Atlas API key from Settings → Integrations'}
          secret
          hint={
            creds.atlas.lastUpdatedAt
              ? `Key last updated: ${new Date(creds.atlas.lastUpdatedAt).toLocaleString('en-IN')}`
              : undefined
          }
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
          {saving ? 'Saving...' : 'Save & Connect'}
        </button>

        {creds.atlas.hasKey && (
          <>
            <TestButton service="atlas" tenantId={tenantId} onResult={setTestOk} />
            <button
              onClick={disconnect}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors ml-auto"
            >
              <Unlink size={12} /> Disconnect
            </button>
          </>
        )}
      </div>

      {error && <p className="text-xs text-rose-400 flex items-center gap-1.5"><AlertTriangle size={11} />{error}</p>}
    </motion.div>
  )
}

// ── Spark Setup Section ────────────────────────────────────────────────────────

function SparkSetup({
  tenantId, creds, onSaved,
}: {
  tenantId: string
  creds: Credentials
  onSaved: () => void
}) {
  const [url, setUrl] = useState(creds.spark.url || 'https://spark.astrastudio.in')
  const [businessId, setBusinessId] = useState(creds.spark.businessId || '')
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [testOk, setTestOk] = useState<boolean | null>(null)

  useEffect(() => {
    setUrl(creds.spark.url || 'https://spark.astrastudio.in')
    setBusinessId(creds.spark.businessId || '')
    setKey('')
    setTestOk(null)
  }, [creds.spark.url, creds.spark.businessId, creds.spark.hasKey])

  async function save() {
    if (!url.trim()) { setError('Server URL is required'); return }
    if (!businessId.trim()) { setError('Business ID is required'); return }
    if (!creds.spark.hasKey && !key.trim()) { setError('Integration key is required'); return }

    setSaving(true)
    setError('')
    try {
      const body: any = {
        tenantId,
        sparkUrl: url.trim(),
        sparkBusinessId: businessId.trim(),
      }
      if (key.trim()) body.sparkApiKey = key.trim()

      const res = await fetch('/api/connect/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        setKey('')
        onSaved()
      } else {
        setError(data.error || 'Save failed')
      }
    } catch {
      setError('Backend unreachable. Is the server running?')
    } finally {
      setSaving(false)
    }
  }

  async function disconnect() {
    setSaving(true)
    try {
      await fetch('/api/connect/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ tenantId, sparkApiKey: '', sparkUrl: '', sparkBusinessId: '' }),
      })
      onSaved()
    } finally {
      setSaving(false)
    }
  }

  const setupSteps = [
    {
      num: 1,
      title: 'Add the integration endpoint to Spark',
      body: (
        <p className="text-xs text-slate-400 leading-relaxed">
          In your Spark server, add a{' '}
          <code className="bg-white/[0.05] px-1 py-0.5 rounded text-orange-300">LENS_API_KEY</code>{' '}
          to <code className="bg-white/[0.05] px-1 py-0.5 rounded text-orange-300">apps/api/.env</code>.
          This is the shared secret Lens uses to authenticate when reading your Spark data.
          Use any secure random string — 32+ characters recommended.
        </p>
      ),
    },
    {
      num: 2,
      title: 'Apply the PROMPT_FOR_SPARK.md code to Spark',
      body: (
        <p className="text-xs text-slate-400 leading-relaxed">
          Follow the steps in{' '}
          <code className="bg-white/[0.05] px-1 py-0.5 rounded text-orange-300">PROMPT_FOR_SPARK.md</code>{' '}
          in this repo to add the Lens snapshot endpoint to Spark. This creates{' '}
          <code className="bg-white/[0.05] px-1 py-0.5 rounded text-orange-300">GET /api/lens/snapshot</code>{' '}
          which Lens calls to read your campaign and WhatsApp data.
        </p>
      ),
    },
    {
      num: 3,
      title: 'Find your Spark Business ID',
      body: (
        <p className="text-xs text-slate-400 leading-relaxed">
          In Spark, go to <strong className="text-white">Settings → Business</strong>.
          Copy the Business ID (UUID format:{' '}
          <code className="bg-white/[0.05] px-1 py-0.5 rounded text-slate-300">xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx</code>).
          Paste it in the Business ID field below.
        </p>
      ),
    },
    {
      num: 4,
      title: 'Enter your details below and save',
      body: (
        <p className="text-xs text-slate-400">
          Enter the Spark server URL, your Business ID, and the same{' '}
          <code className="bg-white/[0.05] px-1 py-0.5 rounded text-orange-300">LENS_API_KEY</code>{' '}
          value you set in Spark. Click Save.
        </p>
      ),
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-[#0F1629] rounded-2xl border border-orange-500/20 p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
            <Zap size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Astra Spark</p>
            <p className="text-xs text-slate-500">WhatsApp · Campaigns · Reels</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {creds.spark.hasKey && (
            <span className="text-xs text-emerald-400 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              <CheckCircle2 size={11} /> Key Saved
            </span>
          )}
          <a
            href={SPARK_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 transition-colors"
          >
            Open Spark <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Setup guide */}
      <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4 space-y-4">
        <p className="text-xs font-medium text-orange-400 flex items-center gap-2">
          <Info size={12} /> Setup guide — Connecting Spark to Lens
        </p>
        <div className="space-y-4">
          {setupSteps.map((step) => (
            <div key={step.num} className="flex gap-3">
              <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                {step.num}
              </span>
              <div className="space-y-1 flex-1">
                <p className="text-xs font-medium text-white">{step.title}</p>
                {step.body}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-3">
        <Field
          label="Spark Server URL"
          value={url}
          onChange={setUrl}
          placeholder="https://spark.astrastudio.in"
          mono
          hint="The URL where your Spark API server is running"
        />
        <Field
          label="Spark Business ID"
          value={businessId}
          onChange={setBusinessId}
          placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          mono
          hint="Find this in Spark → Settings → Business → Business ID (UUID)"
        />
        <Field
          label={
            creds.spark.hasKey
              ? 'Integration Key (LENS_API_KEY) — leave blank to keep current'
              : 'Integration Key (LENS_API_KEY)'
          }
          value={key}
          onChange={setKey}
          placeholder={
            creds.spark.hasKey
              ? '••••• leave blank to keep saved key •••••'
              : 'The LENS_API_KEY value set in your Spark .env'
          }
          secret
          hint={
            creds.spark.lastUpdatedAt
              ? `Key last updated: ${new Date(creds.spark.lastUpdatedAt).toLocaleString('en-IN')}`
              : 'This must match the LENS_API_KEY in your Spark server .env'
          }
        />
      </div>

      {/* Config summary if already connected */}
      {creds.spark.businessId && (
        <div className="bg-[#080D1A] rounded-lg px-3 py-2.5 border border-white/[0.05] space-y-1">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Current Config</p>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Business ID</span>
            <span className="text-[11px] font-mono text-slate-300 truncate ml-2">{creds.spark.businessId}</span>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-orange-500 hover:bg-orange-600 text-white transition-colors"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
          {saving ? 'Saving...' : 'Save & Connect'}
        </button>

        {creds.spark.hasKey && (
          <>
            <TestButton service="spark" tenantId={tenantId} onResult={setTestOk} />
            <button
              onClick={disconnect}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors ml-auto"
            >
              <Unlink size={12} /> Disconnect
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="text-xs text-rose-400 flex items-center gap-1.5">
          <AlertTriangle size={11} />{error}
        </p>
      )}
    </motion.div>
  )
}

// ── Quick action grids shown in the status cards ───────────────────────────────

const atlasActions = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Inventory', icon: Package },
  { label: 'Customers', icon: Users },
  { label: 'Invoices', icon: FileText },
  { label: 'Sales Report', icon: BarChart3 },
  { label: 'GST Report', icon: FileText },
]

const sparkActions = [
  { label: 'Campaigns', icon: Megaphone, path: '/whatsapp/campaigns' },
  { label: 'New Campaign', icon: MessageSquare, path: '/whatsapp/campaigns/new' },
  { label: 'Reel Scripts', icon: Video, path: '/reelscript' },
  { label: 'Schedule Post', icon: Calendar, path: '/social/schedule' },
  { label: 'Analytics', icon: BarChart3, path: '/analytics' },
  { label: 'Buy Credits', icon: CreditCard, path: '/whatsapp/bundles' },
]

// ── Status Overview Cards ──────────────────────────────────────────────────────

function ServiceCard({
  name, tagline, icon: Icon, color, status, actions, baseUrl, delay, isDesktopApp,
}: {
  name: string
  tagline: string
  icon: any
  color: 'blue' | 'orange'
  status: ServiceStatus['atlas'] | null
  actions: { label: string; icon: any; path?: string }[]
  baseUrl?: string
  delay: number
  isDesktopApp?: boolean
}) {
  const c = color === 'blue' ? {
    border: 'border-blue-500/20',
    gradient: 'from-blue-500 to-blue-600',
    text: 'text-blue-400',
    bg: 'bg-blue-500/10',
    hover: 'hover:bg-blue-500/10 hover:text-blue-300',
  } : {
    border: 'border-orange-500/20',
    gradient: 'from-orange-500 to-orange-600',
    text: 'text-orange-400',
    bg: 'bg-orange-500/10',
    hover: 'hover:bg-orange-500/10 hover:text-orange-300',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={cn('bg-[#0F1629] rounded-2xl border p-5 flex flex-col gap-4', c.border)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg', c.gradient)}>
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-slate-500">{tagline}</p>
          </div>
        </div>
        {status ? (
          <StatusBadge
            reachable={status.reachable}
            configured={status.configured}
            usingMock={status.usingMock}
          />
        ) : (
          <div className="w-20 h-6 rounded-full bg-white/[0.04] animate-pulse" />
        )}
      </div>

      {status && (
        <div className="bg-[#080D1A] rounded-lg px-3 py-2 border border-white/[0.05]">
          <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-widest">API Endpoint</p>
          <p className="text-xs text-slate-300 font-mono truncate">{status.url}</p>
        </div>
      )}

      {status && (
        <div className="flex items-center gap-2">
          {status.reachable
            ? <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
            : <AlertTriangle size={13} className="text-amber-400 shrink-0" />}
          <p className="text-xs text-slate-400">
            {status.reachable
              ? 'Connected — reading live data from your account'
              : status.configured
              ? 'Configured but unreachable — check if service is running'
              : 'Not connected — use the setup below to connect'}
          </p>
        </div>
      )}

      <div className="border-t border-white/[0.05] pt-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
          {isDesktopApp ? 'Available in Desktop App' : 'Quick Actions'}
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {actions.map((action, i) => {
            const AIcon = action.icon
            if (isDesktopApp || !action.path || !baseUrl) {
              return (
                <div key={i} className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-white/[0.04] text-[11px] text-slate-500 cursor-default select-none">
                  <AIcon size={11} className="shrink-0" />
                  <span className="truncate">{action.label}</span>
                </div>
              )
            }
            return (
              <a
                key={i}
                href={`${baseUrl}${action.path}`}
                target="_blank"
                rel="noopener noreferrer"
                className={cn('flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-white/[0.04] text-[11px] text-slate-400 transition-all', c.hover)}
              >
                <AIcon size={11} className="shrink-0" />
                <span className="truncate">{action.label}</span>
              </a>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const [tenantId, setTenantId] = useState('default')
  const [tenantDraft, setTenantDraft] = useState('default')
  const [status, setStatus] = useState<ServiceStatus | null>(null)
  const [creds, setCreds] = useState<Credentials>({
    atlas: { hasKey: false, lastUpdatedAt: null, url: null },
    spark: { hasKey: false, lastUpdatedAt: null, url: null, businessId: null },
  })
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('astra_tenant_id') : null
    const initial = normalizeTenantId(stored || 'default')
    setTenantId(initial)
    setTenantDraft(initial)
  }, [])

  const checkStatus = useCallback(async (tid = tenantId) => {
    setLoading(true)
    try {
      const q = `?tenantId=${encodeURIComponent(tid)}`
      const headers = { 'x-tenant-id': tid }
      const [statusRes, credsRes] = await Promise.all([
        fetch(`/api/connect${q}`, { headers }),
        fetch(`/api/connect/setup${q}`, { headers }),
      ])
      const [statusData, credsData] = await Promise.all([statusRes.json(), credsRes.json()])
      setStatus(statusData)
      setCreds(credsData)
      setLastChecked(new Date())
    } catch {
      // keep previous
    } finally {
      setLoading(false)
    }
  }, [tenantId])

  useEffect(() => { checkStatus(tenantId) }, [tenantId])

  function applyTenant() {
    const normalized = normalizeTenantId(tenantDraft)
    setTenantId(normalized)
    setTenantDraft(normalized)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('astra_tenant_id', normalized)
    }
  }

  const bothConnected = !!(status?.atlas.reachable && status?.spark.reachable)
  const anyConnected = !!(status?.atlas.reachable || status?.spark.reachable)

  return (
    <>
      <Topbar
        title="Connect Platforms"
        subtitle="Link Astra Atlas and Spark to see your live business data"
      />

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">

        {/* Status Banner */}
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
                ? 'Both platforms connected — Lens is reading your live business data'
                : anyConnected
                ? 'Partial connection — some data is live, some is demo'
                : 'Running on demo data — connect your Atlas and Spark accounts below'}
            </p>
          </div>
          <button
            onClick={() => checkStatus(tenantId)}
            disabled={loading}
            className="shrink-0 flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={13} className={cn(loading && 'animate-spin')} />
            {lastChecked
              ? `Checked ${lastChecked.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`
              : 'Refresh'}
          </button>
        </motion.div>

        {/* Service Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ServiceCard
            name="Astra Atlas"
            tagline="Billing · Inventory · Customers"
            icon={Building2}
            color="blue"
            status={status?.atlas ?? null}
            actions={atlasActions}
            delay={0.1}
            isDesktopApp
          />
          <ServiceCard
            name="Astra Spark"
            tagline="WhatsApp · Campaigns · Reels"
            icon={Zap}
            color="orange"
            status={status?.spark ?? null}
            actions={sparkActions}
            baseUrl={SPARK_WEB_URL}
            delay={0.15}
          />
        </div>

        {/* Tenant ID */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#0F1629] rounded-2xl border border-white/[0.06] p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Key size={13} className="text-slate-400" />
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Workspace / Tenant ID</p>
          </div>
          <div className="flex gap-2">
            <input
              value={tenantDraft}
              onChange={(e) => setTenantDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyTenant()}
              placeholder="default"
              className="flex-1 bg-[#080D1A] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-white/20"
            />
            <button
              onClick={applyTenant}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-white/[0.07] hover:bg-white/[0.11] text-white transition-colors border border-white/[0.08]"
            >
              Apply
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Active tenant: <span className="font-mono text-slate-300">{tenantId}</span>.
            API keys are isolated per tenant — each tenant has its own Atlas and Spark connection.
          </p>
        </motion.div>

        {/* Atlas Setup */}
        <AtlasSetup tenantId={tenantId} creds={creds} onSaved={() => checkStatus(tenantId)} />

        {/* Spark Setup */}
        <SparkSetup tenantId={tenantId} creds={creds} onSaved={() => checkStatus(tenantId)} />

        {/* Footer note */}
        <p className="text-[11px] text-slate-600 text-center leading-relaxed pb-2">
          API keys are encrypted with AES-256-GCM and stored per tenant on the server.
          Env var defaults apply when no saved key is present.
        </p>
      </div>
    </>
  )
}
