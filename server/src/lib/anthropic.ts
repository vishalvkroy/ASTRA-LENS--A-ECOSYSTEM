import Anthropic from '@anthropic-ai/sdk'
import { logger } from './logger'

let _client: Anthropic | null = null

export function getAnthropicClient(): Anthropic {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in server/.env')
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return _client
}

// Convenience export (lazy proxy)
export const anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    return (getAnthropicClient() as any)[prop]
  },
})

export const AI_MODEL = 'claude-haiku-4-5-20251001'

if (process.env.ANTHROPIC_API_KEY) {
  logger.success('Anthropic client ready')
} else {
  logger.warn('ANTHROPIC_API_KEY not set — AI routes will fail until key is added to server/.env')
}
