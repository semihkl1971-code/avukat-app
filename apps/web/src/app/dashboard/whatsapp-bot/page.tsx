import { createClient } from '@/lib/supabase/server'
import BotForm from './BotForm'

type Keyword = { keyword: string; reply: string }
type BotCfg = { enabled?: boolean; firmName?: string; hours?: string; services?: string; keywords?: Keyword[] }

export default async function WhatsAppBotPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const { data: org } = await supabase
    .from('organizations')
    .select('name, settings')
    .eq('id', profile?.organization_id as string)
    .single()

  const cfg = ((org?.settings as Record<string, unknown>)?.['whatsappBot'] as BotCfg) ?? {}
  const initial: Required<BotCfg> = {
    enabled: cfg.enabled ?? false,
    firmName: cfg.firmName ?? ((org?.name as string) ?? ''),
    hours: cfg.hours ?? 'Pazartesi–Cuma 09:00–18:00',
    services: cfg.services ?? '',
    keywords: cfg.keywords ?? [],
  }

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", borderRadius: 24, background: 'radial-gradient(1000px 480px at 50% -15%, rgba(30,196,95,0.16), transparent), linear-gradient(180deg,#0a0913,#07090f)', border: '1px solid rgba(30,196,95,0.18)', color: '#e8eaf0', minHeight: 'calc(100vh - 130px)', padding: 'clamp(22px,4vw,34px)' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#0d8b3d,#1ec45f)', display: 'grid', placeItems: 'center', fontSize: 22, boxShadow: '0 8px 28px rgba(30,196,95,0.4)' }}>🤖</div>
          <div>
            <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>WhatsApp Asistanı (Bot)</h2>
            <p style={{ color: '#8892a4', fontSize: 14, margin: '2px 0 0' }}>Gelen müvekkil mesajlarına otomatik, güvenli yanıt.</p>
          </div>
        </div>
        <BotForm initial={initial} />
      </div>
    </div>
  )
}
