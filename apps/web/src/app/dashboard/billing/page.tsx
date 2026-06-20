import { createClient } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@avukat/types'
import { SUBSCRIPTION_LIMITS } from '@avukat/types'
import PlanButton from './PlanButton'

const PLANS: Array<{
  tier: SubscriptionTier
  name: string
  priceTRY: string
  priceUSD: string
  popular?: boolean
}> = [
  { tier: 'free', name: 'Ücretsiz', priceTRY: '₺0', priceUSD: '$0' },
  { tier: 'starter', name: 'Başlangıç', priceTRY: '₺799/ay', priceUSD: '$29/mo' },
  { tier: 'pro', name: 'Profesyonel', priceTRY: '₺1.499/ay', priceUSD: '$54/mo', popular: true },
  { tier: 'enterprise', name: 'Büro / Kurumsal', priceTRY: '₺5.000+/ay', priceUSD: 'Contact Us' },
]

export default async function BillingPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()
  const { data: org } = await supabase.from('organizations').select('*').eq('id', profile!.organization_id).single()

  const currentTier = (org?.subscription_tier ?? 'free') as SubscriptionTier
  const isTurkey = org?.country_code !== 'GLOBAL'

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", borderRadius: 24, overflow: 'hidden', background: 'radial-gradient(1000px 500px at 50% -15%, rgba(108,99,255,0.22), transparent), linear-gradient(180deg,#0a0913,#07090f)', border: '1px solid rgba(108,99,255,0.18)', color: '#e8eaf0', minHeight: 'calc(100vh - 130px)' }}>
      <div style={{ padding: 'clamp(22px,4vw,36px)' }}>
        {/* Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 8px 28px rgba(108,99,255,0.5)' }}>💳</div>
          <div>
            <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>Abonelik ve Ödeme</h2>
            <p style={{ color: '#8892a4', fontSize: 14, margin: '2px 0 0' }}>
              Mevcut Plan: <span style={{ fontWeight: 700, color: '#c4b5fd' }}>{PLANS.find(p => p.tier === currentTier)?.name}</span>
            </p>
          </div>
        </div>

        {status === 'success' && (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 12, padding: '12px 18px', fontSize: 14, color: '#6ee7b7', marginBottom: 18 }}>
            ✓ Ödemeniz alındı. Aboneliğiniz birkaç saniye içinde aktifleşecek. Sayfayı yenileyin.
          </div>
        )}
        {status === 'fail' && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 18px', fontSize: 14, color: '#fca5a5', marginBottom: 18 }}>
            ✕ Ödeme tamamlanamadı. Lütfen tekrar deneyin veya farklı bir kart kullanın.
          </div>
        )}

        {/* Planlar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 22 }}>
          {PLANS.map(plan => {
            const limits = SUBSCRIPTION_LIMITS[plan.tier]
            const isCurrent = plan.tier === currentTier
            return (
              <div key={plan.tier} style={{ position: 'relative', background: plan.popular ? 'linear-gradient(160deg,rgba(108,99,255,0.14),rgba(168,85,247,0.08))' : 'rgba(255,255,255,0.03)', border: isCurrent ? '1px solid #a855f7' : plan.popular ? '1px solid rgba(108,99,255,0.5)' : '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 22, boxShadow: plan.popular ? '0 0 50px rgba(108,99,255,0.12)' : 'none' }}>
                {plan.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '4px 14px', borderRadius: 100, whiteSpace: 'nowrap' }}>Popüler</div>}
                {isCurrent && <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(168,85,247,0.2)', color: '#c4b5fd', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100 }}>Mevcut</div>}

                <div style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9' }}>{plan.name}</div>
                <div style={{ fontSize: 26, fontWeight: 800, background: 'linear-gradient(135deg,#a855f7,#6c63ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginTop: 6 }}>{isTurkey ? plan.priceTRY : plan.priceUSD}</div>

                <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13, color: '#9ca3af' }}>
                  <li>✓ {limits.maxLawyers === -1 ? 'Sınırsız' : limits.maxLawyers} Avukat</li>
                  <li>✓ {limits.maxCases === -1 ? 'Sınırsız' : limits.maxCases} Dava</li>
                  <li>✓ {limits.maxDocuments === -1 ? 'Sınırsız' : limits.maxDocuments} Belge</li>
                  <li style={{ color: limits.uyapAccess === 'none' ? '#4b5563' : '#9ca3af', textDecoration: limits.uyapAccess === 'none' ? 'line-through' : 'none' }}>
                    {limits.uyapAccess === 'none' ? '✗ UYAP' : limits.uyapAccess === 'read' ? '✓ UYAP (Okuma)' : '✓ UYAP (Tam)'}
                  </li>
                  <li style={{ color: limits.whatsappPerMonth === 0 ? '#4b5563' : '#9ca3af', textDecoration: limits.whatsappPerMonth === 0 ? 'line-through' : 'none' }}>
                    {limits.whatsappPerMonth === 0 ? '✗ WhatsApp' : limits.whatsappPerMonth === -1 ? '✓ WhatsApp Sınırsız' : `✓ WhatsApp ${limits.whatsappPerMonth}/ay`}
                  </li>
                </ul>

                {!isCurrent && (
                  <div style={{ marginTop: 22 }}>
                    <PlanButton tier={plan.tier} label={plan.tier === 'enterprise' ? 'Teklif İste' : currentTier === 'free' ? 'Başla' : 'Yükselt'} variant={plan.tier === 'enterprise' ? 'outline' : 'primary'} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Ödeme yöntemi */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 22 }}>
          <h3 style={{ fontWeight: 700, color: '#f1f5f9', margin: '0 0 14px', fontSize: 16 }}>Ödeme Yöntemi</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, background: 'rgba(108,99,255,0.12)', border: '1px solid rgba(108,99,255,0.4)', color: '#c4b5fd' }}>🇹🇷 PayTR (Türkiye — TRY)</div>
            <div style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 600, border: '1px solid rgba(255,255,255,0.1)', color: '#8892a4' }}>🌍 Stripe (Global — USD/EUR)</div>
          </div>
          <p style={{ fontSize: 12.5, color: '#6b7280', marginTop: 14, lineHeight: 1.6 }}>
            Türkiye içi ödemeler PayTR güvenli altyapısıyla alınır (3D Secure, taksit ve tüm kartlar desteklenir). Kart bilgileriniz sunucularımızda saklanmaz.
          </p>
        </div>
      </div>
    </div>
  )
}
