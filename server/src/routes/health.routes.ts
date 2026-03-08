import { Router, Request, Response } from 'express'
import { AtlasService } from '../services/atlas.service'
import { SparkService } from '../services/spark.service'
import { logger } from '../lib/logger'
import { getTenantIdFromRequest } from '../lib/tenant'
import { getCredentialStatus, setTenantApiKey } from '../lib/tenant-credentials-store'

const router = Router()

function credentialPayload(tenantId: string) {
  return {
    tenantId,
    atlas: getCredentialStatus(tenantId, 'atlas'),
    spark: getCredentialStatus(tenantId, 'spark'),
  }
}

// GET /api/health/services
// Returns reachability status for Atlas + Spark
router.get('/services', async (req: Request, res: Response) => {
  const devMode = process.env.DEV_MODE === 'true'
  const tenantId = getTenantIdFromRequest(req)

  const [atlasReachable, sparkReachable] = await Promise.all([
    devMode ? Promise.resolve(false) : AtlasService.isReachable(tenantId),
    devMode ? Promise.resolve(false) : SparkService.isReachable(tenantId),
  ])

  logger.info(`GET /api/health/services -> tenant:${tenantId} atlas:${atlasReachable} spark:${sparkReachable} devMode:${devMode}`)

  res.json({
    tenantId,
    devMode,
    atlas: {
      reachable: atlasReachable,
      url: process.env.ATLAS_API_URL || 'http://localhost:4000',
      usingMock: devMode || !atlasReachable,
    },
    spark: {
      reachable: sparkReachable,
      url: process.env.SPARK_API_URL || 'http://localhost:3001',
      usingMock: devMode || !sparkReachable,
    },
  })
})

// POST /api/health/setup - save API keys per tenant
router.post('/setup', (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  const { atlasApiKey, sparkApiKey } = req.body as {
    atlasApiKey?: string
    sparkApiKey?: string
  }

  if (atlasApiKey !== undefined) {
    setTenantApiKey(tenantId, 'atlas', atlasApiKey || null)
    logger.info(`POST /api/health/setup -> tenant:${tenantId} atlas:${atlasApiKey ? 'set' : 'cleared'}`)
  }
  if (sparkApiKey !== undefined) {
    setTenantApiKey(tenantId, 'spark', sparkApiKey || null)
    logger.info(`POST /api/health/setup -> tenant:${tenantId} spark:${sparkApiKey ? 'set' : 'cleared'}`)
  }

  res.json({ success: true, ...credentialPayload(tenantId) })
})

// GET /api/health/credentials - tenant-scoped key status
router.get('/credentials', (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  res.json(credentialPayload(tenantId))
})

export default router
