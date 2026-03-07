import { getAtlasMock } from './atlas.mock'
import { getSparkMock } from './spark.mock'
import type { BusinessSnapshot } from '../types'

export function getMockSnapshot(): BusinessSnapshot {
  return {
    atlas: getAtlasMock(),
    spark: getSparkMock(),
    generatedAt: new Date().toISOString(),
  }
}
