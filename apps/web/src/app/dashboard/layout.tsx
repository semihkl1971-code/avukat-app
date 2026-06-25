import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import BreakReminder from '@/components/dashboard/BreakReminder'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  // İlk giriş bootstrap: büro yoksa (örn. e-posta onayından sonra) metadata'dan oluştur
  if (!profile?.organization_id) {
    const meta = (user.user_metadata ?? {}) as Record<string, string>
    const { data: claimed } = await supabase.rpc('claim_org_invite')
    const joined = Array.isArray(claimed) ? claimed[0] : claimed
    if (joined?.organization_id) {
      await supabase.from('profiles').upsert({ id: user.id, organization_id: joined.organization_id, full_name: meta.full_name ?? null, bar_number: meta.bar_number || null, phone: meta.phone || null, locale: 'tr' })
    } else {
      const orgId = crypto.randomUUID()
      const baseName = (meta.firm_name || meta.full_name || 'buro')
      const slug = baseName.toLowerCase().replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).slice(2, 6)
      await supabase.from('organizations').insert({ id: orgId, name: meta.firm_name || `${meta.full_name ?? 'Yeni'} Hukuk Bürosu`, slug, subscription_tier: 'free', country_code: 'TR' })
      await supabase.from('profiles').upsert({ id: user.id, organization_id: orgId, full_name: meta.full_name ?? null, bar_number: meta.bar_number || null, phone: meta.phone || null, role: 'admin', locale: 'tr' })
    }
    profile = (await supabase.from('profiles').select('*, organizations(*)').eq('id', user.id).single()).data
  }

  // Büro hesabı (Kurumsal/enterprise tier) ise mola hatırlatıcısı ekip moduna geçer
  const org = profile?.organizations as { subscription_tier?: string } | null
  const isFirm = org?.subscription_tier === 'enterprise'

  // Yalnızca sistem sahibi (sen) yönetici panelini görür
  const SUPER_ADMIN = (process.env.SUPER_ADMIN_EMAIL || 'semihkl1971@gmail.com').toLowerCase()
  const isOwner = (user.email ?? '').toLowerCase() === SUPER_ADMIN

  return (
    <div className="flex h-screen" style={{ background: '#07090f' }}>
      <Sidebar profile={profile} isOwner={isOwner} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} profile={profile} />
        <main className="dash-scope flex-1 overflow-y-auto p-6" style={{ background: 'radial-gradient(900px 400px at 50% -10%, rgba(108,99,255,0.07), transparent), #07090f', color: '#e8eaf0' }}>
          {children}
        </main>
      </div>
      <BreakReminder isFirm={isFirm} />
    </div>
  )
}
