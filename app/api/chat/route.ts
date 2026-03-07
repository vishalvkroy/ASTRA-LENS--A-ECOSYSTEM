import { NextRequest } from 'next/server'
import { anthropic, AI_MODEL } from '@/lib/anthropic'
import { buildChatSystemPrompt } from '@/lib/prompts'
import { getBusinessSnapshot } from '@/lib/mock-data'

export async function POST(req: NextRequest) {
  const { message, history } = await req.json()
  const snapshot = getBusinessSnapshot()
  const systemPrompt = buildChatSystemPrompt(snapshot)

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const msgStream = anthropic.messages.stream({
          model: AI_MODEL,
          max_tokens: 512,
          system: systemPrompt,
          messages: [
            ...history,
            { role: 'user', content: message },
          ],
        })

        for await (const chunk of msgStream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text))
          }
        }
        controller.close()
      } catch (err) {
        controller.error(err)
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
