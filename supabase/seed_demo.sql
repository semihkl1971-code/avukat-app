-- ─────────────────────────────────────────────────────────────────
-- Demo hesap verisi — Supabase Dashboard > SQL Editor'de çalıştırın
-- Demo kullanıcı: demo@avukatim.com / Demo123456!
-- ─────────────────────────────────────────────────────────────────

-- 1. Önce Supabase Dashboard > Authentication > Users'dan
--    demo@avukatim.com / Demo123456! kullanıcısını oluşturun
--    ve aşağıya o kullanıcının UUID'sini yazın:

DO $$
DECLARE
  demo_user_id UUID;
  demo_org_id UUID;
  client1_id UUID;
  client2_id UUID;
  client3_id UUID;
  case1_id UUID;
  case2_id UUID;
  case3_id UUID;
BEGIN
  -- Kullanıcıyı bul
  SELECT id INTO demo_user_id FROM auth.users WHERE email = 'demo@avukatim.com' LIMIT 1;
  IF demo_user_id IS NULL THEN
    RAISE EXCEPTION 'Demo kullanıcısı bulunamadı. Önce Authentication > Users > Add User ile demo@avukatim.com / Demo123456! kullanıcısını oluşturun.';
  END IF;

  -- Org oluştur
  INSERT INTO organizations (id, name, slug, subscription_tier, country_code)
  VALUES (gen_random_uuid(), 'Demo Hukuk Bürosu', 'demo-hukuk-' || substr(md5(random()::text),1,6), 'pro', 'TR')
  RETURNING id INTO demo_org_id;

  -- Profil güncelle
  UPDATE profiles SET
    organization_id = demo_org_id,
    full_name = 'Av. Demo Kullanıcı',
    bar_number = 'DEMO-001',
    phone = '05001234567',
    role = 'admin'
  WHERE id = demo_user_id;

  -- Müvekkiller
  INSERT INTO clients (id, organization_id, full_name, type, email, phone, city, tc_kimlik_no)
  VALUES
    (gen_random_uuid(), demo_org_id, 'Ahmet Yılmaz', 'individual', 'ahmet@example.com', '05321234567', 'İstanbul', '12345678901'),
    (gen_random_uuid(), demo_org_id, 'Fatma Kaya', 'individual', 'fatma@example.com', '05331234567', 'Ankara', '23456789012'),
    (gen_random_uuid(), demo_org_id, 'Aras Holding A.Ş.', 'corporate', 'info@aras.com.tr', '02121234567', 'İstanbul', NULL)
  RETURNING id INTO client1_id;

  SELECT id INTO client1_id FROM clients WHERE organization_id = demo_org_id AND full_name = 'Ahmet Yılmaz' LIMIT 1;
  SELECT id INTO client2_id FROM clients WHERE organization_id = demo_org_id AND full_name = 'Fatma Kaya' LIMIT 1;
  SELECT id INTO client3_id FROM clients WHERE organization_id = demo_org_id AND full_name = 'Aras Holding A.Ş.' LIMIT 1;

  -- Davalar
  INSERT INTO cases (id, organization_id, client_id, title, case_number, case_type, court_name, status, next_hearing_at)
  VALUES
    (gen_random_uuid(), demo_org_id, client1_id, 'Yılmaz - Demir Alacak Davası', '2024/1547', 'civil', 'İstanbul 5. Asliye Hukuk Mahkemesi', 'active', now() + interval '15 days'),
    (gen_random_uuid(), demo_org_id, client2_id, 'Kaya Boşanma Davası', '2024/0892', 'family', 'Ankara 3. Aile Mahkemesi', 'active', now() + interval '30 days'),
    (gen_random_uuid(), demo_org_id, client3_id, 'Aras Holding İş Uyuşmazlığı', '2023/3301', 'labor', 'İstanbul İş Mahkemesi', 'active', now() + interval '8 days')
  RETURNING id INTO case1_id;

  SELECT id INTO case1_id FROM cases WHERE organization_id = demo_org_id AND case_number = '2024/1547' LIMIT 1;
  SELECT id INTO case2_id FROM cases WHERE organization_id = demo_org_id AND case_number = '2024/0892' LIMIT 1;
  SELECT id INTO case3_id FROM cases WHERE organization_id = demo_org_id AND case_number = '2023/3301' LIMIT 1;

  -- Duruşmalar
  INSERT INTO hearings (organization_id, case_id, scheduled_at, court_name, hearing_type, uyap_synced)
  VALUES
    (demo_org_id, case1_id, now() + interval '15 days', 'İstanbul 5. Asliye', 'Tensip', true),
    (demo_org_id, case2_id, now() + interval '30 days', 'Ankara 3. Aile', 'Ön İnceleme', true),
    (demo_org_id, case3_id, now() + interval '8 days', 'İstanbul İş Mah.', 'Karar', true);

  -- Mesajlar
  INSERT INTO messages (organization_id, client_id, case_id, channel, direction, from_address, to_address, body, status)
  VALUES
    (demo_org_id, client1_id, case1_id, 'whatsapp', 'inbound', '905321234567', '905001234567', 'Duruşma saat kaçta hocam?', 'delivered'),
    (demo_org_id, client1_id, case1_id, 'whatsapp', 'outbound', '905001234567', '905321234567', 'Saat 10:00, İstanbul 5. Asliye Hukuk Mahkemesi', 'delivered'),
    (demo_org_id, client2_id, NULL, 'gmail', 'inbound', 'fatma@example.com', 'demo@avukatim.com', 'Belgeleri ilettim, incelemenizi bekliyorum.', 'read'),
    (demo_org_id, client3_id, case3_id, 'gmail', 'outbound', 'demo@avukatim.com', 'info@aras.com.tr', 'Duruşma tarihi 8 gün sonra. Hazırlıklarınızı tamamlamanızı rica ederim.', 'sent');

  RAISE NOTICE 'Demo verisi başarıyla oluşturuldu. Org ID: %', demo_org_id;
END $$;
