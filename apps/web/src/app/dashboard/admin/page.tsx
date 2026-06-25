import { createClient } from '@/lib/supabase/server'
import { createClient as svc } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

const SUPER_ADMIN = (process.env.SUPER_ADMIN_EMAIL || 'semihkl1971@gmail.com').toLowerCase()

const TIER_LABEL: Record<string, string> = { free: 'Ücretsiz', starter: 'Solo', pro: 'Profesyonel', enterprise: 'Kurumsal' }
const TIER_COLOR: Record<string, string> = { free: '#6b7280', starter: '#22d3ee', pro: '#a855f7', enterprise: '#f59e0b' }
// Aylık plan fiyatları (₺) — gelir/MRR hesabı için
const TIER_PRICE: Record<string, number> = { free: 0, starter: 799, pro: 1499, enterprise: 5000 }
const tl = (n: number) => '₺' + n.toLocaleString('tr-TR')

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // Yalnızca sahip (sen) görebilir
  if (!user || (user.email ?? '').toLowerCase() !== SUPER_ADMIN) redirect('/dashboard')

  const admin = svc(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  // Tüm kullanıcılar (auth) + profiller + bürolar
  const [{ data: usersData }, { data: profiles }, { data: orgs }] = await Promise.all([
    admin.auth.admin.listUsers({ perPage: 1000 }),
    admin.from('profiles').select('id, full_name, organization_id, role'),
    admin.from('organizations').select('id, name, subscription_tier, subscription_status, created_at'),
  ])
  const users = usersData?.users ?? []
  const profById = new Map((profiles ?? []).map(p => [p.id as string, p]))
  const orgById = new Map((orgs ?? []).map(o => [o.id as string, o]))

  const now = Date.now()
  const days = (iso?: string | null) => (iso ? (now - new Date(iso).getTime()) / 86400000 : Infinity)

  // Birleştirilmiş kullanıcı satırları
  const rows = users.map(u => {
    const prof = profById.get(u.id)
    const org = prof?.organization_id ? orgById.get(prof.organization_id as string) : undefined
    return {
      email: u.email ?? '—',
      name: (prof?.full_name as string) || '—',
      org: (org?.name as string) || '—',
      tier: (org?.subscription_tier as string) || 'free',
      role: (prof?.role as string) || '—',
      created: u.created_at,
      lastSeen: u.last_sign_in_at,
    }
  }).sort((a, b) => new Date(b.created || 0).getTime() - new Date(a.created || 0).getTime())

  const totalUsers = users.length
  const totalOrgs = (orgs ?? []).length
  const active7 = users.filter(u => days(u.last_sign_in_at) <= 7).length
  const new7 = users.filter(u => days(u.created_at) <= 7).length
  const paid = (orgs ?? []).filter(o => o.subscription_tier && o.subscription_tier !== 'free').length

  // Plan dağılımı + gelir
  const tierCounts: Record<string, number> = { free: 0, starter: 0, pro: 0, enterprise: 0 }
  for (const o of orgs ?? []) tierCounts[(o.subscription_tier as string) || 'free'] = (tierCounts[(o.subscription_tier as string) || 'free'] ?? 0) + 1

  // Aylık yinelenen gelir (MRR) — yalnızca aktif abonelikler
  const activeOrgs = (orgs ?? []).filter(o => (o.subscription_status as string) !== 'canceled')
  const mrr = activeOrgs.reduce((s, o) => s + (TIER_PRICE[(o.subscription_tier as string) || 'free'] ?? 0), 0)
  const arr = mrr * 12
  const arpu = paid ? Math.round(mrr / paid) : 0
  const revByTier: Record<string, number> = { starter: tierCounts.starter * TIER_PRICE.starter, pro: tierCounts.pro * TIER_PRICE.pro, enterprise: tierCounts.enterprise * TIER_PRICE.enterprise }

  const stats = [
    { label: 'Toplam Kullanıcı', value: String(totalUsers), color: '#a5b4fc' },
    { label: 'Toplam Büro', value: String(totalOrgs), color: '#c4b5fd' },
    { label: 'Aktif (7 gün)', value: String(active7), color: '#6ee7b7' },
    { label: 'Yeni Üye (7 gün)', value: String(new7), color: '#7dd3fc' },
    { label: 'Ücretli Abone', value: String(paid), color: '#fbbf24' },
  ]
  const revStats = [
    { label: 'Aylık Gelir (MRR)', value: tl(mrr), color: '#34d399', sub: 'Aktif aboneliklerin aylık toplamı' },
    { label: 'Yıllık Gelir (ARR)', value: tl(arr), color: '#22d3ee', sub: 'MRR × 12 tahmini' },
    { label: 'Kullanıcı Başı Gelir', value: tl(arpu), color: '#fbbf24', sub: 'Ücretli abone başına aylık' },
  ]

  const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", borderRadius: 24, background: 'radial-gradient(1100px 500px at 50% -15%, rgba(245,158,11,0.14), transparent), linear-gradient(180deg,#0a0913,#07090f)', border: '1px solid rgba(245,158,11,0.18)', color: '#e8eaf0', minHeight: 'calc(100vh - 130px)', padding: 'clamp(22px,4vw,34px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#f59e0b,#f97316)', display: 'grid', placeItems: 'center', fontSize: 20, boxShadow: '0 8px 24px rgba(245,158,11,0.4)' }}>🛡️</div>
        <div>
          <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>Yönetici Paneli</h2>
          <p style={{ color: '#8892a4', fontSize: 13.5, margin: '2px 0 0' }}>Yalnızca size özel — sistem geneli kullanım.</p>
        </div>
      </div>

      {/* İstatistikler */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14, margin: '22px 0' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 18px' }}>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12.5, color: '#8892a4', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gelir akışı */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 22 }}>
        {revStats.map(s => (
          <div key={s.label} style={{ background: 'linear-gradient(160deg,rgba(52,211,153,0.1),rgba(255,255,255,0.02))', border: '1px solid rgba(52,211,153,0.2)', borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 12.5, color: '#8892a4', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Plan dağılımı + gelir */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20, marginBottom: 22 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 14px' }}>Plan Dağılımı & Gelir</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {Object.entries(tierCounts).map(([tier, n]) => {
            const pct = totalOrgs ? Math.round((n / totalOrgs) * 100) : 0
            const rev = revByTier[tier] ?? 0
            return (
              <div key={tier}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                  <span style={{ color: '#c4cfe0' }}>{TIER_LABEL[tier]} {rev > 0 && <span style={{ color: '#34d399', fontWeight: 600 }}>· {tl(rev)}/ay</span>}</span>
                  <span style={{ color: '#8892a4' }}>{n} büro · %{pct}</span>
                </div>
                <div style={{ height: 8, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 100, background: TIER_COLOR[tier] }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Kullanıcı listesi */}
      <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
        <h3 style={{ fontWeight: 700, fontSize: 15, margin: '0 0 14px' }}>Üyeler ({totalUsers})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ color: '#6b7280', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <th style={{ padding: '8px 10px', fontWeight: 600, letterSpacing: 0.4 }}>E-POSTA</th>
                <th style={{ padding: '8px 10px', fontWeight: 600, letterSpacing: 0.4 }}>AD SOYAD</th>
                <th style={{ padding: '8px 10px', fontWeight: 600, letterSpacing: 0.4 }}>BÜRO</th>
                <th style={{ padding: '8px 10px', fontWeight: 600, letterSpacing: 0.4 }}>PLAN</th>
                <th style={{ padding: '8px 10px', fontWeight: 600, letterSpacing: 0.4 }}>KAYIT</th>
                <th style={{ padding: '8px 10px', fontWeight: 600, letterSpacing: 0.4 }}>SON GİRİŞ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '9px 10px', color: '#e8eaf0' }}>{r.email}</td>
                  <td style={{ padding: '9px 10px', color: '#c4cfe0' }}>{r.name}</td>
                  <td style={{ padding: '9px 10px', color: '#9aa3b4' }}>{r.org}</td>
                  <td style={{ padding: '9px 10px' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 700, color: TIER_COLOR[r.tier], background: `${TIER_COLOR[r.tier]}22`, padding: '2px 9px', borderRadius: 100 }}>{TIER_LABEL[r.tier]}</span>
                  </td>
                  <td style={{ padding: '9px 10px', color: '#8892a4' }}>{fmt(r.created)}</td>
                  <td style={{ padding: '9px 10px', color: '#8892a4' }}>{fmt(r.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
