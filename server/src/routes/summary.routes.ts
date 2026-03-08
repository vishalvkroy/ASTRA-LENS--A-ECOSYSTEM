import { Router, Request, Response, NextFunction } from 'express'
import { AggregatorService } from '../services/aggregator.service'
import { logger } from '../lib/logger'
import { getTenantIdFromRequest } from '../lib/tenant'

const router = Router()

// GET /api/summary
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forceRefresh = req.query.refresh === 'true'
    const tenantId = getTenantIdFromRequest(req)
    const snapshot = await AggregatorService.getSnapshot(forceRefresh, tenantId)

    logger.info(`GET /api/summary -> tenant:${tenantId} business:${snapshot.atlas.business.name}`)
    res.json(snapshot)
  } catch (err) {
    next(err)
  }
})

export default router
