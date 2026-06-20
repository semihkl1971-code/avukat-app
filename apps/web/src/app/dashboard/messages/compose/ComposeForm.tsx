'use client'

import { useActionState, useState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { sendMessage, type FormState } from '../../actions'

type Client = { id: string; full_name: string; phone: string | null; email: string | null }

const TEMPLATES = [
  'Sayın {ad}, davanızla ilgili gelişmeleri paylaşmak isteriz.',
  'Sayın {ad}, duruşmanız {tarih} tarihinde görülecektir. Bilginize.',
  'Sayın {ad}, ödemeniz için son tarih yaklaşmaktadır. Detaylar için arayabilirsiniz.',
  'Merhaba, randevu talebinizi aldık. En kısa sürede dönüş yapacağız.',
]

function SubmitButton({ channel }: { channel: string }) {
  const { pending } = useFormStatus()
  const isWa = channel === 'whatsapp'
  return (
    <button
      type="submit"
      disabled={pending}
      className={`${isWa ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60`}
    >
      {pending ? 'Gönderiliyor...' : isWa ? '💬 WhatsApp Gönder' : '📧 E-posta Gönder'}
    </button>
  )
}

const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5'
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500'

export default function ComposeForm({ clients, initialChannel }: { clients: Client[]; initialChannel: string }) {
  const [state, formAction] = useActionState<FormState, FormData>(sendMessage, {})
  const [channel, setChannel] = useState(initialChannel === 'gmail' ? 'gmail' : 'whatsapp')
  const [clientId, setClientId] = useState('')
  const [body, setBody] = useState('')

  const selected = clients.find(c => c.id === clientId)
  const isWa = channel === 'whatsapp'

  return (
    <form action={formAction} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5 max-w-2xl">
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">⚠ {state.error}</div>
      )}

      {/* Kanal seçimi */}
      <input type="hidden" name="channel" value={channel} />
      <div className="flex gap-2">
        {([['whatsapp', '💬 WhatsApp'], ['gmail', '📧 E-posta']] as const).map(([val, lbl]) => (
          <button
            type="button"
            key={val}
            onClick={() => setChannel(val)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
              channel === val
                ? val === 'whatsapp' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      <div>
        <label className={labelCls}>MÜVEKKİL</label>
        <select name="client_id" value={clientId} onChange={e => setClientId(e.target.value)} className={inputCls}>
          <option value="">— Müvekkil seçin (opsiyonel) —</option>
          {clients.map(c => (
            <option key={c.id} value={c.id}>
              {c.full_name}{isWa ? (c.phone ? ` · ${c.phone}` : ' · telefon yok') : (c.email ? ` · ${c.email}` : ' · e-posta yok')}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>{isWa ? 'TELEFON (müvekkil seçilmezse)' : 'E-POSTA (müvekkil seçilmezse)'}</label>
        <input
          name="to"
          className={inputCls}
          placeholder={isWa ? '+905xxxxxxxxx' : 'ornek@eposta.com'}
          defaultValue={selected ? (isWa ? selected.phone ?? '' : selected.email ?? '') : ''}
          key={clientId + channel}
        />
      </div>

      <div>
        <label className={labelCls}>MESAJ *</label>
        <textarea name="body" required rows={5} value={body} onChange={e => setBody(e.target.value)} className={inputCls} placeholder="Mesajınızı yazın..." />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {TEMPLATES.map((t, i) => (
            <button type="button" key={i} onClick={() => setBody(t.replace('{ad}', selected?.full_name ?? ''))} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-2.5 py-1 rounded-full transition">
              Şablon {i + 1}
            </button>
          ))}
        </div>
      </div>

      {isWa && (
        <p className="text-xs text-gray-400">
          💡 Gerçek gönderim için WhatsApp Cloud API anahtarı gerekir; anahtar yoksa mesaj demo modunda kaydedilir.
        </p>
      )}

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <SubmitButton channel={channel} />
        <Link href="/dashboard/messages" className="text-gray-500 hover:text-gray-700 text-sm">İptal</Link>
      </div>
    </form>
  )
}
