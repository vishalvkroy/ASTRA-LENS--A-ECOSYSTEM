import express from 'express'
import dotenv from 'dotenv'
dotenv.config()

import { corsMiddleware } from './middleware/cors'
import { errorHandler, notFound } from './middleware/error'
import { generalRateLimit } from './middleware/rate-limit'

// Route imports
import summaryRouter from './routes/summary.routes'
import alertsRouter from './routes/alerts.routes'
import insightsRouter from './routes/insights.routes'
import chatRouter from './routes/chat.routes'
import healthRouter from './routes/health.routes'

const app = express()

// Trust reverse proxy (Railway, Render) so rate limiting uses real client IP
app.set('trust proxy', 1)

// Global middleware
app.use(corsMiddleware)
app.use(express.json({ limit: '1mb' }))
app.use(generalRateLimit)

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'astra-lens-api',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    devMode: process.env.DEV_MODE === 'true',
  })
})

// Routes
app.use('/api/summary', summaryRouter)
app.use('/api/alerts', alertsRouter)
app.use('/api/insights', insightsRouter)
app.use('/api/chat', chatRouter)
app.use('/api/health', healthRouter)

// 404 + error handlers (must be last)
app.use(notFound)
app.use(errorHandler)

export default app
