import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 30

// Basit IP başına hız sınırı (kredi suistimaline karşı) — saatte 5 soru
const hits = new Map<string, { count: number; reset: number }>()
const LIMIT = 5
const WINDOW = 60 * 60 * 1000

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const rec = hits.get(ip)
  if (!rec || now > rec.reset) { hits.set(ip, { count: 1, reset: now + WINDOW }); return true }
  if (rec.count >= LIMIT) return false
  rec.count++
  return true
}

const DEMO_SYSTEM = `Sen "Avukatım" platformunun yapay zeka hukuk asistanısın (DEMO sürümü). Karşındaki kişi bir AVUKAT/hukuk bürosu çalışanıdır — vatandaş değil. Meslektaşına danışır gibi, uygulamaya dönük yanıt ver.
- Vatandaş diliyle "X nedir" açıklaması yapma; doğrudan yapılması gerekenler, izlenecek adımlar, süreler, dilekçe/delil ve strateji ver
- En fazla 2-3 paragraf, ilgili kanun maddesine (madde no) atıf yap
- Türkçe, profesyonel meslek dili kullan
- Yanıtın sonuna ekle: "Bu bir demo yanıtıdır — tam analiz, dosya yükleme ve derin araştırma için ücretsiz kaydolun."`

export async function POST(req: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'AI servisi şu an yapılandırılmamış.' }, { status: 503 })
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anon'
  if (!rateLimit(ip)) {
    return Response.json({ error: 'Demo deneme limitiniz doldu (saatte 5 soru). Tüm özellikler için ücretsiz kaydolun.' }, { status: 429 })
  }

  const { question } = (await req.json()) as { question?: string }
  if (!question || question.trim().length < 3) {
    return Response.json({ error: 'Lütfen bir soru yazın.' }, { status: 400 })
  }
  if (question.length > 500) {
    return Response.json({ error: 'Soru çok uzun (en fazla 500 karakter).' }, { status: 400 })
  }

  const client = new Anthropic()
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = client.messages.stream({
          model: 'claude-opus-4-8',
          max_tokens: 800,
          system: DEMO_SYSTEM,
          messages: [{ role: 'user', content: question.trim() }],
        })
        for await (const ev of s) {
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(ev.delta.text))
          }
        }
        controller.close()
      } catch {
        controller.enqueue(encoder.encode('\n\n⚠ Şu an yanıt veremiyorum, lütfen tekrar deneyin.'))
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-cache' } })
}
