import type { Request } from 'express'

export const DEFAULT_TENANT_ID = 'default'

const TENANT_ID_PATTERN = /^[a-zA-Z0-9._-]{2,64}$/

export function normalizeTenantId(rawTenantId: unknown): string {
  if (typeof rawTenantId !== 'string') return DEFAULT_TENANT_ID
  const value = rawTenantId.trim().toLowerCase()
  if (!value || !TENANT_ID_PATTERN.test(value)) return DEFAULT_TENANT_ID
  return value
}

export function getTenantIdFromRequest(req: Request): string {
  const headerTenant = req.header('x-tenant-id')
  if (headerTenant) return normalizeTenantId(headerTenant)

  const queryTenant = req.query?.tenantId
  if (typeof queryTenant === 'string') return normalizeTenantId(queryTenant)

  const bodyTenant = (req.body as { tenantId?: unknown } | undefined)?.tenantId
  return normalizeTenantId(bodyTenant)
}

