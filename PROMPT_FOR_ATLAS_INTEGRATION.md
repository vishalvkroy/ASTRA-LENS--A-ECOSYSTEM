# Claude Prompt — Paste This Inside Astra Atlas Chat
### Adds the "Astra Lens Integration" page to Atlas Settings + generates atlens1_ connection keys

---

```
You are working inside the Astra Atlas codebase.

Atlas already has the /api/lens/snapshot endpoint and integrationAuthMiddleware.
Now we need to add a Settings → Integrations → Astra Lens page where business owners can:
  1. See their generated Lens Connection Key (atlens1_...)
  2. Copy it with one click
  3. Regenerate it if compromised

The connection key format is:
  atlens1_ + base64( atlasServerUrl + "|" + apiKey )

This two-part key encodes everything Astra Lens needs to reach Atlas.
The user copies it from here and pastes it into Astra Lens → Connect → Atlas section.
No other input needed — no URLs, no UUIDs, no technical fields.

---

## ARCHITECTURE NOTES

Atlas uses:
  - Fastify (not Express) — routes use fastify.get(), fastify.post(), not router.get()
  - Raw pg pool (not Prisma) — DB queries use pool.query()
  - integrationAuthMiddleware — reads x-api-key header, resolves tenant/business from it
  - PUBLIC_URL env var for the server's own public URL

The connection key has ONLY TWO PARTS (unlike Spark which has three):
  atlasServerUrl | apiKey
  ↑ already known from server env   ↑ the business's existing API key

Lens decodes the key → extracts url + apiKey → uses x-api-key: <apiKey> header to call Atlas.

---

## STEP 1 — Add helper to src/lib/lens-key.ts (NEW FILE)

```typescript
/**
 * Generates the Lens connection key for an Atlas business.
 * Format: atlens1_ + base64( atlasServerUrl | apiKey )
 *
 * This key is pasted into Astra Lens → Connect → Atlas.
 * It encodes everything Lens needs to call Atlas's /api/lens/snapshot endpoint.
 *
 * Key is deterministic — same business always gets the same key.
 * To invalidate, the business must rotate their Atlas API key.
 */
export function generateLensConnectionKey(apiKey: string): string {
  const url = process.env.PUBLIC_URL || process.env.ATLAS_PUBLIC_URL || 'https://atlas.astrastudio.in'

  if (!apiKey) {
    throw new Error('apiKey is required to generate a Lens connection key.')
  }

  const raw = `${url}|${apiKey}`
  return 'atlens1_' + Buffer.from(raw).toString('base64')
}
```

---

## STEP 2 — Add Fastify route plugin to src/routes/lens-integration.routes.ts (NEW FILE)

```typescript
/**
 * Lens Integration Routes — Fastify plugin
 *
 * Allows business owners to get their Lens connection key.
 * Auth: integrationAuthMiddleware (reads x-api-key header, resolves business)
 *
 * Routes:
 *   GET  /api/lens-integration        → returns the connection key for this business
 *   POST /api/lens-integration/copy   → (optional) log copy event for analytics
 *
 * NOTE: We do NOT expose a /regenerate endpoint here because the Atlas "API key"
 * is the business's primary access credential — it is managed on the main
 * Settings → API page. If they rotate it there, the connection key auto-updates
 * because it is derived from the current key. Instruct them to re-copy from here.
 */

import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify'
import { generateLensConnectionKey } from '../lib/lens-key'

// Type for the authenticated request (after integrationAuthMiddleware enriches it)
interface AuthenticatedRequest extends FastifyRequest {
  businessApiKey?: string   // the raw API key from x-api-key header
  tenantId?: string         // the resolved tenant/business ID
}

const lensIntegrationRoutes: FastifyPluginAsync = async (fastify) => {

  /**
   * GET /api/lens-integration
   * Returns the current Lens connection key for the authenticated business.
   *
   * The API key used to authenticate THIS request IS the business's Atlas API key.
   * We embed it into the connection key — no separate "Lens API key" needed.
   */
  fastify.get(
    '/',
    { preHandler: [fastify.integrationAuthMiddleware] },
    async (request: AuthenticatedRequest, reply: FastifyReply) => {
      try {
        const apiKey = request.businessApiKey

        if (!apiKey) {
          return reply.status(401).send({
            error: 'Unauthorized',
            message: 'No API key found in request context.',
          })
        }

        const connectionKey = generateLensConnectionKey(apiKey)

        return reply.send({
          configured: true,
          connectionKey,
          keyPrefix: 'atlens1_',
          instructions: 'Copy this key and paste it in Astra Lens → Connect → Atlas section.',
        })
      } catch (err: any) {
        request.log.error({ err }, '[LensIntegration] Error generating key')
        return reply.status(500).send({ error: 'InternalError', message: err.message })
      }
    }
  )

}

export default lensIntegrationRoutes
```

---

## STEP 3 — Register the route in your main Fastify app (app.ts or server.ts)

Find where other routes are registered. It will look like:

```typescript
import settingsRoutes from './routes/settings.routes'
fastify.register(settingsRoutes, { prefix: '/api/settings' })
```

Add alongside them:

```typescript
import lensIntegrationRoutes from './routes/lens-integration.routes'

// Lens Integration — business owners get their Lens connection key here
fastify.register(lensIntegrationRoutes, { prefix: '/api/lens-integration' })
```

---

## STEP 4 — Expose the businessApiKey on authenticated requests

Check your integrationAuthMiddleware. It already reads x-api-key and resolves the tenant.
We need it to also attach the raw key to the request object so our route can read it.

Find your middleware (likely in src/middleware/integrationAuth.ts or similar):

```typescript
// BEFORE (typical existing code):
export async function integrationAuthMiddleware(request, reply) {
  const apiKey = request.headers['x-api-key']
  // ... validates key, looks up business ...
  request.tenantId = resolvedTenantId
  // (stops here — does not attach the key itself)
}

// AFTER — add one line:
export async function integrationAuthMiddleware(request, reply) {
  const apiKey = request.headers['x-api-key'] as string
  // ... validates key, looks up business ...
  request.tenantId = resolvedTenantId
  request.businessApiKey = apiKey   // ← ADD THIS LINE
}
```

Also add the type declaration. In the same file or a types file:

```typescript
declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string
    businessApiKey?: string
  }
}
```

---

## STEP 5 — Add the UI component (Atlas Frontend)

Create a new component wherever your Settings page components live.
File: `LensIntegrationCard.tsx` (in your settings/integrations components folder)

```tsx
'use client'

import { useEffect, useState } from 'react'
import { Copy, Check, AlertTriangle, Loader2, Zap, Info } from 'lucide-react'

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

  useEffect(() => { fetchKey() }, [])

  async function fetchKey() {
    setLoading(true)
    try {
      // Replace /api/lens-integration with your Atlas API base path if different
      // Auth: include the business's existing API key (same as how you auth other Atlas API calls)
      const res = await fetch('/api/lens-integration', {
        headers: {
          'x-api-key': getStoredApiKey(), // use however you normally pass the API key in Atlas UI
        },
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

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 p-6 flex items-center gap-3">
        <Loader2 size={16} className="animate-spin text-slate-400" />
        <span className="text-sm text-slate-400">Loading Lens integration...</span>
      </div>
    )
  }

  if (!data?.configured || data.error) {
    return (
      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 space-y-2">
        <div className="flex items-center gap-2 text-amber-400">
          <AlertTriangle size={16} />
          <p className="text-sm font-medium">Lens Integration Unavailable</p>
        </div>
        <p className="text-xs text-slate-400">
          {data?.error || 'Could not generate a connection key. Make sure you are authenticated.'}
        </p>
      </div>
    )
  }

  const maskedKey = data.connectionKey
    ? data.connectionKey.slice(0, 22) + '••••••••••••••••••••'
    : ''

  return (
    <div className="rounded-2xl border border-blue-500/20 bg-[#0F1629] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Zap size={18} className="text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Astra Lens Integration</p>
          <p className="text-xs text-slate-500">AI business intelligence powered by your Atlas data</p>
        </div>
        <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
          Active
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* How to connect */}
        <div className="bg-blue-500/5 border border-blue-500/15 rounded-xl p-4 space-y-2">
          <p className="text-xs font-medium text-blue-400">How to connect Astra Lens</p>
          <ol className="space-y-1">
            {[
              'Copy your connection key below',
              'Open Astra Lens in your browser',
              'Go to Connect → Atlas section',
              'Paste the key and click Connect',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-bold">
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
            This key grants read-only access to your Atlas data. Treat it like a password.
          </p>
        </div>

        {/* Rotation note */}
        <div className="flex items-start gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
          <Info size={12} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-slate-500 leading-relaxed">
            This key is derived from your Atlas API key. If you ever rotate your API key
            in Settings → API, return here to copy a new connection key and update Astra Lens.
          </p>
        </div>
      </div>
    </div>
  )
}
```

---

## STEP 6 — Add to Atlas Settings page

In your Settings page (wherever you render settings sections), import and render:

```tsx
import { LensIntegrationCard } from '@/components/settings/LensIntegrationCard'

// In your Settings page JSX:
// IMPORTANT: Render LensIntegrationCard OUTSIDE any existing "Integrations" list/count.
// It should appear as its own dedicated section — do NOT push it into the array/list
// used to count or render third-party integrations. It is a first-party Astra product,
// not a user-added integration. Do not increment any integration badge or counter for it.
<section>
  <h2 className="text-lg font-semibold mb-4">Astra Lens</h2>
  <p className="text-xs text-slate-500 mb-4">
    Connect Astra Lens to get AI-powered insights from your Atlas data.
  </p>
  <LensIntegrationCard />
</section>
```

Place this section SEPARATELY from (above or below) any "Third-party Integrations" section
that has a count badge like "3 integrations". The Lens card must not affect that count.

---

## KEY DESIGN DECISIONS

### Why no /regenerate endpoint?

In Atlas, the connection key is derived directly from the business's existing API key.
There is no separate "Lens API key" — the same key used to authenticate Atlas API calls
is embedded in the connection key.

This means:
  - No extra key to manage
  - Key is always in sync — no drift between Atlas and Lens
  - To "rotate" the Lens key: rotate the Atlas API key in Settings → API (already exists)
  - After rotating, the user re-copies the new key from this page and re-pastes into Lens

This is simpler and safer than maintaining a separate secret.

### Why x-api-key and not JWT?

Atlas already uses x-api-key for all integration authentication (integrationAuthMiddleware).
Lens uses the same mechanism. No new auth system needed.

### Two parts, not three

Atlas: atlens1_ + base64(url | apiKey)    ← 2 parts
Spark: splens1_ + base64(url | businessId | lensApiKey)  ← 3 parts (needs businessId separately)

Atlas doesn't need a separate businessId because the tenant IS identified by the API key itself.

---

## VERIFICATION

After applying these changes, restart Atlas and verify:

```bash
# Get integration key (replace with your actual Atlas API key)
curl -H "x-api-key: <your-atlas-api-key>" \
  "http://localhost:4000/api/lens-integration"

# Expected response:
{
  "configured": true,
  "connectionKey": "atlens1_aHR0cHM6Ly9hdGxhcy5hc3Ryc...",
  "keyPrefix": "atlens1_",
  "instructions": "Copy this key and paste it in Astra Lens → Connect → Atlas section."
}

# Decode to verify contents (the key encodes: url|apiKey):
node -e "console.log(Buffer.from('aHR0cHM6Ly9hdGxhcy5hc3Ryc...', 'base64').toString())"
# Expected: https://atlas.astrastudio.in|<your-atlas-api-key>
```

Then in Astra Lens:
1. Go to Connect page
2. Paste the `atlens1_...` key into the Atlas card
3. Click Connect → should show "Connected successfully!"

---

## FILES TO CREATE / MODIFY

| File | Action |
|------|--------|
| `src/lib/lens-key.ts` | CREATE — generateLensConnectionKey helper |
| `src/routes/lens-integration.routes.ts` | CREATE — Fastify GET /api/lens-integration route |
| `src/app.ts` (or server.ts) | MODIFY — register lensIntegrationRoutes |
| `src/middleware/integrationAuth.ts` | MODIFY — attach businessApiKey to request object |
| `src/components/settings/LensIntegrationCard.tsx` | CREATE — Settings UI component |
| Settings page component | MODIFY — render LensIntegrationCard in its OWN "Astra Lens" section, NOT inside the integration count/list |

Output: List every file created/modified, confirm the /api/lens-integration endpoint
works and returns a valid atlens1_ key when called with a valid x-api-key header.
```
