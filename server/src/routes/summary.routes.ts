import { Router, Request, Response, NextFunction } from 'express'
import { AggregatorService } from '../services/aggregator.service'
import { logger } from '../lib/logger'

const router = Router()

// GET /api/summary
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const forceRefresh = req.query.refresh === 'true'
    const snapshot = await AggregatorService.getSnapshot(forceRefresh)

    logger.info(`GET /api/summary → ${snapshot.atlas.business.name}`)
    res.json(snapshot)
  } catch (err) {
    next(err)
  }
})

export default router
