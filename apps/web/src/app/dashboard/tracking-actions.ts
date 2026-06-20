'use server'

import { createClient } from '@/lib/supabase/server'

async function ctx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  return { supabase, userId: user.id, orgId: profile?.organization_id as string | undefined }
}

// ─── Ödeme takibi ────────────────────────────────────────────────────────────
export type PaymentRow = { id: string; client_name: string; description: string | null; amount: number; due_date: string | null; paid: boolean }

export async function listPayments(): Promise<PaymentRow[]> {
  const c = await ctx(); if (!c?.orgId) return []
  const { data } = await c.supabase.from('client_payments')
    .select('id, client_name, description, amount, due_date, paid')
    .eq('organization_id', c.orgId).order('created_at', { ascending: false })
  return (data as PaymentRow[]) ?? []
}

export async function addPaymentRecord(input: { client_name: string; description: string; amount: number; due_date: string }) {
  const c = await ctx(); if (!c?.orgId) return { error: 'Oturum yok' }
  const { error } = await c.supabase.from('client_payments').insert({
    organization_id: c.orgId, created_by: c.userId,
    client_name: input.client_name, description: input.description || null,
    amount: input.amount, due_date: input.due_date || null,
  })
  return error ? { error: error.message } : { ok: true }
}

export async function setPaymentPaid(id: string, paid: boolean) {
  const c = await ctx(); if (!c?.orgId) return { error: 'Oturum yok' }
  const { error } = await c.supabase.from('client_payments')
    .update({ paid, paid_at: paid ? new Date().toISOString() : null })
    .eq('id', id).eq('organization_id', c.orgId)
  return error ? { error: error.message } : { ok: true }
}

export async function deletePaymentRecord(id: string) {
  const c = await ctx(); if (!c?.orgId) return { error: 'Oturum yok' }
  const { error } = await c.supabase.from('client_payments').delete().eq('id', id).eq('organization_id', c.orgId)
  return error ? { error: error.message } : { ok: true }
}

// ─── Güvenlik ayarları ───────────────────────────────────────────────────────
export type SecurityRow = { two_fa: boolean; device_lock: boolean; ip_allowlist: boolean; auto_logout: boolean; encrypt_docs: boolean; phishing_guard: boolean }
const SEC_DEFAULT: SecurityRow = { two_fa: false, device_lock: true, ip_allowlist: false, auto_logout: true, encrypt_docs: true, phishing_guard: true }

export async function getSecuritySettings(): Promise<SecurityRow> {
  const c = await ctx(); if (!c?.orgId) return SEC_DEFAULT
  const { data } = await c.supabase.from('security_settings').select('*').eq('organization_id', c.orgId).single()
  return data ? { ...SEC_DEFAULT, ...data } : SEC_DEFAULT
}

export async function saveSecuritySettings(s: SecurityRow) {
  const c = await ctx(); if (!c?.orgId) return { error: 'Oturum yok' }
  const { error } = await c.supabase.from('security_settings')
    .upsert({ organization_id: c.orgId, ...s, updated_at: new Date().toISOString() })
  return error ? { error: error.message } : { ok: true }
}

// ─── Wellness günlüğü ────────────────────────────────────────────────────────
export type WellnessRow = { mood: number | null; coffee: number; water: number; breaks: number }
const WELL_DEFAULT: WellnessRow = { mood: null, coffee: 0, water: 0, breaks: 0 }

export async function getWellnessToday(): Promise<WellnessRow> {
  const c = await ctx(); if (!c) return WELL_DEFAULT
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await c.supabase.from('wellness_log').select('mood, coffee, water, breaks')
    .eq('user_id', c.userId).eq('log_date', today).single()
  return data ? { ...WELL_DEFAULT, ...data } : WELL_DEFAULT
}

export async function saveWellness(s: WellnessRow) {
  const c = await ctx(); if (!c) return { error: 'Oturum yok' }
  const today = new Date().toISOString().slice(0, 10)
  const { error } = await c.supabase.from('wellness_log')
    .upsert({ user_id: c.userId, organization_id: c.orgId ?? null, log_date: today, ...s, updated_at: new Date().toISOString() }, { onConflict: 'user_id,log_date' })
  return error ? { error: error.message } : { ok: true }
}
