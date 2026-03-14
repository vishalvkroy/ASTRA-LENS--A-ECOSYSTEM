import { getGroqClient, AI_MODEL } from '../lib/anthropic'
import { buildInsightsPrompt } from '../lib/prompts'
import type { BusinessSnapshot, InsightCard } from '../types'
import { cache } from '../lib/cache'
import { logger } from '../lib/logger'

const INSIGHTS_CACHE_TTL = parseInt(process.env.INSIGHTS_CACHE_TTL || '600', 10)

export class AIService {

  static async generateInsights(
    tenantId: string,
    snapshot: BusinessSnapshot,
    forceRefresh = false
  ): Promise<InsightCard[]> {

    const cacheKey = `ai_insights:${tenantId}`

    if (!forceRefresh) {
      const cached = cache.get<InsightCard[]>(cacheKey)
      if (cached) {
        logger.info('AIService → returning cached insights')
        return cached
      }
    }

    logger.info('AIService → calling Groq...')
    const prompt = buildInsightsPrompt(snapshot)

    const response = await getGroqClient().chat.completions.create({
      model: AI_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text: string = response.choices[0].message.content ?? ''

    const raw = AIService.parseInsightsJson(text)

    const insights: InsightCard[] = raw.map((item: any, i: number) => ({
      id: `ins_${Date.now()}_${i}`,
      type: item.type || 'recommendation',
      priority: item.priority || 'medium',
      title: item.title || 'Insight',
      body: item.body || '',
      action: item.action || null,
      actionLink: item.actionLink || null,
      generatedAt: new Date().toISOString(),
    }))

    cache.set(cacheKey, insights, INSIGHTS_CACHE_TTL)
    logger.success(`AIService → ${insights.length} insights generated + cached ${INSIGHTS_CACHE_TTL}s`)

    return insights
  }

  private static parseInsightsJson(text: string): any[] {
    // 1. Try to parse the whole response as a JSON array
    try {
      const parsed = JSON.parse(text.trim())
      if (Array.isArray(parsed)) return parsed
      if (parsed && Array.isArray(parsed.insights)) return parsed.insights
    } catch {
      // Not valid top-level JSON — continue
    }

    // 2. Strip markdown code fences and retry
    const stripped = text
      .replace(/^```(?:json)?\s*/im, '')
      .replace(/\s*```\s*$/im, '')
      .trim()
    try {
      const parsed = JSON.parse(stripped)
      if (Array.isArray(parsed)) return parsed
    } catch {
      // Continue
    }

    // 3. Extract first [...] block (last resort)
    const match = stripped.match(/\[[\s\S]*\]/)
    if (match) {
      try {
        const parsed = JSON.parse(match[0])
        if (Array.isArray(parsed)) return parsed
      } catch {
        // Fall through
      }
    }

    logger.error('AIService → could not parse insights JSON from Groq response')
    throw new Error('AI returned an unexpected format. Please try again.')
  }
}
