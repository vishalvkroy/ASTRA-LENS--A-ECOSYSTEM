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
export interface DiagnoseResult {
  reachable: boolean
  statusCode?: number
  errorType?: 'auth' | 'not_found' | 'timeout' | 'network' | 'server_error' | 'unknown'
  errorMessage?: string
  endpoint?: string
}

export class AtlasService {

  private static async getConfig(tenantId: string) {
    const url = await getTenantUrl(tenantId, 'atlas')
    const key = await getTenantApiKey(tenantId, 'atlas')
    return { url, key }
  }

  static async diagnose(tenantId: string): Promise<DiagnoseResult> {
    const { url, key } = await AtlasService.getConfig(tenantId)
    if (!url || !key) {
      return { reachable: false, errorType: 'unknown', errorMessage: 'Not configured — no URL or API key' }
    }

    const endpoint = `${url}/api/lens/snapshot`
    try {
      await axios.get(endpoint, {
        headers: { 'x-api-key': key },
        timeout: 8000,
      })
      return { reachable: true, endpoint }
    } catch (err: any) {
      const status: number | undefined = err.response?.status
      let errorType: DiagnoseResult['errorType'] = 'unknown'
      let errorMessage = err.message

      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        errorType = 'timeout'
        errorMessage = 'Request timed out — server may be starting up (Render cold start)'
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        errorType = 'network'
        errorMessage = `Cannot reach ${url} — check the URL`
      } else if (status === 401 || status === 403) {
        errorType = 'auth'
        errorMessage = 'API key rejected — check your connection key is correct'
      } else if (status === 404) {
        errorType = 'not_found'
        errorMessage = '/api/lens/snapshot not found — Atlas may not have implemented the Lens endpoint yet'
      } else if (status && status >= 500) {
        errorType = 'server_error'
        errorMessage = `Atlas server error (${status}) — ${err.response?.data?.message || err.message}`
      }

      logger.warn(`AtlasService.diagnose → tenant:${tenantId} ${errorType} (${status ?? err.code}): ${errorMessage}`)
      return { reachable: false, statusCode: status, errorType, errorMessage, endpoint }
    }
  }

  static async isReachable(tenantId: string): Promise<boolean> {
    const result = await AtlasService.diagnose(tenantId)
    return result.reachable
  }

  static async getSnapshot(tenantId: string): Promise<AtlasSnapshot> {
    if (process.env.NODE_ENV !== 'production' && process.env.DEV_MODE === 'true') {
      logger.info('AtlasService → DEV_MODE: using mock data')
      return getAtlasMock()
    }

    const { url, key } = await AtlasService.getConfig(tenantId)

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
      const status = err.response?.status
      logger.warn(
        `AtlasService → snapshot failed for tenant:${tenantId} ` +
        `status:${status ?? err.code} msg:${err.message} — using demo data`
      )
      return getAtlasMock()
    }
  }
}
