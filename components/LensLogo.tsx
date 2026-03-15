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
        {/* Dark cool base */}
        <linearGradient id={`lb${id}`} x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0A0B1E"/>
          <stop offset="100%" stopColor="#05061A"/>
        </linearGradient>
        {/* Indigo iris */}
        <linearGradient id={`li${id}`} x1="36" y1="20" x2="36" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#C7D2FE"/>
          <stop offset="45%" stopColor="#6366F1"/>
          <stop offset="100%" stopColor="#3730A3"/>
        </linearGradient>
        {/* Arc sweep */}
        <linearGradient id={`ls${id}`} x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818CF8" stopOpacity=".7"/>
          <stop offset="100%" stopColor="#818CF8" stopOpacity=".05"/>
        </linearGradient>
        {/* Specular shimmer */}
        <linearGradient id={`lh${id}`} x1="28" y1="22" x2="36" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E0E7FF" stopOpacity=".8"/>
          <stop offset="100%" stopColor="#6366F1" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Base */}
      <rect width="72" height="72" rx="16" fill={`url(#lb${id})`}/>
      <rect width="72" height="72" rx="16" fill="none" stroke="#6366F1" strokeWidth=".8" strokeOpacity=".3"/>

      {/* Sweep arcs */}
      <path d="M36 8 A28 28 0 0 1 64 36" fill="none" stroke={`url(#ls${id})`} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M36 64 A28 28 0 0 1 8 36" fill="none" stroke="#818CF8" strokeWidth=".8" strokeOpacity=".18" strokeLinecap="round"/>

      {/* Tick marks */}
      <line x1="36" y1="8"  x2="36" y2="13" stroke="#818CF8" strokeWidth="1.5" strokeOpacity=".6" strokeLinecap="round"/>
      <line x1="64" y1="36" x2="59" y2="36" stroke="#818CF8" strokeWidth="1.5" strokeOpacity=".6" strokeLinecap="round"/>
      <line x1="36" y1="64" x2="36" y2="59" stroke="#818CF8" strokeWidth="1"   strokeOpacity=".3" strokeLinecap="round"/>
      <line x1="8"  y1="36" x2="13" y2="36" stroke="#818CF8" strokeWidth="1"   strokeOpacity=".3" strokeLinecap="round"/>

      {/* Arc endpoint dots */}
      <circle cx="36" cy="8"  r="2" fill="#818CF8" fillOpacity=".9"/>
      <circle cx="64" cy="36" r="2" fill="#818CF8" fillOpacity=".75"/>

      {/* Outer lens ring */}
      <circle cx="36" cy="36" r="20" fill="none" stroke="#6366F1" strokeWidth=".9" strokeOpacity=".45"/>

      {/* Middle ring */}
      <circle cx="36" cy="36" r="14" fill="none" stroke="#818CF8" strokeWidth=".7" strokeOpacity=".28"/>

      {/* Aperture blades — 6 */}
      <path d="M30 22 Q36 18 42 22 Q40 28 36 29 Q32 28 30 22Z" fill="#6366F1" fillOpacity=".1" stroke="#818CF8" strokeWidth=".5" strokeOpacity=".35"/>
      <path d="M42 22 Q48 26 50 32 Q44 33 41 30 Q40 26 42 22Z" fill="#6366F1" fillOpacity=".1" stroke="#818CF8" strokeWidth=".5" strokeOpacity=".35"/>
      <path d="M50 40 Q48 46 42 50 Q40 44 43 41 Q46 39 50 40Z" fill="#6366F1" fillOpacity=".1" stroke="#818CF8" strokeWidth=".5" strokeOpacity=".35"/>
      <path d="M42 50 Q36 54 30 50 Q32 44 36 43 Q40 44 42 50Z" fill="#6366F1" fillOpacity=".1" stroke="#818CF8" strokeWidth=".5" strokeOpacity=".35"/>
      <path d="M30 50 Q24 46 22 40 Q28 39 31 42 Q32 46 30 50Z" fill="#6366F1" fillOpacity=".1" stroke="#818CF8" strokeWidth=".5" strokeOpacity=".35"/>
      <path d="M22 32 Q24 26 30 22 Q32 28 29 31 Q26 33 22 32Z" fill="#6366F1" fillOpacity=".1" stroke="#818CF8" strokeWidth=".5" strokeOpacity=".35"/>

      {/* Inner pupil */}
      <circle cx="36" cy="36" r="8" fill="#0A0B1E" stroke="#6366F1" strokeWidth=".8" strokeOpacity=".6"/>

      {/* Pupil — indigo fill */}
      <circle cx="36" cy="36" r="4.5" fill={`url(#li${id})`}/>

      {/* Specular highlight */}
      <circle cx="33.5" cy="33.5" r="1.8" fill={`url(#lh${id})`}/>

      {/* Crosshair lines */}
      <line x1="16" y1="36" x2="26" y2="36" stroke="#818CF8" strokeWidth=".7" strokeOpacity=".32" strokeLinecap="round"/>
      <line x1="46" y1="36" x2="56" y2="36" stroke="#818CF8" strokeWidth=".7" strokeOpacity=".32" strokeLinecap="round"/>
      <line x1="36" y1="16" x2="36" y2="26" stroke="#818CF8" strokeWidth=".7" strokeOpacity=".32" strokeLinecap="round"/>
      <line x1="36" y1="46" x2="36" y2="56" stroke="#818CF8" strokeWidth=".7" strokeOpacity=".32" strokeLinecap="round"/>

      {/* Scan line */}
      <line x1="20" y1="41" x2="52" y2="41" stroke="#6366F1" strokeWidth=".5" strokeOpacity=".2" strokeDasharray="2.5 2.5"/>

      {/* Corner + scatter dots */}
      <circle cx="19" cy="19" r="1.2" fill="#818CF8" fillOpacity=".22"/>
      <circle cx="55" cy="19" r="1.2" fill="#818CF8" fillOpacity=".22"/>
      <circle cx="19" cy="55" r="1.2" fill="#818CF8" fillOpacity=".16"/>
      <circle cx="55" cy="55" r="1.2" fill="#818CF8" fillOpacity=".16"/>
      <circle cx="22" cy="50" r="1.5" fill="#818CF8" fillOpacity=".28"/>
      <circle cx="52" cy="22" r="1.5" fill="#818CF8" fillOpacity=".28"/>
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
          color: '#EEF2FF',
          letterSpacing: '-.02em',
          lineHeight: 1,
        }}>
          Astra Lens
        </span>
        <span style={{
          fontFamily: 'var(--font-inter, "Inter", sans-serif)',
          fontWeight: 400,
          fontSize: Math.round(size * 0.27),
          color: '#A5B4FC',
          letterSpacing: '.04em',
        }}>
          Business Intelligence
        </span>
      </div>
    </div>
  )
}
