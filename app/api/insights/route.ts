import { NextResponse } from 'next/server'
import { anthropic, AI_MODEL } from '@/lib/anthropic'
import { buildInsightsPrompt } from '@/lib/prompts'
import { getBusinessSnapshot } from '@/lib/mock-data'

export async function POST() {
  try {
    const snapshot = getBusinessSnapshot()
    const prompt = buildInsightsPrompt(snapshot)

    const message = await anthropic.messages.create(
      {
        model: AI_MODEL,
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }],
      },
      { timeout: 30000 }
    )

    const text = (message.content[0] as { type: string; text: string }).text
    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) throw new Error('No JSON array found in response')

    const insights = JSON.parse(jsonMatch[0])
    return NextResponse.json({ insights, generatedAt: new Date().toISOString() })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Insights error:', err)
    return NextResponse.json(
      { error: 'Failed to generate insights', message },
      { status: 500 }
    )
  }
}
