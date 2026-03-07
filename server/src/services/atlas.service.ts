import axios from 'axios'
import type { AtlasSnapshot } from '../types'
import { getAtlasMock } from '../mock/atlas.mock'
import { logger } from '../lib/logger'

const ATLAS_BASE = process.env.ATLAS_API_URL || 'http://localhost:4000'
const DEV_MODE = process.env.DEV_MODE === 'true'

export class AtlasService {

  static async isReachable(): Promise<boolean> {
    try {
      await axios.get(`${ATLAS_BASE}/api/health`, { timeout: 3000 })
      return true
    } catch {
      return false
    }
  }

  static async getSnapshot(): Promise<AtlasSnapshot> {
    if (DEV_MODE) {
      logger.info('AtlasService → DEV_MODE: using mock data')
      return getAtlasMock()
    }

    try {
      const headers = process.env.ATLAS_API_KEY
        ? { Authorization: `Bearer ${process.env.ATLAS_API_KEY}` }
        : {}

      const [salesRes, inventoryRes, customersRes] = await Promise.all([
        axios.get(`${ATLAS_BASE}/api/reports/sales-summary`, { headers, timeout: 5000 }),
        axios.get(`${ATLAS_BASE}/api/inventory?limit=100`, { headers, timeout: 5000 }),
        axios.get(`${ATLAS_BASE}/api/customers/summary`, { headers, timeout: 5000 }),
      ])

      logger.success('AtlasService → fetched live data')

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
      logger.warn(`AtlasService → API unreachable (${err.message}), falling back to mock`)
      return getAtlasMock()
    }
  }
}
