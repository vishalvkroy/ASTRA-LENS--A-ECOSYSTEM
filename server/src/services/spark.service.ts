import axios from 'axios'
import type { SparkData } from '../types'
import { getSparkMock } from '../mock/spark.mock'
import { logger } from '../lib/logger'
import { getTenantApiKey, getTenantUrl, getSparkBusinessId } from '../lib/tenant-credentials-store'

/**
 * SparkService — reads marketing data from Astra Spark.
 *
 * Integration contract (see PROMPT_FOR_SPARK.md):
 *   GET <sparkUrl>/api/lens/snapshot?businessId=<uuid>
 *   GET <sparkUrl>/api/lens/health?businessId=<uuid>
 *   Auth: x-lens-key: <key>  (set as LENS_API_KEY in Spark's .env)
 *
 * If tenant has no key/url/businessId → demo (mock) data.
 * If API call fails → fallback to mock data.
 */
export class SparkService {

  private static getConfig(tenantId: string) {
    const url = getTenantUrl(tenantId, 'spark')
    const key = getTenantApiKey(tenantId, 'spark')
    const businessId = getSparkBusinessId(tenantId)
    return { url, key, businessId }
  }

  static async isReachable(tenantId: string): Promise<boolean> {
    const { url, key, businessId } = SparkService.getConfig(tenantId)
    if (!url || !key) return false

    try {
      await axios.get(`${url}/api/lens/health`, {
        headers: { 'x-lens-key': key },
        params: businessId ? { businessId } : {},
        timeout: 3000,
      })
      return true
    } catch {
      return false
    }
  }

  static async getSnapshot(tenantId: string): Promise<SparkData> {
    if (process.env.DEV_MODE === 'true') {
      logger.info('SparkService → DEV_MODE: using mock data')
      return getSparkMock()
    }

    const { url, key, businessId } = SparkService.getConfig(tenantId)

    if (!url || !key || !businessId) {
      logger.info(
        `SparkService → tenant:${tenantId} not configured ` +
        `(url:${!!url} key:${!!key} businessId:${!!businessId}), using demo data`
      )
      return getSparkMock()
    }

    try {
      const res = await axios.get(`${url}/api/lens/snapshot`, {
        headers: { 'x-lens-key': key },
        params: { businessId },
        timeout: 8000,
      })

      logger.success(`SparkService → live data for tenant:${tenantId}`)

      const data = res.data
      return {
        campaigns: {
          total: data.campaigns?.total ?? 0,
          running: data.campaigns?.running ?? 0,
          list: (data.campaigns?.list ?? []).map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status?.toLowerCase(),
            type: 'whatsapp',
            sentAt: c.sentAt,
            delivered: c.delivered ?? 0,
            opened: c.opened ?? 0,
            clicked: c.clicked ?? 0,
            audience: c.audience ?? 0,
          })),
        },
        whatsapp: {
          messagesSentThisMonth: data.whatsapp?.messagesSentThisMonth ?? 0,
          deliveryRate: data.whatsapp?.deliveryRate ?? 0,
          openRate: data.whatsapp?.openRate ?? 0,
          creditsRemaining: data.whatsapp?.creditsRemaining ?? 0,
        },
        reelScripts: data.reelScripts ?? 0,
        scheduledPosts: data.scheduledPosts ?? 0,
      }
    } catch (err: any) {
      logger.warn(`SparkService → unreachable for tenant:${tenantId} (${err.message}), using demo data`)
      return getSparkMock()
    }
  }
}
