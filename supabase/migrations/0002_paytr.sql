-- ─────────────────────────────────────────────────────────────────
-- PayTR ödeme entegrasyonu — Supabase SQL Editor'de çalıştırın
-- ─────────────────────────────────────────────────────────────────

-- subscription_events provider listesine 'paytr' ekle
ALTER TABLE subscription_events DROP CONSTRAINT IF EXISTS subscription_events_provider_check;
ALTER TABLE subscription_events
  ADD CONSTRAINT subscription_events_provider_check
  CHECK (provider IN ('iyzico','stripe','paytr'));

-- Bekleyen ödeme niyetleri — callback merchant_oid'den tier'ı bulur
CREATE TABLE IF NOT EXISTS payment_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_oid TEXT UNIQUE NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  tier TEXT NOT NULL,
  amount INTEGER NOT NULL,
  provider TEXT NOT NULL DEFAULT 'paytr',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','paid','failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payment_intents_oid ON payment_intents(merchant_oid);
CREATE INDEX IF NOT EXISTS idx_payment_intents_org ON payment_intents(organization_id);

-- RLS: kullanıcı sadece kendi org'unun ödemelerini görebilir.
-- Insert/update yalnızca service-role (callback) tarafından yapılır.
ALTER TABLE payment_intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_intents_select" ON payment_intents;
CREATE POLICY "payment_intents_select" ON payment_intents
  FOR SELECT USING (organization_id = auth_org_id());
