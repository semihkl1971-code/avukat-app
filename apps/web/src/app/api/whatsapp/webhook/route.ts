import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export const runtime = 'nodejs'

// Meta (WhatsApp Cloud API) webhook — gelen mesajları alır, müvekkile eşleyip DB'ye yazar.
// Gönderme tarafı: dashboard/actions.ts `sendMessage`. Bu route sadece GELEN mesajlar içindir.
// Gerekli env (Vercel): WHATSAPP_VERIFY_TOKEN, META_APP_SECRET, SUPABASE_SERVICE_ROLE_KEY.

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// 1) Doğrulama (Meta panelinde webhook kurarken çağrılır)
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const verify = process.env.WHATSAPP_VERIFY_TOKEN
  if (p.get('hub.mode') === 'subscribe' && verify && p.get('hub.verify_token') === verify) {
    return new Response(p.get('hub.challenge') ?? '', { status: 200 })
  }
  return new Response('Forbidden', { status: 403 })
}

// 2) Gelen mesaj
export async function POST(req: NextRequest) {
  const raw = await req.text()

  // İmza doğrulama (META_APP_SECRET tanımlıysa) — Meta ham gövde üzerinden HMAC üretir
  const appSecret = process.env.META_APP_SECRET
  if (appSecret) {
    const sig = req.headers.get('x-hub-signature-256')?.replace('sha256=', '')
    const expected = crypto.createHmac('sha256', appSecret).update(raw).digest('hex')
    if (!sig || sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) {
      return new Response('Invalid signature', { status: 401 })
    }
  }

  let body: Record<string, unknown>
  try { body = JSON.parse(raw) } catch { return new Response('Bad request', { status: 400 }) }

  const entry = (body['entry'] as Record<string, unknown>[])?.[0]
  const changes = (entry?.['changes'] as Record<string, unknown>[])?.[0]
  const value = changes?.['value'] as Record<string, unknown> | undefined
  const messages = (value?.['messages'] as Record<string, unknown>[]) ?? []
  if (messages.length === 0) return Response.json({ status: 'ignored' })

  const supabase = sb()

  for (const msg of messages) {
    const from = msg['from'] as string
    const msgId = msg['id'] as string
    const type = msg['type'] as string
    // Sadece metin (diğer tipler için kısa not düşülür)
    const text = type === 'text'
      ? (msg['text'] as Record<string, string>)?.['body']
      : `[${type} mesajı]`
    if (!from) continue

    // Müvekkili telefonla eşleştir — Türkçe format varyasyonları
    // WhatsApp 'from' = ülke koduyla, +'sız: örn "905383798186"
    const natl = from.replace(/^90/, '') // ulusal kısım: "5383798186"
    const candidates = Array.from(new Set([
      `+${from}`,      // +905383798186
      from,            // 905383798186
      `+90${natl}`,    // +905383798186
      `90${natl}`,     // 905383798186
      `0${natl}`,      // 05383798186 (yerel)
      natl,            // 5383798186
    ]))
    const { data: client } = await supabase
      .from('clients')
      .select('id, organization_id')
      .in('phone', candidates)
      .limit(1)
      .maybeSingle()

    // organization_id NOT NULL: yalnızca kayıtlı müvekkilden gelen mesajı sakla
    if (!client) continue

    // Aynı mesaj iki kez gelirse (Meta retry) tekrar yazma
    const { data: existing } = await supabase
      .from('messages')
      .select('id')
      .eq('external_message_id', msgId)
      .limit(1)
      .maybeSingle()
    if (existing) continue

    await supabase.from('messages').insert({
      organization_id: client.organization_id,
      client_id: client.id,
      channel: 'whatsapp',
      direction: 'inbound',
      external_message_id: msgId,
      from_address: `+${from}`,
      body: text ?? '',
      status: 'delivered',
      received_at: new Date().toISOString(),
    })
  }

  return Response.json({ status: 'ok' })
}
