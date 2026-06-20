'use server'

import { createClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_LIMITS } from '@avukat/types'

export type Member = { id: string; full_name: string | null; role: string; bar_number: string | null; phone: string | null }
export type Invite = { id: string; email: string; role: string; created_at: string }
export type TeamData = {
  members: Member[]
  invites: Invite[]
  currentUserId: string
  currentRole: string
  maxLawyers: number // -1 = sınırsız
  tier: string
}

async function ctx() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from('profiles').select('organization_id, role').eq('id', user.id).single()
  return { supabase, userId: user.id, orgId: profile?.organization_id as string | undefined, role: (profile?.role as string) ?? 'lawyer' }
}

export async function getTeam(): Promise<TeamData | null> {
  const c = await ctx()
  if (!c?.orgId) return null
  const [{ data: members }, { data: invites }, { data: org }] = await Promise.all([
    c.supabase.from('profiles').select('id, full_name, role, bar_number, phone').eq('organization_id', c.orgId).order('role'),
    c.supabase.from('org_invites').select('id, email, role, created_at').eq('organization_id', c.orgId).eq('status', 'pending').order('created_at', { ascending: false }),
    c.supabase.from('organizations').select('subscription_tier').eq('id', c.orgId).single(),
  ])
  const tier = (org?.subscription_tier as keyof typeof SUBSCRIPTION_LIMITS) ?? 'free'
  return {
    members: (members as Member[]) ?? [],
    invites: (invites as Invite[]) ?? [],
    currentUserId: c.userId,
    currentRole: c.role,
    maxLawyers: SUBSCRIPTION_LIMITS[tier]?.maxLawyers ?? 1,
    tier,
  }
}

export async function inviteMember(email: string, role: string) {
  const c = await ctx()
  if (!c?.orgId) return { error: 'Oturum yok' }
  if (c.role !== 'admin') return { error: 'Sadece yöneticiler davet edebilir.' }
  const clean = email.trim().toLowerCase()
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) return { error: 'Geçerli bir e-posta girin.' }
  if (!['admin', 'lawyer', 'assistant'].includes(role)) return { error: 'Geçersiz rol.' }
  const { error } = await c.supabase.from('org_invites').insert({
    organization_id: c.orgId, email: clean, role, invited_by: c.userId,
  })
  return error ? { error: error.message } : { ok: true }
}

export async function revokeInvite(id: string) {
  const c = await ctx()
  if (!c?.orgId) return { error: 'Oturum yok' }
  if (c.role !== 'admin') return { error: 'Yetki yok' }
  const { error } = await c.supabase.from('org_invites').update({ status: 'revoked' }).eq('id', id).eq('organization_id', c.orgId)
  return error ? { error: error.message } : { ok: true }
}

export async function setMemberRole(memberId: string, role: string) {
  const c = await ctx()
  if (!c) return { error: 'Oturum yok' }
  const { error } = await c.supabase.rpc('admin_set_member_role', { member_id: memberId, new_role: role })
  return error ? { error: error.message } : { ok: true }
}

export async function removeMember(memberId: string) {
  const c = await ctx()
  if (!c) return { error: 'Oturum yok' }
  const { error } = await c.supabase.rpc('admin_remove_member', { member_id: memberId })
  return error ? { error: error.message } : { ok: true }
}
