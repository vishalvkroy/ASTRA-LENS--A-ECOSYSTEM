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

async function buildCredentialPayload(tenantId: string) {
  return {
    tenantId,
    atlas: await getCredentialStatus(tenantId, 'atlas'),
    spark: await getSparkCredentialStatus(tenantId),
  }
}

// ── GET /api/health/services ──────────────────────────────────────────────────
router.get('/services', async (req: Request, res: Response) => {
  const devMode = process.env.DEV_MODE === 'true'
  const tenantId = getTenantIdFromRequest(req)

  const [atlasReachable, sparkReachable, atlasCreds, sparkCreds] = await Promise.all([
    devMode ? Promise.resolve(false) : AtlasService.isReachable(tenantId),
    devMode ? Promise.resolve(false) : SparkService.isReachable(tenantId),
    getCredentialStatus(tenantId, 'atlas'),
    getSparkCredentialStatus(tenantId),
  ])

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
router.post('/setup', async (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  const { atlasApiKey, sparkApiKey, atlasUrl, sparkUrl, sparkBusinessId } = req.body as {
    atlasApiKey?: string; sparkApiKey?: string
    atlasUrl?: string; sparkUrl?: string; sparkBusinessId?: string
  }

  if (atlasApiKey !== undefined) await setTenantApiKey(tenantId, 'atlas', atlasApiKey || null)
  if (sparkApiKey !== undefined) await setTenantApiKey(tenantId, 'spark', sparkApiKey || null)
  if (atlasUrl !== undefined) await setTenantUrl(tenantId, 'atlas', atlasUrl || null)
  if (sparkUrl !== undefined) await setTenantUrl(tenantId, 'spark', sparkUrl || null)
  if (sparkBusinessId !== undefined) await setSparkBusinessId(tenantId, sparkBusinessId || null)

  logger.info(`POST /api/health/setup → tenant:${tenantId}`)
  res.json({ success: true, ...(await buildCredentialPayload(tenantId)) })
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
    await setTenantUrl(tenantId, 'atlas', atlasDecoded.url)
    await setTenantApiKey(tenantId, 'atlas', atlasDecoded.apiKey)
    logger.info(`connect-key → tenant:${tenantId} atlas decoded (url:${atlasDecoded.url})`)

    const reachable = await AtlasService.isReachable(tenantId)
    logger.info(`connect-key → atlas reachable:${reachable}`)

    res.json({
      success: true,
      service: 'atlas',
      reachable,
      ...(await buildCredentialPayload(tenantId)),
    })
    return
  }

  // ── Spark key ──
  const sparkDecoded = decodeSparkKey(trimmed)
  if (sparkDecoded) {
    await setTenantUrl(tenantId, 'spark', sparkDecoded.url)
    await setSparkBusinessId(tenantId, sparkDecoded.businessId)
    await setTenantApiKey(tenantId, 'spark', sparkDecoded.apiKey)
    logger.info(`connect-key → tenant:${tenantId} spark decoded (url:${sparkDecoded.url} bid:${sparkDecoded.businessId})`)

    const reachable = await SparkService.isReachable(tenantId)
    logger.info(`connect-key → spark reachable:${reachable}`)

    res.json({
      success: true,
      service: 'spark',
      reachable,
      ...(await buildCredentialPayload(tenantId)),
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
router.get('/credentials', async (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  res.json(await buildCredentialPayload(tenantId))
})

// ── POST /api/health/test-connection ─────────────────────────────────────────
router.post('/test-connection', async (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  const { service } = req.body as { service?: 'atlas' | 'spark' }

  if (service !== 'atlas' && service !== 'spark') {
    res.status(400).json({ error: 'BadRequest', message: 'service must be "atlas" or "spark"' })
    return
  }

  const result =
    service === 'atlas'
      ? await AtlasService.diagnose(tenantId)
      : await SparkService.diagnose(tenantId)

  logger.info(`test-connection → tenant:${tenantId} ${service} reachable:${result.reachable} errorType:${result.errorType ?? 'none'}`)
  res.json({ service, ...result })
})

// ── POST /api/health/disconnect ───────────────────────────────────────────────
router.post('/disconnect', async (req: Request, res: Response) => {
  const tenantId = getTenantIdFromRequest(req)
  const { service } = req.body as { service?: 'atlas' | 'spark' }

  if (service !== 'atlas' && service !== 'spark') {
    res.status(400).json({ error: 'BadRequest', message: 'service must be "atlas" or "spark"' })
    return
  }

  await setTenantApiKey(tenantId, service, null)
  await setTenantUrl(tenantId, service, null)
  if (service === 'spark') await setSparkBusinessId(tenantId, null)

  logger.info(`disconnect → tenant:${tenantId} ${service} cleared`)
  res.json({ success: true, service, ...(await buildCredentialPayload(tenantId)) })
})

export default router
