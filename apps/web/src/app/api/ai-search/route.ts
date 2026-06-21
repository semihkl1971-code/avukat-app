import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSbClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const maxDuration = 60

// Mobil uygulamadan (farklı origin) erişim için CORS
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS })
}

const SYSTEM_PROMPT = `Sen "Avukatım" platformunun yapay zeka hukuk asistanısın. Karşındaki kişi bir AVUKAT ya da hukuk bürosu çalışanıdır — vatandaş değil, meslektaşın. Ona kıdemli bir hukukçunun bir meslektaşına danıştığı şekilde, uygulamaya dönük konuş.

Ton ve yaklaşım:
- Vatandaşa anlatır gibi temel/genel-kültür açıklaması YAPMA. ("X davası nedir, neden açılır" gibi giriş cümleleri kurma.)
- Doğrudan UYGULAMAYA odaklan: dava/iş sürecinde "yapılması gerekenler", izlenecek adımlar, hazırlanacak dilekçe ve deliller, dikkat edilecek süreler (hak düşürücü/zamanaşımı), yetkili-görevli mahkeme, harç ve usul.
- Strateji ve pratik ipuçları ver; olası itiraz/savunmaları ve karşı tarafın hamlelerini öngör.
- Meslek dilini kullan (müvekkil, vekâlet, dosya, esas no, safahat, tensip, bilirkişi, istinaf/temyiz).

Görev:
- Türk hukuku (TMK, TBK, TCK, HMK, CMK, İYUK, İş K., TTK, İİK vb.) — ilgili madde ve güncel Yargıtay içtihatlarına madde/esas numarasıyla atıf yap
- Yüklenen belgeleri (dilekçe, sözleşme, karar, bilirkişi raporu) meslektaş gözüyle incele; eksik, riskli ve lehe/aleyhe noktaları çıkar
- Dilekçe, ihtarname, sözleşme, hesap tablosu taslakları hazırla — doğrudan kullanılabilir nitelikte

Kurallar:
- Türkçe, profesyonel ve net yanıt ver; gereksiz uzatma
- Emin olmadığın içtihat/madde için bunu açıkça belirt
- Web araması yaptıysan kaynak ve tarih ver
- Markdown kullan: başlıklar, maddeler, **kalın** vurgular
- Kısa bir kapanış notu: nihai sorumluluk dosyayı yürüten avukattadır`

type FilePayload = { data: string; mediaType: string; kind: 'image' | 'pdf' | 'text'; name?: string }

export async function POST(req: NextRequest) {
  // Auth: mobil → Authorization: Bearer <token>; web → cookie oturumu
  let user = null
  const authz = req.headers.get('authorization')
  if (authz?.startsWith('Bearer ')) {
    const sb = createSbClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    const { data } = await sb.auth.getUser(authz.slice(7))
    user = data.user
  } else {
    const supabase = await createClient()
    user = (await supabase.auth.getUser()).data.user
  }
  if (!user) return new Response(JSON.stringify({ error: 'Yetkisiz. Lütfen giriş yapın.' }), { status: 401, headers: CORS })
  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY tanımlı değil.' }), { status: 500, headers: CORS })
  }

  const { messages, file, deepResearch } = (await req.json()) as {
    messages: { role: 'user' | 'assistant'; content: string }[]
    file?: FilePayload
    deepResearch?: boolean
  }
  if (!messages?.length) return new Response(JSON.stringify({ error: 'Mesaj gerekli.' }), { status: 400, headers: CORS })

  // Mesajları Anthropic formatına çevir; son kullanıcı mesajına dosya ekle
  const apiMessages: Anthropic.MessageParam[] = messages.map((m, idx) => {
    const isLast = idx === messages.length - 1
    if (isLast && m.role === 'user' && file) {
      const content: Anthropic.ContentBlockParam[] = []
      if (file.kind === 'image') {
        content.push({ type: 'image', source: { type: 'base64', media_type: file.mediaType as 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp', data: file.data } })
      } else if (file.kind === 'pdf') {
        content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data } })
      } else {
        const text = Buffer.from(file.data, 'base64').toString('utf-8').slice(0, 50000)
        content.push({ type: 'text', text: `[Yüklenen belge: ${file.name ?? 'belge'}]\n\n${text}` })
      }
      content.push({ type: 'text', text: m.content })
      return { role: 'user', content }
    }
    return { role: m.role, content: m.content }
  })

  const tools = deepResearch
    ? [{ type: 'web_search_20260209' as const, name: 'web_search' as const, max_uses: 5 }]
    : undefined

  const client = new Anthropic()
  const enc = new TextEncoder()
  const line = (obj: unknown) => enc.encode(JSON.stringify(obj) + '\n')

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = client.messages.stream({
          model: 'claude-opus-4-8',
          max_tokens: 4096,
          thinking: { type: 'adaptive', display: 'summarized' },
          system: SYSTEM_PROMPT,
          messages: apiMessages,
          ...(tools ? { tools } : {}),
        })

        for await (const ev of s) {
          if (ev.type === 'content_block_delta') {
            if (ev.delta.type === 'thinking_delta') controller.enqueue(line({ t: 'k', d: ev.delta.thinking }))
            else if (ev.delta.type === 'text_delta') controller.enqueue(line({ t: 'x', d: ev.delta.text }))
          } else if (ev.type === 'content_block_start' && ev.content_block.type === 'server_tool_use') {
            controller.enqueue(line({ t: 's', d: '🔎 Web\'de araştırılıyor…' }))
          }
        }
        controller.close()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
        controller.enqueue(line({ t: 'x', d: `\n\n⚠ Hata: ${msg}` }))
        controller.close()
      }
    },
  })

  return new Response(stream, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-cache', ...CORS } })
}
