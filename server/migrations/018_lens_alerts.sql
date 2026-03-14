-- Migration 018: Persistent alert store with daily deduplication

CREATE TABLE IF NOT EXISTS lens_alerts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    TEXT        NOT NULL,
  alert_type   TEXT        NOT NULL,   -- 'LOW_STOCK', 'SLOW_MOVING', 'REVENUE_DROP', etc.
  reference_id TEXT        NOT NULL,   -- product_id, campaign_id, or 'general'
  alert_date   DATE        NOT NULL DEFAULT CURRENT_DATE,
  payload      JSONB,
  acknowledged BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, alert_type, reference_id, alert_date)
);

CREATE INDEX IF NOT EXISTS idx_lens_alerts_tenant_date
  ON lens_alerts(tenant_id, alert_date DESC);
CREATE INDEX IF NOT EXISTS idx_lens_alerts_unack
  ON lens_alerts(tenant_id, acknowledged) WHERE acknowledged = FALSE;

COMMENT ON TABLE lens_alerts IS
  'One alert per (tenant, type, reference, date). ON CONFLICT DO NOTHING
   prevents duplicate alerts for the same condition on the same day.';
