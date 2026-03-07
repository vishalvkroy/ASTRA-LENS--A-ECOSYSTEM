import { Request, Response, NextFunction } from 'express'
import { logger } from '../lib/logger'

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`${req.method} ${req.path} →`, err.message)
  const status = err.status || err.statusCode || 500
  res.status(status).json({
    error: err.name || 'InternalServerError',
    message: err.message || 'Something went wrong',
  })
}

export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
  })
}
