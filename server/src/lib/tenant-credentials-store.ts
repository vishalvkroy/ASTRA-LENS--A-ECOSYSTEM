/**
 * Tenant credential store — PostgreSQL backed.
 * Replaces the previous file-based store (data/tenant-credentials.json).
 *
 * Schema: see migrations/017_lens_tenant_credentials.sql
 *
 * Falls back to in-memory cache when DB is unavailable (dev with no DB configured).
 */
import crypto from 'crypto'
import { DEFAULT_TENANT_ID, normalizeTenantId } from './tenant'
import { getPool } from './db'
import { logger } from './logger'

type ServiceName = 'atlas' | 'spark'

interface EncryptedValue {
  iv: string
  tag: string
  value: string
}

export interface CredentialStatus {
  hasKey: boolean
  lastUpdatedAt: string | null
  url: string | null
}

export interface SparkCredentialStatus extends CredentialStatus {
  businessId: string | null
}

// ── Encryption setup ──────────────────────────────────────────────────────────

const ENCRYPTION_SECRET = process.env.CREDENTIALS_ENCRYPTION_KEY
if (!ENCRYPTION_SECRET || ENCRYPTION_SECRET === 'astra-lens-change-this-secret-in-production-32chars') {
  console.warn(
    '\x1b[33m[credentials-store] WARN\x1b[0m  ' +
    'CREDENTIALS_ENCRYPTION_KEY is not set or using the default. Set a strong random key in production!'
  )
}

const ENCRYPTION_KEY = crypto
  .createHash('sha256')
  .update(ENCRYPTION_SECRET || 'astra-lens-local-dev-secret-change-me')
  .digest()

// ── Encryption helpers ────────────────────────────────────────────────────────

function encryptValue(value: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const payload: EncryptedValue = {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    value: encrypted.toString('base64'),
  }
  return JSON.stringify(payload)
}

function decryptValue(raw: string): string | null {
  try {
    const payload = JSON.parse(raw) as EncryptedValue
    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      ENCRYPTION_KEY,
      Buffer.from(payload.iv, 'base64')
    )
    decipher.setAuthTag(Buffer.from(payload.tag, 'base64'))
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.value, 'base64')),
      decipher.final(),
    ])
    return decrypted.toString('utf8')
  } catch {
    return null
  }
}

// ── In-memory fallback (dev / no-DB environments) ────────────────────────────

interface InMemRecord {
  atlasKeyEnc?: string
  sparkKeyEnc?: string
  atlasUrl?: string
  sparkUrl?: string
  sparkBizId?: string
  atlasUpdatedAt?: string
  sparkUpdatedAt?: string
}

const memStore = new Map<string, InMemRecord>()

function getMemRecord(tenantId: string): InMemRecord {
  if (!memStore.has(tenantId)) memStore.set(tenantId, {})
  return memStore.get(tenantId)!
}

// ── DB row type ───────────────────────────────────────────────────────────────

interface DBRow {
  atlas_key_enc: string | null
  spark_key_enc: string | null
  atlas_url: string | null
  spark_url: string | null
  spark_biz_id: string | null
  updated_at: string | null
}

async function dbGetRow(tenantId: string): Promise<DBRow | null> {
  const pool = getPool()
  if (!pool) return null
  try {
    const result = await pool.query<DBRow>(
      `SELECT atlas_key_enc, spark_key_enc, atlas_url, spark_url, spark_biz_id, updated_at
         FROM lens_tenant_credentials
        WHERE tenant_id = $1`,
      [tenantId]
    )
    return result.rows[0] ?? null
  } catch (err: any) {
    logger.warn('[credentials-store] DB read failed:', err.message)
    return null
  }
}

async function dbUpsert(
  tenantId: string,
  fields: Partial<{
    atlas_key_enc: string | null
    spark_key_enc: string | null
    atlas_url: string | null
    spark_url: string | null
    spark_biz_id: string | null
  }>
): Promise<void> {
  const pool = getPool()
  if (!pool) return
  try {
    const setClauses: string[] = ['updated_at = NOW()']
    const params: any[] = [tenantId]
    let idx = 2
    for (const [col, val] of Object.entries(fields)) {
      setClauses.push(`${col} = $${idx}`)
      params.push(val)
      idx++
    }
    await pool.query(
      `INSERT INTO lens_tenant_credentials (tenant_id, ${Object.keys(fields).join(', ')})
         VALUES ($1, ${Object.keys(fields).map((_, i) => `$${i + 2}`).join(', ')})
         ON CONFLICT (tenant_id)
         DO UPDATE SET ${setClauses.join(', ')}`,
      params
    )
  } catch (err: any) {
    logger.warn('[credentials-store] DB upsert failed:', err.message)
  }
}

// ── Environment fallbacks ─────────────────────────────────────────────────────

function envFallback(service: ServiceName): string | undefined {
  if (service === 'atlas') return process.env.ATLAS_API_KEY || undefined
  return process.env.SPARK_API_KEY || undefined
}

function envUrlFallback(service: ServiceName): string | undefined {
  if (service === 'atlas') return process.env.ATLAS_API_URL || undefined
  return process.env.SPARK_API_URL || undefined
}

// ── Public API — API Keys ─────────────────────────────────────────────────────

export async function getTenantApiKey(
  tenantId: string,
  service: ServiceName
): Promise<string | undefined> {
  const resolved = normalizeTenantId(tenantId)

  const row = await dbGetRow(resolved)
  if (row) {
    const enc = service === 'atlas' ? row.atlas_key_enc : row.spark_key_enc
    if (enc) {
      const decrypted = decryptValue(enc)
      if (decrypted) return decrypted
    }
  } else {
    // Fallback to in-memory
    const rec = getMemRecord(resolved)
    const enc = service === 'atlas' ? rec.atlasKeyEnc : rec.sparkKeyEnc
    if (enc) {
      const decrypted = decryptValue(enc)
      if (decrypted) return decrypted
    }
  }

  if (resolved === DEFAULT_TENANT_ID) return envFallback(service)
  return undefined
}

export async function setTenantApiKey(
  tenantId: string,
  service: ServiceName,
  apiKey: string | null
): Promise<void> {
  const resolved = normalizeTenantId(tenantId)
  const trimmed = apiKey?.trim() || null
  const enc = trimmed ? encryptValue(trimmed) : null

  const field = service === 'atlas' ? 'atlas_key_enc' : 'spark_key_enc'
  await dbUpsert(resolved, { [field]: enc })

  // Also update in-memory fallback
  const rec = getMemRecord(resolved)
  if (service === 'atlas') {
    rec.atlasKeyEnc = enc ?? undefined
    rec.atlasUpdatedAt = new Date().toISOString()
  } else {
    rec.sparkKeyEnc = enc ?? undefined
    rec.sparkUpdatedAt = new Date().toISOString()
  }
}

// ── Public API — Service URLs ─────────────────────────────────────────────────

export async function getTenantUrl(
  tenantId: string,
  service: ServiceName
): Promise<string | undefined> {
  const resolved = normalizeTenantId(tenantId)

  const row = await dbGetRow(resolved)
  if (row) {
    const stored = service === 'atlas' ? row.atlas_url : row.spark_url
    if (stored) return stored
  } else {
    const rec = getMemRecord(resolved)
    const stored = service === 'atlas' ? rec.atlasUrl : rec.sparkUrl
    if (stored) return stored
  }

  return envUrlFallback(service)
}

export async function setTenantUrl(
  tenantId: string,
  service: ServiceName,
  url: string | null
): Promise<void> {
  const resolved = normalizeTenantId(tenantId)
  const trimmed = url?.trim() || null

  const field = service === 'atlas' ? 'atlas_url' : 'spark_url'
  await dbUpsert(resolved, { [field]: trimmed })

  const rec = getMemRecord(resolved)
  if (service === 'atlas') rec.atlasUrl = trimmed ?? undefined
  else rec.sparkUrl = trimmed ?? undefined
}

// ── Public API — Spark Business ID ───────────────────────────────────────────

export async function getSparkBusinessId(tenantId: string): Promise<string | undefined> {
  const resolved = normalizeTenantId(tenantId)

  const row = await dbGetRow(resolved)
  if (row?.spark_biz_id) return row.spark_biz_id

  const rec = getMemRecord(resolved)
  if (rec.sparkBizId) return rec.sparkBizId

  return process.env.SPARK_BUSINESS_ID || undefined
}

export async function setSparkBusinessId(
  tenantId: string,
  businessId: string | null
): Promise<void> {
  const resolved = normalizeTenantId(tenantId)
  const trimmed = businessId?.trim() || null

  await dbUpsert(resolved, { spark_biz_id: trimmed })

  const rec = getMemRecord(resolved)
  rec.sparkBizId = trimmed ?? undefined
}

// ── Public API — Status ───────────────────────────────────────────────────────

export async function getCredentialStatus(
  tenantId: string,
  service: ServiceName
): Promise<CredentialStatus> {
  const resolved = normalizeTenantId(tenantId)
  const url = (await getTenantUrl(resolved, service)) || null

  const row = await dbGetRow(resolved)
  const enc = row
    ? (service === 'atlas' ? row.atlas_key_enc : row.spark_key_enc)
    : (service === 'atlas' ? getMemRecord(resolved).atlasKeyEnc : getMemRecord(resolved).sparkKeyEnc)

  if (enc) return { hasKey: true, lastUpdatedAt: row?.updated_at ?? null, url }
  if (resolved === DEFAULT_TENANT_ID && !!envFallback(service)) {
    return { hasKey: true, lastUpdatedAt: null, url }
  }
  return { hasKey: false, lastUpdatedAt: null, url }
}

export async function getSparkCredentialStatus(tenantId: string): Promise<SparkCredentialStatus> {
  const base = await getCredentialStatus(tenantId, 'spark')
  return {
    ...base,
    businessId: (await getSparkBusinessId(tenantId)) || null,
  }
}
