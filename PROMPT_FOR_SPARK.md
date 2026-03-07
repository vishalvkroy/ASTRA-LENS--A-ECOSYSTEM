# Claude Prompt — Paste This Inside Astra Spark Chat
### This will make Spark expose a /api/lens/snapshot endpoint for Astra Lens

---

```
You are working inside the Astra Spark codebase (apps/api/src/).

Spark is a marketing automation platform. It uses:
- Express.js
- Prisma ORM + PostgreSQL
- businessId based multi-tenancy (from JWT middleware)
- Routes in apps/api/src/routes/*.routes.ts
- Services in apps/api/src/services/*.service.ts

## YOUR TASK

Add a new Lens snapshot endpoint to Spark:
  GET /api/lens/snapshot?businessId=<uuid>
  Auth: x-lens-key header (simple shared secret)

This endpoint is called by Astra Lens — a sister product — to read marketing data for AI analysis.
It is READ-ONLY. No writes. No mutations. No side effects.

---

## STEP 1 — Add LENS_API_KEY to .env.example

Open apps/api/.env.example and add this line at the end:
```
# Astra Lens Integration
LENS_API_KEY=                          # Shared secret key for Astra Lens to read Spark data
```

Also add the same to the actual apps/api/.env file with a real value:
```
LENS_API_KEY=lens_secret_change_this_in_production
```

---

## STEP 2 — Create apps/api/src/middleware/lens-auth.middleware.ts

```typescript
/**
 * LENS AUTH MIDDLEWARE
 * Simple shared-secret authentication for Astra Lens integration.
 * Reads x-lens-key header and validates against LENS_API_KEY env var.
 */

import { Request, Response, NextFunction } from 'express'

export function lensAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-lens-key'] as string | undefined

  if (!key) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'x-lens-key header is required',
    })
    return
  }

  if (!process.env.LENS_API_KEY) {
    // LENS_API_KEY not configured — block all requests
    res.status(503).json({
      error: 'ServiceUnavailable',
      message: 'Lens integration is not configured on this server',
    })
    return
  }

  if (key !== process.env.LENS_API_KEY) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid Lens API key',
    })
    return
  }

  next()
}
```

---

## STEP 3 — Create apps/api/src/services/lens.service.ts

```typescript
/**
 * LENS SERVICE
 * Assembles the SparkSnapshot that Astra Lens expects.
 * Read-only. Uses Prisma queries.
 */

import prisma from '../lib/prisma'

export async function getLensSnapshot(businessId: string) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Run all queries in parallel
  const [
    business,
    campaigns,
    reelScriptCount,
    scheduledPostCount,
  ] = await Promise.all([

    // Business info (for WA credits)
    prisma.business.findUnique({
      where: { id: businessId, deletedAt: null },
      select: {
        name: true,
        waCredits: true,
        atlasBusinessId: true,
      },
    }),

    // All WhatsApp campaigns
    prisma.whatsappCampaign.findMany({
      where: {
        businessId,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        status: true,
        sentAt: true,
        recipientCount: true,
        sentCount: true,
        deliveredCount: true,
        readCount: true,
        failedCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),

    // Reel scripts created this month
    prisma.reelScript.count({
      where: {
        businessId,
        deletedAt: null,
        createdAt: { gte: monthStart },
      },
    }),

    // Scheduled posts (upcoming)
    prisma.scheduledPost.count({
      where: {
        businessId,
        deletedAt: null,
        status: 'SCHEDULED',
        scheduledAt: { gte: now },
      },
    }),

  ])

  // ── Compute WA stats from campaigns ──────────────────────────────

  // Campaigns sent this month
  const thisMonthCampaigns = campaigns.filter(
    (c) => c.sentAt && c.sentAt >= monthStart
  )

  const messagesSentThisMonth = thisMonthCampaigns.reduce(
    (sum, c) => sum + (c.sentCount || 0), 0
  )

  const totalDelivered = thisMonthCampaigns.reduce(
    (sum, c) => sum + (c.deliveredCount || 0), 0
  )

  const totalRead = thisMonthCampaigns.reduce(
    (sum, c) => sum + (c.readCount || 0), 0
  )

  const deliveryRate = messagesSentThisMonth > 0
    ? Math.round((totalDelivered / messagesSentThisMonth) * 1000) / 10
    : 0

  const openRate = totalDelivered > 0
    ? Math.round((totalRead / totalDelivered) * 1000) / 10
    : 0

  // Running campaigns
  const runningCampaigns = campaigns.filter((c) => c.status === 'RUNNING')

  // Format campaign list for Lens
  const campaignList = campaigns.slice(0, 10).map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status.toLowerCase(),
    type: 'whatsapp',
    sentAt: c.sentAt?.toISOString() || null,
    delivered: c.deliveredCount || 0,
    opened: c.readCount || 0,
    clicked: 0,                          // Spark doesn't track clicks yet
    audience: c.recipientCount || 0,
  }))

  // Atlas users have unlimited credits
  const creditsRemaining = business?.atlasBusinessId
    ? -1                                 // -1 = unlimited (Atlas user)
    : (business?.waCredits || 0)

  return {
    campaigns: {
      total: campaigns.length,
      running: runningCampaigns.length,
      list: campaignList,
    },
    whatsapp: {
      messagesSentThisMonth,
      deliveryRate,
      openRate,
      creditsRemaining,
    },
    reelScripts: reelScriptCount,
    scheduledPosts: scheduledPostCount,
  }
}
```

---

## STEP 4 — Create apps/api/src/routes/lens.routes.ts

```typescript
/**
 * LENS ROUTES
 * Exposes Spark marketing data to Astra Lens.
 *
 * Auth: x-lens-key header (shared secret, validated by lensAuthMiddleware)
 * All routes are READ-ONLY.
 */

import { Router, Request, Response } from 'express'
import { lensAuthMiddleware } from '../middleware/lens-auth.middleware'
import { getLensSnapshot } from '../services/lens.service'

const router = Router()

/**
 * GET /api/lens/snapshot?businessId=<uuid>
 * Returns Spark marketing snapshot for Astra Lens.
 */
router.get('/snapshot', lensAuthMiddleware, async (req: Request, res: Response) => {
  const { businessId } = req.query

  if (!businessId || typeof businessId !== 'string') {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'businessId query parameter is required',
    })
  }

  try {
    const snapshot = await getLensSnapshot(businessId)
    return res.json(snapshot)
  } catch (err: any) {
    console.error('[LensRoutes] snapshot error:', err.message)
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to generate Lens snapshot',
    })
  }
})

/**
 * GET /api/lens/health?businessId=<uuid>
 * Health check for Lens to verify connectivity.
 */
router.get('/health', lensAuthMiddleware, async (req: Request, res: Response) => {
  const { businessId } = req.query
  return res.json({
    status: 'ok',
    service: 'astra-spark',
    businessId: businessId || null,
    timestamp: new Date().toISOString(),
  })
})

export default router
```

---

## STEP 5 — Register lens routes in apps/api/src/app.ts

Open apps/api/src/app.ts.

Find where other routes are registered (look for lines like):
```typescript
import whatsappRoutes from './routes/whatsapp.routes'
app.use('/api/whatsapp', whatsappRoutes)
```

Add the lens routes alongside them:
```typescript
import lensRoutes from './routes/lens.routes'

// Add with other route registrations:
app.use('/api/lens', lensRoutes)
```

Make sure this is AFTER the express.json() middleware and BEFORE the error handler.

---

## STEP 6 — Update CORS in apps/api/src/app.ts

Find the CORS configuration in app.ts. It likely has an array of allowed origins.
Add the Lens frontend and backend URLs:

```typescript
const allowedOrigins = [
  // ... existing origins ...
  'http://localhost:5000',   // Lens backend
  'http://localhost:3000',   // Lens frontend (Next.js)
]
```

---

## VERIFICATION

After making all changes, restart the Spark API server.

Test with curl:
```bash
# Health check
curl -H "x-lens-key: lens_secret_change_this_in_production" \
  "http://localhost:3001/api/lens/health?businessId=<your-business-id>"

# Full snapshot
curl -H "x-lens-key: lens_secret_change_this_in_production" \
  "http://localhost:3001/api/lens/snapshot?businessId=<your-business-id>"
```

Expected health response:
```json
{ "status": "ok", "service": "astra-spark", "businessId": "...", "timestamp": "..." }
```

Expected snapshot response shape:
```json
{
  "campaigns": { "total": 8, "running": 2, "list": [...] },
  "whatsapp": { "messagesSentThisMonth": 940, "deliveryRate": 96.2, "openRate": 68.4, "creditsRemaining": 560 },
  "reelScripts": 12,
  "scheduledPosts": 5
}
```

---

## IMPORTANT NOTES

1. DO NOT modify any existing routes, services, or middleware. Only ADD new files + register them.

2. The businessId in the query param — Lens gets this from its own config (SPARK_BUSINESS_ID env var). This is the business owner's Spark businessId. It is NOT taken from user input in the UI.

3. The `creditsRemaining: -1` for Atlas users means unlimited. Lens will show "Unlimited" in the UI when it sees -1.

4. After code is working:
   - Copy the LENS_API_KEY value from Spark's .env
   - Add it to Lens backend server/.env as SPARK_API_KEY=<same value>
   - Also add SPARK_BUSINESS_ID=<the business's UUID from Spark DB> to Lens server/.env

Output: List every file created/modified and confirm the server starts and both curl commands succeed.
```
