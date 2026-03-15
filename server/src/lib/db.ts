/**
 * PostgreSQL connection pool for Astra Lens.
 * Requires DATABASE_URL (or LENS_DATABASE_URL) environment variable.
 * Run: npm install pg @types/pg
 */
import { Pool, PoolClient, QueryResultRow } from 'pg'
import { logger } from './logger'

const connectionString =
  process.env.LENS_DATABASE_URL || process.env.DATABASE_URL

if (!connectionString) {
  logger.warn(
    'LENS_DATABASE_URL / DATABASE_URL not set — credential store will fall back to in-process file store'
  )
}

let _pool: Pool | null = null

export function getPool(): Pool | null {
  if (!connectionString) return null
  if (!_pool) {
    _pool = new Pool({ connectionString, max: 5 })
    _pool.on('error', (err) => {
      logger.error('Lens DB pool error:', err.message)
    })
  }
  return _pool
}

export async function query<T extends QueryResultRow = any>(
  sql: string,
  params: any[] = []
): Promise<{ rows: T[] }> {
  const pool = getPool()
  if (!pool) throw new Error('Lens DB not configured')
  return pool.query<T>(sql, params)
}
