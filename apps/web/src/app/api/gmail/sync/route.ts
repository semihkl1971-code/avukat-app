import { NextResponse } from 'next/server'
import { createClient as serverClient } from '@/lib/supabase/server'
import { createClient as svcClient } from '@supabase/supabase-js'
import { decrypt, accessToken, fetchUnread, parseEmail } from '@/lib/gmail'

export const runtime = 'nodejs'
export const maxDuration = 60

// Gelen okunmamış e-postaları çek → müvekkile eşle → messages'a yaz
export async function POST() {
  const supabase = await serverClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('gmail_refresh_token_encrypted, organization_id')
    .eq('id', user.id)
    .single()
  if (!profile?.gmail_refresh_token_encrypted) {
    return NextResponse.json({ error: 'Gmail bağlı değil.' }, { status: 400 })
  }

  let token: string | null
  try {
    token = await accessToken(decrypt(profile.gmail_refresh_token_encrypted))
  } catch {
    return NextResponse.json({ error: 'Gmail yetkisi okunamadı, tekrar bağlayın.' }, { status: 400 })
  }
  if (!token) return NextResponse.json({ error: 'Gmail yetkisi yenilenemedi, tekrar bağlayın.' }, { status: 400 })

  const sb = svcClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const orgId = profile.organization_id as string
  const unread = await fetchUnread(token)
  let synced = 0

  for (const m of unread) {
    const email = parseEmail(m.from)
    const { data: existing } = await sb.from('messages').select('id').eq('external_message_id', m.id).limit(1).maybeSingle()
    if (existing) continue

    const { data: client } = await sb
      .from('clients')
      .select('id')
      .eq('organization_id', orgId)
      .ilike('email', email)
      .limit(1)
      .maybeSingle()

    const { error } = await sb.from('messages').insert({
      organization_id: orgId,
      client_id: client?.id ?? null,
      channel: 'gmail',
      direction: 'inbound',
      external_message_id: m.id,
      from_address: email,
      subject: m.subject || '(konu yok)',
      body: m.snippet || '',
      status: 'delivered',
      received_at: new Date().toISOString(),
    })
    if (!error) synced++
  }

  return NextResponse.json({ synced })
}
