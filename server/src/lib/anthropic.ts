import Groq from 'groq-sdk'
import { logger } from './logger'

let _client: Groq | null = null

function getGroqClient(): Groq {
  if (!_client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set in server/.env')
    }
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _client
}

// Exported as `anthropic` so existing imports don't need to change
export const anthropic = new Proxy({} as Groq, {
  get(_target, prop) {
    return (getGroqClient() as any)[prop]
  },
})

export const AI_MODEL = 'llama-3.3-70b-versatile'

if (process.env.GROQ_API_KEY) {
  logger.success('Groq client ready')
} else {
  logger.warn('GROQ_API_KEY not set — AI routes will fail until key is added to server/.env')
}
