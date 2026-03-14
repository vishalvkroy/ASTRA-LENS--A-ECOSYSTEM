'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Building2, Zap, CheckCircle2, XCircle, RefreshCw,
  Loader2, ChevronDown, ChevronRight, Copy, Check,
  Unlink, AlertTriangle, ArrowRight, Wifi, WifiOff,
  Shield, Key,
} from 'lucide-react'
import Topbar from '@/components/layout/Topbar'
import { cn } from '@/lib/utils'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CredStatus {
  hasKey: boolean
  lastUpdatedAt: string | null
  url: string | null
}

interface SparkCredStatus extends CredStatus {
  businessId: string | null
}

interface Credentials {
  tenantId?: string
  atlas: CredStatus
  spark: SparkCredStatus
}

interface ServiceStatus {
  tenantId?: string
  devMode: boolean
  atlas: { reachable: boolean; url: string | null; usingMock: boolean; configured: boolean }
  spark: { reachable: boolean; url: string | null; usingMock: boolean; configured: boolean }
}

// ── Client-side key validation ────────────────────────────────────────────────

function detectKeyService(key: string): 'atlas' | 'spark' | 'wrong-atlas' | 'wrong-spark' | null {
  const k = key.trim()
  if (k.startsWith('atlens1_')) return 'atlas'
  if (k.startsWith('splens1_')) return 'spark'
  // Helpful: detect if user pasted the wrong service's key
  if (k.startsWith('atlens')) return 'wrong-atlas'
  if (k.startsWith('splens')) return 'wrong-spark'
  return null
}

function isValidKeyFormat(key: string, expectedService: 'atlas' | 'spark'): boolean {
  if (expectedService === 'atlas') return key.trim().startsWith('atlens1_') && key.trim().length > 10
  return key.trim().startsWith('splens1_') && key.trim().length > 10
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function timeSince(isoDate: string | null | undefined): string {
  if (!isoDate) return 'previously'
  const diff = Date.now() - new Date(isoDate).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
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
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-all"
    >
      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
      {copied ? 'Copied!' : label}
    </button>
  )
}

// ── ConnectionCard ────────────────────────────────────────────────────────────

function ConnectionCard({
  service,
  name,
  tagline,
  icon: Icon,
  color,
  keyPrefix,
  keyPlaceholder,
  instructions,
  helpSteps,
  creds,
  status,
  tenantId,
  onRefresh,
}: {
  service: 'atlas' | 'spark'
  name: string
  tagline: string
  icon: any
  color: 'blue' | 'orange'
  keyPrefix: string
  keyPlaceholder: string
  instructions: string
  helpSteps: string[]
  creds: CredStatus | SparkCredStatus
  status: ServiceStatus['atlas'] | null
  tenantId: string
  onRefresh: () => void
}) {
  const [key, setKey] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null)
  const [validationError, setValidationError] = useState('')
  const [diagnosing, setDiagnosing] = useState(false)
  const [diagnoseError, setDiagnoseError] = useState<string | null>(null)

  const c = color === 'blue'
    ? { border: 'border-blue-500/20', icon: 'from-blue-500 to-blue-600', text: 'text-blue-400', bg: 'bg-blue-500/10', ring: 'focus:border-blue-500/40', btn: 'bg-blue-500 hover:bg-blue-600', accent: 'border-blue-500/30 bg-blue-500/5' }
    : { border: 'border-orange-500/20', icon: 'from-orange-500 to-orange-600', text: 'text-orange-400', bg: 'bg-orange-500/10', ring: 'focus:border-orange-500/40', btn: 'bg-orange-500 hover:bg-orange-600', accent: 'border-orange-500/30 bg-orange-500/5' }

  const isConnected = creds.hasKey
  const isReachable = status?.reachable ?? false

  function handleKeyChange(val: string) {
    setKey(val)
    setValidationError('')
    setResult(null)

    if (!val.trim()) return

    const detected = detectKeyService(val)
    if (detected === 'wrong-atlas' || detected === 'wrong-spark') {
      const wrongName = detected === 'wrong-atlas' ? 'Atlas' : 'Spark'
      const rightName = service === 'atlas' ? 'Atlas' : 'Spark'
      if (wrongName !== rightName) {
        setValidationError(`This looks like a ${wrongName} key. Paste it in the ${wrongName} card instead.`)
      }
    }
  }

  async function handleConnect() {
    const trimmed = key.trim()
    if (!trimmed) { setValidationError('Paste your connection key first'); return }

    if (!isValidKeyFormat(trimmed, service)) {
      setValidationError(
        `${name} keys start with ${keyPrefix}. Check you copied the full key.`
      )
      return
    }

    setConnecting(true)
    setResult(null)
    try {
      const res = await fetch('/api/connect/connect-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ connectionKey: trimmed }),
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setResult({ ok: false, message: data.message || 'Connection failed. Check your key and try again.' })
        return
      }

      if (data.reachable) {
        setResult({ ok: true, message: 'Connected successfully!' })
      } else {
        setResult({
          ok: false,
          message: 'Key saved but service is unreachable right now. Check that the server is running.',
        })
      }

      setKey('')
      onRefresh()
    } catch {
      setResult({ ok: false, message: 'Could not reach Lens server. Is it running?' })
    } finally {
      setConnecting(false)
    }
  }

  async function handleDiagnose() {
    setDiagnosing(true)
    setDiagnoseError(null)
    try {
      const res = await fetch('/api/connect/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ service }),
      })
      const data = await res.json()
      if (data.reachable) {
        setDiagnoseError(null)
        onRefresh()
      } else {
        setDiagnoseError(data.errorMessage || 'Unknown error — check server logs')
      }
    } catch {
      setDiagnoseError('Could not reach Lens backend')
    } finally {
      setDiagnosing(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      await fetch('/api/connect/connect-key', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ service }),
      })
      setResult(null)
      onRefresh()
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-[#0F1629] rounded-2xl border overflow-hidden', c.border)}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0', c.icon)}>
            <Icon size={20} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{name}</p>
            <p className="text-xs text-slate-500">{tagline}</p>
          </div>
        </div>

        {/* Status badge */}
        {isConnected ? (
          isReachable ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Data
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full shrink-0">
              <WifiOff size={10} />
              Key Saved
            </span>
          )
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-slate-500 bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full shrink-0">
            <XCircle size={10} />
            Not Connected
          </span>
        )}
      </div>

      <div className="px-5 pb-5 space-y-4">
        <AnimatePresence mode="wait">
          {isConnected && !reconnecting ? (
            /* ── Connected state ── */
            <motion.div
              key="connected"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <div className={cn('rounded-xl border p-4 flex items-start gap-3', c.accent)}>
                <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', c.text)}>
                    {name} Connected
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isReachable
                      ? 'Reading live data from your account'
                      : diagnoseError
                      ? diagnoseError
                      : 'Server may be offline — tap "Why?" to diagnose'}
                  </p>
                  {creds.lastUpdatedAt && (
                    <p className="text-[11px] text-slate-500 mt-1.5">
                      Key saved {timeSince(creds.lastUpdatedAt)}
                    </p>
                  )}
                  {creds.url && (
                    <p className="text-[11px] font-mono text-slate-500 mt-0.5 truncate">
                      {creds.url}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => { setReconnecting(true); setResult(null); setDiagnoseError(null) }}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 px-3 py-2 rounded-lg transition-all"
                >
                  <RefreshCw size={11} />
                  Reconnect
                </button>
                {!isReachable && (
                  <button
                    onClick={handleDiagnose}
                    disabled={diagnosing}
                    className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 border border-amber-500/20 hover:border-amber-500/40 px-3 py-2 rounded-lg transition-all"
                  >
                    {diagnosing ? <Loader2 size={11} className="animate-spin" /> : <AlertTriangle size={11} />}
                    {diagnosing ? 'Testing...' : 'Why offline?'}
                  </button>
                )}
                <button
                  onClick={handleDisconnect}
                  disabled={disconnecting}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors ml-auto"
                >
                  {disconnecting ? <Loader2 size={11} className="animate-spin" /> : <Unlink size={11} />}
                  Disconnect
                </button>
              </div>
            </motion.div>
          ) : (
            /* ── Not connected / reconnect state ── */
            <motion.div
              key="connect"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {/* How to get key */}
              <div className={cn('rounded-xl border p-3.5 space-y-2.5', c.accent)}>
                <p className={cn('text-xs font-medium flex items-center gap-2', c.text)}>
                  <Key size={11} />
                  {instructions}
                </p>
                <ol className="space-y-1.5">
                  {helpSteps.map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className={cn('w-4 h-4 rounded-full text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-semibold', c.bg, c.text)}>
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Key input */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    value={key}
                    onChange={(e) => handleKeyChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text').trim()
                      setKey(pasted)
                      handleKeyChange(pasted)
                    }}
                    placeholder={keyPlaceholder}
                    className={cn(
                      'flex-1 min-w-0 bg-[#080D1A] border border-white/[0.08] rounded-lg px-3 py-2',
                      'text-xs text-white font-mono placeholder:text-slate-600',
                      'focus:outline-none transition-colors',
                      c.ring,
                      validationError && 'border-rose-500/40'
                    )}
                  />
                  <button
                    onClick={handleConnect}
                    disabled={connecting || !key.trim()}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium text-white transition-all shrink-0',
                      c.btn,
                      (connecting || !key.trim()) && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {connecting
                      ? <Loader2 size={12} className="animate-spin" />
                      : <ArrowRight size={12} />}
                    {connecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>

                {validationError && (
                  <p className="text-xs text-rose-400 flex items-center gap-1.5">
                    <AlertTriangle size={11} className="shrink-0" />
                    {validationError}
                  </p>
                )}

                {result && (
                  <p className={cn('text-xs flex items-center gap-1.5', result.ok ? 'text-emerald-400' : 'text-rose-400')}>
                    {result.ok
                      ? <CheckCircle2 size={11} className="shrink-0" />
                      : <AlertTriangle size={11} className="shrink-0" />}
                    {result.message}
                  </p>
                )}
              </div>

              {reconnecting && (
                <button
                  onClick={() => { setReconnecting(false); setKey(''); setResult(null) }}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  ← Keep current connection
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Advanced Settings (tenant ID) ─────────────────────────────────────────────

const TENANT_ID_PATTERN = /^[a-zA-Z0-9._-]{2,64}$/

function AdvancedSettings({
  tenantId, onTenantChange,
}: { tenantId: string; onTenantChange: (id: string) => void }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(tenantId)

  useEffect(() => setDraft(tenantId), [tenantId])

  function apply() {
    const normalized = draft.trim().toLowerCase()
    const valid = normalized && TENANT_ID_PATTERN.test(normalized) ? normalized : 'default'
    onTenantChange(valid)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('astra_tenant_id', valid)
    }
  }

  return (
    <div className="border border-white/[0.05] rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs text-slate-500 hover:text-slate-300 transition-colors"
      >
        <span className="flex items-center gap-2">
          <Shield size={12} />
          Advanced Settings
          <span className="font-mono text-slate-600">workspace: {tenantId}</span>
        </span>
        {open ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/[0.05]"
          >
            <div className="p-4 space-y-3 bg-[#080D1A]">
              <div>
                <p className="text-[11px] text-slate-400 mb-1.5 font-medium">Workspace / Tenant ID</p>
                <div className="flex gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && apply()}
                    placeholder="default"
                    className="flex-1 bg-[#0F1629] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-slate-600 focus:outline-none focus:border-white/20"
                  />
                  <button
                    onClick={apply}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-white/[0.07] hover:bg-white/[0.12] text-white border border-white/[0.08] transition-colors"
                  >
                    Apply
                  </button>
                </div>
                <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                  For businesses with multiple locations. Use different workspace IDs per location to keep credentials separate. Most users can leave this as "default".
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function ConnectPage() {
  const [tenantId, setTenantId] = useState('default')
  const [status, setStatus] = useState<ServiceStatus | null>(null)
  const [creds, setCreds] = useState<Credentials>({
    atlas: { hasKey: false, lastUpdatedAt: null, url: null },
    spark: { hasKey: false, lastUpdatedAt: null, url: null, businessId: null },
  })
  const [loading, setLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem('astra_tenant_id') : null
    setTenantId(stored || 'default')
  }, [])

  const refresh = useCallback(async (tid = tenantId) => {
    setLoading(true)
    try {
      const q = `?tenantId=${encodeURIComponent(tid)}`
      const h = { 'x-tenant-id': tid }
      const [statusRes, credsRes] = await Promise.all([
        fetch(`/api/connect${q}`, { headers: h }),
        fetch(`/api/connect/setup${q}`, { headers: h }),
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

  useEffect(() => { refresh(tenantId) }, [tenantId])

  const bothLive = status?.atlas.reachable && status?.spark.reachable
  const anyLive = status?.atlas.reachable || status?.spark.reachable
  const bothConnected = creds.atlas.hasKey && creds.spark.hasKey

  return (
    <>
      <Topbar
        title="Connect"
        subtitle="Link your Atlas and Spark accounts — one key each, done"
      />

      <div className="p-6 max-w-3xl mx-auto w-full space-y-5">

        {/* Status banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'rounded-xl border px-4 py-3 flex items-center justify-between gap-4',
            bothLive
              ? 'bg-emerald-500/5 border-emerald-500/20'
              : bothConnected
              ? 'bg-blue-500/5 border-blue-500/20'
              : 'bg-white/[0.02] border-white/[0.06]'
          )}
        >
          <div className="flex items-center gap-3">
            {loading
              ? <Loader2 size={13} className="animate-spin text-slate-400 shrink-0" />
              : <div className={cn('w-2 h-2 rounded-full shrink-0', bothLive ? 'bg-emerald-400 animate-pulse' : anyLive ? 'bg-amber-400' : 'bg-slate-600')} />}
            <p className="text-xs text-slate-300">
              {loading
                ? 'Checking connections...'
                : bothLive
                ? 'Both services live — Lens is reading your real business data'
                : anyLive
                ? 'One service connected — connect the other for full insights'
                : bothConnected
                ? 'Keys saved — services appear offline right now'
                : 'Connect Atlas and Spark to unlock live intelligence'}
            </p>
          </div>
          <button
            onClick={() => refresh(tenantId)}
            disabled={loading}
            className="shrink-0 text-xs text-slate-500 hover:text-white flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={12} className={cn(loading && 'animate-spin')} />
            {lastChecked
              ? lastChecked.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
              : 'Refresh'}
          </button>
        </motion.div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ConnectionCard
            service="atlas"
            name="Astra Atlas"
            tagline="Billing · Inventory · Customers"
            icon={Building2}
            color="blue"
            keyPrefix="atlens1_"
            keyPlaceholder="atlens1_..."
            instructions="How to get your Atlas connection key"
            helpSteps={[
              'Open Astra Atlas on your desktop',
              'Go to Settings → Integrations',
              'Click "Astra Lens" → Generate Connection Key',
              'Copy the key and paste it here',
            ]}
            creds={creds.atlas}
            status={status?.atlas ?? null}
            tenantId={tenantId}
            onRefresh={() => refresh(tenantId)}
          />

          <ConnectionCard
            service="spark"
            name="Astra Spark"
            tagline="WhatsApp · Campaigns · Reels"
            icon={Zap}
            color="orange"
            keyPrefix="splens1_"
            keyPlaceholder="splens1_..."
            instructions="How to get your Spark connection key"
            helpSteps={[
              'Open Astra Spark in your browser',
              'Go to Settings → Integrations → Astra Lens',
              'Click "Generate Connection Key"',
              'Copy the key and paste it here',
            ]}
            creds={creds.spark}
            status={status?.spark ?? null}
            tenantId={tenantId}
            onRefresh={() => refresh(tenantId)}
          />
        </div>

        {/* Security note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
        >
          <Shield size={13} className="text-slate-500 shrink-0" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Connection keys are encrypted with AES-256-GCM and stored securely on the server. Keys are never exposed in the UI after saving.
          </p>
        </motion.div>

        {/* Advanced Settings */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <AdvancedSettings
            tenantId={tenantId}
            onTenantChange={(id) => {
              setTenantId(id)
            }}
          />
        </motion.div>
      </div>
    </>
  )
}
