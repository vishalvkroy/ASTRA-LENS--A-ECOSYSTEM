# Claude Prompt — Paste This Inside Astra Spark Chat
### Adds the "Astra Lens Integration" page to Spark Settings + generates splens1_ connection keys

---

```
You are working inside the Astra Spark codebase.

Spark already has the /api/lens/snapshot endpoint (from PROMPT_FOR_SPARK.md).
Now we need to add a Settings → Integrations → Astra Lens page where business owners can:
  1. See their generated Lens Connection Key (splens1_...)
  2. Copy it with one click
  3. Regenerate it if compromised

The connection key format is:
  splens1_ + base64( sparkPublicUrl + "|" + businessId + "|" + LENS_API_KEY )

This single key contains everything Astra Lens needs. The user copies it from here
and pastes it into Astra Lens → Connect → Spark section. No other input needed.

---

## STEP 1 — Add helper function to apps/api/src/lib/lens-key.ts (NEW FILE)

```typescript
/**
 * Generates the Lens connection key for a Spark business.
 * Format: splens1_ + base64( url | businessId | LENS_API_KEY )
 *
 * This key is pasted into Astra Lens → Connect → Spark.
 * It encodes everything Lens needs to call Spark's /api/lens/snapshot endpoint.
 */
export function generateLensConnectionKey(businessId: string): string {
  const url = process.env.PUBLIC_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://spark.astrastudio.in'
  const apiKey = process.env.LENS_API_KEY

  if (!apiKey) {
    throw new Error('LENS_API_KEY is not set. Add it to apps/api/.env to enable Lens integration.')
  }

  const raw = `${url}|${businessId}|${apiKey}`
  return 'splens1_' + Buffer.from(raw).toString('base64')
}

/**
 * Returns true if LENS_API_KEY is configured on this server.
 */
export function isLensConfigured(): boolean {
  return !!process.env.LENS_API_KEY
}
```

---

## STEP 2 — Add API routes to apps/api/src/routes/lens-integration.routes.ts (NEW FILE)

```typescript
/**
 * Lens Integration Settings Routes
 * Allows business owners to get/regenerate their Lens connection key.
 *
 * Auth: standard JWT middleware (same as other settings routes)
 * All routes require authenticated business user.
 */

import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { generateLensConnectionKey, isLensConfigured } from '../lib/lens-key'

// Import your existing auth middleware
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

/**
 * GET /api/settings/lens-integration
 * Returns the current Lens connection key for the authenticated business.
 */
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    // businessId comes from the JWT middleware — the authenticated business
    const businessId: string = (req as any).businessId || (req as any).user?.businessId

    if (!businessId) {
      return res.status(401).json({ error: 'Unauthorized', message: 'No business context' })
    }

    if (!isLensConfigured()) {
      return res.status(503).json({
        error: 'NotConfigured',
        message: 'Lens integration is not enabled on this server. Add LENS_API_KEY to .env',
        configured: false,
      })
    }

    const connectionKey = generateLensConnectionKey(businessId)

    return res.json({
      configured: true,
      connectionKey,
      keyPrefix: 'splens1_',
      instructions: 'Copy this key and paste it in Astra Lens → Connect → Spark section.',
    })
  } catch (err: any) {
    console.error('[LensIntegration] Error generating key:', err.message)
    return res.status(500).json({ error: 'InternalError', message: err.message })
  }
})

/**
 * POST /api/settings/lens-integration/regenerate
 * Generates a new LENS_API_KEY and returns the updated connection key.
 *
 * NOTE: This regenerates the key in memory only. For a proper implementation,
 * you should persist the new key to the database and update process.env.LENS_API_KEY
 * so existing connections are invalidated. In production, prefer rotating via
 * your deployment platform's environment variable management.
 */
router.post('/regenerate', authMiddleware, async (req: Request, res: Response) => {
  const businessId: string = (req as any).businessId || (req as any).user?.businessId

  if (!businessId) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // Generate a new 32-byte random key
  const newKey = 'lsk_' + crypto.randomBytes(24).toString('hex')

  // WARNING: This only updates in-memory for the current server process.
  // You MUST also update LENS_API_KEY in your .env / deployment platform.
  // After regenerating, update Astra Lens with the new connection key.
  process.env.LENS_API_KEY = newKey

  try {
    const connectionKey = generateLensConnectionKey(businessId)
    return res.json({
      success: true,
      connectionKey,
      warning: 'Update LENS_API_KEY in your server .env to persist this change across restarts.',
    })
  } catch (err: any) {
    return res.status(500).json({ error: 'InternalError', message: err.message })
  }
})

export default router
```

---

## STEP 3 — Register the route in apps/api/src/app.ts

Find where other settings routes are registered (look for lines like):
```typescript
import settingsRoutes from './routes/settings.routes'
app.use('/api/settings', settingsRoutes)
```

Add alongside them:
```typescript
import lensIntegrationRoutes from './routes/lens-integration.routes'

// Lens Integration settings
app.use('/api/settings/lens-integration', lensIntegrationRoutes)
```

---

## STEP 4 — Add the UI component (Spark Frontend)

Create a new component wherever your Settings page components live.
File: `LensIntegrationCard.tsx` (or similar, in your settings components folder)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, RefreshCw, AlertTriangle, Loader2, Zap } from 'lucide-react'

interface LensIntegrationData {
  configured: boolean
  connectionKey?: string
  instructions?: string
  error?: string
}

export function LensIntegrationCard() {
  const [data, setData] = useState<LensIntegrationData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  useEffect(() => { fetchKey() }, [])

  async function fetchKey() {
    setLoading(true)
    try {
      const res = await fetch('/api/settings/lens-integration', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        // Adjust auth header to match your Spark auth pattern
      })
      const json = await res.json()
      setData(json)
    } catch {
      setData({ configured: false, error: 'Failed to load integration settings' })
    } finally {
      setLoading(false)
    }
  }

  async function copyKey() {
    if (!data?.connectionKey) return
    await navigator.clipboard.writeText(data.connectionKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  async function regenerate() {
    setRegenerating(true)
    setShowConfirm(false)
    try {
      const res = await fetch('/api/settings/lens-integration/regenerate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        // Adjust auth header
      })
      const json = await res.json()
      if (json.success) {
        setData(prev => prev ? { ...prev, connectionKey: json.connectionKey } : null)
      }
    } finally {
      setRegenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 p-6 flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">Loading Lens integration...</span>
      </div>
    )
  }

  if (!data?.configured) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-2">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle size={16} />
          <p className="text-sm font-medium">Lens Integration Not Configured</p>
        </div>
        <p className="text-xs text-slate-400">
          Add <code className="bg-white/10 px-1 rounded">LENS_API_KEY=&lt;any-secret&gt;</code> to your server{' '}
          <code className="bg-white/10 px-1 rounded">apps/api/.env</code> and restart to enable this integration.
        </p>
      </div>
    )
  }

  const maskedKey = data.connectionKey
    ? data.connectionKey.slice(0, 20) + '••••••••••••••••••••'
    : ''

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-[#0F1629] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Astra Lens Integration</p>
          <p className="text-xs text-slate-500">AI business intelligence for your Spark data</p>
        </div>
        <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          Active
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* Instructions */}
        <div className="bg-orange-500/5 border border-orange-500/15 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-orange-400">How to connect</p>
          <ol className="space-y-1">
            {[
              'Copy your connection key below',
              'Open Astra Lens in your browser',
              'Go to Connect → Spark section',
              'Paste the key and click Connect',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Connection Key */}
        <div>
          <p className="text-[11px] text-slate-400 mb-2 font-medium">Your Connection Key</p>
          <div className="flex items-center gap-2 bg-[#080D1A] border border-white/[0.08] rounded-xl px-4 py-3">
            <code className="flex-1 text-xs text-slate-300 font-mono truncate">{maskedKey}</code>
            <button
              onClick={copyKey}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-white/[0.08] hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-all shrink-0"
            >
              {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
              {copied ? 'Copied!' : 'Copy Key'}
            </button>
          </div>
          <p className="text-[10px] text-slate-600 mt-1.5">
            This key grants read-only access to your Spark data. Keep it secret.
          </p>
        </div>

        {/* Regenerate */}
        <div className="pt-1">
          {showConfirm ? (
            <div className="flex items-center gap-3">
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <AlertTriangle size={11} />
                This will invalidate your current key. Update Lens after regenerating.
              </p>
              <button
                onClick={regenerate}
                disabled={regenerating}
                className="text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors shrink-0"
              >
                {regenerating ? 'Regenerating...' : 'Yes, Regenerate'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="text-xs text-slate-500 hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors"
            >
              <RefreshCw size={11} />
              Regenerate key
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
```

---

## STEP 5 — Add to Spark Settings page

In your Settings page (wherever you render settings sections), import and render:

```tsx
import { LensIntegrationCard } from '@/components/settings/LensIntegrationCard'

// In your Settings page JSX:
<section>
  <h2 className="text-lg font-semibold mb-4">Integrations</h2>
  <LensIntegrationCard />
</section>
```

---

## VERIFICATION

After applying these changes, restart Spark and verify:

```bash
# Get integration key (replace with your actual auth token)
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/settings/lens-integration"

# Expected response:
{
  "configured": true,
  "connectionKey": "splens1_aHR0cHM6...",
  "keyPrefix": "splens1_",
  "instructions": "Copy this key and paste it in Astra Lens → Connect → Spark section."
}

# Decode to verify contents (the key encodes: url|businessId|LENS_API_KEY):
node -e "console.log(Buffer.from('aHR0cHM6...', 'base64').toString())"
# Expected: https://spark.astrastudio.in|<businessId>|<LENS_API_KEY>
```

Then in Astra Lens:
1. Go to Connect page
2. Paste the `splens1_...` key into the Spark card
3. Click Connect → should show "Connected successfully!"

---

## IMPORTANT NOTES

1. The key format is: `splens1_` + base64(`{sparkUrl}|{businessId}|{LENS_API_KEY}`)
   - `sparkUrl` = your Spark server's public URL
   - `businessId` = the authenticated business's UUID
   - `LENS_API_KEY` = shared secret set in Spark's .env

2. Lens decodes this on the server side (never in the browser) and stores parts separately.

3. If you rotate `LENS_API_KEY` in Spark's .env, existing Lens connections will break.
   The business owner must get a new key from Spark → Settings → Integrations and reconnect.

4. DO NOT add this key to URL query params or log it anywhere. Treat it like a password.

Output: List every file created/modified, confirm the /api/settings/lens-integration endpoint
works and returns a valid splens1_ key.
```
