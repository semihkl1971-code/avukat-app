-- WhatsApp AI bot: mesajın bot mu (otomatik) yoksa insan mı gönderdiğini işaretle.
-- Avukat devralınca botun susması bu kolona dayanır (is_auto=false => insan yanıtı).
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_auto BOOLEAN NOT NULL DEFAULT false;

-- Bot ayarları organizations.settings JSONB içinde tutulur (ayrı kolon gerekmez):
--   settings.whatsappBot = {
--     enabled: bool, firmName, hours, services,
--     keywords: [{ keyword: "randevu", reply: "..." }]
--   }

-- Kullanıcının kendi bürosunun bot ayarını güvenle güncellemesi (SECURITY DEFINER).
CREATE OR REPLACE FUNCTION set_whatsapp_bot(p_config JSONB)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_org UUID;
BEGIN
  SELECT organization_id INTO v_org FROM profiles WHERE id = auth.uid();
  IF v_org IS NULL THEN
    RAISE EXCEPTION 'Büro bulunamadı';
  END IF;
  UPDATE organizations
    SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{whatsappBot}', p_config, true),
        updated_at = now()
    WHERE id = v_org;
END;
$$;

GRANT EXECUTE ON FUNCTION set_whatsapp_bot(JSONB) TO authenticated;
