import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import TopBar from '@/components/dashboard/TopBar'
import BreakReminder from '@/components/dashboard/BreakReminder'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, organizations(*)')
    .eq('id', user.id)
    .single()

  // Büro hesabı (Kurumsal/enterprise tier) ise mola hatırlatıcısı ekip moduna geçer
  const org = profile?.organizations as { subscription_tier?: string } | null
  const isFirm = org?.subscription_tier === 'enterprise'

  return (
    <div className="flex h-screen" style={{ background: '#07090f' }}>
      <Sidebar profile={profile} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar user={user} profile={profile} />
        <main className="flex-1 overflow-y-auto p-6" style={{ background: 'radial-gradient(900px 400px at 50% -10%, rgba(108,99,255,0.07), transparent), #07090f', color: '#e8eaf0' }}>
          {children}
        </main>
      </div>
      <BreakReminder isFirm={isFirm} />
    </div>
  )
}
