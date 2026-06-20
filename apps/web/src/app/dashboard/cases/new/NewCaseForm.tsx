'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createCaseRecord, type FormState } from '../../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60"
    >
      {pending ? 'Kaydediliyor...' : 'Davayı Kaydet'}
    </button>
  )
}

const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5'
const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500'

const CASE_TYPES = [
  { value: 'civil', label: 'Hukuk (Asliye)' },
  { value: 'criminal', label: 'Ceza' },
  { value: 'commercial', label: 'Ticaret' },
  { value: 'family', label: 'Aile' },
  { value: 'labor', label: 'İş' },
  { value: 'administrative', label: 'İdari' },
  { value: 'other', label: 'Diğer' },
]

export default function NewCaseForm({ clients }: { clients: { id: string; full_name: string }[] }) {
  const [state, formAction] = useActionState<FormState, FormData>(createCaseRecord, {})

  return (
    <form action={formAction} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
      {state.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">
          ⚠ {state.error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelCls}>DAVA BAŞLIĞI *</label>
          <input name="title" required className={inputCls} placeholder="Yılmaz - Demir Alacak Davası" />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>MÜVEKKİL *</label>
          <select name="client_id" required className={inputCls} defaultValue="">
            <option value="" disabled>Müvekkil seçin...</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>{c.full_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>ESAS NO</label>
          <input name="case_number" className={inputCls} placeholder="2024/1547" />
        </div>
        <div>
          <label className={labelCls}>DAVA TÜRÜ</label>
          <select name="case_type" className={inputCls} defaultValue="civil">
            {CASE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>MAHKEME</label>
          <input name="court_name" className={inputCls} placeholder="İstanbul 5. Asliye Hukuk Mahkemesi" />
        </div>
        <div>
          <label className={labelCls}>DURUM</label>
          <select name="status" className={inputCls} defaultValue="active">
            <option value="active">Aktif</option>
            <option value="pending">Beklemede</option>
            <option value="closed">Kapandı</option>
            <option value="archived">Arşiv</option>
          </select>
        </div>
        <div className="col-span-2">
          <label className={labelCls}>SONRAKİ DURUŞMA</label>
          <input name="next_hearing_at" type="datetime-local" className={inputCls} />
        </div>
        <div className="col-span-2">
          <label className={labelCls}>AÇIKLAMA</label>
          <textarea name="description" rows={3} className={inputCls} placeholder="Dava ile ilgili detaylar..." />
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
        <SubmitButton />
        <Link href="/dashboard/cases" className="text-gray-500 hover:text-gray-700 text-sm">İptal</Link>
      </div>
    </form>
  )
}
