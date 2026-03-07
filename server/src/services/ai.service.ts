import { anthropic, AI_MODEL } from '../lib/anthropic'
import { buildInsightsPrompt } from '../lib/prompts'
import type { BusinessSnapshot, InsightCard } from '../types'
import { cache } from '../lib/cache'
import { logger } from '../lib/logger'

const INSIGHTS_CACHE_TTL = parseInt(process.env.INSIGHTS_CACHE_TTL || '600', 10)
const CACHE_KEY = 'ai_insights'

export class AIService {

  static async generateInsights(
    snapshot: BusinessSnapshot,
    forceRefresh = false
  ): Promise<InsightCard[]> {

    if (!forceRefresh) {
      const cached = cache.get<InsightCard[]>(CACHE_KEY)
      if (cached) {
        logger.info('AIService.generateInsights → returning cached insights')
        return cached
      }
    }

    logger.info('AIService.generateInsights → calling Groq...')

    const prompt = buildInsightsPrompt(snapshot)

    const response = await (anthropic as any).chat.completions.create({
      model: AI_MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })

    const text: string = response.choices[0].message.content ?? ''

    const jsonMatch = text.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      logger.error('AIService → no JSON array in Groq response')
      throw new Error('AI returned unexpected format. Please try again.')
    }

    const raw: any[] = JSON.parse(jsonMatch[0])

    const insights: InsightCard[] = raw.map((item, i) => ({
      id: `ins_${Date.now()}_${i}`,
      type: item.type || 'recommendation',
      priority: item.priority || 'medium',
      title: item.title || 'Insight',
      body: item.body || '',
      action: item.action || null,
      actionLink: item.actionLink || null,
      generatedAt: new Date().toISOString(),
    }))

    cache.set(CACHE_KEY, insights, INSIGHTS_CACHE_TTL)
    logger.success(`AIService → ${insights.length} insights generated + cached for ${INSIGHTS_CACHE_TTL}s`)

    return insights
  }
}
