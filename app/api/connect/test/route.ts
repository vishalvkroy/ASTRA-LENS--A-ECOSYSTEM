import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantId } from '../../_lib/tenant'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000'

export async function POST(request: NextRequest) {
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
    return NextResponse.json(data, { status: res.ok ? 200 : res.status })
  } catch {
    return NextResponse.json(
      { reachable: false, errorType: 'network', errorMessage: 'Lens backend unreachable' },
      { status: 502 }
    )
  }
}
