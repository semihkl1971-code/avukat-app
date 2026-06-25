'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface BotState {
  ok?: boolean
  error?: string
}

export async function saveBotSettings(_prev: BotState, formData: FormData): Promise<BotState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Oturum bulunamadı.' }

  const enabled = formData.get('enabled') === 'on'
  const firmName = ((formData.get('firmName') as string) ?? '').trim()
  const hours = ((formData.get('hours') as string) ?? '').trim()
  const services = ((formData.get('services') as string) ?? '').trim()

  let keywords: { keyword: string; reply: string }[] = []
  try {
    const parsed = JSON.parse((formData.get('keywords') as string) || '[]')
    if (Array.isArray(parsed)) {
      keywords = parsed
        .map((k: { keyword?: string; reply?: string }) => ({ keyword: (k.keyword ?? '').trim(), reply: (k.reply ?? '').trim() }))
        .filter(k => k.keyword && k.reply)
        .slice(0, 20)
    }
  } catch { /* yoksay */ }

  const config = { enabled, firmName, hours, services, keywords }

  const { error } = await supabase.rpc('set_whatsapp_bot', { p_config: config })
  if (error) return { error: 'Kaydedilemedi: ' + error.message }

  revalidatePath('/dashboard/whatsapp-bot')
  return { ok: true }
}
