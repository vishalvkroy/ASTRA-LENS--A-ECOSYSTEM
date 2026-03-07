import { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const backendRes = await fetch(`${process.env.BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
