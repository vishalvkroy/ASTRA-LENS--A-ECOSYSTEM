import { atlasSnapshot } from './atlas'
import { sparkSnapshot } from './spark'
import type { BusinessSnapshot } from './types'

export function getBusinessSnapshot(): BusinessSnapshot {
  return {
    atlas: atlasSnapshot,
    spark: sparkSnapshot,
    generatedAt: new Date().toISOString(),
  }
}

export { atlasSnapshot, sparkSnapshot }
export type { BusinessSnapshot, AtlasSnapshot, SparkData } from './types'
export * from './types'
