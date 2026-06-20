-- ════════════════════════════════════════════════════════════════════════════
--  0005 — Büro / Ekip yönetimi: davet sistemi + admin rol yönetimi
--  profiles_update politikası sadece "kendi profilin"e izin verdiği için
--  admin işlemleri SECURITY DEFINER fonksiyonlarla yapılır.
-- ════════════════════════════════════════════════════════════════════════════

-- ─── Davetler ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS org_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'lawyer' CHECK (role IN ('admin','lawyer','assistant')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','revoked')),
  invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  accepted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_org_invites_org ON org_invites(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_invites_email ON org_invites(lower(email));

ALTER TABLE org_invites ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS org_invites_rw ON org_invites;
CREATE POLICY org_invites_rw ON org_invites
  USING (organization_id = auth_org_id())
  WITH CHECK (organization_id = auth_org_id());

-- ─── Caller admin mi? ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION is_org_admin()
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ─── Üye rolünü değiştir (sadece admin, kendi bürosunda) ─────────────────────
CREATE OR REPLACE FUNCTION admin_set_member_role(member_id UUID, new_role TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF new_role NOT IN ('admin','lawyer','assistant') THEN RAISE EXCEPTION 'Geçersiz rol'; END IF;
  IF NOT is_org_admin() THEN RAISE EXCEPTION 'Yetki yok'; END IF;
  UPDATE profiles SET role = new_role
   WHERE id = member_id
     AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid());
END; $$;

-- ─── Üyeyi bürodan çıkar (sadece admin, kendini değil) ───────────────────────
CREATE OR REPLACE FUNCTION admin_remove_member(member_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF member_id = auth.uid() THEN RAISE EXCEPTION 'Kendinizi çıkaramazsınız'; END IF;
  IF NOT is_org_admin() THEN RAISE EXCEPTION 'Yetki yok'; END IF;
  UPDATE profiles SET organization_id = NULL
   WHERE id = member_id
     AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid());
END; $$;

-- ─── Yeni kullanıcı kendi e-postasına gelen daveti kabul eder ────────────────
CREATE OR REPLACE FUNCTION claim_org_invite()
RETURNS TABLE(organization_id UUID, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv org_invites%ROWTYPE; uemail TEXT;
BEGIN
  SELECT email INTO uemail FROM auth.users WHERE id = auth.uid();
  SELECT * INTO inv FROM org_invites
   WHERE lower(email) = lower(uemail) AND status = 'pending'
   ORDER BY created_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN; END IF;
  UPDATE profiles SET organization_id = inv.organization_id, role = inv.role WHERE id = auth.uid();
  UPDATE org_invites SET status = 'accepted', accepted_at = now() WHERE id = inv.id;
  RETURN QUERY SELECT inv.organization_id, inv.role;
END; $$;
