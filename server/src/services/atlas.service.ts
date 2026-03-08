import axios from 'axios'
import type { AtlasSnapshot } from '../types'
import { getAtlasMock } from '../mock/atlas.mock'
import { logger } from '../lib/logger'
import { getTenantApiKey, getTenantUrl } from '../lib/tenant-credentials-store'

/**
 * AtlasService — reads operations data from Astra Atlas.
 *
 * Auth: Authorization: Bearer <key>
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
      await axios.get(`${url}/api/health`, {
        headers: { Authorization: `Bearer ${key}` },
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
      const headers = { Authorization: `Bearer ${key}` }

      const [salesRes, inventoryRes, customersRes] = await Promise.all([
        axios.get(`${url}/api/reports/sales-summary`, { headers, timeout: 8000 }),
        axios.get(`${url}/api/inventory?limit=100`, { headers, timeout: 8000 }),
        axios.get(`${url}/api/customers/summary`, { headers, timeout: 8000 }),
      ])

      logger.success(`AtlasService → live data for tenant:${tenantId}`)

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
      logger.warn(`AtlasService → unreachable for tenant:${tenantId} (${err.message}), using demo data`)
      return getAtlasMock()
    }
  }
}
