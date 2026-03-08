import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/health/services`, {
      next: { revalidate: 0 },
    })
    if (!res.ok) throw new Error(`Backend error: ${res.status}`)
    return NextResponse.json(await res.json())
  } catch {
    // Return mock status when backend is down
    return NextResponse.json({
      devMode: true,
      atlas: { reachable: false, url: 'http://localhost:4000', usingMock: true },
      spark: { reachable: false, url: 'http://localhost:3001', usingMock: true },
    })
  }
}
