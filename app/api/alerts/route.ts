import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/alerts`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    return NextResponse.json(await res.json())
  } catch {
    return NextResponse.json({ alerts: [], counts: { high: 0, medium: 0, low: 0, total: 0 } })
  }
}
