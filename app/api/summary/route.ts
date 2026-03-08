import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantId } from '../_lib/tenant'

export async function GET(request: NextRequest) {
  const tenantId = resolveTenantId(request)

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/summary`, {
      headers: { 'x-tenant-id': tenantId },
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    const { getBusinessSnapshot } = await import('@/lib/mock-data')
    return NextResponse.json(getBusinessSnapshot())
  }
}
