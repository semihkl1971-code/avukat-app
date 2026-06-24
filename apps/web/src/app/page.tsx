'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LandingStyles, LandingReveal, HeroBackdrop, QuickFeatures, GlobeSection, PeopleSection, CourtroomSection, PhoneMockup, FeatureVisual } from '@/components/landing/Animations'

interface BIPEvent extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }

// ════════════════════════════════════════════════════════════════════════════
//  MEDYA — Google Flow ile üretilen tanıtım videoları (apps/web/public/videos/).
//  Yeni video eklemek için dosyayı public/videos/ klasörüne atıp yolunu yazın.
// ════════════════════════════════════════════════════════════════════════════
const HERO_VIDEO = '/videos/tanitim.mp4'
const HERO_POSTER = '/posters/tanitim.jpg'

const TUTORIALS = [
  { title: 'UYAP ile Dava Takibi', duration: '0:08', poster: '/posters/dava-takip.jpg', video: '/videos/dava-takip.mp4' },
  { title: 'WhatsApp & Gmail Birleşik Gelen Kutusu', duration: '0:08', poster: '/posters/birlesik-iletisim.jpg', video: '/videos/birlesik-iletisim.mp4' },
  { title: 'Avukatınız İçin Tek Platform', duration: '0:08', poster: '/posters/avukat-ofis.jpg', video: '/videos/avukat-ofis.mp4' },
  { title: 'Avukatım — Tam Tanıtım Filmi', duration: '1:01', poster: '/posters/tanitim.jpg', video: '/videos/tanitim.mp4' },
]

const FEATURES = [
  {
    tag: 'UYAP ENTEGRASYONU', color: '#6c63ff', kind: 'uyap' as const, video: '',
    title: 'Dava Takibini Otomatikleştirin',
    desc: 'UYAP ile doğrudan bağlantı kurarak tüm dava ve duruşma bilgilerinizi otomatik senkronize edin. Duruşma tarihlerini kaçırmayın, mahkeme kararlarını anında görün.',
    items: ['30 dakikada bir otomatik senkronizasyon', 'Duruşma hatırlatma bildirimleri', 'UYAP belge indirme', 'Karar ve safahat takibi'],
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&q=80&auto=format&fit=crop',
  },
  {
    tag: 'BİRLEŞİK İLETİŞİM', color: '#10b981', kind: 'inbox' as const, video: '/videos/feat-iletisim.mp4',
    title: 'WhatsApp & Gmail Tek Ekranda',
    desc: 'Müvekkillerinizle tüm yazışmaları tek gelen kutusundan yönetin. WhatsApp mesajları ve e-postalar otomatik olarak ilgili davaya bağlanır.',
    items: ['Birleşik gelen kutusu', 'Otomatik müvekkil eşleştirme', 'Hazır şablon mesajlar', 'Okundu bilgisi takibi'],
    image: 'https://images.unsplash.com/photo-1577563908411-5077b6dc7624?w=900&q=80&auto=format&fit=crop',
  },
  {
    tag: 'DAVA YÖNETİMİ', color: '#f59e0b', kind: 'dash' as const, video: '/videos/feat-dava.mp4',
    title: 'Tüm Büronuz Tek Platformda',
    desc: 'Müvekkil bilgileri, dava dosyaları, belgeler, duruşma tutanakları ve zaman kayıtlarını profesyonel bir arayüzde yönetin. Ekibinizle gerçek zamanlı çalışın.',
    items: ['Müvekkil ve dava takibi', 'Belge yönetimi ve OCR', 'Zaman ve ücret takibi', 'Ekip iş birliği'],
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=900&q=80&auto=format&fit=crop',
  },
]

const TESTIMONIALS = [
  { name: 'Av. Selin Arslan', title: 'İstanbul Barosu', text: 'UYAP entegrasyonu sayesinde duruşma takibim tamamen otomatikleşti. Haftada 5 saat kazanıyorum.', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&q=80&auto=format&fit=crop&crop=face' },
  { name: 'Av. Mert Yıldız', title: 'Ankara Barosu', text: 'WhatsApp üzerinden müvekkil takibi çok kolay. Yanıt sürem %80 düştü, hiçbir mesajı kaçırmıyorum.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&q=80&auto=format&fit=crop&crop=face' },
  { name: 'Av. Zeynep Kaya', title: 'İzmir Barosu', text: '3 yıllık arşivimi birkaç saniyede arayabiliyorum. Belge yönetimi ve arama inanılmaz.', avatar: 'https://images.unsplash.com/photo-1589571894960-20bbe2828d0a?w=160&q=80&auto=format&fit=crop&crop=face' },
]

// Bireysel avukatlar için planlar (min ₺799)
const PLANS = [
  { name: 'Ücretsiz', price: '₺0', period: '/ay', desc: 'Bireysel başlangıç', features: ['1 Avukat', '10 Dava', '100 Belge', 'Mobil uygulama'], disabled: ['UYAP', 'WhatsApp/Gmail'], cta: 'Ücretsiz Başla', highlight: false },
  { name: 'Başlangıç', price: '₺799', period: '/ay', desc: 'Bireysel avukatlar', features: ['1 Avukat', '100 Dava', '1.000 Belge', 'UYAP okuma', '100 WhatsApp/ay'], disabled: ['Sınırsız WhatsApp'], cta: 'Hemen Başla', highlight: false },
  { name: 'Profesyonel', price: '₺1.499', period: '/ay', desc: 'Yoğun çalışan avukatlar', features: ['3 Avukat', 'Sınırsız Dava', 'Sınırsız Belge', 'UYAP tam erişim', '1.000 WhatsApp/ay', 'Yapay zeka asistan'], disabled: [], cta: 'En Popüler', highlight: true },
]

// Hukuk büroları için ayrı abonelikler (min ₺5.000)
const BURO_PLANS = [
  { name: 'Büro Başlangıç', price: '₺5.000', period: '/ay', desc: 'Küçük hukuk büroları', features: ['10 Avukat', 'Sınırsız Dava', 'Sınırsız Belge', 'UYAP tam erişim', '5.000 WhatsApp/ay', 'Ekip yönetimi', 'Rol & yetki'], disabled: [], cta: 'Büro Planı Başlat', highlight: false },
  { name: 'Büro Pro', price: '₺9.500', period: '/ay', desc: 'Büyüyen bürolar', features: ['25 Avukat', 'Sınırsız her şey', 'Öncelikli UYAP SLA', 'Sınırsız WhatsApp', 'Özel numara', 'Gelişmiş raporlama', '7/24 öncelikli destek'], disabled: [], cta: 'Büro Pro Başlat', highlight: true },
  { name: 'Kurumsal', price: 'Teklif', period: '', desc: 'Büyük şirketler & barolar', features: ['Sınırsız avukat', 'Özel UYAP SLA', 'Özel entegrasyon', 'Adanmış hesap yöneticisi', 'On-premise seçeneği'], disabled: [], cta: 'İletişime Geçin', highlight: false },
]

const FAQS = [
  { q: 'UYAP entegrasyonu için ne gerekiyor?', a: 'UYAP e-imza sertifikanız ve baro sicil numaranız yeterli. Kurulum 5 dakikada tamamlanır. Yardım videolarımız adım adım anlatır.' },
  { q: 'Verilerim güvende mi?', a: 'Tüm veriler AES-256 şifrelemesiyle saklanır. KVKK uyumlu altyapı ve Türkiye lokasyonlu sunucular kullanılır.' },
  { q: 'İstediğim zaman iptal edebilir miyim?', a: 'Evet. Aylık planlarda bir sonraki döneme kadar, yıllık planlarda 30 gün içinde tam iade.' },
  { q: 'Mobil uygulama var mı?', a: 'Evet, iOS ve Android uygulamalarımız tüm planlara dahildir ve ücretsiz indirilebilir.' },
]

type Plan = { name: string; price: string; period: string; desc: string; features: string[]; disabled: string[]; cta: string; highlight: boolean }

const DEMO_QUESTIONS = [
  'Kira tespit davasında izlenecek adımlar ve süreler',
  'İşçilik alacağı davasında kıdem-ihbar tazminatı hesap tablosu',
  'Boşanmada mal rejimi tasfiyesi: dilekçe ve deliller',
  'Menfi tespit davasında ispat yükü ve strateji',
]

export default function LandingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [activeVideo, setActiveVideo] = useState<string | null>(null)
  const [demoQ, setDemoQ] = useState('')
  const [demoA, setDemoA] = useState('')
  const [demoLoading, setDemoLoading] = useState(false)
  const [osName, setOsName] = useState<'windows' | 'mac' | 'linux' | 'other'>('other')
  const [deferredPrompt, setDeferredPrompt] = useState<BIPEvent | null>(null)
  const [installed, setInstalled] = useState(false)

  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    const ua = navigator.userAgent.toLowerCase()
    setOsName(ua.includes('win') ? 'windows' : ua.includes('mac') ? 'mac' : (ua.includes('linux') || ua.includes('x11')) ? 'linux' : 'other')
    const onPrompt = (e: Event) => { e.preventDefault(); setDeferredPrompt(e as BIPEvent) }
    window.addEventListener('beforeinstallprompt', onPrompt)
    const onInstalled = () => setInstalled(true)
    window.addEventListener('appinstalled', onInstalled)
    if (window.matchMedia('(display-mode: standalone)').matches) setInstalled(true)
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onInstalled) }
  }, [])

  async function installApp() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      setDeferredPrompt(null)
    } else if (osName === 'mac') {
      alert('macOS — Safari: Paylaş ▸ "Dock\'a Ekle". Chrome: adres çubuğundaki yükleme simgesine tıklayın.')
    } else {
      alert('Tarayıcı menüsünden (⋮) "Avukatım\'ı Yükle / Uygulamayı Yükle" seçeneğini kullanın. (Chrome veya Edge önerilir.)')
    }
  }

  async function askDemo(q: string) {
    const question = q.trim()
    if (!question || demoLoading) return
    setDemoLoading(true)
    setDemoA('')
    setDemoQ(question)
    try {
      const res = await fetch('/api/ai-search-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      if (res.status === 429 || res.status === 400 || res.status === 503) {
        const d = await res.json()
        setDemoA('⚠ ' + (d.error ?? 'Hata'))
        return
      }
      if (!res.body) throw new Error('yanıt yok')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += dec.decode(value, { stream: true })
        setDemoA(acc)
      }
    } catch {
      setDemoA('⚠ Şu an yanıt veremiyorum, lütfen tekrar deneyin.')
    } finally {
      setDemoLoading(false)
    }
  }

  const renderPlan = (plan: Plan) => (
    <div key={plan.name} className="la-reveal la-plan-anim" style={{ position: 'relative', background: plan.highlight ? 'linear-gradient(160deg,rgba(108,99,255,0.12),rgba(168,85,247,0.08))' : 'rgba(255,255,255,0.025)', border: plan.highlight ? '1px solid rgba(108,99,255,0.5)' : '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 24, display: 'flex', flexDirection: 'column', boxShadow: plan.highlight ? '0 0 60px rgba(108,99,255,0.15)' : 'none' }}>
      {plan.highlight && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 16px', borderRadius: 100, whiteSpace: 'nowrap' }}>EN POPÜLER</div>}
      <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 4 }}>{plan.name}</div>
      <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 16 }}>{plan.desc}</div>
      <div style={{ marginBottom: 20 }}>
        <span style={{ fontSize: 34, fontWeight: 800, color: '#f1f5f9' }}>{plan.price}</span>
        <span style={{ fontSize: 14, color: '#6b7280' }}>{plan.period}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
        {plan.features.map(ft => <div key={ft} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#9ca3af' }}><span style={{ color: '#6c63ff' }}>✓</span>{ft}</div>)}
        {plan.disabled.map(ft => <div key={ft} style={{ display: 'flex', gap: 8, fontSize: 12, color: '#374151' }}><span>✕</span>{ft}</div>)}
      </div>
      <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 12, background: plan.highlight ? 'linear-gradient(135deg,#6c63ff,#a855f7)' : 'rgba(255,255,255,0.06)', border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>{plan.cta}</Link>
    </div>
  )

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", background: '#07090f', color: '#e8eaf0', overflowX: 'hidden' }}>
      <LandingStyles />
      <LandingReveal />

      {/* ── NAV ── */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px,5vw,48px)', height: 64, borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(7,9,15,0.95)', backdropFilter: 'blur(16px)', zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22 }}>⚖️</span>
            <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '-0.5px' }}>Avukat<span style={{ color: '#6c63ff' }}>ım</span></span>
          </div>
          <div className="nav-links" style={{ display: 'flex', gap: 4 }}>
            {[['AI Asistan', '#ai-demo'], ['Özellikler', '#features'], ['Videolar', '#videos'], ['Fiyatlar', '#pricing'], ['SSS', '#faq']].map(([l, h]) => (
              <a key={l} href={h} className="nav-link" style={{ padding: '6px 14px', borderRadius: 8, color: '#9ca3af', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>{l}</a>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/login" className="nav-link" style={{ padding: '8px 18px', borderRadius: 8, color: '#9ca3af', textDecoration: 'none', fontSize: 14 }}>Giriş</Link>
          <Link href="/register" className="la-btn-anim la-btn-pulse" style={{ padding: '8px 18px', borderRadius: 8, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Ücretsiz Başla</Link>
        </div>
      </nav>

      {/* ═══════════ BÖLÜM 1 — HERO + VİDEO ═══════════ */}
      <section style={{ position: 'relative', minHeight: '92vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 24px', maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
        <HeroBackdrop />
        <div style={{ position: 'relative', zIndex: 1, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 100, padding: '5px 14px', fontSize: 13, color: '#a89fff', marginBottom: 24 }}>
          🚀 Türkiye'nin #1 Hukuk Bürosu Platformu
        </div>
        <h1 style={{ fontSize: 'clamp(34px,6vw,68px)', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-2px', margin: '0 0 20px' }}>
          Hukuk Büronuzu<br /><span style={{ background: 'linear-gradient(135deg,#6c63ff,#a855f7,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Dijitalleştirin</span>
        </h1>
        <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: '#8892a4', lineHeight: 1.7, maxWidth: 560, margin: '0 auto 32px' }}>
          UYAP ile otomatik dava takibi, WhatsApp & Gmail ile müvekkil iletişimi, yapay zeka destekli hukuki araştırma — tek platformda.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
          <Link href="/register" className="la-btn-anim la-btn-pulse" style={{ padding: '14px 30px', borderRadius: 12, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700, boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }}>14 Gün Ücretsiz Dene →</Link>
          <Link href="/demo" className="la-btn-anim" style={{ padding: '14px 30px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', color: '#c8d0dc', textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>🖥 Demoyu İncele</Link>
        </div>

        {/* HERO VİDEO */}
        <div style={{ width: '100%', maxWidth: 880, borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', boxShadow: '0 40px 120px rgba(0,0,0,0.6)', position: 'relative', aspectRatio: '16/9', background: '#0d0f1a' }}>
          <video
            src={HERO_VIDEO}
            poster={HERO_POSTER}
            controls
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: 8, padding: '4px 12px', fontSize: 12, color: '#cbd5e1', pointerEvents: 'none' }}>
            ▶ 60 saniyelik tanıtım
          </div>
        </div>
        <p style={{ marginTop: 18, fontSize: 12, color: '#4b5563' }}>Kredi kartı gerekmez · KVKK uyumlu · 2.400+ avukat kullanıyor</p>
        </div>
      </section>

      {/* ═══════════ ÜST KUTUCUKLAR (hover'da içi dolar) ═══════════ */}
      <QuickFeatures />

      {/* ═══════════ İSTATİSTİK ═══════════ */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '40px 24px', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24, textAlign: 'center' }}>
          {[['2.400+', 'Aktif Avukat'], ['180K+', 'Yönetilen Dava'], ['99.9%', 'Uptime'], ['4.9/5', 'Puan']].map(([v, l]) => (
            <div key={l} className="la-reveal">
              <div style={{ fontSize: 'clamp(24px,4vw,34px)', fontWeight: 800, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{v}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ AI DEMO — ziyaretçiler soru sorsun ═══════════ */}
      <section id="ai-demo" style={{ padding: '90px 24px', background: 'radial-gradient(900px 500px at 50% -10%, rgba(124,58,237,0.18), transparent), linear-gradient(180deg,#07090f,#0c0a1a)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 100, padding: '5px 14px', fontSize: 13, color: '#c4b5fd', marginBottom: 16 }}>🧠 Yapay Zeka · Ücretsiz Deneyin</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 10px' }}>Hukuki Sorunuzu <span style={{ background: 'linear-gradient(135deg,#a855f7,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Hemen Sorun</span></h2>
            <p style={{ color: '#8892a4', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>Kaydolmadan deneyin — Türk hukuku eğitimli yapay zeka asistanımız saniyeler içinde yanıtlasın.</p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.22)', borderRadius: 20, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
            <form onSubmit={e => { e.preventDefault(); askDemo(demoQ) }} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input value={demoQ} onChange={e => setDemoQ(e.target.value)} placeholder="Örn: Kira artış oranı en fazla ne kadar olabilir?" maxLength={500} disabled={demoLoading}
                style={{ flex: 1, minWidth: 220, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '13px 16px', color: '#fff', fontSize: 15, outline: 'none' }} />
              <button type="submit" disabled={demoLoading || !demoQ.trim()} style={{ padding: '13px 26px', borderRadius: 12, border: 'none', background: demoLoading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: demoLoading ? 'default' : 'pointer' }}>{demoLoading ? 'Yanıtlıyor…' : 'Sor →'}</button>
            </form>

            {!demoA && !demoLoading && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                {DEMO_QUESTIONS.map(q => (
                  <button key={q} onClick={() => askDemo(q)} style={{ fontSize: 12.5, color: '#c4b5fd', background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', borderRadius: 100, padding: '6px 13px', cursor: 'pointer' }}>{q}</button>
                ))}
              </div>
            )}

            {(demoA || demoLoading) && (
              <div style={{ marginTop: 16, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px', fontSize: 14.5, lineHeight: 1.7, color: '#d8d4ea', whiteSpace: 'pre-wrap', maxHeight: 360, overflowY: 'auto' }}>
                {demoA || 'Düşünüyor…'}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link href="/register" style={{ display: 'inline-block', padding: '13px 30px', borderRadius: 12, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700 }}>Tüm Özellikler İçin Ücretsiz Kaydolun →</Link>
            <p style={{ fontSize: 12, color: '#5b5380', marginTop: 10 }}>Demo: saatte 5 soru · Üyelikte sınırsız + dosyalarınıza özel analiz</p>
          </div>
        </div>
      </section>

      {/* ═══════════ BÖLÜM 2,3,4 — ÖZELLİKLER (her biri tam sayfa, alt alta) ═══════════ */}
      <div id="features">
        {FEATURES.map((f, i) => (
          <section key={f.tag} style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', padding: '80px 24px', borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
            <div className="feature-row" style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'clamp(32px,6vw,72px)', alignItems: 'center', width: '100%' }}>
              <div className="la-stagger" style={{ order: i % 2 === 0 ? 0 : 1 }}>
                <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, color: f.color, letterSpacing: '1.5px', marginBottom: 16 }}>{f.tag}</div>
                <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 18, color: '#f1f5f9', lineHeight: 1.15 }}>{f.title}</h2>
                <p style={{ color: '#8892a4', lineHeight: 1.75, fontSize: 16, marginBottom: 28 }}>{f.desc}</p>
                <div className="la-stagger" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {f.items.map(it => (
                    <div key={it} className="la-fcard">
                      <span className="la-fic" style={{ background: `linear-gradient(135deg, ${f.color}, #a855f7)` }}>✓</span>
                      {it}
                    </div>
                  ))}
                </div>
              </div>
              <div className="la-reveal d1" style={{ order: i % 2 === 0 ? 1 : 0, position: 'relative' }}>
                {f.video ? (
                  <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', aspectRatio: '4/3' }}>
                    <video src={f.video} autoPlay muted loop playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg,${f.color}22,transparent 55%)`, pointerEvents: 'none' }} />
                  </div>
                ) : (
                  <FeatureVisual kind={f.kind} />
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* ═══════════ ANİMASYONLU BÖLÜMLER — DÜNYA / İNSANLAR / DURUŞMA ═══════════ */}
      <GlobeSection />
      <PeopleSection />
      <CourtroomSection />

      {/* ═══════════ BÖLÜM 5 — ANLATIM VİDEOLARI ═══════════ */}
      <section id="videos" style={{ padding: '90px 24px', background: 'linear-gradient(180deg,#07090f,#0d0b1a,#07090f)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff', letterSpacing: '1.5px', marginBottom: 12 }}>NASIL ÇALIŞIR?</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 12px' }}>Anlatım Videoları</h2>
            <p style={{ color: '#6b7280', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>Uygulamanın her özelliğini dakikalar içinde öğrenin</p>
          </div>
          <div className="video-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 20 }}>
            {TUTORIALS.map(t => (
              <button key={t.title} onClick={() => setActiveVideo(t.video)} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden', cursor: 'pointer', textAlign: 'left', padding: 0, color: 'inherit' }}>
                <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden' }}>
                  <img src={t.poster} alt={t.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(7,9,15,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(108,99,255,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 12px rgba(108,99,255,0.18)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M5 3l14 9-14 9V3z" /></svg>
                    </div>
                  </div>
                  <span style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.75)', color: '#fff', fontSize: 12, padding: '2px 8px', borderRadius: 6 }}>{t.duration}</span>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#e8eaf0' }}>{t.title}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>İzlemek için tıklayın →</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BÖLÜM 6 — REFERANSLAR ═══════════ */}
      <section style={{ padding: '90px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff', letterSpacing: '1.5px', marginBottom: 12 }}>BAŞARI HİKAYELERİ</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Avukatlar Ne Diyor?</h2>
          </div>
          <div className="testi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="la-reveal la-tcard" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 28 }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(i => <span key={i} style={{ color: '#f59e0b', fontSize: 14 }}>★</span>)}
                </div>
                <p style={{ color: '#9ca3af', lineHeight: 1.7, fontSize: 14, marginBottom: 20 }}>&quot;{t.text}&quot;</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={t.avatar} alt={t.name} loading="lazy" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(108,99,255,0.3)' }} />
                  <div>
                    <div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>{t.name}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{t.title}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BÖLÜM 7 — FİYATLANDIRMA ═══════════ */}
      <section id="pricing" style={{ padding: '90px 24px', background: 'rgba(255,255,255,0.015)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff', letterSpacing: '1.5px', marginBottom: 12 }}>FİYATLANDIRMA</div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 12px' }}>Her Büroya Uygun Plan</h2>
            <p style={{ color: '#6b7280', fontSize: 16 }}>14 gün ücretsiz deneyin. Kredi kartı gerekmez.</p>
          </div>

          {/* Bireysel avukatlar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <span style={{ fontSize: 18 }}>👤</span>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Bireysel Avukatlar</h3>
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <div className="price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {PLANS.map(renderPlan)}
          </div>

          {/* Hukuk büroları */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '48px 0 20px' }}>
            <span style={{ fontSize: 18 }}>🏛️</span>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>Hukuk Büroları</h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#a89fff', background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 100, padding: '3px 12px' }}>Ekip & çoklu avukat</span>
            <span style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>
          <div className="price-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
            {BURO_PLANS.map(renderPlan)}
          </div>
          <div style={{ marginTop: 32, background: 'rgba(108,99,255,0.06)', border: '1px solid rgba(108,99,255,0.15)', borderRadius: 16, padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 26 }}>🇹🇷</span>
            <div><div style={{ fontWeight: 700, color: '#e2e8f0', fontSize: 14 }}>Türkiye için PayTR, Global için Stripe</div><div style={{ color: '#6b7280', fontSize: 13, marginTop: 4 }}>Türk avukatlar için TRY cinsinden 3D Secure ödeme. Uluslararası kullanıcılar için USD/EUR.</div></div>
          </div>
        </div>
      </section>

      {/* ═══════════ BÖLÜM 8 — SSS ═══════════ */}
      <section id="faq" style={{ padding: '90px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff', letterSpacing: '1.5px', marginBottom: 12 }}>SSS</div>
            <h2 style={{ fontSize: 'clamp(26px,4vw,36px)', fontWeight: 800, letterSpacing: '-1px', margin: 0 }}>Sık Sorulan Sorular</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {FAQS.map((faq, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden' }}>
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} style={{ width: '100%', padding: '18px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'none', border: 'none', color: '#e2e8f0', fontSize: 15, fontWeight: 600, cursor: 'pointer', textAlign: 'left' }}>
                  {faq.q}
                  <span style={{ color: '#6c63ff', fontSize: 18, flexShrink: 0, marginLeft: 16, transform: openFaq === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.2s' }}>+</span>
                </button>
                {openFaq === i && <div style={{ padding: '0 24px 18px', fontSize: 14, color: '#8892a4', lineHeight: 1.7 }}>{faq.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ BÖLÜM 9 — CTA ═══════════ */}
      <section style={{ padding: '90px 24px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', background: 'linear-gradient(135deg,rgba(108,99,255,0.12),rgba(168,85,247,0.08))', border: '1px solid rgba(108,99,255,0.25)', borderRadius: 28, padding: 'clamp(40px,6vw,64px) 40px' }}>
          <video src="/videos/logo-acilis.mp4" autoPlay muted loop playsInline style={{ width: 'min(240px,68%)', display: 'block', margin: '0 auto 20px', borderRadius: 16 }} />
          <h2 style={{ fontSize: 'clamp(28px,4vw,38px)', fontWeight: 800, letterSpacing: '-1px', marginBottom: 14 }}>Hemen Başlayın</h2>
          <p style={{ color: '#8892a4', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>14 gün ücretsiz. Kredi kartı gerekmez. 5 dakikada kurulum.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700, boxShadow: '0 8px 32px rgba(108,99,255,0.4)' }}>Ücretsiz Hesap Aç →</Link>
            <Link href="/demo" style={{ padding: '14px 32px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.15)', color: '#c8d0dc', textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>Önce Demoyu Gör</Link>
          </div>
        </div>
      </section>

      {/* ═══════════ BÖLÜM 9.5 — MASAÜSTÜ UYGULAMASI ═══════════ */}
      <section id="masaustu" style={{ padding: '80px 24px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff', letterSpacing: '1.5px', marginBottom: 12 }}>BİLGİSAYARINIZA KURUN</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 14px' }}>Masaüstü Uygulaması</h2>
          <p style={{ color: '#8892a4', fontSize: 16, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 14px' }}>Avukatım&apos;ı bir program gibi bilgisayarınıza kurun — ayrı pencere, hızlı erişim, masaüstü bildirimleri. Tarayıcı sekmesi aramaya son.</p>
          {installed && <div style={{ display: 'inline-block', fontSize: 13, color: '#6ee7b7', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 100, padding: '6px 16px', marginBottom: 20 }}>✓ Uygulama bu cihaza kurulu</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 16, marginTop: 24 }}>
            {([
              { key: 'windows', icon: '🪟', name: 'Windows', sub: 'Windows 10 / 11 · .exe', url: 'https://github.com/semihkl1971-code/avukat-app/releases/download/desktop-v1.0.1/Avukatim.Setup.1.0.0.exe' },
              { key: 'mac', icon: '🍎', name: 'macOS', sub: 'macOS 12+ · Apple Silicon · .dmg', url: 'https://github.com/semihkl1971-code/avukat-app/releases/download/desktop-v1.0.1/Avukatim-1.0.0-arm64.dmg' },
              { key: 'linux', icon: '🐧', name: 'Linux', sub: 'Evrensel · .AppImage', url: 'https://github.com/semihkl1971-code/avukat-app/releases/download/desktop-v1.0.1/Avukatim-1.0.0.AppImage' },
            ] as const).map(o => {
              const current = osName === o.key
              return (
                <div key={o.key} style={{ position: 'relative', background: current ? 'linear-gradient(160deg,rgba(108,99,255,0.14),rgba(168,85,247,0.08))' : 'rgba(255,255,255,0.03)', border: current ? '1px solid rgba(108,99,255,0.5)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28, textAlign: 'center', boxShadow: current ? '0 0 50px rgba(108,99,255,0.15)' : 'none' }}>
                  {current && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>Sisteminiz</div>}
                  <div style={{ fontSize: 48, marginBottom: 12 }}>{o.icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9' }}>{o.name}</div>
                  <div style={{ fontSize: 12.5, color: '#8892a4', margin: '6px 0 18px' }}>{o.sub}</div>
                  <a href={o.url} style={{ display: 'block', width: '100%', padding: '12px 0', borderRadius: 12, border: 'none', background: current ? 'linear-gradient(135deg,#6c63ff,#a855f7)' : 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: 'pointer', textDecoration: 'none', boxShadow: current ? '0 8px 24px rgba(108,99,255,0.35)' : 'none' }}>
                    ⬇ İndir
                  </a>
                </div>
              )
            })}
          </div>
          <p style={{ fontSize: 12.5, color: '#5b5380', marginTop: 18, lineHeight: 1.6 }}>
            💡 Sürüm 1.0.1 · ücretsiz. Windows&apos;ta &quot;Bilinmeyen yayıncı&quot; uyarısı çıkarsa &quot;Diğer bilgiler ▸ Yine de çalıştır&quot; deyin (uygulama imzasızdır, güvenlidir). Tarayıcıdan hızlı erişim için <button onClick={installApp} style={{ background: 'none', border: 'none', color: '#a89fff', cursor: 'pointer', textDecoration: 'underline', fontSize: 12.5, padding: 0 }}>uygulama olarak da yükleyebilirsiniz</button>.
          </p>
        </div>
      </section>

      {/* ═══════════ BÖLÜM 10 — MOBİL UYGULAMA ═══════════ */}
      <section id="mobil" style={{ padding: '70px 24px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.015)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#6c63ff', letterSpacing: '1.5px', marginBottom: 12 }}>HER YERDE YANINIZDA</div>
          <h2 style={{ fontSize: 'clamp(26px,4vw,38px)', fontWeight: 800, letterSpacing: '-1px', margin: '0 0 14px' }}>Mobil Uygulamayı İndirin</h2>
          <p style={{ color: '#8892a4', fontSize: 16, lineHeight: 1.7, maxWidth: 520, margin: '0 auto 8px' }}>iOS ve Android için Avukatım uygulaması tüm planlara dahildir. Davalarınızı, mesajlarınızı ve duruşmalarınızı cebinizden takip edin.</p>
          <PhoneMockup />
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginTop: 24 }}>
            {/* Android — doğrudan APK (şimdi çalışıyor) */}
            <a href="https://expo.dev/artifacts/eas/ZDUrcr_ndI77qRpa6gTqBIku34AYvGBqExoU_lOQi6I.apk" style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'linear-gradient(135deg,#0d8b3d,#1ec45f)', border: '1px solid rgba(46,196,95,0.5)', borderRadius: 12, padding: '11px 22px', textDecoration: 'none', minWidth: 210, boxShadow: '0 8px 24px rgba(30,196,95,0.25)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><path d="M17.6 9.48l1.84-3.18a.4.4 0 10-.69-.4l-1.86 3.23a11.4 11.4 0 00-9.78 0L5.25 5.9a.4.4 0 10-.69.4L6.4 9.48A10.8 10.8 0 001 18h22a10.8 10.8 0 00-5.4-8.52zM7 15.25a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5zm10 0a1.25 1.25 0 110-2.5 1.25 1.25 0 010 2.5z"/></svg>
              <span style={{ textAlign: 'left' }}><span style={{ display: 'block', fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>Android için</span><span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: '#fff' }}>APK İndir</span></span>
            </a>
            {/* App Store — yakında (iOS sürümü henüz yayında değil) */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '11px 22px', minWidth: 210, opacity: 0.65 }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#9ca3af"><path d="M17.05 12.04c-.03-2.6 2.13-3.85 2.23-3.91-1.22-1.78-3.11-2.02-3.78-2.05-1.61-.16-3.14.95-3.96.95-.81 0-2.07-.93-3.41-.9-1.75.03-3.37 1.02-4.27 2.59-1.82 3.16-.47 7.84 1.31 10.41.87 1.26 1.9 2.67 3.26 2.62 1.31-.05 1.8-.85 3.39-.85 1.58 0 2.03.85 3.41.82 1.41-.02 2.3-1.28 3.16-2.55 1-1.46 1.41-2.87 1.43-2.95-.03-.01-2.74-1.05-2.77-4.17l.27-.36zM14.5 4.6c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.28.69-3.02 1.56-.66.77-1.24 2-1.08 3.18 1.15.09 2.32-.58 3.03-1.45z"/></svg>
              <span style={{ textAlign: 'left' }}><span style={{ display: 'block', fontSize: 10, color: '#9ca3af' }}>App Store</span><span style={{ display: 'block', fontSize: 17, fontWeight: 700, color: '#cbd5e1' }}>Yakında</span></span>
            </div>
          </div>
          <p style={{ marginTop: 16, fontSize: 12, color: '#4b5563' }}>📲 Android 8+ için APK ile doğrudan kurulum · iOS sürümü yakında · Türk hukuku için optimize</p>
          <div className="la-reveal" style={{ maxWidth: 540, margin: '28px auto 0', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)', aspectRatio: '16/9' }}>
            <video src="/videos/mobil-kullanim.mp4" autoPlay muted loop playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '56px clamp(20px,5vw,48px) 32px', background: '#05060b' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr', gap: 40 }}>
            {/* Marka + iletişim */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 22 }}>⚖️</span>
                <span style={{ fontWeight: 800, fontSize: 18, color: '#e2e8f0' }}>Avukat<span style={{ color: '#6c63ff' }}>ım</span></span>
              </div>
              <p style={{ color: '#6b7280', fontSize: 13, lineHeight: 1.7, marginBottom: 16 }}>Türk avukatlar için UYAP entegrasyonlu hukuk bürosu yönetim platformu.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 13, color: '#9ca3af' }}>
                <a href="mailto:destek@avukatım.com" style={{ color: '#9ca3af', textDecoration: 'none' }}>✉️ destek@avukatım.com</a>
                <a href="tel:+908502420000" style={{ color: '#9ca3af', textDecoration: 'none' }}>📞 0850 242 00 00</a>
                <span>📍 Maslak, Sarıyer / İstanbul</span>
                <span>⚖️ KEP: avukatim@hs01.kep.tr</span>
              </div>
            </div>

            {/* Ürün */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.5px', marginBottom: 14 }}>ÜRÜN</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[['Özellikler', '#features'], ['Videolar', '#videos'], ['Fiyatlar', '#pricing'], ['Masaüstü Uygulaması', '#masaustu'], ['Mobil Uygulama', '#mobil'], ['Demo', '/demo']].map(([l, h]) => (
                  <a key={l} href={h} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>{l}</a>
                ))}
              </div>
            </div>

            {/* Yasal & Prosedür */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.5px', marginBottom: 14 }}>YASAL & PROSEDÜR</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                {[
                  ['KVKK Aydınlatma Metni', '/yasal/kvkk'],
                  ['Gizlilik Politikası', '/yasal/gizlilik'],
                  ['Kullanım Şartları', '/yasal/kullanim-sartlari'],
                  ['Çerez Politikası', '/yasal/cerez'],
                  ['Mesafeli Satış Sözleşmesi', '/yasal/mesafeli-satis'],
                  ['İptal & İade Prosedürü', '/yasal/iptal-iade'],
                ].map(([l, h]) => (
                  <a key={l} href={h} style={{ color: '#6b7280', fontSize: 13, textDecoration: 'none' }}>{l}</a>
                ))}
              </div>
            </div>

            {/* Güvenlik & Sertifikalar */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#e2e8f0', letterSpacing: '0.5px', marginBottom: 14 }}>GÜVENLİK & SERTİFİKA</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['🔒 256-bit SSL', '🛡️ KVKK Uyumlu', '✅ ISO 27001', '🇹🇷 Yerli Sunucu', '🔑 e-İmza', '📋 KEP', '⚖️ UYAP Onaylı', '🏛️ ETBİS Kayıtlı'].map(b => (
                  <span key={b} style={{ fontSize: 11, color: '#a89fff', background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 8, padding: '5px 9px' }}>{b}</span>
                ))}
              </div>
              <p style={{ color: '#4b5563', fontSize: 11, lineHeight: 1.6, marginTop: 14 }}>Verileriniz Türkiye lokasyonlu sunucularda AES-256 ile şifrelenir. KVKK ve 6698 sayılı kanuna tam uyumludur.</p>
            </div>
          </div>

          <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
            <span style={{ color: '#4b5563', fontSize: 13 }}>© 2026 Avukatım Yazılım A.Ş. · Tüm hakları saklıdır.</span>
            <span style={{ color: '#4b5563', fontSize: 13 }}>🇹🇷 Türkiye'de tasarlandı · Mersis No: 0000-0000-0000-0000</span>
          </div>
        </div>
      </footer>

      {/* ── VİDEO MODAL ── */}
      {activeVideo && (
        <div onClick={() => setActiveVideo(null)} style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 900, position: 'relative' }}>
            <button onClick={() => setActiveVideo(null)} style={{ position: 'absolute', top: -42, right: 0, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer' }}>✕</button>
            <video src={activeVideo} controls autoPlay playsInline style={{ width: '100%', borderRadius: 14, border: '1px solid rgba(255,255,255,0.15)', display: 'block', aspectRatio: '16/9', background: '#000' }} />
          </div>
        </div>
      )}

      <style>{`
        html { scroll-behavior: smooth; }
        .nav-link { position: relative; transition: color .2s ease, background-color .2s ease; }
        .nav-link:hover { color: #fff !important; background: rgba(255,255,255,0.06); }
        .nav-link::after { content: ''; position: absolute; left: 14px; right: 14px; bottom: 2px; height: 2px; border-radius: 2px; background: linear-gradient(90deg,#6c63ff,#a855f7); transform: scaleX(0); transform-origin: left; transition: transform .25s ease; }
        .nav-link:hover::after { transform: scaleX(1); }
        @media (max-width: 860px) {
          .nav-links { display: none !important; }
          .feature-row { grid-template-columns: 1fr !important; }
          .feature-row > div { order: 0 !important; }
          .video-grid, .testi-grid, .price-grid { grid-template-columns: 1fr !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 560px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 560px) {
          section[id] > div > div:first-child { }
        }
      `}</style>
    </div>
  )
}
