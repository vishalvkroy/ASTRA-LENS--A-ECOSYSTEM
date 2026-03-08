import { NextRequest, NextResponse } from 'next/server'
import { resolveTenantId } from '../_lib/tenant'

export async function POST(req: NextRequest) {
  const tenantId = resolveTenantId(req)

  try {
    const body = await req.json().catch(() => ({}))
    const res = await fetch(`${process.env.BACKEND_URL}/api/insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    return NextResponse.json(await res.json())
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to generate insights', message: err.message },
      { status: 500 }
    )
  }
}
