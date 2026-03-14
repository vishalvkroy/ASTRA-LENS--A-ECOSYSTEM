import cors from 'cors'
import { logger } from '../lib/logger'

const isProd = process.env.NODE_ENV === 'production'

// Warn on startup if FRONTEND_URL is not set in production
if (isProd && !process.env.FRONTEND_URL) {
  logger.warn('FRONTEND_URL is not set — all browser requests will be CORS-blocked in production. Set FRONTEND_URL to your Lens web app URL.')
}

// Build allowlist: always include localhost for dev, add production URL if set
const allowedOrigins: string[] = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
]

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL)
}

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Server-to-server calls (no Origin header): always allowed —
    // they are protected by x-service-key / API key auth instead.
    if (!origin) return callback(null, true)

    // In production: only explicitly listed origins. No wildcard fallback.
    if (allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    // In development: also allow Vercel preview deployments
    if (!isProd && /^https:\/\/.*\.vercel\.app$/.test(origin)) {
      return callback(null, true)
    }

    callback(new Error(`CORS: ${origin} is not an allowed origin`))
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-id', 'x-lens-key'],
  credentials: true,
  // Preflight cache: browser won't re-check OPTIONS for 2 minutes
  maxAge: 120,
})
