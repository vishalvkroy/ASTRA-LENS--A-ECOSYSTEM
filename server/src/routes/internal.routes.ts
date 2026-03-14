/**
 * INTERNAL ROUTES (Atlas → Lens)
 * Protected by x-service-key header — only Atlas should call these.
 *
 * POST /api/internal/atlas-event
 *   Atlas calls this after a sale is created or inventory changes.
 *   Lens invalidates its in-memory snapshot cache so the next query fetches fresh data.
 */

import { Router, Request, Response } from 'express'
import { serviceAuth } from '../middleware/service-auth'
import { cache } from '../lib/cache'
import { normalizeTenantId } from '../lib/tenant'
import { logger } from '../lib/logger'

const router = Router()
router.use(serviceAuth)

router.post('/atlas-event', (req: Request, res: Response): void => {
  const { type, tenantId, totalAmount, itemCount } = req.body as {
    type: string
    tenantId: string
    totalAmount?: number
    itemCount?: number
    timestamp: string
  }

  if (!type || !tenantId) {
    res.status(400).json({ error: 'type and tenantId are required' })
    return
  }

  const resolved = normalizeTenantId(tenantId)
  const cacheKey = `business_snapshot:${resolved}`

  // Invalidate snapshot cache — next call to AggregatorService will fetch fresh data
  cache.invalidate(cacheKey)

  logger.info(
    `internal/atlas-event → type:${type} tenant:${resolved} ` +
    `(totalAmount:${totalAmount ?? '-'} items:${itemCount ?? '-'}) — cache invalidated`
  )

  res.json({ success: true, message: 'Cache invalidated', cacheKey })
})

export default router
