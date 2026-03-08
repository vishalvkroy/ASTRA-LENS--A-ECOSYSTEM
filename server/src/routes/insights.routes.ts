import { Router, Request, Response, NextFunction } from 'express'
import { AggregatorService } from '../services/aggregator.service'
import { AIService } from '../services/ai.service'
import { aiRateLimit } from '../middleware/rate-limit'
import { logger } from '../lib/logger'
import { getTenantIdFromRequest } from '../lib/tenant'

const router = Router()

// POST /api/insights
router.post('/', aiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forceRefresh = req.body?.refresh === true
    const tenantId = getTenantIdFromRequest(req)
    const snapshot = await AggregatorService.getSnapshot(forceRefresh, tenantId)
    const insights = await AIService.generateInsights(snapshot, forceRefresh)

    logger.info(`POST /api/insights -> tenant:${tenantId} cards:${insights.length}`)
    res.json({ insights, generatedAt: new Date().toISOString() })
  } catch (err) {
    next(err)
  }
})

export default router
