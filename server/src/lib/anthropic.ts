import Groq from 'groq-sdk'
import { logger } from './logger'

let _client: Groq | null = null

export function getGroqClient(): Groq {
  if (!_client) {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set — add it to server/.env')
    }
    _client = new Groq({ apiKey: process.env.GROQ_API_KEY })
  }
  return _client
}

export const AI_MODEL = 'llama-3.3-70b-versatile'

if (process.env.GROQ_API_KEY) {
  logger.success('Groq client ready')
} else {
  logger.warn('GROQ_API_KEY not set — AI routes will fail until key is added to server/.env')
}
