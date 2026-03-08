import { Router, Request, Response } from 'express'
import { AtlasService } from '../services/atlas.service'
import { SparkService } from '../services/spark.service'
import { logger } from '../lib/logger'
import { setAtlasApiKey, setSparkApiKey, hasAtlasKey, hasSparkKey } from '../lib/config-store'

const router = Router()

// GET /api/health/services
// Returns reachability status for Atlas + Spark
router.get('/services', async (req: Request, res: Response) => {
  const devMode = process.env.DEV_MODE === 'true'

  const [atlasReachable, sparkReachable] = await Promise.all([
    devMode ? Promise.resolve(false) : AtlasService.isReachable(),
    devMode ? Promise.resolve(false) : SparkService.isReachable(),
  ])

  logger.info(`GET /api/health/services → atlas:${atlasReachable} spark:${sparkReachable} devMode:${devMode}`)

  res.json({
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

// POST /api/health/setup — save API keys at runtime (no env restart needed)
router.post('/setup', (req: Request, res: Response) => {
  const { atlasApiKey, sparkApiKey } = req.body

  if (atlasApiKey !== undefined) {
    setAtlasApiKey(atlasApiKey || null)
    logger.info(`POST /api/health/setup → Atlas key ${atlasApiKey ? 'set' : 'cleared'}`)
  }
  if (sparkApiKey !== undefined) {
    setSparkApiKey(sparkApiKey || null)
    logger.info(`POST /api/health/setup → Spark key ${sparkApiKey ? 'set' : 'cleared'}`)
  }

  res.json({ success: true, atlas: { hasKey: hasAtlasKey() }, spark: { hasKey: hasSparkKey() } })
})

// GET /api/health/credentials — check which keys are set (without exposing them)
router.get('/credentials', (_req: Request, res: Response) => {
  res.json({ atlas: { hasKey: hasAtlasKey() }, spark: { hasKey: hasSparkKey() } })
})

export default router
