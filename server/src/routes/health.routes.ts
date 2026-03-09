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

// ── Decode connection key helpers ─────────────────────────────────────────────

interface AtlasKeyParts { url: string; apiKey: string }
interface SparkKeyParts { url: string; businessId: string; apiKey: string }

function decodeAtlasKey(key: string): AtlasKeyParts | null {
  if (!key.startsWith('atlens1_')) return null
  try {
    const decoded = Buffer.from(key.slice(8), 'base64').toString('utf8')
    const parts = decoded.split('|')
    if (parts.length < 2) return null
    const [url, apiKey] = parts
    if (!url || !apiKey) return null
    return { url: url.trim(), apiKey: apiKey.trim() }
  } catch {
    return null
  }
}

function decodeSparkKey(key: string): SparkKeyParts | null {
  if (!key.startsWith('splens1_')) return null
  try {
    const decoded = Buffer.from(key.slice(8), 'base64').toString('utf8')
    const parts = decoded.split('|')
    if (parts.length < 3) return null
    const [url, businessId, apiKey] = parts
    if (!url || !businessId || !apiKey) return null
    return { url: url.trim(), businessId: businessId.trim(), apiKey: apiKey.trim() }
  } catch {
    return null
  }
}

// ── Credential payload helper ─────────────────────────────────────────────────

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
      url: atlasCreds.url || null,
      usingMock: devMode || !atlasReachable,
      configured: atlasCreds.hasKey,
    },
    spark: {
      reachable: sparkReachable,
      url: sparkCreds.url || null,
      usingMock: devMode || !sparkReachable,
      configured: sparkCreds.hasKey && !!sparkCreds.businessId,
    },
  })
})

// ── POST /api/health/setup ────────────────────────────────────────────────────
// Legacy endpoint — save API keys, URLs, and Spark businessId per tenant
router.post('/setup', (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  const { atlasApiKey, sparkApiKey, atlasUrl, sparkUrl, sparkBusinessId } = req.body as {
    atlasApiKey?: string; sparkApiKey?: string
    atlasUrl?: string; sparkUrl?: string; sparkBusinessId?: string
  }

  if (atlasApiKey !== undefined) setTenantApiKey(tenantId, 'atlas', atlasApiKey || null)
  if (sparkApiKey !== undefined) setTenantApiKey(tenantId, 'spark', sparkApiKey || null)
  if (atlasUrl !== undefined) setTenantUrl(tenantId, 'atlas', atlasUrl || null)
  if (sparkUrl !== undefined) setTenantUrl(tenantId, 'spark', sparkUrl || null)
  if (sparkBusinessId !== undefined) setSparkBusinessId(tenantId, sparkBusinessId || null)

  logger.info(`POST /api/health/setup → tenant:${tenantId}`)
  res.json({ success: true, ...buildCredentialPayload(tenantId) })
})

// ── POST /api/health/connect-key ──────────────────────────────────────────────
// Professional single-key connect endpoint.
// Accepts an encoded connection key (atlens1_... or splens1_...),
// decodes it, stores credentials, and tests connectivity — all in one call.
router.post('/connect-key', async (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  const { connectionKey } = req.body as { connectionKey?: string }

  if (!connectionKey || typeof connectionKey !== 'string') {
    res.status(400).json({ error: 'BadRequest', message: 'connectionKey is required' })
    return
  }

  const trimmed = connectionKey.trim()

  // ── Atlas key ──
  const atlasDecoded = decodeAtlasKey(trimmed)
  if (atlasDecoded) {
    setTenantUrl(tenantId, 'atlas', atlasDecoded.url)
    setTenantApiKey(tenantId, 'atlas', atlasDecoded.apiKey)
    logger.info(`connect-key → tenant:${tenantId} atlas decoded (url:${atlasDecoded.url})`)

    const reachable = await AtlasService.isReachable(tenantId)
    logger.info(`connect-key → atlas reachable:${reachable}`)

    res.json({
      success: true,
      service: 'atlas',
      reachable,
      ...buildCredentialPayload(tenantId),
    })
    return
  }

  // ── Spark key ──
  const sparkDecoded = decodeSparkKey(trimmed)
  if (sparkDecoded) {
    setTenantUrl(tenantId, 'spark', sparkDecoded.url)
    setSparkBusinessId(tenantId, sparkDecoded.businessId)
    setTenantApiKey(tenantId, 'spark', sparkDecoded.apiKey)
    logger.info(`connect-key → tenant:${tenantId} spark decoded (url:${sparkDecoded.url} bid:${sparkDecoded.businessId})`)

    const reachable = await SparkService.isReachable(tenantId)
    logger.info(`connect-key → spark reachable:${reachable}`)

    res.json({
      success: true,
      service: 'spark',
      reachable,
      ...buildCredentialPayload(tenantId),
    })
    return
  }

  // ── Unknown key format ──
  res.status(400).json({
    error: 'InvalidKey',
    message: 'Unrecognised connection key format. Atlas keys start with atlens1_ and Spark keys start with splens1_.',
  })
})

// ── GET /api/health/credentials ───────────────────────────────────────────────
router.get('/credentials', (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  res.json(buildCredentialPayload(tenantId))
})

// ── POST /api/health/test-connection ─────────────────────────────────────────
router.post('/test-connection', async (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  const { service } = req.body as { service?: 'atlas' | 'spark' }

  if (service !== 'atlas' && service !== 'spark') {
    res.status(400).json({ error: 'BadRequest', message: 'service must be "atlas" or "spark"' })
    return
  }

  const reachable =
    service === 'atlas'
      ? await AtlasService.isReachable(tenantId)
      : await SparkService.isReachable(tenantId)

  logger.info(`test-connection → tenant:${tenantId} ${service} reachable:${reachable}`)
  res.json({ service, reachable })
})

// ── POST /api/health/disconnect ───────────────────────────────────────────────
router.post('/disconnect', (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  const { service } = req.body as { service?: 'atlas' | 'spark' }

  if (service !== 'atlas' && service !== 'spark') {
    res.status(400).json({ error: 'BadRequest', message: 'service must be "atlas" or "spark"' })
    return
  }

  setTenantApiKey(tenantId, service, null)
  setTenantUrl(tenantId, service, null)
  if (service === 'spark') setSparkBusinessId(tenantId, null)

  logger.info(`disconnect → tenant:${tenantId} ${service} cleared`)
  res.json({ success: true, service, ...buildCredentialPayload(tenantId) })
})

export default router
