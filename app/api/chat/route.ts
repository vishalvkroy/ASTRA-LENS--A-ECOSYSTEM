import { NextRequest } from 'next/server'
import { resolveTenantId } from '../_lib/tenant'

export async function POST(req: NextRequest) {
  const tenantId = resolveTenantId(req)

  try {
    const body = await req.json()
    const backendRes = await fetch(`${process.env.BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-tenant-id': tenantId,
      },
      body: JSON.stringify(body),
    })

    if (!backendRes.ok || !backendRes.body) {
      return new Response('Backend unavailable', { status: 502 })
    }

    return new Response(backendRes.body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err: any) {
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
}
