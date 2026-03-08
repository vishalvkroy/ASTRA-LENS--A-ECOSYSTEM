import type { BusinessSnapshot } from '../types'
import { AtlasService } from './atlas.service'
import { SparkService } from './spark.service'
import { cache } from '../lib/cache'
import { logger } from '../lib/logger'
import { normalizeTenantId } from '../lib/tenant'

const CACHE_TTL = parseInt(process.env.SNAPSHOT_CACHE_TTL || '300', 10)

export class AggregatorService {

  static async getSnapshot(forceRefresh = false, tenantId = 'default'): Promise<BusinessSnapshot> {
    const resolvedTenantId = normalizeTenantId(tenantId)
    const cacheKey = `business_snapshot:${resolvedTenantId}`

    if (!forceRefresh) {
      const cached = cache.get<BusinessSnapshot>(cacheKey)
      if (cached) {
        logger.info(`AggregatorService -> returning cached snapshot for tenant:${resolvedTenantId}`)
        return cached
      }
    }

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

    cache.set(cacheKey, snapshot, CACHE_TTL)
    logger.success(`AggregatorService -> snapshot ready for tenant:${resolvedTenantId}, cached for ${CACHE_TTL}s`)

    return snapshot
  }
}

function estimateDaysLeft(stock: number, soldThisMonth: number): number {
  if (soldThisMonth === 0) return 999
  const dailyRate = soldThisMonth / 30
  return Math.round(stock / dailyRate)
}
