import { NextRequest } from 'next/server'

export const runtime = 'nodejs'

// UYAP'tan yeni belge geldiğinde telefona WhatsApp bildirimi gönderir.
export async function POST(req: NextRequest) {
  const { phone, document, case: caseName } = (await req.json()) as { phone?: string; document?: string; case?: string }

  if (!phone) {
    return Response.json({ error: 'Bildirim için telefon numarası gerekli.' }, { status: 400 })
  }

  const body = `⚖️ Avukatım — UYAP Bildirimi\n\nYeni belge: ${document ?? 'Belge'}\nDava: ${caseName ?? '-'}\n\nBelge hesabınıza kaydedildi.`

  // Gerçek gönderim: WhatsApp Cloud API anahtarı tanımlıysa
  if (process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_ID) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ messaging_product: 'whatsapp', to: phone.replace(/^\+/, ''), type: 'text', text: { body } }),
      })
      const data = await res.json()
      if (!res.ok) return Response.json({ error: data?.error?.message ?? 'WhatsApp hatası' }, { status: 400 })
      return Response.json({ ok: true, sent: true })
    } catch {
      return Response.json({ error: 'WhatsApp servisine ulaşılamadı.' }, { status: 502 })
    }
  }

  // Demo modu: anahtar yoksa başarı döndür (gerçek gönderim için WHATSAPP_ACCESS_TOKEN gerekli)
  return Response.json({ ok: true, sent: false, demo: true, preview: body })
}
