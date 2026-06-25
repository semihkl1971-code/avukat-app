import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import crypto from 'crypto'
import { whatsappUsage } from '@/lib/usage'
import type { SubscriptionTier } from '@avukat/types'

export const runtime = 'nodejs'
export const maxDuration = 30

// Meta (WhatsApp Cloud API) webhook — gelen mesajları alır, müvekkile eşleyip DB'ye yazar.
// Otomatik AI yanıtı: env WHATSAPP_AUTOREPLY=ai ise gelen mesaja chatbot cevap verir.
// Gerekli env (Vercel): WHATSAPP_VERIFY_TOKEN, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID,
//   ANTHROPIC_API_KEY (autoreply için), META_APP_SECRET (ops.), SUPABASE_SERVICE_ROLE_KEY.

function sb() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export type BotKeyword = { keyword: string; reply: string }
export type BotConfig = {
  enabled?: boolean
  firmName?: string
  hours?: string
  services?: string
  keywords?: BotKeyword[]
}

// Büroya göre özelleştirilebilir sistem promptu
function buildSystem(cfg: BotConfig): string {
  const firm = cfg.firmName?.trim() || 'hukuk büromuz'
  const hours = cfg.hours?.trim()
  const services = cfg.services?.trim()
  return `Sen "${firm}" adlı hukuk bürosunun WhatsApp asistanısın. Müvekkillere ve arayanlara kibar, kısa, yardımcı yanıt veriyorsun.
${hours ? `\nÇalışma saatleri: ${hours}.` : ''}${services ? `\nBüronun başlıca çalışma alanları: ${services}.` : ''}

Kurallar:
- BAĞLAYICI hukuki görüş veya garanti VERME. Spesifik hukuki tavsiye/dava değerlendirmesi gerektiren konularda: "Bu konuda avukatımız en kısa sürede sizinle iletişime geçecek" de.
- Randevu talebi, dosya/dava durumu sorusu, çalışma saatleri, genel bilgilendirme, iletişim gibi konularda yardımcı ol.
- Gerekirse bilgi iste (ad-soyad, konu, dosya no).
- Türkçe, samimi ama profesyonel. WhatsApp mesajı gibi KISA (en fazla 2-3 cümle). Emoji çok az.
- Acil/ciddi durumlarda doğrudan büroyu aramalarını öner.`
}

// Anahtar kelime eşleştirme — gelen metin bir anahtar kelimeyi içeriyorsa hazır yanıt
function matchKeyword(text: string, keywords?: BotKeyword[]): string | null {
  if (!keywords?.length) return null
  const t = text.toLowerCase()
  for (const k of keywords) {
    const kw = k.keyword?.toLowerCase().trim()
    if (kw && k.reply?.trim() && t.includes(kw)) return k.reply.trim()
  }
  return null
}

// Avukat devraldı mı? Son 12 saatte insan (is_auto=false) giden mesajı varsa bot susar.
async function recentHumanReply(supabase: SupabaseClient, clientId: string): Promise<boolean> {
  const since = new Date(Date.now() - 12 * 3600 * 1000).toISOString()
  const { data, error } = await supabase
    .from('messages')
    .select('id')
    .eq('client_id', clientId)
    .eq('channel', 'whatsapp')
    .eq('direction', 'outbound')
    .eq('is_auto', false)
    .gte('created_at', since)
    .limit(1)
  if (error) return false // is_auto kolonu henüz yoksa devralma kapalı
  return (data?.length ?? 0) > 0
}

// Bot giden mesajını DB'ye yaz (is_auto=true); kolon yoksa zarif fallback
async function insertBotOutbound(supabase: SupabaseClient, orgId: string, clientId: string, to: string, extId: string, body: string) {
  const base = {
    organization_id: orgId, client_id: clientId, channel: 'whatsapp', direction: 'outbound',
    external_message_id: extId, to_address: `+${to}`, body, status: 'sent', sent_at: new Date().toISOString(),
  }
  const { error } = await supabase.from('messages').insert({ ...base, is_auto: true })
  if (error) await supabase.from('messages').insert(base)
}

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

// Bu müvekkilin son yazışmasını bağlam alıp AI yanıtı üret (büroya göre özelleştirilmiş)
async function aiReply(supabase: SupabaseClient, clientId: string, cfg: BotConfig): Promise<string | null> {
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
      system: buildSystem(cfg),
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

    // Otomatik bot yanıtı — sadece metin mesajlarına
    if (type === 'text' && text) {
      // Büro bot ayarları (organizations.settings.whatsappBot)
      const { data: org } = await supabase
        .from('organizations')
        .select('settings, subscription_tier')
        .eq('id', client.organization_id as string)
        .single()
      const cfg: BotConfig = ((org?.settings as Record<string, unknown>)?.['whatsappBot'] as BotConfig) ?? {}
      const tier = ((org?.subscription_tier as SubscriptionTier) ?? 'free')
      // Açık mı? (org ayarı; yoksa eski env ile geri uyumluluk)
      const enabled = cfg.enabled ?? (process.env.WHATSAPP_AUTOREPLY === 'ai')
      // Plan gereği WhatsApp hakkı (Solo'dan itibaren) ve aylık limit dolmamış olmalı
      const usage = await whatsappUsage(supabase, client.organization_id as string, tier)
      const withinPlan = usage.limit !== 0 && usage.ok

      if (enabled && withinPlan && !(await recentHumanReply(supabase, client.id as string))) {
        // Önce anahtar kelime, yoksa AI
        let reply = matchKeyword(text, cfg.keywords)
        if (!reply) reply = await aiReply(supabase, client.id as string, cfg)
        if (reply) {
          const sentId = await sendWaText(from, reply)
          if (sentId) await insertBotOutbound(supabase, client.organization_id as string, client.id as string, from, sentId, reply)
        }
      }
    }
  }

  return Response.json({ status: 'ok' })
}
