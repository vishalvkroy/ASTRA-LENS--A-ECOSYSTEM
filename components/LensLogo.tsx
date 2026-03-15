'use client'

import { useId } from 'react'

interface LensLogoProps {
  size?: number
  className?: string
}

export function LensMark({ size = 72, className }: LensLogoProps) {
  const uid = useId()
  const id = uid.replace(/:/g, '')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ flexShrink: 0 }}
      aria-label="Astra Lens"
    >
      <defs>
        <linearGradient id={`lb${id}`} x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0A2C2A"/>
          <stop offset="100%" stopColor="#051816"/>
        </linearGradient>
        <linearGradient id={`li${id}`} x1="36" y1="20" x2="36" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#03fcdf"/>
          <stop offset="60%" stopColor="#01B8A6"/>
          <stop offset="100%" stopColor="#007A6D"/>
        </linearGradient>
        <linearGradient id={`ls${id}`} x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#03fcdf" stopOpacity=".55"/>
          <stop offset="100%" stopColor="#03fcdf" stopOpacity=".05"/>
        </linearGradient>
        <linearGradient id={`lh${id}`} x1="28" y1="22" x2="36" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C8FFF8" stopOpacity=".7"/>
          <stop offset="100%" stopColor="#03fcdf" stopOpacity="0"/>
        </linearGradient>
      </defs>

      <rect width="72" height="72" rx="16" fill={`url(#lb${id})`}/>
      <rect width="72" height="72" rx="16" fill="none" stroke="#03fcdf" strokeWidth=".8" strokeOpacity=".22"/>

      <path d="M36 8 A28 28 0 0 1 64 36" fill="none" stroke={`url(#ls${id})`} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M36 64 A28 28 0 0 1 8 36" fill="none" stroke="#03fcdf" strokeWidth=".8" strokeOpacity=".15" strokeLinecap="round"/>

      <line x1="36" y1="8"  x2="36" y2="13" stroke="#03fcdf" strokeWidth="1.5" strokeOpacity=".5" strokeLinecap="round"/>
      <line x1="64" y1="36" x2="59" y2="36" stroke="#03fcdf" strokeWidth="1.5" strokeOpacity=".5" strokeLinecap="round"/>
      <line x1="36" y1="64" x2="36" y2="59" stroke="#03fcdf" strokeWidth="1"   strokeOpacity=".28" strokeLinecap="round"/>
      <line x1="8"  y1="36" x2="13" y2="36" stroke="#03fcdf" strokeWidth="1"   strokeOpacity=".28" strokeLinecap="round"/>

      <circle cx="36" cy="8"  r="2" fill="#03fcdf" fillOpacity=".8"/>
      <circle cx="64" cy="36" r="2" fill="#03fcdf" fillOpacity=".7"/>

      <circle cx="36" cy="36" r="20" fill="none" stroke="#03fcdf" strokeWidth=".9" strokeOpacity=".4"/>
      <circle cx="36" cy="36" r="14" fill="none" stroke="#03fcdf" strokeWidth=".7" strokeOpacity=".25"/>

      <path d="M30 22 Q36 18 42 22 Q40 28 36 29 Q32 28 30 22Z" fill="#03fcdf" fillOpacity=".07" stroke="#03fcdf" strokeWidth=".5" strokeOpacity=".3"/>
      <path d="M42 22 Q48 26 50 32 Q44 33 41 30 Q40 26 42 22Z" fill="#03fcdf" fillOpacity=".07" stroke="#03fcdf" strokeWidth=".5" strokeOpacity=".3"/>
      <path d="M50 40 Q48 46 42 50 Q40 44 43 41 Q46 39 50 40Z" fill="#03fcdf" fillOpacity=".07" stroke="#03fcdf" strokeWidth=".5" strokeOpacity=".3"/>
      <path d="M42 50 Q36 54 30 50 Q32 44 36 43 Q40 44 42 50Z" fill="#03fcdf" fillOpacity=".07" stroke="#03fcdf" strokeWidth=".5" strokeOpacity=".3"/>
      <path d="M30 50 Q24 46 22 40 Q28 39 31 42 Q32 46 30 50Z" fill="#03fcdf" fillOpacity=".07" stroke="#03fcdf" strokeWidth=".5" strokeOpacity=".3"/>
      <path d="M22 32 Q24 26 30 22 Q32 28 29 31 Q26 33 22 32Z" fill="#03fcdf" fillOpacity=".07" stroke="#03fcdf" strokeWidth=".5" strokeOpacity=".3"/>

      <circle cx="36" cy="36" r="8" fill="#0A2C2A" stroke="#03fcdf" strokeWidth=".8" strokeOpacity=".5"/>
      <circle cx="36" cy="36" r="4.5" fill={`url(#li${id})`}/>
      <circle cx="33.5" cy="33.5" r="1.8" fill={`url(#lh${id})`}/>

      <line x1="16" y1="36" x2="26" y2="36" stroke="#03fcdf" strokeWidth=".7" strokeOpacity=".3" strokeLinecap="round"/>
      <line x1="46" y1="36" x2="56" y2="36" stroke="#03fcdf" strokeWidth=".7" strokeOpacity=".3" strokeLinecap="round"/>
      <line x1="36" y1="16" x2="36" y2="26" stroke="#03fcdf" strokeWidth=".7" strokeOpacity=".3" strokeLinecap="round"/>
      <line x1="36" y1="46" x2="36" y2="56" stroke="#03fcdf" strokeWidth=".7" strokeOpacity=".3" strokeLinecap="round"/>

      <line x1="20" y1="41" x2="52" y2="41" stroke="#03fcdf" strokeWidth=".5" strokeOpacity=".18" strokeDasharray="2.5 2.5"/>

      <circle cx="19" cy="19" r="1.2" fill="#03fcdf" fillOpacity=".2"/>
      <circle cx="55" cy="19" r="1.2" fill="#03fcdf" fillOpacity=".2"/>
      <circle cx="19" cy="55" r="1.2" fill="#03fcdf" fillOpacity=".15"/>
      <circle cx="55" cy="55" r="1.2" fill="#03fcdf" fillOpacity=".15"/>
      <circle cx="22" cy="50" r="1.5" fill="#03fcdf" fillOpacity=".28"/>
      <circle cx="52" cy="22" r="1.5" fill="#03fcdf" fillOpacity=".28"/>
    </svg>
  )
}

export function LensLogoHorizontal({ size = 40, className }: LensLogoProps) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className={className}>
      <LensMark size={size} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{
          fontFamily: 'var(--font-inter, "Inter", sans-serif)',
          fontWeight: 800,
          fontSize: Math.round(size * 0.6),
          color: '#E0FAF7',
          letterSpacing: '-.02em',
          lineHeight: 1,
        }}>
          Astra Lens
        </span>
        <span style={{
          fontFamily: 'var(--font-inter, "Inter", sans-serif)',
          fontWeight: 400,
          fontSize: Math.round(size * 0.27),
          color: '#6ABDB5',
          letterSpacing: '.04em',
        }}>
          Business Intelligence
        </span>
      </div>
    </div>
  )
}
