import axios from 'axios'
import type { AtlasSnapshot } from '../types'
import { getAtlasMock } from '../mock/atlas.mock'
import { logger } from '../lib/logger'
import { getTenantApiKey, getTenantUrl } from '../lib/tenant-credentials-store'

/**
 * AtlasService — reads operations data from Astra Atlas.
 *
 * Auth: x-api-key: <key>  (Atlas integrationAuthMiddleware)
 * Endpoint: GET /api/lens/snapshot
 *
 * If tenant has no key/url configured → demo (mock) data.
 * If API call fails → fallback to mock data.
 */
export class AtlasService {

  private static getConfig(tenantId: string) {
    const url = getTenantUrl(tenantId, 'atlas')
    const key = getTenantApiKey(tenantId, 'atlas')
    return { url, key }
  }

  static async isReachable(tenantId: string): Promise<boolean> {
    const { url, key } = AtlasService.getConfig(tenantId)
    if (!url || !key) return false

    try {
      await axios.get(`${url}/api/lens/health`, {
        headers: { 'x-api-key': key },
        timeout: 3000,
      })
      return true
    } catch {
      return false
    }
  }

  static async getSnapshot(tenantId: string): Promise<AtlasSnapshot> {
    if (process.env.DEV_MODE === 'true') {
      logger.info('AtlasService → DEV_MODE: using mock data')
      return getAtlasMock()
    }

    const { url, key } = AtlasService.getConfig(tenantId)

    if (!url || !key) {
      logger.info(
        `AtlasService → tenant:${tenantId} not configured ` +
        `(url:${!!url} key:${!!key}), using demo data`
      )
      return getAtlasMock()
    }

    try {
      const res = await axios.get(`${url}/api/lens/snapshot`, {
        headers: { 'x-api-key': key },
        timeout: 8000,
      })

      logger.success(`AtlasService → live data for tenant:${tenantId}`)

      const data = res.data
      return {
        business: data.business,
        sales: {
          today: data.sales?.today ?? 0,
          yesterday: data.sales?.yesterday ?? 0,
          thisWeek: data.sales?.thisWeek ?? 0,
          lastWeek: data.sales?.lastWeek ?? 0,
          thisMonth: data.sales?.thisMonth ?? 0,
          lastMonth: data.sales?.lastMonth ?? 0,
          todayTransactions: data.sales?.todayTransactions ?? 0,
          trend: data.sales?.trend ?? [],
        },
        inventory: {
          totalItems: data.inventory?.totalItems ?? 0,
          totalValue: data.inventory?.totalValue ?? 0,
          lowStockItems: data.inventory?.lowStockItems ?? [],
          topProducts: data.inventory?.topProducts ?? [],
          slowMoving: data.inventory?.slowMoving ?? [],
        },
        customers: {
          total: data.customers?.total ?? 0,
          active: data.customers?.active ?? 0,
          inactive: data.customers?.inactive ?? 0,
          newThisMonth: data.customers?.newThisMonth ?? 0,
          topCustomers: data.customers?.topCustomers ?? [],
          recentActivity: data.customers?.recentActivity ?? [],
        },
      }
    } catch (err: any) {
      logger.warn(`AtlasService → unreachable for tenant:${tenantId} (${err.message}), using demo data`)
      return getAtlasMock()
    }
  }
}
