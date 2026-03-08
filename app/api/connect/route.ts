import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantId } from '../_lib/tenant'

export async function GET(request: NextRequest) {
  const tenantId = resolveTenantId(request)

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/health/services`, {
      headers: { 'x-tenant-id': tenantId },
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({
      tenantId,
      devMode: true,
      atlas: { reachable: false, url: 'http://localhost:4000', usingMock: true },
      spark: { reachable: false, url: 'http://localhost:3001', usingMock: true },
    })
  }
}
