import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const res = await fetch(`${process.env.BACKEND_URL}/api/summary`, {
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
