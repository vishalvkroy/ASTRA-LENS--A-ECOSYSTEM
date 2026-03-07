import { Router, Request, Response, NextFunction } from 'express'
import { AggregatorService } from '../services/aggregator.service'
import { buildChatSystemPrompt } from '../lib/prompts'
import { anthropic, AI_MODEL } from '../lib/anthropic'
import { aiRateLimit } from '../middleware/rate-limit'
import { logger } from '../lib/logger'
import type { ChatMessage } from '../types'

const router = Router()

// POST /api/chat
router.post('/', aiRateLimit, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history = [] } = req.body as {
      message: string
      history: ChatMessage[]
    }

    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'BadRequest', message: 'message is required' })
      return
    }

    const snapshot = await AggregatorService.getSnapshot()
    const systemPrompt = buildChatSystemPrompt(snapshot)

    logger.info(`POST /api/chat → "${message.slice(0, 50)}..."`)

    res.setHeader('Content-Type', 'text/plain; charset=utf-8')
    res.setHeader('Transfer-Encoding', 'chunked')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('X-Accel-Buffering', 'no')
    res.flushHeaders()

    const messages: ChatMessage[] = [
      ...history.slice(-10),
      { role: 'user', content: message },
    ]

    const stream = anthropic.messages.stream({
      model: AI_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        res.write(chunk.delta.text)
      }
    }

    res.end()
    logger.success('POST /api/chat → stream complete')
  } catch (err) {
    if (!res.headersSent) {
      next(err)
    } else {
      res.end()
    }
  }
})

export default router
