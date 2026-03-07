import { NextResponse } from 'next/server'
import { getBusinessSnapshot } from '@/lib/mock-data'

export async function GET() {
  const snapshot = getBusinessSnapshot()
  return NextResponse.json(snapshot)
}
