import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

const isProd = process.env.NODE_ENV === 'production'

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status || err.statusCode || 500

  if (status >= 500) {
    logger.error(`${req.method} ${req.path} → ${status}`, err.message)
  } else {
    logger.warn(`${req.method} ${req.path} → ${status}`, err.message)
  }

  res.status(status).json({
    error: err.name || 'InternalServerError',
    // Never leak internal error details to clients in production
    message: isProd && status >= 500
      ? 'Something went wrong'
      : (err.message || 'Something went wrong'),
  })
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
  })
}
