import { NextRequest, NextResponse } from 'next/server'
import { normalizeTenantId, resolveTenantId, TENANT_COOKIE } from '../../_lib/tenant'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

function setCookieAndReturn(response: NextResponse, tenantId: string) {
  response.cookies.set(TENANT_COOKIE, tenantId, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}

// POST — save API keys, URLs, and Spark businessId for the tenant
export async function POST(request: NextRequest) {
  const tenantIdFromRequest = resolveTenantId(request)

  try {
    const body = await request.json()
    const tenantId = normalizeTenantId(body?.tenantId || tenantIdFromRequest)

    const res = await fetch(`${BACKEND_URL}/api/health/setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json(
        { success: false, error: `Backend error: ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return setCookieAndReturn(NextResponse.json(data), tenantId)
  } catch {
    return NextResponse.json({ success: false, error: 'Backend unreachable' }, { status: 502 })
  }
}

// GET — fetch current credential/config status for the tenant
export async function GET(request: NextRequest) {
  const tenantId = resolveTenantId(request)

  try {
    const res = await fetch(`${BACKEND_URL}/api/health/credentials`, {
      headers: { 'x-tenant-id': tenantId },
      cache: 'no-store',
    })

    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return setCookieAndReturn(NextResponse.json(data), tenantId)
  } catch {
    return NextResponse.json({
      tenantId,
      atlas: { hasKey: false, lastUpdatedAt: null, url: null },
      spark: { hasKey: false, lastUpdatedAt: null, url: null, businessId: null },
    })
  }
}

// PATCH — proxy test-connection to backend
export async function PATCH(request: NextRequest) {
  const tenantId = resolveTenantId(request)

  try {
    const body = await request.json()
    const res = await fetch(`${BACKEND_URL}/api/health/test-connection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ reachable: false, error: 'Backend unreachable' }, { status: 502 })
  }
}
