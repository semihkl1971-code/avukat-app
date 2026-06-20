-- ════════════════════════════════════════════════════════════════════════════
--  0004 — Müvekkil ödeme takibi, siber güvenlik ayarları, wellness günlüğü
--  RLS: mevcut auth_org_id() yardımcısı ve auth.uid() kullanılır.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Müvekkil ödeme takibi ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS client_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  due_date DATE,
  paid BOOLEAN NOT NULL DEFAULT false,
  paid_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_client_payments_org ON client_payments(organization_id);

-- ─── Siber güvenlik ayarları (org başına tek satır) ──────────────────────────
CREATE TABLE IF NOT EXISTS security_settings (
  organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
  two_fa BOOLEAN NOT NULL DEFAULT false,
  device_lock BOOLEAN NOT NULL DEFAULT true,
  ip_allowlist BOOLEAN NOT NULL DEFAULT false,
  auto_logout BOOLEAN NOT NULL DEFAULT true,
  encrypt_docs BOOLEAN NOT NULL DEFAULT true,
  phishing_guard BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Wellness günlüğü (kullanıcı + gün başına tek satır) ──────────────────────
CREATE TABLE IF NOT EXISTS wellness_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  log_date DATE NOT NULL DEFAULT current_date,
  mood SMALLINT,
  coffee SMALLINT NOT NULL DEFAULT 0,
  water SMALLINT NOT NULL DEFAULT 0,
  breaks SMALLINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE client_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE wellness_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_payments_rw ON client_payments;
CREATE POLICY client_payments_rw ON client_payments
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS security_settings_rw ON security_settings;
CREATE POLICY security_settings_rw ON security_settings
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS wellness_log_rw ON wellness_log;
CREATE POLICY wellness_log_rw ON wellness_log
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
