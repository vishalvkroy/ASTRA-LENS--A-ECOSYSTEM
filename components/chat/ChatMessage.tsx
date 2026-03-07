import { cn } from '@/lib/utils'

interface ChatMessageProps {
  role: 'user' | 'assistant'
  content: string
  isStreaming?: boolean
  index: number
}

export default function ChatMessage({ role, content, isStreaming, index }: ChatMessageProps) {
  const isUser = role === 'user'

  return (
    <div
      className={cn('flex gap-2 animate-fade-in', isUser ? 'justify-end' : 'justify-start')}
      style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
          L
        </div>
      )}

      {/* Bubble */}
      <div
        className={cn(
          'max-w-[80%] px-4 py-3 text-sm leading-relaxed',
          isUser
            ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm'
            : 'bg-[#1A2235] border border-white/[0.06] text-slate-200 rounded-2xl rounded-tl-sm'
        )}
      >
        {content}
        {isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-indigo-400 ml-0.5 align-middle animate-pulse" />
        )}
      </div>
    </div>
  )
}
