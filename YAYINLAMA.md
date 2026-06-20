# Avukatım — Yayınlama (Deployment) Rehberi

Production build **başarılı** ✅ — uygulama yayına hazır. Aşağıdaki adımlarla canlıya alınır.

## Mimari özet
- **Web (Next.js)** → Vercel (önerilen). Tüm temel özellikler burada: panel, AI asistan, ödemeler, ekip, yasal sayfalar, `/api/*` route'ları (PayTR, Stripe, AI, UYAP bildirim).
- **Veritabanı (Supabase)** → zaten bulutta, deploy gerekmez. Migration'lar çalıştırıldı (0001–0006).
- **Mobil (Expo)** → App Store / Google Play (EAS Build) veya web önizleme.
- **apps/api (Fastify)** → opsiyonel; WhatsApp webhook, UYAP mock, cron için. v1'de şart değil (Next /api route'ları çoğu işi görüyor). Railway/Render/Fly'a ayrı deploy edilebilir.

---

## 1) Web'i Vercel'e çıkar
1. https://vercel.com → GitHub/GitLab ile giriş → **Add New ▸ Project**
2. Bu repoyu içe aktar
3. **Root Directory: `apps/web`** seç (önemli — monorepo)
4. Framework: **Next.js** (otomatik algılanır)
5. **Environment Variables** ekle (aşağıdaki liste) → **Deploy**

> Not: `apps/web/vercel.json` build/install komutlarını monorepo'ya göre ayarlar. Vercel kök `pnpm install` yapıp `web`'i build eder.

### Vercel ortam değişkenleri (Environment Variables)
`.env.local`'deki değerlerin **aynısı**, ek olarak `NEXT_PUBLIC_APP_URL` production domaini olur:

```
NEXT_PUBLIC_SUPABASE_URL=https://nhkxesbykmuwtotrgsqj.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...
ANTHROPIC_API_KEY=sk-ant-...           (YENİ anahtar — eskisini iptal et)
PAYTR_MERCHANT_ID=...
PAYTR_MERCHANT_KEY=...
PAYTR_MERCHANT_SALT=...
PAYTR_TEST_MODE=0                        (canlıda 0)
STRIPE_SECRET_KEY=...                    (global ödeme isteniyorsa)
STRIPE_WEBHOOK_SECRET=...
WHATSAPP_ACCESS_TOKEN=...                (WhatsApp aktifse)
WHATSAPP_PHONE_ID=...
NEXT_PUBLIC_APP_URL=https://www.avukatım.com
```

## 2) Domain bağla
1. Domaini al: **avukatım.com** (punycode: `xn--avukatm-wfb.com`)
2. Vercel → Project ▸ **Settings ▸ Domains** → `www.avukatım.com` ekle
3. Vercel'in verdiği DNS kayıtlarını (A / CNAME) domain panelinde gir
4. SSL otomatik gelir

## 3) Deploy sonrası ayarlar
- **PayTR/Stripe callback URL'leri**: production domaine güncelle
  - PayTR: `https://www.avukatım.com/api/payments/paytr/callback`
  - Stripe webhook: `https://www.avukatım.com/api/payments/stripe` (Stripe dashboard'dan ekle)
- **Supabase Auth**: Authentication ▸ URL Configuration → Site URL = `https://www.avukatım.com`; Redirect URLs'e ekle
- **Google Search Console**: domaini doğrula (SEO zaten hazır — JSON-LD, sitemap, robots)
- **PayTR mağaza aktivasyonu**: "mağaza aktif değil" hatası için PayTR'den mağazayı aktifleştir

## 4) Mobil yayın (opsiyonel, sonra)
- `apps/mobile/.env` → `EXPO_PUBLIC_API_URL=https://www.avukatım.com` yap
- EAS hesabı: `npx eas login` → `npx eas build:configure`
- `npx eas build --platform android` / `--platform ios`
- Çıkan paketleri Google Play / App Store Connect'e yükle
- `app.json`'daki `extra.eas.projectId` gerçek EAS proje ID'siyle değişmeli

---

## Yayın öncesi kontrol listesi
- [x] Production build hatasız (`pnpm --filter web build`)
- [ ] 🔴 Anthropic API anahtarını yenile (sohbete yapıştırılan eski anahtarı iptal et)
- [ ] Vercel'e deploy + tüm env değişkenleri girildi
- [ ] Domain bağlandı + SSL aktif
- [ ] Supabase Auth Site URL güncellendi
- [ ] PayTR mağaza aktif + callback URL'leri production
- [ ] PAYTR_TEST_MODE=0 (canlı ödeme)
- [ ] Demo hesabı production'da test edildi
