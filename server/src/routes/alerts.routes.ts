import { Router, Request, Response, NextFunction } from 'express'
import { AlertService } from '../services/alert.service'
import { logger } from '../lib/logger'
import { getTenantIdFromRequest } from '../lib/tenant'

const router = Router()

// GET /api/alerts
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = getTenantIdFromRequest(req)
    const result = await AlertService.getAlerts(tenantId)
    logger.info(`GET /api/alerts -> tenant:${tenantId} total:${result.counts.total} high:${result.counts.high}`)
    res.json(result)
  } catch (err) {
    next(err)
  }
})

export default router
