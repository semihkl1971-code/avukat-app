import cron from 'node-cron'
import { createClient } from '@supabase/supabase-js'
import { syncOrganizationCases } from '../services/uyap/client.js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function decrypt(encrypted: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const [iv, content] = encrypted.split(':')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv!, 'hex'))
  return decipher.update(content!, 'hex', 'utf8') + decipher.final('utf8')
}

async function syncAllOrgs() {
  const { data: profiles } = await supabase
    .from('profiles')
    .select('organization_id, uyap_credentials_encrypted')
    .not('uyap_credentials_encrypted', 'is', null)

  if (!profiles?.length) return

  const orgIds = [...new Set(profiles.map(p => p.organization_id))]

  for (const orgId of orgIds) {
    const profile = profiles.find(p => p.organization_id === orgId)
    if (!profile) continue

    const [tcNo, password] = decrypt(profile.uyap_credentials_encrypted).split(':')
    await syncOrganizationCases(orgId, tcNo!, password!, supabase).catch(console.error)
  }
}

async function sendHearingReminders() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const dayStart = new Date(tomorrow.setHours(0, 0, 0, 0)).toISOString()
  const dayEnd = new Date(tomorrow.setHours(23, 59, 59, 999)).toISOString()

  const { data: hearings } = await supabase
    .from('hearings')
    .select('*, cases(title, clients(full_name, phone, whatsapp_opted_in))')
    .gte('scheduled_at', dayStart)
    .lte('scheduled_at', dayEnd)
    .eq('reminder_sent', false)

  for (const h of hearings ?? []) {
    const client = h.cases?.clients
    if (!client?.whatsapp_opted_in || !client?.phone) continue

    // WhatsApp reminder would be sent here via the API service
    console.log(`Sending hearing reminder to ${client.full_name} for ${h.cases?.title}`)

    await supabase.from('hearings').update({ reminder_sent: true }).eq('id', h.id)
  }
}

export function startCronJobs() {
  // UYAP sync her 30 dakikada
  cron.schedule('*/30 * * * *', () => syncAllOrgs().catch(console.error))

  // Duruşma hatırlatıcıları her gün 09:00'da
  cron.schedule('0 9 * * *', () => sendHearingReminders().catch(console.error))

  console.log('Cron jobs başlatıldı')
}
