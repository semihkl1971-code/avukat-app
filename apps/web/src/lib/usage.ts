import { SUBSCRIPTION_LIMITS, type SubscriptionTier } from '@avukat/types'
import type { SupabaseClient } from '@supabase/supabase-js'

export type Usage = { count: number; limit: number; ok: boolean; unlimited: boolean }

// Bu ayın başı (aylık limitler için)
export function monthStart(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
}

export async function getTier(supabase: SupabaseClient, orgId: string): Promise<SubscriptionTier> {
  const { data } = await supabase.from('organizations').select('subscription_tier').eq('id', orgId).single()
  return ((data?.subscription_tier as SubscriptionTier) ?? 'free')
}

function mk(count: number, limit: number): Usage {
  const unlimited = limit === -1
  return { count, limit, unlimited, ok: unlimited || count < limit }
}

// Bu ay gönderilen WhatsApp (giden) mesaj sayısı vs aylık limit
export async function whatsappUsage(supabase: SupabaseClient, orgId: string, tier: SubscriptionTier): Promise<Usage> {
  const limit = SUBSCRIPTION_LIMITS[tier].whatsappPerMonth
  if (limit === 0) return { count: 0, limit: 0, ok: false, unlimited: false }
  const { count } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('channel', 'whatsapp')
    .eq('direction', 'outbound')
    .gte('created_at', monthStart())
  return mk(count ?? 0, limit)
}

// Toplam dava sayısı vs limit
export async function caseUsage(supabase: SupabaseClient, orgId: string, tier: SubscriptionTier): Promise<Usage> {
  const limit = SUBSCRIPTION_LIMITS[tier].maxCases
  const { count } = await supabase.from('cases').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
  return mk(count ?? 0, limit)
}

// Toplam belge sayısı vs limit
export async function documentUsage(supabase: SupabaseClient, orgId: string, tier: SubscriptionTier): Promise<Usage> {
  const limit = SUBSCRIPTION_LIMITS[tier].maxDocuments
  const { count } = await supabase.from('documents').select('id', { count: 'exact', head: true }).eq('organization_id', orgId)
  return mk(count ?? 0, limit)
}
