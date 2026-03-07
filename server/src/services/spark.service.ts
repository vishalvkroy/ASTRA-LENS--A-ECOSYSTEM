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
