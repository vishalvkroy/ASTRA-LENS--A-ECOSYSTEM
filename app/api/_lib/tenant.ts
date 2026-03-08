import type { NextRequest } from 'next/server'

export const TENANT_COOKIE = 'astra_tenant_id'
export const DEFAULT_TENANT_ID = 'default'

const TENANT_ID_PATTERN = /^[a-zA-Z0-9._-]{2,64}$/

export function normalizeTenantId(rawTenantId: string | null | undefined): string {
  if (!rawTenantId) return DEFAULT_TENANT_ID
  const value = rawTenantId.trim().toLowerCase()
  if (!value || !TENANT_ID_PATTERN.test(value)) return DEFAULT_TENANT_ID
  return value
}

export function resolveTenantId(request: NextRequest): string {
  const fromHeader = request.headers.get('x-tenant-id')
  if (fromHeader) return normalizeTenantId(fromHeader)

  const fromQuery = request.nextUrl.searchParams.get('tenantId')
  if (fromQuery) return normalizeTenantId(fromQuery)

  const fromCookie = request.cookies.get(TENANT_COOKIE)?.value
  return normalizeTenantId(fromCookie)
}

