import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
})

export const metadata: Metadata = {
  title: { default: 'Astra Lens', template: '%s | Astra Lens' },
  description: 'AI business intelligence for Indian retailers. Insights, smart alerts, and revenue trends in Hindi and English.',
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  manifest: '/site.webmanifest',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0A0F1E] text-white antialiased`}>
        {children}
      </body>
    </html>
  )
}
