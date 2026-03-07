import { Router, Request, Response, NextFunction } from 'express'
import { AggregatorService } from '../services/aggregator.service'
import { AIService } from '../services/ai.service'
import { aiRateLimit } from '../middleware/rate-limit'
import { logger } from '../lib/logger'

const router = Router()

// POST /api/insights
router.post('/', aiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forceRefresh = req.body?.refresh === true
    const snapshot = await AggregatorService.getSnapshot()
    const insights = await AIService.generateInsights(snapshot, forceRefresh)

    logger.info(`POST /api/insights → ${insights.length} cards returned`)
    res.json({ insights, generatedAt: new Date().toISOString() })
  } catch (err) {
    next(err)
  }
})

export default router
