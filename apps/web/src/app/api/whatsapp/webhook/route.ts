import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import crypto from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 30

// Meta (WhatsApp Cloud API) webhook — gelen mesajları alır, müvekkile eşleyip DB'ye yazar.
// Otomatik AI yanıtı: env WHATSAPP_AUTOREPLY=ai ise gelen mesaja chatbot cevap verir.
// Gerekli env (Vercel): WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID,
//   ANTHROPIC_API_KEY (autoreply için), META_APP_SECRET (ops.), SUPABASE_SERVICE_ROLE_KEY.

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const BOT_SYSTEM = `Sen bir hukuk bürosunun WhatsApp asistanısın ("Avukatım"). Müvekkillere ve arayanlara kibar, kısa, yardımcı yanıt veriyorsun.

Kurallar:
- BAĞLAYICI hukuki görüş veya garanti VERME. Spesifik hukuki tavsiye/dava değerlendirmesi gerektiren konularda: "Bu konuda avukatımız en kısa sürede sizinle iletişime geçecek" de.
- Randevu talebi, dosya/dava durumu sorusu, çalışma saatleri, genel bilgilendirme, iletişim gibi konularda yardımcı ol.
- Gerekirse bilgi iste (ad-soyad, konu, dosya no).
- Türkçe, samimi ama profesyonel. WhatsApp mesajı gibi KISA (en fazla 2-3 cümle). Emoji çok az.
- Acil/ciddi durumlarda doğrudan büroyu aramalarını öner.`

// WhatsApp düz metin gönder
async function sendWaText(to: string, body: string): Promise<string | null> {
  const phoneId = process.env.WHATSAPP_PHONE_ID
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  if (!phoneId || !token) return null
  const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
  })
  const d = (await res.json()) as { messages?: { id: string }[] }
  return res.ok ? (d.messages?.[0]?.id ?? null) : null
}

// Bu müvekkilin son yazışmasını bağlam alıp AI yanıtı üret
async function aiReply(supabase: SupabaseClient, clientId: string): Promise<string | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null
  const { data: history } = await supabase
    .from('messages')
    .select('direction, body, created_at')
    .eq('client_id', clientId)
    .eq('channel', 'whatsapp')
    .order('created_at', { ascending: false })
    .limit(8)
  const msgs: Anthropic.MessageParam[] = (history ?? [])
    .reverse()
    .filter(m => m.body)
    .map(m => ({ role: m.direction === 'inbound' ? 'user' : 'assistant', content: m.body as string }))
  if (msgs.length === 0 || msgs[msgs.length - 1].role !== 'user') return null
  try {
    const client = new Anthropic()
    const res = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 320,
      system: BOT_SYSTEM,
      messages: msgs,
    })
    const blk = res.content.find(b => b.type === 'text') as { text: string } | undefined
    return blk?.text?.trim() || null
  } catch {
    return null
  }
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

    // Otomatik AI yanıtı (env WHATSAPP_AUTOREPLY=ai ise) — sadece metin mesajlarına
    if (process.env.WHATSAPP_AUTOREPLY === 'ai' && type === 'text') {
      const reply = await aiReply(supabase, client.id as string)
      if (reply) {
        const sentId = await sendWaText(from, reply)
        if (sentId) {
          await supabase.from('messages').insert({
            organization_id: client.organization_id,
            client_id: client.id,
            channel: 'whatsapp',
            direction: 'outbound',
            external_message_id: sentId,
            to_address: `+${from}`,
            body: reply,
            status: 'sent',
            sent_at: new Date().toISOString(),
          })
        }
      }
    }
  }

  return Response.json({ status: 'ok' })
}
