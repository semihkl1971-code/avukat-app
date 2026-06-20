-- ─────────────────────────────────────────────────────────────────
-- ÜYELİK HATASI DÜZELTMESİ — "Database error saving new user"
-- Supabase Dashboard > SQL Editor'de çalıştırın.
--
-- Sorun: handle_new_user trigger'ı profiles tablosuna eklerken hata
-- verirse, auth.users insert'i komple geri alınıyor ve kayıt 500 dönüyor.
--
-- Çözüm: search_path netleştirildi + EXCEPTION handler eklendi.
-- Artık trigger ne olursa olsun auth kaydını ASLA bozmaz.
-- ─────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, locale)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE(NEW.raw_user_meta_data->>'locale', 'tr')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Profil oluşturulamasa bile kullanıcı kaydı tamamlansın.
  -- Profil daha sonra uygulama tarafından upsert edilir.
  RETURN NEW;
END;
$$;

-- Trigger'ı yeniden bağla (varsa düşür, yeniden oluştur)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- organizations INSERT politikası eksikti — üye olan kullanıcı
-- kendi hukuk bürosunu oluşturabilsin (giriş yapmış olmak şartıyla).
-- ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "org_insert" ON organizations;
CREATE POLICY "org_insert" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
