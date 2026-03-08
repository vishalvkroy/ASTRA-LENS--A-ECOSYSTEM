import { Router, Request, Response } from 'express'
import { AtlasService } from '../services/atlas.service'
import { SparkService } from '../services/spark.service'
import { logger } from '../lib/logger'

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

export default router
