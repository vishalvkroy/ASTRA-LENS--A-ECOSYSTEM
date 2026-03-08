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
  atlas?: EncryptedValue
  spark?: EncryptedValue
  atlasUpdatedAt?: string
  sparkUpdatedAt?: string
}

interface StoreData {
  version: 1
  tenants: Record<string, TenantCredentialRecord>
}

export interface CredentialStatus {
  hasKey: boolean
  lastUpdatedAt: string | null
}

const STORE_FILE_PATH = process.env.CREDENTIALS_STORE_FILE
  ? path.resolve(process.env.CREDENTIALS_STORE_FILE)
  : path.resolve(process.cwd(), 'data', 'tenant-credentials.json')

const ENCRYPTION_SECRET =
  process.env.CREDENTIALS_ENCRYPTION_KEY ||
  process.env.CREDENTIALS_SECRET ||
  process.env.ATLAS_API_KEY ||
  process.env.SPARK_API_KEY ||
  'astra-lens-local-dev-secret-change-me'

const ENCRYPTION_KEY = crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest()

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

function getTenantRecord(tenantId: string): TenantCredentialRecord {
  const data = ensureStoreLoaded()
  const resolvedTenantId = normalizeTenantId(tenantId)
  const record = data.tenants[resolvedTenantId]
  if (!record) {
    data.tenants[resolvedTenantId] = {}
    return data.tenants[resolvedTenantId]
  }
  return record
}

function deleteTenantIfEmpty(tenantId: string) {
  const data = ensureStoreLoaded()
  const resolvedTenantId = normalizeTenantId(tenantId)
  const record = data.tenants[resolvedTenantId]
  if (!record) return

  const hasAnyData =
    !!record.atlas ||
    !!record.spark ||
    !!record.atlasUpdatedAt ||
    !!record.sparkUpdatedAt

  if (!hasAnyData) {
    delete data.tenants[resolvedTenantId]
  }
}

function envFallback(service: ServiceName): string | undefined {
  if (service === 'atlas') return process.env.ATLAS_API_KEY || undefined
  return process.env.SPARK_API_KEY || undefined
}

export function getTenantApiKey(tenantId: string, service: ServiceName): string | undefined {
  const resolvedTenantId = normalizeTenantId(tenantId)
  const record = getTenantRecord(resolvedTenantId)
  const encrypted = service === 'atlas' ? record.atlas : record.spark

  if (encrypted) {
    const decrypted = decryptValue(encrypted)
    if (decrypted) return decrypted
  }

  // Backward compatibility: existing env keys still work for default tenant.
  if (resolvedTenantId === DEFAULT_TENANT_ID) {
    return envFallback(service)
  }
  return undefined
}

export function setTenantApiKey(
  tenantId: string,
  service: ServiceName,
  apiKey: string | null
): CredentialStatus {
  const resolvedTenantId = normalizeTenantId(tenantId)
  const record = getTenantRecord(resolvedTenantId)
  const trimmed = apiKey?.trim()
  const now = new Date().toISOString()

  if (trimmed) {
    const encrypted = encryptValue(trimmed)
    if (service === 'atlas') {
      record.atlas = encrypted
      record.atlasUpdatedAt = now
    } else {
      record.spark = encrypted
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

  deleteTenantIfEmpty(resolvedTenantId)
  persistStore()

  return getCredentialStatus(resolvedTenantId, service)
}

export function getCredentialStatus(tenantId: string, service: ServiceName): CredentialStatus {
  const resolvedTenantId = normalizeTenantId(tenantId)
  const record = getTenantRecord(resolvedTenantId)

  if (service === 'atlas') {
    if (record.atlas) return { hasKey: true, lastUpdatedAt: record.atlasUpdatedAt || null }
    if (resolvedTenantId === DEFAULT_TENANT_ID && !!envFallback('atlas')) {
      return { hasKey: true, lastUpdatedAt: null }
    }
    return { hasKey: false, lastUpdatedAt: null }
  }

  if (record.spark) return { hasKey: true, lastUpdatedAt: record.sparkUpdatedAt || null }
  if (resolvedTenantId === DEFAULT_TENANT_ID && !!envFallback('spark')) {
    return { hasKey: true, lastUpdatedAt: null }
  }
  return { hasKey: false, lastUpdatedAt: null }
}

