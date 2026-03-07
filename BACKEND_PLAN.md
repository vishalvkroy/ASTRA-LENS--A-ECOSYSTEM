# Astra Lens — Backend Plan
### Designed as a Senior Backend Developer

---

## Why a Separate Backend?

The current frontend uses Next.js API routes with mock data.
A proper Express backend gives us:

1. **Real data** — calls Atlas API + Spark API (server-to-server, secure)
2. **Separation of concerns** — frontend only renders, backend handles all logic
3. **Caching** — cache business snapshots so Claude isn't called on every request
4. **Rate limiting** — protect Claude API from abuse
5. **Extensible** — add DB, auth, multi-tenant support later without touching frontend
6. **Production-ready** — same pattern as Astra Spark (you already know it)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        ASTRA LENS                               │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │   Frontend        │  HTTP   │   Backend (Express)          │  │
│  │   Next.js 14      │ ──────► │   Port 5000                  │  │
│  │   Port 3000       │         │                              │  │
│  └──────────────────┘         │  Routes:                     │  │
│                               │  GET  /api/summary           │  │
│                               │  GET  /api/alerts            │  │
│                               │  POST /api/insights          │  │
│                               │  POST /api/chat              │  │
│                               │  GET  /api/health            │  │
│                               └──────────────┬───────────────┘  │
└──────────────────────────────────────────────┼──────────────────┘
                                               │
                    ┌──────────────────────────┼──────────────────────┐
                    │                          │                      │
                    ▼                          ▼                      ▼
          ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
          │   Astra Atlas    │    │   Astra Spark    │    │   Claude AI      │
          │   (Atlas API)    │    │   (Spark API)    │    │   (Anthropic)    │
          │   Port 4000      │    │   Port 3001      │    │   claude-haiku   │
          └──────────────────┘    └──────────────────┘    └──────────────────┘
```

---

## Folder Structure

```
server/                          ← Express backend root
├── src/
│   ├── routes/
│   │   ├── summary.routes.ts    → GET /api/summary
│   │   ├── insights.routes.ts   → POST /api/insights
│   │   ├── chat.routes.ts       → POST /api/chat
│   │   └── alerts.routes.ts     → GET /api/alerts
│   │
│   ├── services/
│   │   ├── atlas.service.ts     → Calls Atlas API (with mock fallback)
│   │   ├── spark.service.ts     → Calls Spark API (with mock fallback)
│   │   ├── aggregator.service.ts → Combines Atlas + Spark into snapshot
│   │   └── ai.service.ts        → Claude API (insights + chat)
│   │
│   ├── middleware/
│   │   ├── cors.ts              → Allow requests from frontend
│   │   ├── error.ts             → Global error handler
│   │   └── rate-limit.ts        → Rate limit AI endpoints
│   │
│   ├── lib/
│   │   ├── anthropic.ts         → Anthropic client singleton
│   │   ├── prompts.ts           → AI prompt templates
│   │   ├── cache.ts             → Simple in-memory cache
│   │   └── logger.ts            → Console logger with timestamps
│   │
│   ├── types/
│   │   └── index.ts             → All shared TypeScript interfaces
│   │
│   ├── app.ts                   → Express app setup
│   └── index.ts                 → Server entry point
│
├── package.json
├── tsconfig.json
└── .env
```

---

## Tech Stack (Backend)

| What | Technology | Why |
|------|-----------|-----|
| Runtime | Node.js 20 | Same as Spark |
| Framework | Express.js | Same as Spark, fast |
| Language | TypeScript | Type safety |
| HTTP client | Axios | Calls Atlas + Spark APIs |
| AI | @anthropic-ai/sdk | Claude integration |
| Rate limiting | express-rate-limit | Protect AI endpoints |
| CORS | cors | Allow frontend requests |
| Env | dotenv | Environment variables |
| Dev server | ts-node-dev | Hot reload in dev |
| Build | tsc | Compile to JS |

---

## Environment Variables

```
PORT=5000
NODE_ENV=development

# Astra Atlas API
ATLAS_API_URL=http://localhost:4000
ATLAS_API_KEY=           # Atlas service key (if protected)

# Astra Spark API
SPARK_API_URL=http://localhost:3001
SPARK_JWT_SECRET=        # Same secret as Spark uses

# Claude AI
ANTHROPIC_API_KEY=sk-ant-...

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Cache TTL (seconds)
SNAPSHOT_CACHE_TTL=300   # 5 minutes
INSIGHTS_CACHE_TTL=600   # 10 minutes

# Dev mode (uses mock data when APIs are unavailable)
DEV_MODE=true
```

---

## API Routes — Full Spec

### GET /api/health
Returns server status. No auth.

### GET /api/summary
1. Check cache → if fresh, return cached snapshot
2. Call AtlasService.getSnapshot() → parallel with SparkService.getSnapshot()
3. Pass both to AggregatorService.combine() → BusinessSnapshot
4. Cache result for SNAPSHOT_CACHE_TTL seconds
5. Return snapshot

### GET /api/alerts
1. Get BusinessSnapshot (from cache or fresh fetch)
2. Run AlertEngine rules against snapshot
3. Return sorted alerts (HIGH → MEDIUM → LOW)
4. No AI involved — pure logic

### POST /api/insights
Body: optional `{ refresh: boolean }`
1. Get BusinessSnapshot
2. Check insights cache → return if fresh (unless refresh=true)
3. Call AIService.generateInsights(snapshot) → Claude API
4. Cache insights for INSIGHTS_CACHE_TTL seconds
5. Return 6 insight cards

Rate limit: 10 requests/minute per IP

### POST /api/chat
Body: `{ message: string, history: Message[] }`
1. Get BusinessSnapshot (from cache)
2. Build system prompt with business context
3. Call Claude API with streaming
4. Stream response back to client
5. No caching (every chat is unique)

Rate limit: 30 requests/minute per IP

---

## Services — What Each Does

### AtlasService
Calls Atlas API endpoints. Falls back to mock data if:
- `DEV_MODE=true`, OR
- Atlas API is unreachable (connection refused)

Atlas endpoints it calls:
- `GET /api/business/stats` → sales summary
- `GET /api/inventory` → inventory + stock levels
- `GET /api/customers/summary` → customer counts + recent activity

### SparkService
Calls Spark API endpoints. Falls back to mock data if unavailable.

Spark endpoints it calls:
- `GET /api/whatsapp/stats` → WA campaign stats
- `GET /api/whatsapp/campaigns` → campaign list
- `GET /api/scheduler/posts` → scheduled posts count

### AggregatorService
Combines AtlasSnapshot + SparkSnapshot into a single BusinessSnapshot.
Computes derived fields:
- Revenue change % (today vs yesterday)
- Week-over-week change %
- Days of stock remaining per low-stock item

### AIService
- `generateInsights(snapshot)` → Claude call, returns InsightCard[]
- `streamChat(message, history, snapshot)` → Claude stream

### Cache (In-Memory)
Simple Map-based cache with TTL.
Keys: `snapshot`, `insights`
No Redis needed for hackathon.

---

## Frontend Changes After Backend

Update Next.js API routes to call Express backend instead of using mock data directly:

```typescript
// app/api/summary/route.ts — AFTER backend is ready
export async function GET() {
  const res = await fetch(`${process.env.BACKEND_URL}/api/summary`)
  const data = await res.json()
  return NextResponse.json(data)
}
```

Or: Update frontend fetch calls to call backend directly (skip Next.js API proxy).

---

## Build Phases

| Phase | What | Time |
|-------|------|------|
| B0 | Scaffold + setup (package.json, tsconfig, app.ts, index.ts) | 30 min |
| B1 | Types + Mock data (same as frontend mock-data, ported to backend) | 20 min |
| B2 | Atlas + Spark service clients (with mock fallback) | 45 min |
| B3 | Aggregator + Cache + Alert engine | 30 min |
| B4 | Summary + Alerts routes (wired end-to-end) | 20 min |
| B5 | AI Insights route (Claude, cached) | 30 min |
| B6 | AI Chat route (Claude streaming) | 30 min |
| B7 | Connect frontend to backend | 20 min |

**Total: ~3.5 hours**

---

## Key Design Decisions

1. **Mock fallback everywhere** — DEV_MODE=true means the backend works even if Atlas and Spark aren't running. Perfect for hackathon.
2. **In-memory cache** — No Redis. Simple Map with TTL. Avoids hammering Claude API.
3. **Parallel API calls** — Atlas and Spark are fetched concurrently with Promise.all().
4. **Streaming chat** — Same streaming pattern as Spark's WhatsApp campaign job.
5. **No auth on Lens backend** — For hackathon, no JWT needed. Add later.
6. **Single business mode** — No multi-tenancy. One mock business. Add businessId later.
