import crypto from 'crypto'
import type { Request, Response, NextFunction } from 'express'

/**
 * Service-to-service auth middleware.
 * Validates the x-service-key header against LENS_SERVICE_KEY env var.
 * Uses crypto.timingSafeEqual to prevent timing side-channel attacks.
 * Used to protect /api/internal/* routes that only Atlas should call.
 */
export function serviceAuth(req: Request, res: Response, next: NextFunction): void {
  const key = req.headers['x-service-key'] as string | undefined
  const expected = process.env['LENS_SERVICE_KEY']

  if (!expected) {
    res.status(503).json({ error: 'Internal service not configured' })
    return
  }

  if (!key) {
    res.status(401).json({ error: 'Missing service key' })
    return
  }

  try {
    const keyBuf = Buffer.from(key)
    const expectedBuf = Buffer.from(expected)
    const valid =
      keyBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(keyBuf, expectedBuf)

    if (!valid) {
      res.status(401).json({ error: 'Invalid service key' })
      return
    }
  } catch {
    res.status(401).json({ error: 'Invalid service key' })
    return
  }

  next()
}
