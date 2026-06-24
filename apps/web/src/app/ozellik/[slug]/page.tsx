import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Landmark, MessageSquare, Sparkles, Folder, Wallet, ShieldCheck,
  ArrowLeft, Check, ArrowRight,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { GUIDES, GUIDE_MAP, type FeatureGuide } from '@/lib/feature-guides'

const ICONS: Record<string, LucideIcon> = {
  landmark: Landmark, 'message-square': MessageSquare, sparkles: Sparkles,
  folder: Folder, wallet: Wallet, 'shield-check': ShieldCheck,
}

export function generateStaticParams() {
  return GUIDES.map(g => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const g = GUIDE_MAP[slug]
  if (!g) return { title: 'Özellik — Avukatım' }
  return { title: `${g.title} — Avukatım`, description: g.summary }
}

const hex = (c: string, a: number) => {
  const n = parseInt(c.slice(1), 16)
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`
}

// ── "Nasıl Çalışır" — özelliğe göre farklı düzen ──
function HowItWorks({ g }: { g: FeatureGuide }) {
  if (g.variant === 'cards') {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 16 }}>
        {g.howItWorks.map((s, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 22, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -10, fontSize: 90, fontWeight: 900, color: hex(g.color, 0.08), lineHeight: 1 }}>{i + 1}</div>
            <div style={{ position: 'relative' }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: hex(g.color, 0.16), color: g.color, display: 'grid', placeItems: 'center', fontWeight: 800, marginBottom: 12 }}>{i + 1}</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9', marginBottom: 6 }}>{s.t}</div>
              <div style={{ fontSize: 14, color: '#9aa3b4', lineHeight: 1.6 }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (g.variant === 'split') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {g.howItWorks.map((s, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: i % 2 ? 'row-reverse' : 'row', alignItems: 'center', gap: 20, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 18, padding: '20px 22px' }}>
            <div style={{ flexShrink: 0, width: 58, height: 58, borderRadius: 16, background: `linear-gradient(135deg,${g.color},${g.color2})`, display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 900, color: '#fff', boxShadow: `0 8px 24px ${hex(g.color, 0.4)}` }}>{i + 1}</div>
            <div style={{ flex: 1, textAlign: i % 2 ? 'right' : 'left' }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: '#f1f5f9', marginBottom: 5 }}>{s.t}</div>
              <div style={{ fontSize: 14.5, color: '#9aa3b4', lineHeight: 1.65 }}>{s.d}</div>
            </div>
          </div>
        ))}
      </div>
    )
  }
  // timeline
  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      <div style={{ position: 'absolute', left: 11, top: 6, bottom: 6, width: 2, background: `linear-gradient(${g.color},${hex(g.color2, 0.2)})` }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {g.howItWorks.map((s, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: -28, top: 2, width: 24, height: 24, borderRadius: '50%', background: g.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 800, boxShadow: `0 0 0 4px ${hex(g.color, 0.18)}` }}>{i + 1}</div>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#f1f5f9', marginBottom: 4 }}>{s.t}</div>
            <div style={{ fontSize: 14.5, color: '#9aa3b4', lineHeight: 1.65, maxWidth: 620 }}>{s.d}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const g = GUIDE_MAP[slug]
  if (!g) notFound()
  const Icon = ICONS[g.icon] ?? Sparkles
  const others = GUIDES.filter(x => x.slug !== g.slug)

  return (
    <div style={{ background: '#07090f', color: '#e8eaf0', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Üst bar */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 clamp(20px,5vw,48px)', height: 62, borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, background: 'rgba(7,9,15,0.92)', backdropFilter: 'blur(14px)', zIndex: 50 }}>
        <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: '#cbd5e1', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          <ArrowLeft size={17} /> Ana Sayfa
        </Link>
        <Link href="/register" style={{ padding: '8px 18px', borderRadius: 10, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', textDecoration: 'none', fontSize: 13.5, fontWeight: 700 }}>Ücretsiz Dene →</Link>
      </nav>

      {/* HERO — aksan rengi özelliğe göre */}
      <header style={{ position: 'relative', overflow: 'hidden', padding: 'clamp(48px,8vw,90px) 24px clamp(40px,6vw,64px)', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', background: `radial-gradient(900px 420px at 50% -10%, ${hex(g.color, 0.22)}, transparent 70%)` }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          <div style={{ width: 70, height: 70, borderRadius: 20, background: `linear-gradient(135deg,${g.color},${g.color2})`, display: 'grid', placeItems: 'center', margin: '0 auto 22px', boxShadow: `0 16px 50px ${hex(g.color, 0.45)}` }}>
            <Icon size={34} color="#fff" />
          </div>
          <div style={{ display: 'inline-block', fontSize: 12, fontWeight: 700, letterSpacing: '1.5px', color: g.color, marginBottom: 14 }}>{g.tag}</div>
          <h1 style={{ fontSize: 'clamp(30px,5.5vw,52px)', fontWeight: 900, letterSpacing: '-1.5px', lineHeight: 1.08, margin: '0 0 18px' }}>{g.title}</h1>
          <p style={{ fontSize: 'clamp(16px,2.2vw,20px)', color: '#aeb6c6', lineHeight: 1.7, maxWidth: 680, margin: '0 auto' }}>{g.summary}</p>
        </div>
      </header>

      <main style={{ maxWidth: 920, margin: '0 auto', padding: 'clamp(40px,6vw,68px) 24px' }}>
        {/* Nedir */}
        <section style={{ marginBottom: 'clamp(44px,7vw,72px)' }}>
          <h2 style={{ fontSize: 'clamp(22px,3.4vw,30px)', fontWeight: 800, letterSpacing: '-0.6px', margin: '0 0 14px' }}>Nedir?</h2>
          <p style={{ fontSize: 17, color: '#c4ccdb', lineHeight: 1.8 }}>{g.whatIs}</p>
        </section>

        {/* Nasıl Çalışır — varyantlı */}
        <section style={{ marginBottom: 'clamp(44px,7vw,72px)' }}>
          <h2 style={{ fontSize: 'clamp(22px,3.4vw,30px)', fontWeight: 800, letterSpacing: '-0.6px', margin: '0 0 22px' }}>Nasıl Çalışır?</h2>
          <HowItWorks g={g} />
        </section>

        {/* Nasıl Kullanılır — adım adım */}
        <section style={{ marginBottom: 'clamp(44px,7vw,72px)' }}>
          <h2 style={{ fontSize: 'clamp(22px,3.4vw,30px)', fontWeight: 800, letterSpacing: '-0.6px', margin: '0 0 8px' }}>Nasıl Kullanılır?</h2>
          <p style={{ color: '#8892a4', fontSize: 15, margin: '0 0 22px' }}>Birkaç adımda başlayın:</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(230px,1fr))', gap: 14 }}>
            {g.howToUse.map((s, i) => (
              <div key={i} style={{ background: `linear-gradient(160deg,${hex(g.color, 0.08)},rgba(255,255,255,0.02))`, border: `1px solid ${hex(g.color, 0.2)}`, borderRadius: 16, padding: 20 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 8, background: g.color, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 800 }}>{i + 1}</span>
                  <span style={{ fontWeight: 700, fontSize: 15.5, color: '#f1f5f9' }}>{s.t}</span>
                </div>
                <div style={{ fontSize: 14, color: '#9aa3b4', lineHeight: 1.6 }}>{s.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Öne Çıkanlar */}
        <section style={{ marginBottom: 'clamp(44px,7vw,72px)' }}>
          <h2 style={{ fontSize: 'clamp(22px,3.4vw,30px)', fontWeight: 800, letterSpacing: '-0.6px', margin: '0 0 22px' }}>Öne Çıkanlar</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14 }}>
            {g.highlights.map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 7, background: hex(g.color, 0.16), color: g.color, display: 'grid', placeItems: 'center' }}><Check size={15} /></div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{h.t}</div>
                  <div style={{ fontSize: 13, color: '#8892a4', marginTop: 2 }}>{h.d}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section style={{ textAlign: 'center', background: `linear-gradient(160deg,${hex(g.color, 0.14)},rgba(255,255,255,0.02))`, border: `1px solid ${hex(g.color, 0.25)}`, borderRadius: 24, padding: 'clamp(32px,5vw,48px)', marginBottom: 'clamp(44px,7vw,68px)' }}>
          <h2 style={{ fontSize: 'clamp(22px,3.4vw,32px)', fontWeight: 800, letterSpacing: '-0.6px', margin: '0 0 12px' }}>Hemen denemeye başlayın</h2>
          <p style={{ color: '#aeb6c6', fontSize: 16, margin: '0 auto 26px', maxWidth: 460 }}>14 gün ücretsiz. Kredi kartı gerekmez. 5 dakikada kurulum.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{ padding: '14px 30px', borderRadius: 12, background: `linear-gradient(135deg,${g.color},${g.color2})`, color: '#fff', textDecoration: 'none', fontSize: 15, fontWeight: 700, boxShadow: `0 10px 30px ${hex(g.color, 0.4)}` }}>Ücretsiz Başla →</Link>
            <Link href="/login" style={{ padding: '14px 30px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.16)', color: '#e2e8f0', textDecoration: 'none', fontSize: 15, fontWeight: 600 }}>Giriş Yap</Link>
          </div>
        </section>

        {/* Diğer özellikler */}
        <section>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px', color: '#cbd5e1' }}>Diğer özellikler</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
            {others.map(o => {
              const OIcon = ICONS[o.icon] ?? Sparkles
              return (
                <Link key={o.slug} href={`/ozellik/${o.slug}`} className="guide-card" style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px', textDecoration: 'none' }}>
                  <div style={{ flexShrink: 0, width: 36, height: 36, borderRadius: 10, background: hex(o.color, 0.16), color: o.color, display: 'grid', placeItems: 'center' }}><OIcon size={18} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14.5, color: '#f1f5f9' }}>{o.name}</div>
                    <div style={{ fontSize: 12, color: '#8892a4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.tag}</div>
                  </div>
                  <ArrowRight size={16} color="#6b7280" />
                </Link>
              )
            })}
          </div>
        </section>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '24px', textAlign: 'center', color: '#6b7280', fontSize: 13 }}>
        <Link href="/" style={{ color: '#a89fff', textDecoration: 'none', fontWeight: 600 }}>Avukatım</Link> — Hukuk Bürosu Yönetim Platformu
      </footer>

      <style>{`.guide-card:hover { border-color: rgba(108,99,255,0.4) !important; background: rgba(255,255,255,0.05) !important; }`}</style>
    </div>
  )
}
