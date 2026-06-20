import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'

const STATUS_META: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktif', color: '#6c63ff' },
  pending: { label: 'Beklemede', color: '#f59e0b' },
  closed: { label: 'Kapandı', color: '#10b981' },
  archived: { label: 'Arşiv', color: '#6b7280' },
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('organization_id, full_name').eq('id', user.id).single()
  const orgId = profile?.organization_id
  const firstName = (profile?.full_name as string)?.split(' ')[0] ?? 'Avukat'
  const monthAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()

  const [casesRes, hearingsRes, clientsMonthRes, clientsTotalRes, paymentsRes, messagesRes] = await Promise.all([
    supabase.from('cases').select('status').eq('organization_id', orgId!),
    supabase.from('hearings').select('id, scheduled_at, court_name, cases(title)').eq('organization_id', orgId!).gte('scheduled_at', new Date().toISOString()).order('scheduled_at').limit(5),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!).gte('created_at', monthAgo),
    supabase.from('clients').select('id', { count: 'exact', head: true }).eq('organization_id', orgId!),
    supabase.from('client_payments').select('amount, paid, due_date').eq('organization_id', orgId!),
    supabase.from('messages').select('id, channel, direction, body, created_at, clients(full_name)').eq('organization_id', orgId!).order('created_at', { ascending: false }).limit(5),
  ])

  const cases = casesRes.data ?? []
  const statusTally = cases.reduce<Record<string, number>>((acc, c) => { const s = (c.status as string) ?? 'active'; acc[s] = (acc[s] ?? 0) + 1; return acc }, {})
  const activeCases = statusTally.active ?? 0
  const totalCases = cases.length
  const hearings = hearingsRes.data ?? []
  const payments = paymentsRes.data ?? []
  const today = new Date().toISOString().slice(0, 10)
  const pendingTotal = payments.filter(p => !p.paid).reduce((s, p) => s + Number(p.amount), 0)
  const overdueTotal = payments.filter(p => !p.paid && p.due_date && (p.due_date as string) < today).reduce((s, p) => s + Number(p.amount), 0)
  const messages = messagesRes.data ?? []
  const fmt = (n: number) => n.toLocaleString('tr-TR') + ' ₺'

  const stats = [
    { label: 'Aktif Dava', value: String(activeCases), icon: '⚖️', href: '/dashboard/cases', glow: 'rgba(108,99,255,0.25)', color: '#a5b4fc' },
    { label: 'Yaklaşan Duruşma', value: String(hearings.length), icon: '📅', href: '/dashboard/calendar', glow: 'rgba(168,85,247,0.25)', color: '#c4b5fd' },
    { label: 'Bu Ay Yeni Müvekkil', value: String(clientsMonthRes.count ?? 0), icon: '👤', href: '/dashboard/clients', glow: 'rgba(16,185,129,0.22)', color: '#6ee7b7' },
    { label: 'Bekleyen Tahsilat', value: fmt(pendingTotal), icon: '💰', href: '/dashboard/odemeler', glow: 'rgba(245,158,11,0.22)', color: '#fbbf24' },
  ]

  const QUICK = [
    { label: 'Yeni Dava', icon: '⚖️', href: '/dashboard/cases/new' },
    { label: 'Yeni Müvekkil', icon: '👤', href: '/dashboard/clients/new' },
    { label: 'AI Asistan', icon: '🧠', href: '/dashboard/ai-arama' },
    { label: 'Mesaj Gönder', icon: '💬', href: '/dashboard/messages/compose' },
  ]

  const CH_ICON: Record<string, string> = { whatsapp: '💬', gmail: '📧', sms: '📱' }

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", borderRadius: 24, background: 'radial-gradient(1100px 500px at 50% -15%, rgba(108,99,255,0.2), transparent), linear-gradient(180deg,#0a0913,#07090f)', border: '1px solid rgba(108,99,255,0.18)', color: '#e8eaf0', minHeight: 'calc(100vh - 130px)', padding: 'clamp(22px,4vw,34px)' }}>

      {/* Karşılama */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14, marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 'clamp(24px,3.5vw,32px)', fontWeight: 800, letterSpacing: '-0.6px', margin: 0 }}>Merhaba, <span style={{ background: 'linear-gradient(135deg,#a855f7,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{firstName}</span> 👋</h2>
          <p style={{ color: '#8892a4', fontSize: 14, margin: '4px 0 0' }}>{new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {QUICK.map(q => (
            <Link key={q.label} href={q.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 12, padding: '9px 14px', textDecoration: 'none', color: '#d8d4ea', fontSize: 13.5, fontWeight: 600 }}>
              <span>{q.icon}</span>{q.label}
            </Link>
          ))}
        </div>
      </div>

      {/* İstatistik kartları */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: 16, marginBottom: 18 }}>
        {stats.map(s => (
          <Link key={s.label} href={s.href} style={{ position: 'relative', overflow: 'hidden', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 20, textDecoration: 'none', display: 'block' }}>
            <div style={{ position: 'absolute', top: -28, right: -28, width: 110, height: 110, borderRadius: '50%', background: s.glow, filter: 'blur(28px)' }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 13, color: '#8892a4', marginTop: 2 }}>{s.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16 }}>
        {/* Dava durum dağılımı */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Dava Durum Dağılımı</h3>
            <span style={{ fontSize: 12.5, color: '#8892a4' }}>Toplam {totalCases}</span>
          </div>
          {totalCases === 0 ? <p style={{ color: '#6b7280', fontSize: 14 }}>Henüz dava yok.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const n = statusTally[key] ?? 0
                const pct = totalCases ? Math.round((n / totalCases) * 100) : 0
                return (
                  <div key={key}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: '#c4cfe0' }}>{meta.label}</span>
                      <span style={{ color: '#8892a4' }}>{n} · %{pct}</span>
                    </div>
                    <div style={{ height: 8, borderRadius: 100, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: 100, background: meta.color, transition: 'width .4s' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {overdueTotal > 0 && (
            <div style={{ marginTop: 18, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#fca5a5' }}>
              ⚠️ Gecikmiş tahsilat: <strong>{fmt(overdueTotal)}</strong> — <Link href="/dashboard/odemeler" style={{ color: '#fca5a5', textDecoration: 'underline' }}>takip et</Link>
            </div>
          )}
        </div>

        {/* Yaklaşan duruşmalar */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Yaklaşan Duruşmalar</h3>
            <Link href="/dashboard/calendar" style={{ color: '#a78bfa', fontSize: 13, textDecoration: 'none' }}>Tümü →</Link>
          </div>
          {hearings.length === 0 ? <p style={{ color: '#6b7280', fontSize: 14 }}>Yaklaşan duruşma yok.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {hearings.map((h: Record<string, unknown>) => (
                <div key={h.id as string} style={{ display: 'flex', alignItems: 'center', gap: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '11px 14px' }}>
                  <div style={{ textAlign: 'center', minWidth: 42 }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#a78bfa' }}>{new Date(h.scheduled_at as string).getDate()}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{new Date(h.scheduled_at as string).toLocaleDateString('tr-TR', { month: 'short' })}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{((h.cases as Record<string, unknown>)?.title as string) ?? 'Dava'}</div>
                    <div style={{ fontSize: 12.5, color: '#8892a4' }}>{(h.court_name as string) ?? ''}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: '#6b7280', whiteSpace: 'nowrap' }}>{formatDistanceToNow(new Date(h.scheduled_at as string), { locale: tr, addSuffix: true })}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Son mesajlar */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 22 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Son Mesajlar</h3>
            <Link href="/dashboard/messages" style={{ color: '#a78bfa', fontSize: 13, textDecoration: 'none' }}>Tümü →</Link>
          </div>
          {messages.length === 0 ? <p style={{ color: '#6b7280', fontSize: 14 }}>Henüz mesaj yok.</p> : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((m: Record<string, unknown>) => (
                <div key={m.id as string} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '11px 14px' }}>
                  <span style={{ fontSize: 18 }}>{CH_ICON[m.channel as string] ?? '✉️'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#f1f5f9' }}>{((m.clients as Record<string, unknown>)?.full_name as string) ?? 'Bilinmeyen'} <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 400 }}>{m.direction === 'inbound' ? '← gelen' : '→ giden'}</span></div>
                    <div style={{ fontSize: 12.5, color: '#8892a4', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.body as string}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
