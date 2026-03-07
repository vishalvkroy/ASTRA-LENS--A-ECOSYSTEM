import app from './app'
import { logger } from './lib/logger'

const PORT = parseInt(process.env.PORT || '5000', 10)

app.listen(PORT, () => {
  logger.success(`Astra Lens API running on http://localhost:${PORT}`)
  logger.info(`Dev mode: ${process.env.DEV_MODE === 'true' ? 'ON (mock fallback active)' : 'OFF'}`)
  logger.info(`Atlas API: ${process.env.ATLAS_API_URL}`)
  logger.info(`Spark API: ${process.env.SPARK_API_URL}`)
})
