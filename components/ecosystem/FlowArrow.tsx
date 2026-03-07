'use client'

interface FlowArrowProps {
  label: string
  fromColor?: string
  toColor?: string
}

export default function FlowArrow({ label, fromColor = '#6366F1', toColor = 'transparent' }: FlowArrowProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 w-24 shrink-0">
      {/* Label pill */}
      <span className="text-xs text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded-full whitespace-nowrap">
        {label}
      </span>

      {/* Arrow */}
      <div className="relative w-full flex items-center">
        {/* Animated flow line */}
        <div
          className="h-0.5 w-full rounded-full animate-pulse"
          style={{
            background: `linear-gradient(to right, ${fromColor}80, ${fromColor}, ${toColor})`,
          }}
        />
        {/* Arrowhead */}
        <div
          className="shrink-0 w-0 h-0"
          style={{
            borderTop: '5px solid transparent',
            borderBottom: '5px solid transparent',
            borderLeft: `8px solid ${fromColor}`,
          }}
        />
      </div>
    </div>
  )
}
