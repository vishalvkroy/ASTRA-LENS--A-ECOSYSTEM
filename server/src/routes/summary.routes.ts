import { Router, Request, Response, NextFunction } from 'express'
import { AggregatorService } from '../services/aggregator.service'
import { logger } from '../lib/logger'
import { getTenantIdFromRequest } from '../lib/tenant'

const router = Router()

// GET /api/summary — force=true is only accepted once per 60s (rate-limited in app.ts)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Only allow forceRefresh from authenticated internal callers — prevent cache busting DoS
    const forceRefresh = req.query.refresh === 'true' &&
      typeof req.headers['x-service-key'] === 'string'
    const tenantId = getTenantIdFromRequest(req)
    const snapshot = await AggregatorService.getSnapshot(forceRefresh, tenantId)

    logger.info(`GET /api/summary -> tenant:${tenantId}`)
    res.json(snapshot)
  } catch (err) {
    next(err)
  }
})

export default router
