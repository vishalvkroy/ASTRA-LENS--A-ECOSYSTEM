import rateLimit from 'express-rate-limit'

// Skip rate limiting for internal service calls (they use x-service-key auth instead)
const skipInternalRequests = (req: any) =>
  typeof req.headers['x-service-key'] === 'string'

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 60,               // 60 requests/min per IP
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInternalRequests,
  message: { error: 'TooManyRequests', message: 'Slow down. Try again in a minute.' },
})

// AI routes: chat + insights — expensive, strict limit
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 10,               // 10 AI calls per minute per IP (down from 15)
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInternalRequests,
  message: { error: 'TooManyRequests', message: 'Too many AI requests. Please wait a minute.' },
})

// Summary/snapshot — fetched on every dashboard load, slightly relaxed
export const snapshotRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInternalRequests,
  message: { error: 'TooManyRequests', message: 'Too many requests. Try again shortly.' },
})
