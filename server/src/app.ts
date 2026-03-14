import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

import helmet from 'helmet'
import { corsMiddleware } from './middleware/cors'
import { errorHandler, notFound } from './middleware/error'
import { generalRateLimit, snapshotRateLimit } from './middleware/rate-limit'
import { logger } from './lib/logger'

// Sentry — gracefully no-ops if SENTRY_DSN is not set
let Sentry: typeof import('@sentry/node') | null = null
if (process.env.SENTRY_DSN) {
  Sentry = require('@sentry/node')
  Sentry!.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,  // 10% of requests traced — adjust for volume
  })
  logger.success('Sentry error tracking initialised')
} else {
  logger.warn('SENTRY_DSN not set — error tracking disabled. Set it for production observability.')
}

// Route imports
import summaryRouter from './routes/summary.routes'
import alertsRouter from './routes/alerts.routes'
import insightsRouter from './routes/insights.routes'
import chatRouter from './routes/chat.routes'
import healthRouter from './routes/health.routes'
import internalRouter from './routes/internal.routes'

const app = express()

// Trust reverse proxy (Railway, Render) so rate limiting uses real client IP
app.set('trust proxy', 1)

// ─── Security headers (Helmet) ────────────────────────────────
app.use(helmet({
  // Content-Security-Policy: lock down what the API response can reference
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'none'"],
      frameAncestors: ["'none'"],
    },
  },
  // Prevent browsers from MIME-sniffing the response type
  noSniff: true,
  // Tell browsers not to send this server's URL as Referer in cross-origin requests
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  // Force HTTPS (1 year, include subdomains)
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  // Don't expose the X-Powered-By: Express header
  hidePoweredBy: true,
}))

// ─── CORS ────────────────────────────────────────────────────
app.use(corsMiddleware)

// ─── Body parsing — tight limits per route type ───────────────
// Chat and insights: small JSON only (message + history)
app.use('/api/chat', express.json({ limit: '16kb' }))
app.use('/api/insights', express.json({ limit: '4kb' }))
// Internal events from Atlas: small payloads
app.use('/api/internal', express.json({ limit: '32kb' }))
// All other routes: 256kb max (covers summary/alerts responses)
app.use(express.json({ limit: '256kb' }))

// ─── Global rate limit (all routes) ──────────────────────────
app.use(generalRateLimit)

// ─── Sentry request handler (must be before routes) ──────────
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler())
}

// ─── Health check (no rate limit — used by uptime monitors) ──
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'astra-lens-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    // Never expose DEV_MODE status in production responses
    ...(process.env.NODE_ENV !== 'production' && {
      devMode: process.env.DEV_MODE === 'true',
    }),
  })
})

// ─── Routes ──────────────────────────────────────────────────
app.use('/api/summary', snapshotRateLimit, summaryRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/insights', insightsRouter)
app.use('/api/chat', chatRouter)
app.use('/api/health', healthRouter)
app.use('/api/internal', internalRouter)

// ─── Sentry error handler (must be before custom error handler) ──
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler())
}

// ─── 404 + error handlers (must be last) ─────────────────────
app.use(notFound)
app.use(errorHandler)

export default app
