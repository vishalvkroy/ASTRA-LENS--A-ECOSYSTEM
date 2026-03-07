import rateLimit from 'express-rate-limit'

export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 15,               // 15 AI calls per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'TooManyRequests',
    message: 'Too many AI requests. Please wait a minute.',
  },
})

export const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
})
