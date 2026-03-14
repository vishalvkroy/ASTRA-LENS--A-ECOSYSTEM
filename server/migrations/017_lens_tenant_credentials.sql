-- Migration 017: Persistent tenant credential store for Lens
-- Replaces ephemeral local file (data/tenant-credentials.json)
-- This table must be in a persistent PostgreSQL database

CREATE TABLE IF NOT EXISTS lens_tenant_credentials (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id      TEXT        NOT NULL UNIQUE,
  atlas_key_enc  TEXT,        -- AES-256-GCM encrypted: iv:tag:ciphertext (base64)
  spark_key_enc  TEXT,        -- AES-256-GCM encrypted
  atlas_url      TEXT,        -- plain text — not sensitive
  spark_url      TEXT,        -- plain text
  spark_biz_id   TEXT,        -- Spark businessId for this tenant
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lens_creds_tenant ON lens_tenant_credentials(tenant_id);

COMMENT ON TABLE lens_tenant_credentials IS
  'Stores encrypted API keys and service URLs for each Lens tenant.
   Replaces the ephemeral data/tenant-credentials.json file.
   Keys are encrypted with AES-256-GCM using LENS_ENCRYPTION_KEY env var.';
