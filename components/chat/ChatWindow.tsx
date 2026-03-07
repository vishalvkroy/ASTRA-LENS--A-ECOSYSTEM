'use client'

import { useState, useRef, useEffect } from 'react'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const INITIAL_MESSAGE: Message = {
  role: 'assistant',
  content:
    'Namaste Rajesh ji! Main Astra Lens hoon, aapka AI business advisor. Aaj main aapki kaise madad kar sakta hoon? Aap apni sales, inventory, customers — kuch bhi pooch sakte ho!',
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE])
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentStreamText, setCurrentStreamText] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, currentStreamText])

  const handleSend = async (message: string) => {
    const userMessage: Message = { role: 'user', content: message }
    const history = messages.slice(-10)

    setMessages((prev) => [...prev, userMessage])
    setIsStreaming(true)
    setCurrentStreamText('')

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      })

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        setCurrentStreamText(fullText)
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: fullText },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, kuch problem ho gayi. Please dobara try karein.' },
      ])
    } finally {
      setIsStreaming(false)
      setCurrentStreamText('')
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-65px)]">
      {/* Glow background */}
      <div className="absolute inset-0 bg-glow-indigo pointer-events-none opacity-30" />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 relative">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            index={i}
          />
        ))}

        {/* Streaming message */}
        {isStreaming && (
          <ChatMessage
            role="assistant"
            content={currentStreamText}
            isStreaming
            index={messages.length}
          />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </div>
  )
}
