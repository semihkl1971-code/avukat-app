'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface FormState {
  error?: string
}

async function getOrgContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.organization_id) return null
  return { supabase, userId: user.id, orgId: profile.organization_id }
}

function str(formData: FormData, key: string): string | null {
  const v = formData.get(key)
  if (typeof v !== 'string') return null
  const trimmed = v.trim()
  return trimmed === '' ? null : trimmed
}

// ─── Müvekkil oluştur ────────────────────────────────────────────────────────
export async function createClientRecord(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Oturum bulunamadı. Tekrar giriş yapın.' }

  const full_name = str(formData, 'full_name')
  if (!full_name) return { error: 'Ad soyad zorunludur.' }

  const { error } = await ctx.supabase.from('clients').insert({
    organization_id: ctx.orgId,
    created_by: ctx.userId,
    type: (str(formData, 'type') ?? 'individual') as 'individual' | 'corporate',
    full_name,
    tc_kimlik_no: str(formData, 'tc_kimlik_no'),
    tax_number: str(formData, 'tax_number'),
    phone: str(formData, 'phone'),
    email: str(formData, 'email'),
    city: str(formData, 'city'),
    address: str(formData, 'address'),
    notes: str(formData, 'notes'),
  })

  if (error) return { error: 'Müvekkil kaydedilemedi: ' + error.message }

  revalidatePath('/dashboard/clients')
  redirect('/dashboard/clients')
}

// ─── Dava oluştur ────────────────────────────────────────────────────────────
export async function createCaseRecord(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Oturum bulunamadı. Tekrar giriş yapın.' }

  const title = str(formData, 'title')
  const client_id = str(formData, 'client_id')
  if (!title) return { error: 'Dava başlığı zorunludur.' }
  if (!client_id) return { error: 'Müvekkil seçilmelidir.' }

  const nextHearing = str(formData, 'next_hearing_at')

  const { error } = await ctx.supabase.from('cases').insert({
    organization_id: ctx.orgId,
    assigned_lawyer_id: ctx.userId,
    client_id,
    title,
    case_number: str(formData, 'case_number'),
    case_type: str(formData, 'case_type') as
      | 'civil' | 'criminal' | 'administrative' | 'commercial' | 'family' | 'labor' | 'other' | null,
    court_name: str(formData, 'court_name'),
    status: (str(formData, 'status') ?? 'active') as 'active' | 'closed' | 'pending' | 'archived',
    description: str(formData, 'description'),
    next_hearing_at: nextHearing ? new Date(nextHearing).toISOString() : null,
  })

  if (error) return { error: 'Dava kaydedilemedi: ' + error.message }

  revalidatePath('/dashboard/cases')
  redirect('/dashboard/cases')
}

// ─── Mesaj gönder (WhatsApp / E-posta) ───────────────────────────────────────
export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await getOrgContext()
  if (!ctx) return { error: 'Oturum bulunamadı. Tekrar giriş yapın.' }

  const channel = (str(formData, 'channel') ?? 'whatsapp') as 'whatsapp' | 'gmail'
  const body = str(formData, 'body')
  const client_id = str(formData, 'client_id')
  let to = str(formData, 'to')

  if (!body) return { error: 'Mesaj metni boş olamaz.' }

  // Müvekkil seçildiyse iletişim bilgisini ondan al
  let clientName: string | null = null
  if (client_id) {
    const { data: c } = await ctx.supabase
      .from('clients')
      .select('full_name, phone, email')
      .eq('id', client_id)
      .single()
    clientName = (c?.full_name as string) ?? null
    to = to ?? (channel === 'whatsapp' ? (c?.phone as string) : (c?.email as string))
  }
  if (!to) return { error: channel === 'whatsapp' ? 'Telefon numarası gerekli.' : 'E-posta adresi gerekli.' }

  let status = 'sent'
  let externalId: string | null = null

  // WhatsApp Cloud API gönderimi (anahtar tanımlıysa); değilse demo modunda kaydedilir
  if (channel === 'whatsapp' && process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_ID) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: to.replace(/^\+/, ''), type: 'text', text: { body } }),
      })
      const data = await res.json()
      if (!res.ok) return { error: 'WhatsApp gönderilemedi: ' + (data?.error?.message ?? 'bilinmeyen hata') }
      externalId = data?.messages?.[0]?.id ?? null
    } catch {
      return { error: 'WhatsApp servisine ulaşılamadı.' }
    }
  } else if (channel === 'whatsapp') {
    status = 'queued' // demo modu: gerçek gönderim için WHATSAPP_ACCESS_TOKEN gerekli
  }

  const { error } = await ctx.supabase.from('messages').insert({
    organization_id: ctx.orgId,
    client_id: client_id ?? null,
    channel,
    direction: 'outbound',
    external_message_id: externalId,
    to_address: to,
    body,
    status,
    sent_at: new Date().toISOString(),
  })
  if (error) return { error: 'Mesaj kaydedilemedi: ' + error.message }

  revalidatePath('/dashboard/messages')
  redirect('/dashboard/messages')
}
