import { NextRequest, NextResponse } from 'next/server'
import { normalizeTenantId, resolveTenantId, TENANT_COOKIE } from '../../_lib/tenant'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

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

    const data = await res.json()
    const response = NextResponse.json(data)
    response.cookies.set(TENANT_COOKIE, tenantId, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
    return response
  } catch {
    return NextResponse.json({ success: false, error: 'Backend unreachable' }, { status: 502 })
  }
}

export async function GET(request: NextRequest) {
  const tenantId = resolveTenantId(request)

  try {
    const res = await fetch(`${BACKEND_URL}/api/health/credentials`, {
      headers: { 'x-tenant-id': tenantId },
      cache: 'no-store',
    })
    const data = await res.json()
    const response = NextResponse.json(data)
    response.cookies.set(TENANT_COOKIE, tenantId, {
      httpOnly: false,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
    })
    return response
  } catch {
    return NextResponse.json({
      tenantId,
      atlas: { hasKey: false, lastUpdatedAt: null },
      spark: { hasKey: false, lastUpdatedAt: null },
    })
  }
}
