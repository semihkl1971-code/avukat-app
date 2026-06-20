-- ─────────────────────────────────────────────────────────────────────────────
-- Avukat App — Initial Schema (IF NOT EXISTS — tekrar çalıştırılabilir)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── TABLOLAR ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'TR',
  locale TEXT NOT NULL DEFAULT 'tr',
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free','starter','pro','enterprise')),
  subscription_status TEXT NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active','past_due','canceled','trialing')),
  iyzico_subscription_reference_code TEXT,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  full_name TEXT,
  bar_number TEXT,
  role TEXT NOT NULL DEFAULT 'lawyer'
    CHECK (role IN ('admin','lawyer','assistant')),
  phone TEXT,
  avatar_url TEXT,
  locale TEXT NOT NULL DEFAULT 'tr',
  uyap_credentials_encrypted TEXT,
  gmail_refresh_token_encrypted TEXT,
  whatsapp_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'individual'
    CHECK (type IN ('individual','corporate')),
  full_name TEXT NOT NULL,
  tc_kimlik_no TEXT,
  tax_number TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  country TEXT NOT NULL DEFAULT 'TR',
  whatsapp_opted_in BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  assigned_lawyer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  case_number TEXT,
  uyap_case_id TEXT,
  case_type TEXT
    CHECK (case_type IN ('civil','criminal','administrative','commercial','family','labor','other')),
  court_name TEXT,
  court_file_number TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','closed','pending','archived')),
  stage TEXT,
  description TEXT,
  opened_at DATE,
  closed_at DATE,
  next_hearing_at TIMESTAMPTZ,
  fee_arrangement JSONB,
  tags TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hearings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  court_name TEXT,
  courtroom TEXT,
  judge_name TEXT,
  hearing_type TEXT,
  outcome TEXT,
  notes TEXT,
  uyap_synced BOOLEAN NOT NULL DEFAULT false,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  mime_type TEXT,
  ocr_text TEXT,
  uyap_document_id TEXT,
  source TEXT NOT NULL DEFAULT 'upload'
    CHECK (source IN ('upload','uyap','email','whatsapp')),
  tags TEXT[] NOT NULL DEFAULT '{}',
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  channel TEXT NOT NULL
    CHECK (channel IN ('whatsapp','gmail','sms')),
  direction TEXT NOT NULL
    CHECK (direction IN ('inbound','outbound')),
  external_message_id TEXT,
  from_address TEXT,
  to_address TEXT,
  subject TEXT,
  body TEXT,
  body_html TEXT,
  attachments JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'delivered'
    CHECK (status IN ('pending','sent','delivered','read','failed')),
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS laws (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE,
  title TEXT NOT NULL,
  category TEXT,
  content TEXT,
  source_url TEXT,
  effective_date DATE,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  lawyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  description TEXT,
  minutes INTEGER NOT NULL CHECK (minutes > 0),
  billable BOOLEAN NOT NULL DEFAULT true,
  billed BOOLEAN NOT NULL DEFAULT false,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE RESTRICT,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','paid','overdue','canceled')),
  currency TEXT NOT NULL DEFAULT 'TRY',
  amount DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  payment_method TEXT
    CHECK (payment_method IN ('iyzico','stripe','bank_transfer','cash')),
  iyzico_payment_id TEXT,
  stripe_payment_intent_id TEXT,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  items JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL CHECK (provider IN ('iyzico','stripe')),
  provider_event_id TEXT,
  payload JSONB,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS uyap_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  case_id UUID REFERENCES cases(id) ON DELETE SET NULL,
  sync_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success','error','partial')),
  response JSONB,
  error_message TEXT,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── INDEX'LER ────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_full_name ON clients USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_cases_org ON cases(organization_id);
CREATE INDEX IF NOT EXISTS idx_cases_client ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_cases_hearing ON cases(next_hearing_at) WHERE next_hearing_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hearings_org ON hearings(organization_id);
CREATE INDEX IF NOT EXISTS idx_hearings_case ON hearings(case_id);
CREATE INDEX IF NOT EXISTS idx_hearings_scheduled ON hearings(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_documents_org ON documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_case ON documents(case_id);
CREATE INDEX IF NOT EXISTS idx_documents_ocr ON documents USING gin(to_tsvector('turkish', coalesce(ocr_text, '')));
CREATE INDEX IF NOT EXISTS idx_messages_org ON messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_messages_client ON messages(client_id);
CREATE INDEX IF NOT EXISTS idx_messages_channel ON messages(organization_id, channel);
CREATE INDEX IF NOT EXISTS idx_laws_fts ON laws USING gin(to_tsvector('turkish', title || ' ' || coalesce(content, '')));
CREATE INDEX IF NOT EXISTS idx_time_entries_case ON time_entries(case_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client ON invoices(client_id);

-- ─── FONKSİYONLAR ─────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, locale)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'tr')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ─── TRIGGER'LAR ──────────────────────────────────────────────────────────────

DROP TRIGGER IF EXISTS trg_organizations_updated_at ON organizations;
CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_cases_updated_at ON cases;
CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── ROW LEVEL SECURITY ───────────────────────────────────────────────────────

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE laws ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE uyap_sync_log ENABLE ROW LEVEL SECURITY;

-- ─── POLİTİKALAR ─────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "org_select" ON organizations;
CREATE POLICY "org_select" ON organizations
  FOR SELECT USING (id = auth_org_id());

DROP POLICY IF EXISTS "org_update" ON organizations;
CREATE POLICY "org_update" ON organizations
  FOR UPDATE USING (id = auth_org_id());

DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (organization_id = auth_org_id() OR id = auth.uid());

DROP POLICY IF EXISTS "profiles_update" ON profiles;
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "clients_all" ON clients;
CREATE POLICY "clients_all" ON clients
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS "cases_all" ON cases;
CREATE POLICY "cases_all" ON cases
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS "hearings_all" ON hearings;
CREATE POLICY "hearings_all" ON hearings
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS "documents_all" ON documents;
CREATE POLICY "documents_all" ON documents
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS "messages_all" ON messages;
CREATE POLICY "messages_all" ON messages
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS "time_entries_all" ON time_entries;
CREATE POLICY "time_entries_all" ON time_entries
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS "invoices_all" ON invoices;
CREATE POLICY "invoices_all" ON invoices
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

DROP POLICY IF EXISTS "sub_events_select" ON subscription_events;
CREATE POLICY "sub_events_select" ON subscription_events
  FOR SELECT USING (organization_id = auth_org_id());

DROP POLICY IF EXISTS "uyap_log_select" ON uyap_sync_log;
CREATE POLICY "uyap_log_select" ON uyap_sync_log
  FOR SELECT USING (organization_id = auth_org_id());

DROP POLICY IF EXISTS "laws_select" ON laws;
CREATE POLICY "laws_select" ON laws FOR SELECT USING (true);
