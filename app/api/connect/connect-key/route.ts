import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantId, TENANT_COOKIE } from '../../_lib/tenant'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

function withCookie(response: NextResponse, tenantId: string) {
  response.cookies.set(TENANT_COOKIE, tenantId, {
    httpOnly: false,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  })
  return response
}

// POST — decode a connection key (atlens1_... or splens1_...) and store credentials
export async function POST(request: NextRequest) {
  const tenantId = resolveTenantId(request)

  try {
    const body = await request.json()

    const res = await fetch(`${BACKEND_URL}/api/health/connect-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    return withCookie(NextResponse.json(data), tenantId)
  } catch {
    return NextResponse.json(
      { success: false, error: 'Backend unreachable' },
      { status: 502 }
    )
  }
}

// POST disconnect — clears credentials for a given service
export async function DELETE(request: NextRequest) {
  const tenantId = resolveTenantId(request)

  try {
    const body = await request.json()

    const res = await fetch(`${BACKEND_URL}/api/health/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(body),
      cache: 'no-store',
    })

    const data = await res.json()
    return withCookie(NextResponse.json(data), tenantId)
  } catch {
    return NextResponse.json({ success: false, error: 'Backend unreachable' }, { status: 502 })
  }
}
