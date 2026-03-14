import { Router, Request, Response, NextFunction } from 'express'
import { AggregatorService } from '../services/aggregator.service'
import { buildChatSystemPrompt } from '../lib/prompts'
import { getGroqClient, AI_MODEL } from '../lib/anthropic'
import { aiRateLimit } from '../middleware/rate-limit'
import { logger } from '../lib/logger'
import type { ChatMessage } from '../types'
import { getTenantIdFromRequest } from '../lib/tenant'

const router = Router()

const MAX_MESSAGE_LENGTH = 500   // characters — prevents prompt stuffing
const MAX_HISTORY_TURNS = 10     // last N messages kept from history

// Strip HTML/XML characters that could be used for prompt injection
function sanitizeUserInput(input: string): string {
  return input
    .slice(0, MAX_MESSAGE_LENGTH)
    .replace(/[<>]/g, '')
    .trim()
}

// POST /api/chat
router.post('/', aiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history } = req.body as {
      message: unknown
      history: unknown
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      res.status(400).json({ error: 'BadRequest', message: 'message must be a non-empty string' })
      return
    }

    // Validate history shape
    if (history !== undefined && !Array.isArray(history)) {
      res.status(400).json({ error: 'BadRequest', message: 'history must be an array' })
      return
    }

    const cleanMessage = sanitizeUserInput(message)
    if (cleanMessage.length === 0) {
      res.status(400).json({ error: 'BadRequest', message: 'message contains no valid content after sanitization' })
      return
    }

    // Sanitize and validate history entries — reject malformed entries, cap length
    const rawHistory: unknown[] = Array.isArray(history) ? history : []
    const validHistory: ChatMessage[] = rawHistory
      .filter(
        (h): h is { role: 'user' | 'assistant'; content: string } =>
          h !== null &&
          typeof h === 'object' &&
          ((h as any).role === 'user' || (h as any).role === 'assistant') &&
          typeof (h as any).content === 'string'
      )
      .slice(-MAX_HISTORY_TURNS)
      .map(h => ({
        role: h.role,
        // Sanitize user history turns, truncate assistant turns
        content: h.role === 'user'
          ? sanitizeUserInput(h.content)
          : h.content.slice(0, 2000),
      }))

    const tenantId = getTenantIdFromRequest(req)
    const snapshot = await AggregatorService.getSnapshot(false, tenantId)
    const systemPrompt = buildChatSystemPrompt(snapshot)

    logger.info(`POST /api/chat -> tenant:${tenantId} msg_len:${cleanMessage.length}`)

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    // Use typed Groq client directly — no `as any` cast
    const groq = getGroqClient()
    const stream = await groq.chat.completions.create({
      model: AI_MODEL,
      max_tokens: 512,
      stream: true,
      messages: [
        { role: 'system', content: systemPrompt },
        ...validHistory,
        { role: 'user', content: cleanMessage },
      ],
    })

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? ''
      if (text) res.write(text)
    }

    res.end()
    logger.success(`POST /api/chat -> stream complete tenant:${tenantId}`)
  } catch (err) {
    if (!res.headersSent) {
      next(err)
    } else {
      res.end()
    }
  }
})

export default router
