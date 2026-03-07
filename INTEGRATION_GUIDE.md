# Astra Lens — Integration Guide
### How Atlas + Spark connect to Lens

---

## Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   Astra Atlas (Fastify + pg)          Astra Spark (Express + Prisma)│
│   Port: 4000                          Port: 3001                    │
│                                                                     │
│   GET /api/lens/snapshot              GET /api/lens/snapshot        │
│   Auth: x-api-key header              Auth: x-lens-key header       │
│            │                                      │                 │
│            └──────────────────┬───────────────────┘                 │
│                               │                                     │
│                               ▼                                     │
│                    Astra Lens Backend (Express)                     │
│                    Port: 5000                                       │
│                                                                     │
│                    AtlasService  +  SparkService                    │
│                    (calls both in parallel via Promise.all)         │
│                               │                                     │
│                               ▼                                     │
│                    AggregatorService → BusinessSnapshot             │
│                               │                                     │
│                               ▼                                     │
│                    Claude AI → Insights / Alerts / Chat             │
│                               │                                     │
│                               ▼                                     │
│                    Astra Lens Frontend (Next.js)                    │
│                    Port: 3000                                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Authentication Strategy

### Atlas → Lens
Atlas already has a full **Integration API Key system** (`x-api-key` header).
- Owner creates a `CUSTOM_API` integration in Atlas dashboard
- Gets a one-time API key
- Puts it in Lens `.env` as `ATLAS_API_KEY`
- Lens sends `x-api-key: <key>` on every request
- Atlas validates via `integrationAuthMiddleware` and resolves `tenant_id` automatically

### Spark → Lens
Spark gets a new simple **shared secret middleware**.
- A secret key is defined in Spark's `.env` as `LENS_API_KEY`
- Same key goes into Lens `.env` as `SPARK_API_KEY`
- Lens sends `x-lens-key: <secret>` on every request to Spark
- Spark validates it in a lightweight middleware

---

## What Data Flows

### From Atlas → Lens

| Data | Atlas Source Table | Lens Uses It For |
|------|--------------------|-----------------|
| Business name, owner, location | `tenant_settings` | Dashboard header, chat context |
| Daily sales (today/yesterday/week/month) | `sales` (aggregated) | Stat cards, revenue chart, insights |
| Top 5 selling products | `sale_items` + `products` | Top Products widget, insights |
| Low stock items (stock < threshold) | `products` or `inventory` | Smart alerts (HIGH), insights |
| Slow-moving products (low sales) | `products` + `sale_items` | Smart alerts (MEDIUM), insights |
| Total customers, active vs inactive | `customers` | Stat cards, smart alerts, insights |
| Recent customer activity | `sales` + `customers` | Customer Activity widget |

### From Spark → Lens

| Data | Spark Source Table | Lens Uses It For |
|------|--------------------|-----------------|
| Total campaigns, running count | `whatsapp_campaigns` | Stat card, insights |
| Last campaign stats (delivered/read) | `whatsapp_campaigns` | Insights, alerts |
| WA messages sent this month | `whatsapp_campaigns` (sum) | Stat card |
| WA credits remaining | `businesses.waCredits` | Smart alert (LOW CREDITS), insights |
| Scheduled posts count | `scheduled_posts` | Dashboard stat |
| Reel scripts count this month | `reel_scripts` | Dashboard stat |

---

## Endpoint Contracts

### Atlas: GET /api/lens/snapshot

**Headers:** `x-api-key: <ATLAS_API_KEY>`

**Response:**
```json
{
  "business": {
    "name": "Sharma General Store",
    "owner": "Rajesh Sharma",
    "location": "Kanpur, UP",
    "category": "GROCERY_KIRANA",
    "phone": "9876543210"
  },
  "sales": {
    "today": 12400,
    "yesterday": 10500,
    "thisWeek": 67200,
    "lastWeek": 58900,
    "thisMonth": 245000,
    "lastMonth": 218000,
    "todayTransactions": 19,
    "trend": [
      { "date": "2026-03-01", "amount": 9200, "transactions": 12 },
      { "date": "2026-03-02", "amount": 11400, "transactions": 18 }
    ]
  },
  "inventory": {
    "totalItems": 142,
    "totalValue": 485000,
    "lowStockItems": [
      { "id": "p1", "name": "Basmati Rice 5kg", "stock": 5, "unit": "bags", "price": 450, "category": "Grains", "soldThisMonth": 84, "revenue": 42000, "daysLeft": 3, "trend": "up" }
    ],
    "topProducts": [
      { "id": "p1", "name": "Basmati Rice 5kg", "stock": 5, "unit": "bags", "price": 450, "category": "Grains", "soldThisMonth": 84, "revenue": 42000, "trend": "up" }
    ],
    "slowMoving": [
      { "id": "p6", "name": "Bournvita 500g", "stock": 24, "unit": "packets", "price": 280, "category": "Beverages", "soldThisMonth": 3, "revenue": 840, "trend": "down" }
    ]
  },
  "customers": {
    "total": 847,
    "active": 312,
    "inactive": 535,
    "newThisMonth": 23,
    "topCustomers": [
      { "id": "c1", "name": "Priya Verma", "phone": "9876543210", "totalSpent": 18400, "visits": 24, "lastVisit": "2026-03-07", "tags": ["loyal"] }
    ],
    "recentActivity": [
      { "customerId": "c1", "name": "Priya Verma", "action": "Purchase", "amount": 1240, "items": ["Rice", "Salt"], "time": "2 hours ago" }
    ]
  }
}
```

---

### Spark: GET /api/lens/snapshot

**Headers:** `x-lens-key: <SPARK_API_KEY>`
**Query:** `?businessId=<uuid>` (required)

**Response:**
```json
{
  "campaigns": {
    "total": 8,
    "running": 2,
    "list": [
      {
        "id": "camp1",
        "name": "Holi Special Offer",
        "status": "completed",
        "type": "whatsapp",
        "sentAt": "2026-03-05T10:00:00Z",
        "delivered": 480,
        "opened": 312,
        "clicked": 89,
        "audience": 500
      }
    ]
  },
  "whatsapp": {
    "messagesSentThisMonth": 940,
    "deliveryRate": 96.2,
    "openRate": 68.4,
    "creditsRemaining": 560
  },
  "reelScripts": 12,
  "scheduledPosts": 5
}
```

---

## Environment Variables

### Lens Backend (.env)
```
ATLAS_API_URL=http://localhost:4000
ATLAS_API_KEY=atlas_live_xxxxxxxxxxxx    # from Atlas integration dashboard

SPARK_API_URL=http://localhost:3001
SPARK_API_KEY=lens_secret_xxxxxxxxxxxx   # shared secret, same in both

DEV_MODE=false   # set false when real APIs are connected
```

### Atlas Backend (.env additions)
```
# No changes needed — uses existing integration system
```

### Spark Backend (.env additions)
```
LENS_API_KEY=lens_secret_xxxxxxxxxxxx    # same as Lens SPARK_API_KEY above
```

---

## Setup Steps (After Code Is Written)

### Step 1 — Create Atlas Integration
1. Start Atlas backend (`npm run dev` in astraKeeps/backend)
2. Login to Atlas as owner
3. POST `/api/integrations` with body `{ "name": "Astra Lens", "source": "CUSTOM_API" }`
4. Copy the one-time API key returned
5. Paste it as `ATLAS_API_KEY` in Lens `.env`

### Step 2 — Configure Spark Secret
1. Generate a random secret: `openssl rand -hex 32`
2. Add to Spark `.env`: `LENS_API_KEY=<secret>`
3. Add same to Lens `.env`: `SPARK_API_KEY=<secret>`
4. Restart Spark backend

### Step 3 — Set Lens DEV_MODE=false
1. In Lens `server/.env` set `DEV_MODE=false`
2. Restart Lens backend
3. GET http://localhost:5000/api/summary → should return real data

---

## How Lens Calls Both APIs

```typescript
// In Lens backend — AggregatorService
const [atlas, spark] = await Promise.all([
  AtlasService.getSnapshot(),   // GET atlas:4000/api/lens/snapshot (x-api-key)
  SparkService.getSnapshot(),   // GET spark:3001/api/lens/snapshot (x-lens-key)
])
```

Both calls happen in **parallel** — total latency = max(atlas_time, spark_time), not sum.
If either fails → falls back to mock data for that source only.

---

## Key Facts About Each Codebase

### Atlas (astraKeeps/backend)
- Framework: **Fastify** (not Express)
- DB: **PostgreSQL** via `pg` raw SQL (no Prisma/ORM)
- Auth: `integrationAuthMiddleware` reads `x-api-key` header → resolves `tenant_id`
- Multi-tenancy: `tenant_id` on every table
- Routes registered via `app.register()` pattern

### Spark (apps/api in AstraSpark)
- Framework: **Express**
- DB: **Prisma** + PostgreSQL
- Auth: JWT middleware → sets `req.user.businessId`
- Multi-tenancy: `businessId` on every table
- Routes in `apps/api/src/routes/*.routes.ts`
