# Claude Prompt — Paste This Inside Astra Atlas Chat
### This will make Atlas expose a /api/lens/snapshot endpoint for Astra Lens

---

```
You are working inside the Astra Atlas codebase (astraKeeps/backend).

Atlas is a billing + inventory system for Indian shop owners. It uses:
- Fastify (not Express)
- PostgreSQL via raw pg pool queries (no ORM/Prisma)
- tenant_id based multi-tenancy
- An existing Integration API key system (integrationAuthMiddleware reads x-api-key header and resolves tenant_id)

## YOUR TASK

Add a new Lens snapshot endpoint to Atlas:
  GET /api/lens/snapshot
  Auth: x-api-key header (uses existing integrationAuthMiddleware)

This endpoint is called by Astra Lens — a sister product — to read business data for AI analysis.
It is READ-ONLY. No writes. No mutations. No side effects.

---

## STEP 1 — Add 'ASTRA_LENS' to integration sources

Find the file that defines IntegrationSource type (likely in src/repositories/integrationRepository.ts or a types file).

Look for a line like:
  export type IntegrationSource = 'WEBSITE' | 'SHOPIFY' | 'AMAZON' | 'FLIPKART' | 'CUSTOM_API'

Add 'ASTRA_LENS' to this union type:
  export type IntegrationSource = 'WEBSITE' | 'SHOPIFY' | 'AMAZON' | 'FLIPKART' | 'CUSTOM_API' | 'ASTRA_LENS'

Also find wherever IntegrationSource values are validated in integrationRoutes.ts (the validSources array) and add 'ASTRA_LENS' there too.

---

## STEP 2 — Create src/repositories/lensRepository.ts

This repository runs all SQL queries needed by the Lens snapshot.
It uses the db pool directly (same pattern as other repositories).

```typescript
/**
 * LENS REPOSITORY
 * Read-only queries for Astra Lens integration.
 * Returns aggregated business data — no writes, no transactions.
 */

import { db } from '../database/connection'

export interface LensSalesData {
  today: number
  yesterday: number
  thisWeek: number
  lastWeek: number
  thisMonth: number
  lastMonth: number
  todayTransactions: number
  trend: Array<{ date: string; amount: number; transactions: number }>
}

export interface LensProduct {
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

export interface LensCustomer {
  id: string
  name: string
  phone: string
  totalSpent: number
  visits: number
  lastVisit: string
  tags: string[]
}

export interface LensActivity {
  customerId: string
  name: string
  action: 'Purchase' | 'Return' | 'New'
  amount: number
  items: string[]
  time: string
}

export class LensRepository {

  // ── BUSINESS INFO ──────────────────────────────────────────────────

  async getBusinessInfo(tenant_id: string): Promise<{
    name: string
    owner: string
    location: string
    category: string
    phone: string
  }> {
    // Query tenant_settings or businesses table for shop name, owner name, city, state, category, phone
    // Adjust table/column names to match actual Atlas schema
    const result = await db.query(
      `SELECT
        ts.shop_name AS name,
        u.name AS owner,
        CONCAT(ts.city, ', ', ts.state) AS location,
        ts.category,
        ts.phone
       FROM tenant_settings ts
       LEFT JOIN users u ON u.tenant_id = ts.tenant_id AND u.role = 'OWNER'
       WHERE ts.tenant_id = $1
       LIMIT 1`,
      [tenant_id]
    )
    const row = result.rows[0]
    return {
      name: row?.name || 'My Store',
      owner: row?.owner || 'Owner',
      location: row?.location || 'India',
      category: row?.category || 'General Store',
      phone: row?.phone || '',
    }
  }

  // ── SALES ──────────────────────────────────────────────────────────

  async getSalesData(tenant_id: string): Promise<LensSalesData> {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]

    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    // Week boundaries (Mon–Sun)
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay() + 1)
    const lastWeekStart = new Date(weekStart)
    lastWeekStart.setDate(weekStart.getDate() - 7)
    const lastWeekEnd = new Date(weekStart)
    lastWeekEnd.setDate(weekStart.getDate() - 1)

    // Month boundaries
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)

    // Run all queries in parallel
    const [todayRes, yesterdayRes, thisWeekRes, lastWeekRes, thisMonthRes, lastMonthRes, trendRes] =
      await Promise.all([
        // Today
        db.query(
          `SELECT COALESCE(SUM(total_amount), 0) AS amount, COUNT(*) AS transactions
           FROM sales WHERE tenant_id = $1 AND sale_date::date = $2 AND deleted_at IS NULL`,
          [tenant_id, todayStr]
        ),
        // Yesterday
        db.query(
          `SELECT COALESCE(SUM(total_amount), 0) AS amount
           FROM sales WHERE tenant_id = $1 AND sale_date::date = $2 AND deleted_at IS NULL`,
          [tenant_id, yesterdayStr]
        ),
        // This week
        db.query(
          `SELECT COALESCE(SUM(total_amount), 0) AS amount
           FROM sales WHERE tenant_id = $1 AND sale_date >= $2 AND deleted_at IS NULL`,
          [tenant_id, weekStart.toISOString()]
        ),
        // Last week
        db.query(
          `SELECT COALESCE(SUM(total_amount), 0) AS amount
           FROM sales WHERE tenant_id = $1 AND sale_date >= $2 AND sale_date <= $3 AND deleted_at IS NULL`,
          [tenant_id, lastWeekStart.toISOString(), lastWeekEnd.toISOString()]
        ),
        // This month
        db.query(
          `SELECT COALESCE(SUM(total_amount), 0) AS amount
           FROM sales WHERE tenant_id = $1 AND sale_date >= $2 AND deleted_at IS NULL`,
          [tenant_id, monthStart.toISOString()]
        ),
        // Last month
        db.query(
          `SELECT COALESCE(SUM(total_amount), 0) AS amount
           FROM sales WHERE tenant_id = $1 AND sale_date >= $2 AND sale_date <= $3 AND deleted_at IS NULL`,
          [tenant_id, lastMonthStart.toISOString(), lastMonthEnd.toISOString()]
        ),
        // 7-day trend
        db.query(
          `SELECT
             sale_date::date AS date,
             COALESCE(SUM(total_amount), 0) AS amount,
             COUNT(*) AS transactions
           FROM sales
           WHERE tenant_id = $1
             AND sale_date >= NOW() - INTERVAL '7 days'
             AND deleted_at IS NULL
           GROUP BY sale_date::date
           ORDER BY sale_date::date ASC`,
          [tenant_id]
        ),
      ])

    return {
      today: parseFloat(todayRes.rows[0]?.amount || '0'),
      yesterday: parseFloat(yesterdayRes.rows[0]?.amount || '0'),
      thisWeek: parseFloat(thisWeekRes.rows[0]?.amount || '0'),
      lastWeek: parseFloat(lastWeekRes.rows[0]?.amount || '0'),
      thisMonth: parseFloat(thisMonthRes.rows[0]?.amount || '0'),
      lastMonth: parseFloat(lastMonthRes.rows[0]?.amount || '0'),
      todayTransactions: parseInt(todayRes.rows[0]?.transactions || '0'),
      trend: trendRes.rows.map((r: any) => ({
        date: r.date,
        amount: parseFloat(r.amount),
        transactions: parseInt(r.transactions),
      })),
    }
  }

  // ── INVENTORY ──────────────────────────────────────────────────────

  async getTopProducts(tenant_id: string, limit = 5): Promise<LensProduct[]> {
    // Join products with sale_items to find top sellers this month
    const result = await db.query(
      `SELECT
         p.id,
         p.name,
         p.category,
         p.selling_price AS price,
         p.current_stock AS stock,
         COALESCE(p.unit, 'units') AS unit,
         COALESCE(SUM(si.quantity), 0) AS sold_this_month,
         COALESCE(SUM(si.total_price), 0) AS revenue
       FROM products p
       LEFT JOIN sale_items si ON si.product_id = p.id
         AND si.created_at >= date_trunc('month', NOW())
       WHERE p.tenant_id = $1 AND p.deleted_at IS NULL
       GROUP BY p.id, p.name, p.category, p.selling_price, p.current_stock, p.unit
       ORDER BY revenue DESC
       LIMIT $2`,
      [tenant_id, limit]
    )

    return result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category || 'General',
      price: parseFloat(r.price || '0'),
      stock: parseInt(r.stock || '0'),
      unit: r.unit || 'units',
      soldThisMonth: parseInt(r.sold_this_month || '0'),
      revenue: parseFloat(r.revenue || '0'),
      trend: parseInt(r.sold_this_month) > 10 ? 'up' : parseInt(r.sold_this_month) < 3 ? 'down' : 'stable',
    }))
  }

  async getLowStockItems(tenant_id: string, daysThreshold = 7): Promise<LensProduct[]> {
    // Products where current_stock / (monthly_sales / 30) < daysThreshold
    const result = await db.query(
      `SELECT
         p.id,
         p.name,
         p.category,
         p.selling_price AS price,
         p.current_stock AS stock,
         COALESCE(p.unit, 'units') AS unit,
         COALESCE(monthly.sold, 0) AS sold_this_month,
         COALESCE(monthly.revenue, 0) AS revenue,
         CASE
           WHEN COALESCE(monthly.sold, 0) = 0 THEN 999
           ELSE ROUND(p.current_stock / (COALESCE(monthly.sold, 0)::float / 30))
         END AS days_left
       FROM products p
       LEFT JOIN (
         SELECT si.product_id,
                SUM(si.quantity) AS sold,
                SUM(si.total_price) AS revenue
         FROM sale_items si
         WHERE si.created_at >= date_trunc('month', NOW())
         GROUP BY si.product_id
       ) monthly ON monthly.product_id = p.id
       WHERE p.tenant_id = $1
         AND p.deleted_at IS NULL
         AND p.current_stock > 0
         AND CASE
               WHEN COALESCE(monthly.sold, 0) = 0 THEN false
               ELSE (p.current_stock / (COALESCE(monthly.sold, 0)::float / 30)) < $2
             END
       ORDER BY days_left ASC
       LIMIT 10`,
      [tenant_id, daysThreshold]
    )

    return result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category || 'General',
      price: parseFloat(r.price || '0'),
      stock: parseInt(r.stock || '0'),
      unit: r.unit || 'units',
      soldThisMonth: parseInt(r.sold_this_month || '0'),
      revenue: parseFloat(r.revenue || '0'),
      daysLeft: parseInt(r.days_left || '999'),
      trend: 'down',
    }))
  }

  async getSlowMovingItems(tenant_id: string, maxSold = 5): Promise<LensProduct[]> {
    const result = await db.query(
      `SELECT
         p.id,
         p.name,
         p.category,
         p.selling_price AS price,
         p.current_stock AS stock,
         COALESCE(p.unit, 'units') AS unit,
         COALESCE(monthly.sold, 0) AS sold_this_month,
         COALESCE(monthly.revenue, 0) AS revenue
       FROM products p
       LEFT JOIN (
         SELECT si.product_id,
                SUM(si.quantity) AS sold,
                SUM(si.total_price) AS revenue
         FROM sale_items si
         WHERE si.created_at >= date_trunc('month', NOW())
         GROUP BY si.product_id
       ) monthly ON monthly.product_id = p.id
       WHERE p.tenant_id = $1
         AND p.deleted_at IS NULL
         AND p.current_stock > 10
         AND COALESCE(monthly.sold, 0) <= $2
       ORDER BY p.current_stock DESC
       LIMIT 5`,
      [tenant_id, maxSold]
    )

    return result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      category: r.category || 'General',
      price: parseFloat(r.price || '0'),
      stock: parseInt(r.stock || '0'),
      unit: r.unit || 'units',
      soldThisMonth: parseInt(r.sold_this_month || '0'),
      revenue: parseFloat(r.revenue || '0'),
      trend: 'down',
    }))
  }

  async getTotalInventory(tenant_id: string): Promise<{ totalItems: number; totalValue: number }> {
    const result = await db.query(
      `SELECT
         COUNT(*) AS total_items,
         COALESCE(SUM(current_stock * selling_price), 0) AS total_value
       FROM products
       WHERE tenant_id = $1 AND deleted_at IS NULL`,
      [tenant_id]
    )
    return {
      totalItems: parseInt(result.rows[0]?.total_items || '0'),
      totalValue: parseFloat(result.rows[0]?.total_value || '0'),
    }
  }

  // ── CUSTOMERS ──────────────────────────────────────────────────────

  async getCustomerStats(tenant_id: string): Promise<{
    total: number
    active: number
    inactive: number
    newThisMonth: number
  }> {
    const result = await db.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE last_purchase_at >= NOW() - INTERVAL '30 days') AS active,
         COUNT(*) FILTER (WHERE last_purchase_at < NOW() - INTERVAL '30 days' OR last_purchase_at IS NULL) AS inactive,
         COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) AS new_this_month
       FROM customers
       WHERE tenant_id = $1 AND deleted_at IS NULL`,
      [tenant_id]
    )
    const row = result.rows[0]
    return {
      total: parseInt(row?.total || '0'),
      active: parseInt(row?.active || '0'),
      inactive: parseInt(row?.inactive || '0'),
      newThisMonth: parseInt(row?.new_this_month || '0'),
    }
  }

  async getTopCustomers(tenant_id: string, limit = 3): Promise<LensCustomer[]> {
    const result = await db.query(
      `SELECT
         c.id,
         c.name,
         c.phone,
         COALESCE(SUM(s.total_amount), 0) AS total_spent,
         COUNT(s.id) AS visits,
         MAX(s.sale_date)::text AS last_visit
       FROM customers c
       LEFT JOIN sales s ON s.customer_id = c.id AND s.deleted_at IS NULL
       WHERE c.tenant_id = $1 AND c.deleted_at IS NULL
       GROUP BY c.id, c.name, c.phone
       ORDER BY total_spent DESC
       LIMIT $2`,
      [tenant_id, limit]
    )

    return result.rows.map((r: any) => ({
      id: r.id,
      name: r.name || 'Customer',
      phone: r.phone || '',
      totalSpent: parseFloat(r.total_spent || '0'),
      visits: parseInt(r.visits || '0'),
      lastVisit: r.last_visit ? r.last_visit.split('T')[0] : '',
      tags: [],
    }))
  }

  async getRecentActivity(tenant_id: string, limit = 5): Promise<LensActivity[]> {
    const result = await db.query(
      `SELECT
         s.id AS sale_id,
         c.id AS customer_id,
         COALESCE(c.name, s.customer_name, 'Walk-in') AS customer_name,
         s.total_amount AS amount,
         s.created_at,
         ARRAY_AGG(p.name ORDER BY si.quantity DESC) AS product_names
       FROM sales s
       LEFT JOIN customers c ON c.id = s.customer_id
       LEFT JOIN sale_items si ON si.sale_id = s.id
       LEFT JOIN products p ON p.id = si.product_id
       WHERE s.tenant_id = $1 AND s.deleted_at IS NULL
       GROUP BY s.id, c.id, c.name, s.customer_name, s.total_amount, s.created_at
       ORDER BY s.created_at DESC
       LIMIT $2`,
      [tenant_id, limit]
    )

    return result.rows.map((r: any) => {
      const minutesAgo = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 60000)
      let time: string
      if (minutesAgo < 60) time = `${minutesAgo} minutes ago`
      else if (minutesAgo < 1440) time = `${Math.floor(minutesAgo / 60)} hours ago`
      else time = `${Math.floor(minutesAgo / 1440)} days ago`

      return {
        customerId: r.customer_id || r.sale_id,
        name: r.customer_name,
        action: 'Purchase' as const,
        amount: parseFloat(r.amount || '0'),
        items: (r.product_names || []).filter(Boolean).slice(0, 3),
        time,
      }
    })
  }
}

export const lensRepository = new LensRepository()
```

---

## STEP 3 — Create src/services/lensService.ts

```typescript
/**
 * LENS SERVICE
 * Orchestrates all repository calls and assembles the snapshot object.
 * Returns exactly the shape that Astra Lens expects.
 */

import { lensRepository } from '../repositories/lensRepository'

export class LensService {
  async getSnapshot(tenant_id: string) {
    // Run all queries in parallel for speed
    const [
      business,
      sales,
      topProducts,
      lowStockItems,
      slowMoving,
      inventoryTotals,
      customerStats,
      topCustomers,
      recentActivity,
    ] = await Promise.all([
      lensRepository.getBusinessInfo(tenant_id),
      lensRepository.getSalesData(tenant_id),
      lensRepository.getTopProducts(tenant_id, 5),
      lensRepository.getLowStockItems(tenant_id, 7),
      lensRepository.getSlowMovingItems(tenant_id, 5),
      lensRepository.getTotalInventory(tenant_id),
      lensRepository.getCustomerStats(tenant_id),
      lensRepository.getTopCustomers(tenant_id, 3),
      lensRepository.getRecentActivity(tenant_id, 5),
    ])

    return {
      business,
      sales,
      inventory: {
        totalItems: inventoryTotals.totalItems,
        totalValue: inventoryTotals.totalValue,
        lowStockItems,
        topProducts,
        slowMoving,
      },
      customers: {
        ...customerStats,
        topCustomers,
        recentActivity,
      },
    }
  }
}

export const lensService = new LensService()
```

---

## STEP 4 — Create src/routes/lensRoutes.ts

```typescript
/**
 * LENS ROUTES
 * Exposes Atlas data to Astra Lens via the existing Integration API key system.
 *
 * Auth: x-api-key header → integrationAuthMiddleware → tenant_id resolved automatically
 * All routes are READ-ONLY.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { integrationAuthMiddleware, getIntegrationTenantId } from '../middleware/integrationAuth'
import { lensService } from '../services/lensService'

export async function lensRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/lens/snapshot
   * Returns full business snapshot for Astra Lens.
   * Auth: x-api-key header (ASTRA_LENS integration)
   */
  app.get(
    '/lens/snapshot',
    {
      preHandler: integrationAuthMiddleware,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tenant_id = getIntegrationTenantId(request)
        const snapshot = await lensService.getSnapshot(tenant_id)

        return reply.send(snapshot)
      } catch (error: any) {
        request.log.error({ error: error.message }, 'Lens snapshot failed')
        return reply.status(500).send({
          error: 'InternalServerError',
          message: 'Failed to generate Lens snapshot',
        })
      }
    }
  )

  /**
   * GET /api/lens/health
   * Simple health check for Lens to verify connectivity.
   * Auth: x-api-key header
   */
  app.get(
    '/lens/health',
    {
      preHandler: integrationAuthMiddleware,
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenant_id = getIntegrationTenantId(request)
      return reply.send({
        status: 'ok',
        service: 'astra-atlas',
        tenant_id,
        timestamp: new Date().toISOString(),
      })
    }
  )
}
```

---

## STEP 5 — Register lensRoutes in the main app file

Find the main Fastify app file (likely src/app.ts or src/index.ts or src/server.ts).
Look for where other routes are registered using `app.register()`.

Add this import and registration alongside the existing routes:

```typescript
import { lensRoutes } from './routes/lensRoutes'

// Add with other route registrations:
app.register(lensRoutes, { prefix: '/api' })
```

---

## STEP 6 — Add ASTRA_LENS to validSources in integrationRoutes.ts

Find src/routes/integrationRoutes.ts.
Find the validSources array (around line 87):
```typescript
const validSources: IntegrationSource[] = [
  'WEBSITE',
  'SHOPIFY',
  'AMAZON',
  'FLIPKART',
  'CUSTOM_API',
]
```

Add 'ASTRA_LENS':
```typescript
const validSources: IntegrationSource[] = [
  'WEBSITE',
  'SHOPIFY',
  'AMAZON',
  'FLIPKART',
  'CUSTOM_API',
  'ASTRA_LENS',
]
```

---

## IMPORTANT NOTES

1. The SQL column names in the repository (total_amount, current_stock, selling_price, etc.) MUST match Atlas's actual table columns. Before using this code, verify column names by reading:
   - src/repositories/salesRepository.ts (for sales table columns)
   - src/repositories/productRepository.ts (for products table columns)
   - src/repositories/customerRepository.ts (for customers table columns)
   If column names differ, update them in lensRepository.ts accordingly.

2. DO NOT modify any existing routes, services, or repositories. Only ADD new files.

3. The lensRoutes handler is purely read-only — no INSERT, UPDATE, or DELETE queries anywhere.

4. After code is added and server restarts:
   - Create an ASTRA_LENS integration via POST /api/integrations: { "name": "Astra Lens", "source": "ASTRA_LENS" }
   - Save the one-time API key
   - Add it to Lens backend as ATLAS_API_KEY in server/.env

Output: List every file created/modified and confirm the server starts without errors.
```
