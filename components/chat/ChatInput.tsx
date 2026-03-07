'use client'

import { useRef, useState, KeyboardEvent } from 'react'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (msg: string) => void
  disabled: boolean
}

const quickPrompts = [
  'Aaj kaisa raha?',
  'Top products?',
  'Slow items?',
  'Next week forecast?',
]

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = () => {
    const msg = value.trim()
    if (!msg || disabled) return
    onSend(msg)
    setValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 96) + 'px'
  }

  return (
    <div className="border-t border-white/[0.06] bg-[#0A0F1E]/80 backdrop-blur-md p-4 flex-none">
      {/* Quick prompts */}
      <div className="flex flex-wrap gap-2 mb-3">
        {quickPrompts.map((prompt) => (
          <button
            key={prompt}
            onClick={() => onSend(prompt)}
            disabled={disabled}
            className="bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-xs text-slate-400 hover:text-white rounded-full px-3 py-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          disabled={disabled}
          rows={1}
          placeholder="Apne business ke baare mein kuch poochho..."
          className="flex-1 bg-[#0F1629] border border-white/[0.08] focus:border-indigo-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none resize-none transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl p-3 transition-all shrink-0"
        >
          {disabled
            ? <Loader2 size={16} className="text-white animate-spin" />
            : <Send size={16} className="text-white" />
          }
        </button>
      </div>
    </div>
  )
}
