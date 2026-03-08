/**
 * Runtime config store — holds API keys set via the Connect UI.
 * Initialized from env vars; can be updated at runtime without restart.
 * Note: resets on server restart (use env vars for permanent storage).
 */

interface RuntimeConfig {
  atlasApiKey?: string
  sparkApiKey?: string
}

const _config: RuntimeConfig = {
  atlasApiKey: process.env.ATLAS_API_KEY || undefined,
  sparkApiKey: process.env.SPARK_API_KEY || undefined,
}

export function getAtlasApiKey(): string | undefined {
  return _config.atlasApiKey
}

export function setAtlasApiKey(key: string | null) {
  _config.atlasApiKey = key ?? undefined
}

export function getSparkApiKey(): string | undefined {
  return _config.sparkApiKey
}

export function setSparkApiKey(key: string | null) {
  _config.sparkApiKey = key ?? undefined
}

export function hasAtlasKey(): boolean {
  return !!_config.atlasApiKey
}

export function hasSparkKey(): boolean {
  return !!_config.sparkApiKey
}
