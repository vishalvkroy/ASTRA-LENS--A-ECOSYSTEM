import { Router, Request, Response, NextFunction } from 'express'
import { AlertService } from '../services/alert.service'
import { logger } from '../lib/logger'

const router = Router()

// GET /api/alerts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await AlertService.getAlerts()
    logger.info(`GET /api/alerts → ${result.counts.total} alerts (${result.counts.high} HIGH)`)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
