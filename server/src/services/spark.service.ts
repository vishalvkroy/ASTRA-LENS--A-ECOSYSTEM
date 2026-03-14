import axios from 'axios'
import type { SparkData } from '../types'
import { getSparkMock } from '../mock/spark.mock'
import { logger } from '../lib/logger'
import { getTenantApiKey, getTenantUrl, getSparkBusinessId } from '../lib/tenant-credentials-store'
import type { DiagnoseResult } from './atlas.service'

export type { DiagnoseResult }

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

  private static async getConfig(tenantId: string) {
    const url = await getTenantUrl(tenantId, 'spark')
    const key = await getTenantApiKey(tenantId, 'spark')
    const businessId = await getSparkBusinessId(tenantId)
    return { url, key, businessId }
  }

  static async diagnose(tenantId: string): Promise<DiagnoseResult> {
    const { url, key, businessId } = await SparkService.getConfig(tenantId)
    if (!url || !key) {
      return { reachable: false, errorType: 'unknown', errorMessage: 'Not configured — no URL or API key' }
    }
    if (!businessId) {
      return { reachable: false, errorType: 'unknown', errorMessage: 'No businessId — connection key may be missing the business ID' }
    }

    const endpoint = `${url}/api/lens/snapshot`
    try {
      await axios.get(endpoint, {
        headers: { 'x-lens-key': key },
        params: { businessId },
        timeout: 8000,
      })
      return { reachable: true, endpoint }
    } catch (err: any) {
      const status: number | undefined = err.response?.status
      let errorType: DiagnoseResult['errorType'] = 'unknown'
      let errorMessage = err.message

      if (err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT') {
        errorType = 'timeout'
        errorMessage = 'Request timed out — Spark server may be starting up'
      } else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
        errorType = 'network'
        errorMessage = `Cannot reach ${url} — check the URL`
      } else if (status === 401 || status === 403) {
        errorType = 'auth'
        errorMessage = 'API key rejected — check your Spark connection key is correct'
      } else if (status === 404) {
        errorType = 'not_found'
        errorMessage = '/api/lens/snapshot not found — Spark may not have implemented the Lens endpoint yet'
      } else if (status && status >= 500) {
        errorType = 'server_error'
        errorMessage = `Spark server error (${status}) — ${err.response?.data?.message || err.message}`
      }

      logger.warn(`SparkService.diagnose → tenant:${tenantId} ${errorType} (${status ?? err.code}): ${errorMessage}`)
      return { reachable: false, statusCode: status, errorType, errorMessage, endpoint }
    }
  }

  static async isReachable(tenantId: string): Promise<boolean> {
    const result = await SparkService.diagnose(tenantId)
    return result.reachable
  }

  static async getSnapshot(tenantId: string): Promise<SparkData> {
    if (process.env.DEV_MODE === 'true') {
      logger.info('SparkService → DEV_MODE: using mock data')
      return getSparkMock()
    }

    const { url, key, businessId } = await SparkService.getConfig(tenantId)

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
      const status = err.response?.status
      logger.warn(
        `SparkService → snapshot failed for tenant:${tenantId} ` +
        `status:${status ?? err.code} msg:${err.message} — using demo data`
      )
      return getSparkMock()
    }
  }
}
