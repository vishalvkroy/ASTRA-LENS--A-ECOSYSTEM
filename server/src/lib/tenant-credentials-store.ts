import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import { DEFAULT_TENANT_ID, normalizeTenantId } from './tenant'

type ServiceName = 'atlas' | 'spark'

interface EncryptedValue {
  iv: string
  tag: string
  value: string
}

interface TenantCredentialRecord {
  // Encrypted API keys
  atlas?: EncryptedValue
  spark?: EncryptedValue
  atlasUpdatedAt?: string
  sparkUpdatedAt?: string

  // Plain-text service URLs (not sensitive)
  atlasUrl?: string
  sparkUrl?: string
  atlasUrlUpdatedAt?: string
  sparkUrlUpdatedAt?: string

  // Spark businessId — identifies which Spark tenant Lens reads data for
  sparkBusinessId?: string
  sparkBusinessIdUpdatedAt?: string
}

interface StoreData {
  version: 1
  tenants: Record<string, TenantCredentialRecord>
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

const STORE_FILE_PATH = process.env.CREDENTIALS_STORE_FILE
  ? path.resolve(process.env.CREDENTIALS_STORE_FILE)
  : path.resolve(process.cwd(), 'data', 'tenant-credentials.json')

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

// ── Store persistence ─────────────────────────────────────────────────────────

let store: StoreData | null = null

function defaultStore(): StoreData {
  return { version: 1, tenants: {} }
}

function ensureStoreLoaded(): StoreData {
  if (store) return store
  try {
    const file = fs.readFileSync(STORE_FILE_PATH, 'utf8')
    const parsed = JSON.parse(file) as StoreData
    if (parsed.version !== 1 || typeof parsed.tenants !== 'object') {
      store = defaultStore()
    } else {
      store = parsed
    }
  } catch {
    store = defaultStore()
  }
  return store
}

function persistStore() {
  const data = ensureStoreLoaded()
  fs.mkdirSync(path.dirname(STORE_FILE_PATH), { recursive: true })
  fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), 'utf8')
}

// ── Encryption helpers ────────────────────────────────────────────────────────

function encryptValue(value: string): EncryptedValue {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return {
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    value: encrypted.toString('base64'),
  }
}

function decryptValue(payload: EncryptedValue): string | null {
  try {
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

// ── Tenant record helpers ─────────────────────────────────────────────────────

function getTenantRecord(tenantId: string): TenantCredentialRecord {
  const data = ensureStoreLoaded()
  const resolved = normalizeTenantId(tenantId)
  if (!data.tenants[resolved]) {
    data.tenants[resolved] = {}
  }
  return data.tenants[resolved]
}

function pruneEmptyTenant(tenantId: string) {
  const data = ensureStoreLoaded()
  const resolved = normalizeTenantId(tenantId)
  const record = data.tenants[resolved]
  if (!record) return
  const hasAny =
    !!record.atlas ||
    !!record.spark ||
    !!record.atlasUrl ||
    !!record.sparkUrl ||
    !!record.sparkBusinessId
  if (!hasAny) delete data.tenants[resolved]
}

function envFallback(service: ServiceName): string | undefined {
  if (service === 'atlas') return process.env.ATLAS_API_KEY || undefined
  return process.env.SPARK_API_KEY || undefined
}

function envUrlFallback(service: ServiceName): string | undefined {
  if (service === 'atlas') return process.env.ATLAS_API_URL || undefined
  return process.env.SPARK_API_URL || undefined
}

// ── Public API — API Keys ─────────────────────────────────────────────────────

export function getTenantApiKey(tenantId: string, service: ServiceName): string | undefined {
  const resolved = normalizeTenantId(tenantId)
  const record = getTenantRecord(resolved)
  const encrypted = service === 'atlas' ? record.atlas : record.spark

  if (encrypted) {
    const decrypted = decryptValue(encrypted)
    if (decrypted) return decrypted
  }

  if (resolved === DEFAULT_TENANT_ID) return envFallback(service)
  return undefined
}

export function setTenantApiKey(
  tenantId: string,
  service: ServiceName,
  apiKey: string | null
): void {
  const resolved = normalizeTenantId(tenantId)
  const record = getTenantRecord(resolved)
  const trimmed = apiKey?.trim()
  const now = new Date().toISOString()

  if (trimmed) {
    if (service === 'atlas') {
      record.atlas = encryptValue(trimmed)
      record.atlasUpdatedAt = now
    } else {
      record.spark = encryptValue(trimmed)
      record.sparkUpdatedAt = now
    }
  } else {
    if (service === 'atlas') {
      delete record.atlas
      delete record.atlasUpdatedAt
    } else {
      delete record.spark
      delete record.sparkUpdatedAt
    }
  }

  pruneEmptyTenant(resolved)
  persistStore()
}

// ── Public API — Service URLs ─────────────────────────────────────────────────

export function getTenantUrl(tenantId: string, service: ServiceName): string | undefined {
  const resolved = normalizeTenantId(tenantId)
  const record = getTenantRecord(resolved)
  const stored = service === 'atlas' ? record.atlasUrl : record.sparkUrl
  if (stored) return stored
  return envUrlFallback(service)
}

export function setTenantUrl(
  tenantId: string,
  service: ServiceName,
  url: string | null
): void {
  const resolved = normalizeTenantId(tenantId)
  const record = getTenantRecord(resolved)
  const trimmed = url?.trim() || null
  const now = new Date().toISOString()

  if (trimmed) {
    if (service === 'atlas') {
      record.atlasUrl = trimmed
      record.atlasUrlUpdatedAt = now
    } else {
      record.sparkUrl = trimmed
      record.sparkUrlUpdatedAt = now
    }
  } else {
    if (service === 'atlas') {
      delete record.atlasUrl
      delete record.atlasUrlUpdatedAt
    } else {
      delete record.sparkUrl
      delete record.sparkUrlUpdatedAt
    }
  }

  pruneEmptyTenant(resolved)
  persistStore()
}

// ── Public API — Spark Business ID ───────────────────────────────────────────

export function getSparkBusinessId(tenantId: string): string | undefined {
  const resolved = normalizeTenantId(tenantId)
  const record = getTenantRecord(resolved)
  if (record.sparkBusinessId) return record.sparkBusinessId
  return process.env.SPARK_BUSINESS_ID || undefined
}

export function setSparkBusinessId(tenantId: string, businessId: string | null): void {
  const resolved = normalizeTenantId(tenantId)
  const record = getTenantRecord(resolved)
  const trimmed = businessId?.trim() || null
  const now = new Date().toISOString()

  if (trimmed) {
    record.sparkBusinessId = trimmed
    record.sparkBusinessIdUpdatedAt = now
  } else {
    delete record.sparkBusinessId
    delete record.sparkBusinessIdUpdatedAt
  }

  pruneEmptyTenant(resolved)
  persistStore()
}

// ── Public API — Status ───────────────────────────────────────────────────────

export function getCredentialStatus(tenantId: string, service: ServiceName): CredentialStatus {
  const resolved = normalizeTenantId(tenantId)
  const record = getTenantRecord(resolved)
  const url = getTenantUrl(resolved, service) || null

  if (service === 'atlas') {
    if (record.atlas) return { hasKey: true, lastUpdatedAt: record.atlasUpdatedAt || null, url }
    if (resolved === DEFAULT_TENANT_ID && !!envFallback('atlas')) {
      return { hasKey: true, lastUpdatedAt: null, url }
    }
    return { hasKey: false, lastUpdatedAt: null, url }
  }

  if (record.spark) return { hasKey: true, lastUpdatedAt: record.sparkUpdatedAt || null, url }
  if (resolved === DEFAULT_TENANT_ID && !!envFallback('spark')) {
    return { hasKey: true, lastUpdatedAt: null, url }
  }
  return { hasKey: false, lastUpdatedAt: null, url }
}

export function getSparkCredentialStatus(tenantId: string): SparkCredentialStatus {
  const base = getCredentialStatus(tenantId, 'spark')
  return {
    ...base,
    businessId: getSparkBusinessId(tenantId) || null,
  }
}
