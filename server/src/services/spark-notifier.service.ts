/**
 * SPARK NOTIFIER (Lens → Spark)
 * Fire-and-forget: after Lens generates a fresh snapshot, it pushes
 * the top insight to Spark so the dashboard can show "AI Suggestions".
 *
 * Auth: x-service-key header with SPARK_SERVICE_KEY env var.
 * Never throws — Spark being down must never break Lens.
 */

import type { BusinessSnapshot } from '../types'
import { logger } from '../lib/logger'

const SPARK_URL = process.env['SPARK_SERVICE_URL'] ?? ''
const SPARK_KEY = process.env['SPARK_SERVICE_KEY'] ?? ''
const REQUEST_TIMEOUT = 5_000

export interface LensInsightPayload {
  type: 'insight.generated'
  tenantId: string
  insight: {
    category: 'slow_moving' | 'trending' | 'low_stock' | 'revenue_opportunity'
    productName: string
    message: string
    recommendAction: 'promote' | 'restock' | 'highlight' | 'none'
  }
  timestamp: string
}

function deriveInsight(snapshot: BusinessSnapshot): LensInsightPayload['insight'] | null {
  const { atlas } = snapshot
  const inventory = atlas.inventory

  // Priority 1: slow-moving items (clearance opportunity)
  if (inventory.slowMoving && inventory.slowMoving.length > 0) {
    const slowItem = inventory.slowMoving[0]!
    return {
      category: 'slow_moving',
      productName: slowItem.name,
      message: `"${slowItem.name}" is moving slowly. Consider a promotional offer.`,
      recommendAction: 'promote',
    }
  }

  // Priority 2: critical low stock
  const criticalItem = inventory.lowStockItems.find((i) => (i.daysLeft ?? 999) < 5)
  if (criticalItem) {
    return {
      category: 'low_stock',
      productName: criticalItem.name,
      message: `"${criticalItem.name}" will run out in ~${criticalItem.daysLeft ?? '<5'} days.`,
      recommendAction: 'restock',
    }
  }

  // Priority 3: top selling product (showcase / trending)
  const topProduct = inventory.topProducts?.[0] ?? null
  if (topProduct) {
    return {
      category: 'trending',
      productName: topProduct.name,
      message: `"${topProduct.name}" is your best seller. Highlight it to bring in more customers.`,
      recommendAction: 'highlight',
    }
  }

  return null
}

async function post(tenantId: string, payload: LensInsightPayload): Promise<void> {
  if (!SPARK_URL || !SPARK_KEY) return

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    await fetch(`${SPARK_URL}/api/internal/lens-insight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': SPARK_KEY,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })
  } catch {
    // Intentionally swallowed
  } finally {
    clearTimeout(timer)
  }
}

export const sparkInsightNotifier = {
  notifyFromSnapshot(tenantId: string, snapshot: BusinessSnapshot): void {
    const insight = deriveInsight(snapshot)
    if (!insight) return

    const payload: LensInsightPayload = {
      type: 'insight.generated',
      tenantId,
      insight,
      timestamp: new Date().toISOString(),
    }

    logger.info(
      `sparkInsightNotifier → tenant:${tenantId} ` +
      `sending insight: ${insight.category} / "${insight.productName}"`
    )

    void post(tenantId, payload)
  },
}
