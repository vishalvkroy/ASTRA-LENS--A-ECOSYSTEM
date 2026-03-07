import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const res = await fetch(`${process.env.BACKEND_URL}/api/insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
