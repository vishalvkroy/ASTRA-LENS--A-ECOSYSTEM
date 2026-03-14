import type { BusinessSnapshot } from '../types'
import { AtlasService } from './atlas.service'
import { SparkService } from './spark.service'
import { sparkInsightNotifier } from './spark-notifier.service'
import { cache } from '../lib/cache'
import { logger } from '../lib/logger'
import { normalizeTenantId } from '../lib/tenant'

const CACHE_TTL      = parseInt(process.env.SNAPSHOT_CACHE_TTL      || '300', 10)
// Background refresh fires when remaining TTL drops below this threshold (seconds)
const REFRESH_LEAD   = parseInt(process.env.SNAPSHOT_REFRESH_LEAD   || '60',  10)

// Track which tenants have an in-flight background refresh so we don't double-fire
const _refreshing = new Set<string>()

export class AggregatorService {

  static async getSnapshot(forceRefresh = false, tenantId = 'default'): Promise<BusinessSnapshot> {
    const resolvedTenantId = normalizeTenantId(tenantId)
    const cacheKey         = `business_snapshot:${resolvedTenantId}`
    const ttlKey           = `${cacheKey}:set_at`

    if (!forceRefresh) {
      const cached = cache.get<BusinessSnapshot>(cacheKey)
      if (cached) {
        logger.info(`AggregatorService -> returning cached snapshot for tenant:${resolvedTenantId}`)

        // ── Background (stale-while-revalidate) refresh ──────────────────────
        // If the cached entry is close to expiry and no refresh is already in
        // flight, kick off a background fetch so the next request sees fresh data
        const setAt = cache.get<number>(ttlKey)
        if (setAt !== undefined && !_refreshing.has(resolvedTenantId)) {
          const ageSeconds     = (Date.now() - setAt) / 1000
          const remainingTTL   = CACHE_TTL - ageSeconds
          if (remainingTTL < REFRESH_LEAD) {
            _refreshing.add(resolvedTenantId)
            logger.info(`AggregatorService -> background refresh triggered for tenant:${resolvedTenantId} (${Math.round(remainingTTL)}s remaining)`)
            AggregatorService._fetchAndCache(resolvedTenantId, cacheKey, ttlKey)
              .catch(err => logger.error(`AggregatorService -> background refresh failed for tenant:${resolvedTenantId}: ${err.message}`))
              .finally(() => _refreshing.delete(resolvedTenantId))
          }
        }

        return cached
      }
    }

    // Cache miss or forced refresh — fetch synchronously
    return AggregatorService._fetchAndCache(resolvedTenantId, cacheKey, ttlKey)
  }

  /** Fetch fresh data, write to cache, notify Spark. Returns the new snapshot. */
  private static async _fetchAndCache(
    resolvedTenantId: string,
    cacheKey: string,
    ttlKey: string,
  ): Promise<BusinessSnapshot> {
    logger.info(`AggregatorService -> fetching fresh snapshot for tenant:${resolvedTenantId}`)

    const [atlas, spark] = await Promise.all([
      AtlasService.getSnapshot(resolvedTenantId),
      SparkService.getSnapshot(resolvedTenantId),
    ])

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

    // Write snapshot and its creation timestamp (used for TTL calculation)
    cache.set(cacheKey, snapshot, CACHE_TTL)
    cache.set(ttlKey, Date.now(), CACHE_TTL + REFRESH_LEAD)
    logger.success(`AggregatorService -> snapshot ready for tenant:${resolvedTenantId}, cached for ${CACHE_TTL}s`)

    // Push key insight to Spark (fire-and-forget — must not block or throw)
    sparkInsightNotifier.notifyFromSnapshot(resolvedTenantId, snapshot)

    return snapshot
  }
}

function estimateDaysLeft(stock: number, soldThisMonth: number): number {
  if (soldThisMonth === 0) return 999
  const dailyRate = soldThisMonth / 30
  return Math.round(stock / dailyRate)
}
