import { Router, Request, Response } from 'express'
import { AtlasService } from '../services/atlas.service'
import { SparkService } from '../services/spark.service'
import { logger } from '../lib/logger'
import { getTenantIdFromRequest } from '../lib/tenant'
import {
  getCredentialStatus,
  getSparkCredentialStatus,
  setTenantApiKey,
  setTenantUrl,
  setSparkBusinessId,
} from '../lib/tenant-credentials-store'

const router = Router()

function buildCredentialPayload(tenantId: string) {
  return {
    tenantId,
    atlas: getCredentialStatus(tenantId, 'atlas'),
    spark: getSparkCredentialStatus(tenantId),
  }
}

// ── GET /api/health/services ──────────────────────────────────────────────────
router.get('/services', async (req: Request, res: Response) => {
  const devMode = process.env.DEV_MODE === 'true'
  const tenantId = getTenantIdFromRequest(req)

  const [atlasReachable, sparkReachable] = await Promise.all([
    devMode ? Promise.resolve(false) : AtlasService.isReachable(tenantId),
    devMode ? Promise.resolve(false) : SparkService.isReachable(tenantId),
  ])

  const atlasCreds = getCredentialStatus(tenantId, 'atlas')
  const sparkCreds = getSparkCredentialStatus(tenantId)

  logger.info(
    `GET /api/health/services → tenant:${tenantId} ` +
    `atlas:${atlasReachable} spark:${sparkReachable} devMode:${devMode}`
  )

  res.json({
    tenantId,
    devMode,
    atlas: {
      reachable: atlasReachable,
      url: atlasCreds.url || 'http://localhost:4000',
      usingMock: devMode || !atlasReachable,
      configured: atlasCreds.hasKey,
    },
    spark: {
      reachable: sparkReachable,
      url: sparkCreds.url || 'http://localhost:3001',
      usingMock: devMode || !sparkReachable,
      configured: sparkCreds.hasKey && !!sparkCreds.businessId,
    },
  })
})

// ── POST /api/health/setup ────────────────────────────────────────────────────
// Save API keys, URLs, and Spark businessId per tenant
router.post('/setup', (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  const {
    atlasApiKey,
    sparkApiKey,
    atlasUrl,
    sparkUrl,
    sparkBusinessId,
  } = req.body as {
    atlasApiKey?: string
    sparkApiKey?: string
    atlasUrl?: string
    sparkUrl?: string
    sparkBusinessId?: string
  }

  if (atlasApiKey !== undefined) {
    setTenantApiKey(tenantId, 'atlas', atlasApiKey || null)
    logger.info(`setup → tenant:${tenantId} atlas key:${atlasApiKey ? 'set' : 'cleared'}`)
  }
  if (sparkApiKey !== undefined) {
    setTenantApiKey(tenantId, 'spark', sparkApiKey || null)
    logger.info(`setup → tenant:${tenantId} spark key:${sparkApiKey ? 'set' : 'cleared'}`)
  }
  if (atlasUrl !== undefined) {
    setTenantUrl(tenantId, 'atlas', atlasUrl || null)
    logger.info(`setup → tenant:${tenantId} atlas url:${atlasUrl || 'cleared'}`)
  }
  if (sparkUrl !== undefined) {
    setTenantUrl(tenantId, 'spark', sparkUrl || null)
    logger.info(`setup → tenant:${tenantId} spark url:${sparkUrl || 'cleared'}`)
  }
  if (sparkBusinessId !== undefined) {
    setSparkBusinessId(tenantId, sparkBusinessId || null)
    logger.info(`setup → tenant:${tenantId} sparkBusinessId:${sparkBusinessId || 'cleared'}`)
  }

  res.json({ success: true, ...buildCredentialPayload(tenantId) })
})

// ── GET /api/health/credentials ───────────────────────────────────────────────
router.get('/credentials', (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  res.json(buildCredentialPayload(tenantId))
})

// ── POST /api/health/test-connection ─────────────────────────────────────────
// Tests connectivity to Atlas or Spark for this tenant
router.post('/test-connection', async (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  const { service } = req.body as { service?: 'atlas' | 'spark' }

  if (service !== 'atlas' && service !== 'spark') {
    res.status(400).json({ error: 'BadRequest', message: 'service must be "atlas" or "spark"' })
    return
  }

  logger.info(`test-connection → tenant:${tenantId} service:${service}`)

  const reachable =
    service === 'atlas'
      ? await AtlasService.isReachable(tenantId)
      : await SparkService.isReachable(tenantId)

  logger.info(`test-connection → ${service} reachable:${reachable}`)
  res.json({ service, reachable })
})

export default router
