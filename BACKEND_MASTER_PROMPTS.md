# Astra Lens — Backend Master Prompts
### Express.js Backend — Phase by Phase

Each prompt is self-contained. Run them in order inside `C:\Users\hp\OneDrive\Desktop\Desktop app\AstraLens\server\`

---

---

# PHASE B0 — Express Scaffold

```
You are building the Express.js backend for "Astra Lens" — an AI business intelligence dashboard.
This backend sits at /server inside the AstraLens project root.
It aggregates data from Astra Atlas API + Astra Spark API, calls Claude AI, and serves clean JSON to the Next.js frontend.

## Create the following files inside /server

### package.json
```json
{
  "name": "astra-lens-server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc --project tsconfig.json",
    "start": "node dist/index.js",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "axios": "^1.7.2",
    "@anthropic-ai/sdk": "^0.32.0",
    "express-rate-limit": "^7.3.1"
  },
  "devDependencies": {
    "typescript": "^5.4.5",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.14.2",
    "ts-node-dev": "^2.0.0"
  }
}
```

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### .env
```
PORT=5000
NODE_ENV=development

# Astra Atlas API
ATLAS_API_URL=http://localhost:4000
ATLAS_API_KEY=

# Astra Spark API
SPARK_API_URL=http://localhost:3001

# Claude AI
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:3000

# Cache TTL in seconds
SNAPSHOT_CACHE_TTL=300
INSIGHTS_CACHE_TTL=600

# Set true to use mock data when Atlas/Spark APIs are unreachable
DEV_MODE=true
```

### .env.example
Same as .env but with empty values for ANTHROPIC_API_KEY and ATLAS_API_KEY.

### src/types/index.ts
Define ALL shared TypeScript interfaces:

```typescript
export interface Business {
  name: string
  owner: string
  location: string
  category: string
  phone: string
  gstNumber: string
}

export interface DailySale {
  date: string
  amount: number
  transactions: number
}

export interface SalesData {
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
  todayTransactions: number
  trend: DailySale[]
}

export interface Product {
  id: string
  name: string
  category: string
  price: number
  stock: number
  unit: string
  soldThisMonth: number
  revenue: number
  daysLeft?: number
  trend: 'up' | 'down' | 'stable'
}

export interface Customer {
  id: string
  name: string
  phone: string
  totalSpent: number
  visits: number
  lastVisit: string
  tags: string[]
}

export interface CustomerActivity {
  customerId: string
  name: string
  action: 'Purchase' | 'Return' | 'New'
  amount: number
  items: string[]
  time: string
}

export interface InventoryData {
  totalItems: number
  totalValue: number
  lowStockItems: Product[]
  topProducts: Product[]
  slowMoving: Product[]
}

export interface CustomersData {
  total: number
  active: number
  inactive: number
  newThisMonth: number
  topCustomers: Customer[]
  recentActivity: CustomerActivity[]
}

export interface CampaignData {
  id: string
  name: string
  status: 'running' | 'completed' | 'draft'
  type: 'whatsapp' | 'social' | 'reel'
  sentAt?: string
  delivered?: number
  opened?: number
  clicked?: number
  audience: number
}

export interface SparkData {
  campaigns: {
    total: number
    running: number
    list: CampaignData[]
  }
  whatsapp: {
    messagesSentThisMonth: number
    deliveryRate: number
    openRate: number
    creditsRemaining: number
  }
  reelScripts: number
  scheduledPosts: number
}

export interface AtlasSnapshot {
  business: Business
  sales: SalesData
  inventory: InventoryData
  customers: CustomersData
}

export interface BusinessSnapshot {
  atlas: AtlasSnapshot
  spark: SparkData
  generatedAt: string
}

export interface InsightCard {
  id: string
  type: 'opportunity' | 'warning' | 'achievement' | 'recommendation'
  priority: 'high' | 'medium' | 'low'
  title: string
  body: string
  action?: string | null
  actionLink?: string | null
  generatedAt: string
}

export interface Alert {
  id: string
  level: 'high' | 'medium' | 'low'
  category: 'inventory' | 'customers' | 'sales' | 'campaigns' | 'credits'
  title: string
  description: string
  action?: string
  actionLink?: string
  createdAt: string
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ApiError {
  error: string
  message: string
  statusCode?: number
}
```

### src/lib/logger.ts
Simple timestamped console logger:
```typescript
const timestamp = () => new Date().toISOString().split('T')[1].slice(0, 8)

export const logger = {
  info: (msg: string, ...args: any[]) =>
    console.log(`\x1b[36m[${timestamp()}] INFO\x1b[0m  ${msg}`, ...args),
  success: (msg: string, ...args: any[]) =>
    console.log(`\x1b[32m[${timestamp()}] OK  \x1b[0m  ${msg}`, ...args),
  warn: (msg: string, ...args: any[]) =>
    console.log(`\x1b[33m[${timestamp()}] WARN\x1b[0m  ${msg}`, ...args),
  error: (msg: string, ...args: any[]) =>
    console.log(`\x1b[31m[${timestamp()}] ERR \x1b[0m  ${msg}`, ...args),
}
```

### src/lib/cache.ts
Simple in-memory TTL cache (no Redis):
```typescript
interface CacheEntry<T> {
  data: T
  expiresAt: number
}

class Cache {
  private store = new Map<string, CacheEntry<any>>()

  set<T>(key: string, data: T, ttlSeconds: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    return entry.data as T
  }

  invalidate(key: string): void {
    this.store.delete(key)
  }

  clear(): void {
    this.store.clear()
  }
}

export const cache = new Cache()
```

### src/lib/anthropic.ts
```typescript
import Anthropic from '@anthropic-ai/sdk'

if (!process.env.ANTHROPIC_API_KEY) {
  throw new Error('ANTHROPIC_API_KEY is required')
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export const AI_MODEL = 'claude-haiku-4-5-20251001'
```

### src/middleware/cors.ts
```typescript
import cors from 'cors'

export const corsMiddleware = cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
})
```

### src/middleware/error.ts
```typescript
import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`${req.method} ${req.path} →`, err.message)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'Something went wrong',
  })
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
  })
}
```

### src/middleware/rate-limit.ts
```typescript
import rateLimit from 'express-rate-limit'

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 15,               // 15 AI calls per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many AI requests. Please wait a minute.',
  },
})

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
})
```

### src/app.ts
```typescript
import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

import { corsMiddleware } from './middleware/cors'
import { errorHandler, notFound } from './middleware/error'
import { generalRateLimit } from './middleware/rate-limit'

// Route imports (add as phases complete)
import summaryRouter from './routes/summary.routes'
import alertsRouter from './routes/alerts.routes'
import insightsRouter from './routes/insights.routes'
import chatRouter from './routes/chat.routes'

const app = express()

// Global middleware
app.use(corsMiddleware)
app.use(express.json({ limit: '1mb' }))
app.use(generalRateLimit)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'astra-lens-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    devMode: process.env.DEV_MODE === 'true',
  })
})

// Routes
app.use('/api/summary', summaryRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/insights', insightsRouter)
app.use('/api/chat', chatRouter)

// 404 + error handlers (must be last)
app.use(notFound)
app.use(errorHandler)

export default app
```

### src/index.ts
```typescript
import app from './app'
import { logger } from './lib/logger'

const PORT = parseInt(process.env.PORT || '5000', 10)

app.listen(PORT, () => {
  logger.success(`Astra Lens API running on http://localhost:${PORT}`)
  logger.info(`Dev mode: ${process.env.DEV_MODE === 'true' ? 'ON (mock fallback active)' : 'OFF'}`)
  logger.info(`Atlas API: ${process.env.ATLAS_API_URL}`)
  logger.info(`Spark API: ${process.env.SPARK_API_URL}`)
})
```

Create placeholder route files so app.ts compiles:
- src/routes/summary.routes.ts → exports express.Router() with GET / returning { message: 'summary coming soon' }
- src/routes/alerts.routes.ts → same
- src/routes/insights.routes.ts → same
- src/routes/chat.routes.ts → same

Run `npm install` after creating package.json.
Test: `npm run dev` → server should start on port 5000 and GET /api/health returns { status: 'ok' }.

Output: confirm all files created + server starts successfully.
```

---

---

# PHASE B1 — Mock Data (Backend)

```
You are building the Express backend for Astra Lens.
Phase B1: Create the mock data layer — same data as the frontend but in the backend /server/src/mock/ folder.
This is used when DEV_MODE=true or when Atlas/Spark APIs are unreachable.

## Files to Create

### server/src/mock/atlas.mock.ts
Export `getAtlasMock(): AtlasSnapshot` — same realistic data:

Business: Sharma General Store, Rajesh Sharma, Kanpur UP, General Store, 9876543210, 09ABCDE1234F1Z5

Sales trend last 7 days (dates should use new Date() relative to today):
- Day -6: ₹9,200 (12 tx)
- Day -5: ₹11,400 (18 tx)
- Day -4: ₹8,700 (11 tx)
- Day -3: ₹13,200 (21 tx)
- Day -2: ₹10,100 (15 tx)
- Day -1: ₹10,500 (16 tx)
- Day 0 (today): ₹12,400 (19 tx)

Compute today/yesterday/thisWeek/lastWeek/thisMonth/lastMonth from the trend array.

Inventory (5 top products, 2 low stock, 2 slow moving) — same as frontend mock.

Customers: total 847, active 312, inactive 535, newThisMonth 23. Top 3 customers. 4 recent activities.

### server/src/mock/spark.mock.ts
Export `getSparkMock(): SparkData` — same campaign/WA data as frontend mock.
8 campaigns, 2 running. Holi Special campaign. 940 WA messages, 96.2% delivery, 68.4% open, 560 credits.

### server/src/mock/index.ts
```typescript
import { getAtlasMock } from './atlas.mock'
import { getSparkMock } from './spark.mock'
import type { BusinessSnapshot } from '../types'

export function getMockSnapshot(): BusinessSnapshot {
  return {
    atlas: getAtlasMock(),
    spark: getSparkMock(),
    generatedAt: new Date().toISOString(),
  }
}
```

Output: confirm all mock files created with correct TypeScript types.
```

---

---

# PHASE B2 — Atlas + Spark Service Clients

```
You are building the Express backend for Astra Lens.
Phase B2: Create the Atlas and Spark service clients.
These call the real APIs when available, and fall back to mock data when DEV_MODE=true or APIs are unreachable.

## Files to Create

### server/src/services/atlas.service.ts

```typescript
import axios from 'axios'
import type { AtlasSnapshot } from '../types'
import { getAtlasMock } from '../mock/atlas.mock'
import { logger } from '../lib/logger'

const ATLAS_BASE = process.env.ATLAS_API_URL || 'http://localhost:4000'
const DEV_MODE = process.env.DEV_MODE === 'true'

export class AtlasService {

  // Check if Atlas is reachable
  static async isReachable(): Promise<boolean> {
    try {
      await axios.get(`${ATLAS_BASE}/api/health`, { timeout: 3000 })
      return true
    } catch {
      return false
    }
  }

  // Get full Atlas snapshot
  static async getSnapshot(): Promise<AtlasSnapshot> {
    if (DEV_MODE) {
      logger.info('AtlasService → DEV_MODE: using mock data')
      return getAtlasMock()
    }

    try {
      const headers = process.env.ATLAS_API_KEY
        ? { Authorization: `Bearer ${process.env.ATLAS_API_KEY}` }
        : {}

      // Fetch all data in parallel
      const [salesRes, inventoryRes, customersRes] = await Promise.all([
        axios.get(`${ATLAS_BASE}/api/reports/sales-summary`, { headers, timeout: 5000 }),
        axios.get(`${ATLAS_BASE}/api/inventory?limit=100`, { headers, timeout: 5000 }),
        axios.get(`${ATLAS_BASE}/api/customers/summary`, { headers, timeout: 5000 }),
      ])

      logger.success('AtlasService → fetched live data')

      // Map Atlas API response to AtlasSnapshot shape
      return {
        business: salesRes.data.business,
        sales: {
          today: salesRes.data.today,
          yesterday: salesRes.data.yesterday,
          thisWeek: salesRes.data.thisWeek,
          lastWeek: salesRes.data.lastWeek,
          thisMonth: salesRes.data.thisMonth,
          lastMonth: salesRes.data.lastMonth,
          todayTransactions: salesRes.data.todayTransactions || 0,
          trend: salesRes.data.trend || [],
        },
        inventory: {
          totalItems: inventoryRes.data.total,
          totalValue: inventoryRes.data.totalValue || 0,
          lowStockItems: inventoryRes.data.lowStock || [],
          topProducts: inventoryRes.data.topSellers || [],
          slowMoving: inventoryRes.data.slowMoving || [],
        },
        customers: {
          total: customersRes.data.total,
          active: customersRes.data.active,
          inactive: customersRes.data.inactive,
          newThisMonth: customersRes.data.newThisMonth || 0,
          topCustomers: customersRes.data.topCustomers || [],
          recentActivity: customersRes.data.recentActivity || [],
        },
      }
    } catch (err: any) {
      logger.warn(`AtlasService → API unreachable (${err.message}), falling back to mock`)
      return getAtlasMock()
    }
  }
}
```

### server/src/services/spark.service.ts

```typescript
import axios from 'axios'
import type { SparkData } from '../types'
import { getSparkMock } from '../mock/spark.mock'
import { logger } from '../lib/logger'

const SPARK_BASE = process.env.SPARK_API_URL || 'http://localhost:3001'
const DEV_MODE = process.env.DEV_MODE === 'true'

export class SparkService {

  static async isReachable(): Promise<boolean> {
    try {
      await axios.get(`${SPARK_BASE}/api/health`, { timeout: 3000 })
      return true
    } catch {
      return false
    }
  }

  static async getSnapshot(): Promise<SparkData> {
    if (DEV_MODE) {
      logger.info('SparkService → DEV_MODE: using mock data')
      return getSparkMock()
    }

    try {
      // Fetch Spark data in parallel
      const [campaignsRes, waStatsRes] = await Promise.all([
        axios.get(`${SPARK_BASE}/api/whatsapp/campaigns?limit=10`, { timeout: 5000 }),
        axios.get(`${SPARK_BASE}/api/whatsapp/stats`, { timeout: 5000 }),
      ])

      logger.success('SparkService → fetched live data')

      const campaigns = campaignsRes.data.campaigns || []

      return {
        campaigns: {
          total: campaignsRes.data.total || campaigns.length,
          running: campaigns.filter((c: any) => c.status === 'RUNNING').length,
          list: campaigns.map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status?.toLowerCase(),
            type: 'whatsapp',
            sentAt: c.scheduledAt,
            delivered: c.stats?.delivered || 0,
            opened: c.stats?.read || 0,
            clicked: c.stats?.clicked || 0,
            audience: c.stats?.total || 0,
          })),
        },
        whatsapp: {
          messagesSentThisMonth: waStatsRes.data.messagesSentThisMonth || 0,
          deliveryRate: waStatsRes.data.deliveryRate || 0,
          openRate: waStatsRes.data.openRate || 0,
          creditsRemaining: waStatsRes.data.credits || 0,
        },
        reelScripts: 0,
        scheduledPosts: 0,
      }
    } catch (err: any) {
      logger.warn(`SparkService → API unreachable (${err.message}), falling back to mock`)
      return getSparkMock()
    }
  }
}
```

Output: confirm both services compile without TypeScript errors.
```

---

---

# PHASE B3 — Aggregator + Alert Engine

```
You are building the Express backend for Astra Lens.
Phase B3: Create the AggregatorService (combines Atlas + Spark into BusinessSnapshot) and the AlertEngine (rule-based monitoring).

## Files to Create

### server/src/services/aggregator.service.ts

```typescript
import type { AtlasSnapshot, SparkData, BusinessSnapshot } from '../types'
import { AtlasService } from './atlas.service'
import { SparkService } from './spark.service'
import { cache } from '../lib/cache'
import { logger } from '../lib/logger'

const CACHE_TTL = parseInt(process.env.SNAPSHOT_CACHE_TTL || '300', 10)
const CACHE_KEY = 'business_snapshot'

export class AggregatorService {

  static async getSnapshot(forceRefresh = false): Promise<BusinessSnapshot> {
    // Check cache first
    if (!forceRefresh) {
      const cached = cache.get<BusinessSnapshot>(CACHE_KEY)
      if (cached) {
        logger.info('AggregatorService → returning cached snapshot')
        return cached
      }
    }

    logger.info('AggregatorService → fetching fresh snapshot...')

    // Fetch Atlas + Spark in parallel
    const [atlas, spark] = await Promise.all([
      AtlasService.getSnapshot(),
      SparkService.getSnapshot(),
    ])

    // Enrich inventory with daysLeft calculation
    const enrichedInventory = {
      ...atlas.inventory,
      lowStockItems: atlas.inventory.lowStockItems.map(item => ({
        ...item,
        daysLeft: item.daysLeft ?? estimateDaysLeft(item.stock, item.soldThisMonth),
      })),
    }

    const snapshot: BusinessSnapshot = {
      atlas: {
        ...atlas,
        inventory: enrichedInventory,
      },
      spark,
      generatedAt: new Date().toISOString(),
    }

    // Cache the result
    cache.set(CACHE_KEY, snapshot, CACHE_TTL)
    logger.success(`AggregatorService → snapshot ready, cached for ${CACHE_TTL}s`)

    return snapshot
  }
}

function estimateDaysLeft(stock: number, soldThisMonth: number): number {
  if (soldThisMonth === 0) return 999
  const dailyRate = soldThisMonth / 30
  return Math.round(stock / dailyRate)
}
```

### server/src/services/alert.service.ts

```typescript
import type { BusinessSnapshot, Alert } from '../types'
import { AggregatorService } from './aggregator.service'

export class AlertService {

  static async getAlerts(): Promise<{
    alerts: Alert[]
    counts: { high: number; medium: number; low: number; total: number }
  }> {
    const snapshot = await AggregatorService.getSnapshot()
    const alerts: Alert[] = []

    // RULE 1: Low stock — critical (daysLeft <= 3)
    for (const item of snapshot.atlas.inventory.lowStockItems) {
      const days = item.daysLeft ?? 999
      if (days <= 3) {
        alerts.push({
          id: `low-stock-critical-${item.id}`,
          level: 'high',
          category: 'inventory',
          title: `Low Stock: ${item.name}`,
          description: `Only ${item.stock} ${item.unit} remaining. At current sales rate, stock runs out in approximately ${days} day${days === 1 ? '' : 's'}.`,
          action: 'Restock Now',
          actionLink: `${process.env.ATLAS_API_URL?.replace('localhost:4000', 'localhost:3000') || 'https://atlas.astrastudio.in'}/inventory`,
          createdAt: new Date().toISOString(),
        })
      } else if (days <= 7) {
        alerts.push({
          id: `low-stock-warning-${item.id}`,
          level: 'medium',
          category: 'inventory',
          title: `Stock Running Low: ${item.name}`,
          description: `${item.stock} ${item.unit} remaining — approximately ${days} days left. Consider restocking soon.`,
          action: 'View Inventory',
          actionLink: `https://atlas.astrastudio.in/inventory`,
          createdAt: new Date().toISOString(),
        })
      }
    }

    // RULE 2: Inactive customers — high if > 400
    const { inactive, total } = snapshot.atlas.customers
    if (inactive > 400) {
      alerts.push({
        id: 'inactive-customers-high',
        level: 'high',
        category: 'customers',
        title: `${inactive.toLocaleString('en-IN')} Customers Inactive (30+ days)`,
        description: `${Math.round((inactive / total) * 100)}% of your customer base hasn't purchased in over 30 days. A re-engagement WhatsApp campaign could bring back 15-20% of them.`,
        action: 'Launch WhatsApp Campaign',
        actionLink: 'https://spark.astrastudio.in/whatsapp/campaigns/new',
        createdAt: new Date().toISOString(),
      })
    } else if (inactive > 200) {
      alerts.push({
        id: 'inactive-customers-medium',
        level: 'medium',
        category: 'customers',
        title: `${inactive} Customers Need Re-engagement`,
        description: `${inactive} customers haven't purchased in 30+ days. Consider a targeted campaign.`,
        action: 'Create Campaign',
        actionLink: 'https://spark.astrastudio.in/whatsapp/campaigns/new',
        createdAt: new Date().toISOString(),
      })
    }

    // RULE 3: Sales drop today vs yesterday > 20%
    const { today, yesterday } = snapshot.atlas.sales
    if (yesterday > 0) {
      const dropPercent = ((yesterday - today) / yesterday) * 100
      if (dropPercent > 20) {
        alerts.push({
          id: 'sales-drop',
          level: 'medium',
          category: 'sales',
          title: `Sales Down ${Math.round(dropPercent)}% vs Yesterday`,
          description: `Today's revenue is ₹${today.toLocaleString('en-IN')} vs yesterday's ₹${yesterday.toLocaleString('en-IN')}. Check if any products are out of stock or if there's a local event affecting footfall.`,
          action: 'View Dashboard',
          actionLink: '/dashboard',
          createdAt: new Date().toISOString(),
        })
      }
    }

    // RULE 4: Slow-moving stock
    for (const item of snapshot.atlas.inventory.slowMoving) {
      alerts.push({
        id: `slow-moving-${item.id}`,
        level: 'medium',
        category: 'inventory',
        title: `Slow-Moving Stock: ${item.name}`,
        description: `Only ${item.soldThisMonth} units sold this month despite ${item.stock} in stock. Consider a bundle offer or WhatsApp promotion to clear inventory.`,
        action: 'Create Promotion on Spark',
        actionLink: 'https://spark.astrastudio.in/reelscript',
        createdAt: new Date().toISOString(),
      })
    }

    // RULE 5: No recent campaign (last campaign > 7 days ago)
    const lastCampaign = snapshot.spark.campaigns.list.find(
      c => c.status === 'completed' && c.sentAt
    )
    if (lastCampaign?.sentAt) {
      const daysSince = Math.floor(
        (Date.now() - new Date(lastCampaign.sentAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSince > 7) {
        alerts.push({
          id: 'no-recent-campaign',
          level: 'low',
          category: 'campaigns',
          title: `Last Campaign Was ${daysSince} Days Ago`,
          description: `Regular customer communication improves retention. Your last campaign was "${lastCampaign.name}". Time to engage your customers again.`,
          action: 'Plan Next Campaign',
          actionLink: 'https://spark.astrastudio.in/whatsapp/campaigns/new',
          createdAt: new Date().toISOString(),
        })
      }
    }

    // RULE 6: Low WA credits (< 100)
    const { creditsRemaining } = snapshot.spark.whatsapp
    if (creditsRemaining > 0 && creditsRemaining < 100) {
      alerts.push({
        id: 'low-wa-credits',
        level: 'medium',
        category: 'credits',
        title: `Only ${creditsRemaining} WhatsApp Credits Remaining`,
        description: `You're running low on WhatsApp message credits. Buy a bundle on Spark to keep your campaigns running.`,
        action: 'Buy Credits on Spark',
        actionLink: 'https://spark.astrastudio.in/whatsapp/bundles',
        createdAt: new Date().toISOString(),
      })
    }

    // Sort: high first, then medium, then low
    const priority = { high: 0, medium: 1, low: 2 }
    alerts.sort((a, b) => priority[a.level] - priority[b.level])

    const counts = {
      high: alerts.filter(a => a.level === 'high').length,
      medium: alerts.filter(a => a.level === 'medium').length,
      low: alerts.filter(a => a.level === 'low').length,
      total: alerts.length,
    }

    return { alerts, counts }
  }
}
```

Output: confirm both services compile and logic is correct.
```

---

---

# PHASE B4 — Summary + Alerts Routes

```
You are building the Express backend for Astra Lens.
Phase B4: Wire up the /api/summary and /api/alerts routes.

## Files to Modify

### server/src/routes/summary.routes.ts
Replace placeholder with full implementation:

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { AggregatorService } from '../services/aggregator.service'
import { logger } from '../lib/logger'

const router = Router()

// GET /api/summary
// Returns full business snapshot (Atlas + Spark combined)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forceRefresh = req.query.refresh === 'true'
    const snapshot = await AggregatorService.getSnapshot(forceRefresh)

    logger.info(`GET /api/summary → ${snapshot.atlas.business.name}`)
    res.json(snapshot)
  } catch (err) {
    next(err)
  }
})

export default router
```

### server/src/routes/alerts.routes.ts
Replace placeholder with full implementation:

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { AlertService } from '../services/alert.service'
import { logger } from '../lib/logger'

const router = Router()

// GET /api/alerts
// Returns rule-based alerts sorted by priority
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AlertService.getAlerts()
    logger.info(`GET /api/alerts → ${result.counts.total} alerts (${result.counts.high} HIGH)`)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
```

## Test These Routes
Start server with `npm run dev` and verify:
1. GET http://localhost:5000/api/health → { status: 'ok' }
2. GET http://localhost:5000/api/summary → full BusinessSnapshot JSON
3. GET http://localhost:5000/api/alerts → { alerts: [...], counts: {...} }
4. GET http://localhost:5000/api/summary?refresh=true → forces cache bypass

Output: confirm routes work + paste sample /api/alerts response.
```

---

---

# PHASE B5 — AI Insights Route

```
You are building the Express backend for Astra Lens.
Phase B5: Build the /api/insights route — calls Claude AI with full business context.

## Files to Create/Modify

### server/src/lib/prompts.ts
```typescript
import type { BusinessSnapshot } from '../types'

export function buildInsightsPrompt(snapshot: BusinessSnapshot): string {
  const { atlas, spark } = snapshot
  return `You are an AI business advisor for Indian small shop owners. Analyze this business data and generate exactly 6 actionable insights as a JSON array.

BUSINESS: ${atlas.business.name}, ${atlas.business.location} (${atlas.business.category})
OWNER: ${atlas.business.owner}

SALES DATA:
- Today: ₹${atlas.sales.today} (${atlas.sales.todayTransactions} transactions)
- Yesterday: ₹${atlas.sales.yesterday}
- This week: ₹${atlas.sales.thisWeek} | Last week: ₹${atlas.sales.lastWeek}
- This month: ₹${atlas.sales.thisMonth} | Last month: ₹${atlas.sales.lastMonth}
- Weekly change: ${(((atlas.sales.thisWeek - atlas.sales.lastWeek) / atlas.sales.lastWeek) * 100).toFixed(1)}%

INVENTORY:
- Total items: ${atlas.inventory.totalItems}
- Low stock (urgent): ${atlas.inventory.lowStockItems.map(i => `${i.name} (${i.stock} ${i.unit}, ~${i.daysLeft ?? '?'} days left)`).join(', ') || 'None'}
- Slow moving: ${atlas.inventory.slowMoving.map(i => `${i.name} (only ${i.soldThisMonth} sold this month)`).join(', ') || 'None'}
- Top sellers: ${atlas.inventory.topProducts.slice(0, 3).map(i => `${i.name} ₹${i.revenue.toLocaleString('en-IN')}`).join(', ')}

CUSTOMERS:
- Total: ${atlas.customers.total}
- Active (last 30 days): ${atlas.customers.active}
- Inactive (30+ days): ${atlas.customers.inactive}
- New this month: ${atlas.customers.newThisMonth}

MARKETING (via Astra Spark):
- WhatsApp messages sent this month: ${spark.whatsapp.messagesSentThisMonth}
- Delivery rate: ${spark.whatsapp.deliveryRate}%
- Open rate: ${spark.whatsapp.openRate}%
- Active campaigns: ${spark.campaigns.running}
- WA credits remaining: ${spark.whatsapp.creditsRemaining}

CONTEXT: Current date is ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}. Holi festival is approximately 7 days away — very relevant for Indian shop promotions.

Generate exactly 6 insight objects. Return ONLY a valid JSON array. No markdown, no explanation, no extra text.

Each object must follow this exact schema:
{
  "type": "opportunity" | "warning" | "achievement" | "recommendation",
  "priority": "high" | "medium" | "low",
  "title": "max 60 characters",
  "body": "2-3 sentences in natural Hinglish (mix of Hindi and English, how Indian shopkeepers actually talk). Be specific — use actual numbers from the data.",
  "action": "CTA button text (short) or null",
  "actionLink": "https://spark.astrastudio.in/... OR https://atlas.astrastudio.in/... OR null"
}

Mix the types: include at least 1 warning, 1 opportunity, 1 achievement. Prioritize by real business impact.`
}

export function buildChatSystemPrompt(snapshot: BusinessSnapshot): string {
  const { atlas, spark } = snapshot
  const weekChange = (((atlas.sales.thisWeek - atlas.sales.lastWeek) / atlas.sales.lastWeek) * 100).toFixed(1)

  return `You are Astra Lens, an AI business advisor for Indian small shop owners. You are helpful, friendly, and practical. You speak in natural Hinglish — a casual mix of Hindi and English, the way Indian shopkeepers and businesspeople actually talk to each other. Not forced — just natural. Keep responses short: 3-5 sentences max. Always be specific and use actual numbers from the business data below.

SHOP CONTEXT:
- Name: ${atlas.business.name}
- Owner: ${atlas.business.owner}
- Location: ${atlas.business.location}
- Type: ${atlas.business.category}

TODAY'S PERFORMANCE:
- Sales today: ₹${atlas.sales.today.toLocaleString('en-IN')} (${atlas.sales.todayTransactions} transactions)
- vs yesterday: ₹${atlas.sales.yesterday.toLocaleString('en-IN')} (${today_vs_yesterday(atlas.sales.today, atlas.sales.yesterday)})
- This week: ₹${atlas.sales.thisWeek.toLocaleString('en-IN')} (${weekChange}% vs last week)

INVENTORY ALERTS:
- Low stock: ${atlas.inventory.lowStockItems.map(i => `${i.name} (~${i.daysLeft} days left)`).join(', ') || 'None'}
- Slow moving: ${atlas.inventory.slowMoving.map(i => i.name).join(', ') || 'None'}
- Top seller: ${atlas.inventory.topProducts[0]?.name || 'N/A'} (₹${atlas.inventory.topProducts[0]?.revenue?.toLocaleString('en-IN') || '0'} this month)

CUSTOMERS:
- Active: ${atlas.customers.active} | Inactive 30+ days: ${atlas.customers.inactive}
- New this month: ${atlas.customers.newThisMonth}

SPARK (Marketing):
- Running campaigns: ${spark.campaigns.running}
- WA messages this month: ${spark.whatsapp.messagesSentThisMonth}
- WA credits remaining: ${spark.whatsapp.creditsRemaining}

When relevant, suggest using Astra Spark for marketing (campaigns, WhatsApp, reels) or Astra Atlas for operations (inventory, billing). Be encouraging. If there's a real problem, be honest but constructive.`
}

function today_vs_yesterday(today: number, yesterday: number): string {
  if (yesterday === 0) return 'N/A'
  const change = ((today - yesterday) / yesterday * 100).toFixed(1)
  return `${Number(change) >= 0 ? '+' : ''}${change}%`
}
```

### server/src/services/ai.service.ts
```typescript
import { anthropic, AI_MODEL } from '../lib/anthropic'
import { buildInsightsPrompt } from '../lib/prompts'
import type { BusinessSnapshot, InsightCard } from '../types'
import { cache } from '../lib/cache'
import { logger } from '../lib/logger'

const INSIGHTS_CACHE_TTL = parseInt(process.env.INSIGHTS_CACHE_TTL || '600', 10)
const CACHE_KEY = 'ai_insights'

export class AIService {

  static async generateInsights(
    snapshot: BusinessSnapshot,
    forceRefresh = false
  ): Promise<InsightCard[]> {

    // Check cache
    if (!forceRefresh) {
      const cached = cache.get<InsightCard[]>(CACHE_KEY)
      if (cached) {
        logger.info('AIService.generateInsights → returning cached insights')
        return cached
      }
    }

    logger.info('AIService.generateInsights → calling Claude...')

    const prompt = buildInsightsPrompt(snapshot)

    const response = await anthropic.messages.create({
      model: AI_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    }, { timeout: 30000 })

    const text = (response.content[0] as any).text as string

    // Extract JSON array safely
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      logger.error('AIService → no JSON array in Claude response')
      throw new Error('AI returned unexpected format. Please try again.')
    }

    const raw: any[] = JSON.parse(jsonMatch[0])

    const insights: InsightCard[] = raw.map((item, i) => ({
      id: `ins_${Date.now()}_${i}`,
      type: item.type || 'recommendation',
      priority: item.priority || 'medium',
      title: item.title || 'Insight',
      body: item.body || '',
      action: item.action || null,
      actionLink: item.actionLink || null,
      generatedAt: new Date().toISOString(),
    }))

    // Cache insights
    cache.set(CACHE_KEY, insights, INSIGHTS_CACHE_TTL)
    logger.success(`AIService → ${insights.length} insights generated + cached for ${INSIGHTS_CACHE_TTL}s`)

    return insights
  }
}
```

### server/src/routes/insights.routes.ts
```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { AggregatorService } from '../services/aggregator.service'
import { AIService } from '../services/ai.service'
import { aiRateLimit } from '../middleware/rate-limit'
import { logger } from '../lib/logger'

const router = Router()

// POST /api/insights
router.post('/', aiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forceRefresh = req.body?.refresh === true
    const snapshot = await AggregatorService.getSnapshot()
    const insights = await AIService.generateInsights(snapshot, forceRefresh)

    logger.info(`POST /api/insights → ${insights.length} cards returned`)
    res.json({ insights, generatedAt: new Date().toISOString() })
  } catch (err) {
    next(err)
  }
})

export default router
```

Test: POST http://localhost:5000/api/insights → should return 6 insight cards.
Output: confirm route works + paste sample response.
```

---

---

# PHASE B6 — AI Chat Route (Streaming)

```
You are building the Express backend for Astra Lens.
Phase B6: Build the /api/chat route with Claude streaming responses.

## Files to Modify

### server/src/routes/chat.routes.ts
```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { AggregatorService } from '../services/aggregator.service'
import { buildChatSystemPrompt } from '../lib/prompts'
import { anthropic, AI_MODEL } from '../lib/anthropic'
import { aiRateLimit } from '../middleware/rate-limit'
import { logger } from '../lib/logger'
import type { ChatMessage } from '../types'

const router = Router()

// POST /api/chat
// Streams Claude response back to the client
router.post('/', aiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history = [] } = req.body as {
      message: string
      history: ChatMessage[]
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'message is required' })
      return
    }

    // Get business context
    const snapshot = await AggregatorService.getSnapshot()
    const systemPrompt = buildChatSystemPrompt(snapshot)

    logger.info(`POST /api/chat → "${message.slice(0, 50)}..."`)

    // Set streaming headers
    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    // Build messages array (last 10 history + current)
    const messages: ChatMessage[] = [
      ...history.slice(-10),
      { role: 'user', content: message },
    ]

    // Stream from Claude
    const stream = anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        res.write(chunk.delta.text)
      }
    }

    res.end()
    logger.success('POST /api/chat → stream complete')
  } catch (err) {
    // Can't send JSON error if headers already sent (streaming started)
    if (!res.headersSent) {
      next(err)
    } else {
      res.end()
    }
  }
})

export default router
```

Test with curl:
```bash
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Is hafte kaisa raha?", "history": []}' \
  --no-buffer
```
Should stream Hinglish response in chunks.

Output: confirm streaming works correctly.
```

---

---

# PHASE B7 — Connect Frontend to Backend

```
You are connecting the Astra Lens Next.js frontend to the new Express backend.
Currently the frontend calls its own /app/api/* routes which use mock data.
Now update those routes to proxy to the Express backend at http://localhost:5000.

## Files to Modify

Add to frontend .env.local:
```
BACKEND_URL=http://localhost:5000
```

### app/api/summary/route.ts — UPDATE
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/summary`, {
      next: { revalidate: 0 }, // no cache — always fresh
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    // Fallback to mock data if backend is down
    const { getBusinessSnapshot } = await import('@/lib/mock-data')
    return NextResponse.json(getBusinessSnapshot())
  }
}
```

### app/api/alerts/route.ts — UPDATE
```typescript
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/alerts`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    return NextResponse.json(await res.json())
  } catch {
    // Fallback: import alert logic inline from mock
    const { getBusinessSnapshot } = await import('@/lib/mock-data')
    const snapshot = getBusinessSnapshot()
    return NextResponse.json({ alerts: [], counts: { high: 0, medium: 0, low: 0, total: 0 } })
  }
}
```

### app/api/insights/route.ts — UPDATE
```typescript
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const res = await fetch(`${process.env.BACKEND_URL}/api/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    return NextResponse.json(await res.json())
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to generate insights', message: err.message },
      { status: 500 }
    )
  }
}
```

### app/api/chat/route.ts — UPDATE
```typescript
import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const backendRes = await fetch(`${process.env.BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!backendRes.ok || !backendRes.body) {
      return new Response('Backend unavailable', { status: 502 })
    }

    // Pass streaming response directly through to client
    return new Response(backendRes.body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
}
```

## Final Test — Full Stack
1. Start backend: `cd server && npm run dev` → port 5000
2. Start frontend: `cd .. && npm run dev` → port 3000
3. Open http://localhost:3000
4. Dashboard loads with real data from backend
5. Insights page generates Claude insights
6. Chat streams responses
7. Alerts show rule-based warnings

If backend is down → frontend falls back to mock data gracefully.

Output: confirm full stack works end-to-end.
```

---

END OF BACKEND MASTER PROMPTS

## Summary

| Phase | File(s) Created | What it does |
|-------|----------------|-------------|
| B0 | server scaffold | Express app, middleware, logger, cache, types |
| B1 | mock/*.ts | Mock Atlas + Spark data (fallback) |
| B2 | atlas.service + spark.service | Real API calls with mock fallback |
| B3 | aggregator.service + alert.service | Combines data + 6 alert rules |
| B4 | summary.routes + alerts.routes | GET /api/summary, GET /api/alerts |
| B5 | ai.service + insights.routes | Claude insights with caching |
| B6 | chat.routes | Claude streaming chat |
| B7 | frontend api routes updated | Frontend proxies to backend |
