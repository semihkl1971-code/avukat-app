'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import Link from 'next/link'
import { createClientRecord, type FormState } from '../../actions'

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition disabled:opacity-60"
    >
      {pending ? 'Kaydediliyor...' : 'Müvekkili Kaydet'}
    </button>
  )
}

const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5'
const inputCls = 'w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500'

export default function NewClientPage() {
  const [state, formAction] = useActionState<FormState, FormData>(createClientRecord, {})

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/clients" className="hover:text-violet-300">Müvekkiller</Link>
        <span>/</span>
        <span className="text-gray-100">Yeni Müvekkil</span>
      </div>

      <h2 className="text-2xl font-serif font-bold text-gray-100">Yeni Müvekkil Ekle</h2>

      <form action={formAction} className="bg-[#0e1019] rounded-xl shadow-sm border border-white/10 p-6 space-y-5">
        {state.error && (
          <div className="bg-red-500/10 border border-red-200 text-red-300 rounded-lg px-4 py-2.5 text-sm">
            ⚠ {state.error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className={labelCls}>AD SOYAD / ÜNVAN *</label>
            <input name="full_name" required className={inputCls} placeholder="Ahmet Yılmaz veya Aras Holding A.Ş." />
          </div>
          <div>
            <label className={labelCls}>MÜVEKKİL TÜRÜ</label>
            <select name="type" className={inputCls} defaultValue="individual">
              <option value="individual">Bireysel</option>
              <option value="corporate">Kurumsal</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>ŞEHİR</label>
            <input name="city" className={inputCls} placeholder="İstanbul" />
          </div>
          <div>
            <label className={labelCls}>TC KİMLİK NO</label>
            <input name="tc_kimlik_no" className={inputCls} placeholder="11 haneli" maxLength={11} />
          </div>
          <div>
            <label className={labelCls}>VERGİ NO (Kurumsal)</label>
            <input name="tax_number" className={inputCls} placeholder="10 haneli" />
          </div>
          <div>
            <label className={labelCls}>TELEFON</label>
            <input name="phone" className={inputCls} placeholder="05xx xxx xx xx" />
          </div>
          <div>
            <label className={labelCls}>E-POSTA</label>
            <input name="email" type="email" className={inputCls} placeholder="ornek@email.com" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>ADRES</label>
            <input name="address" className={inputCls} placeholder="Açık adres" />
          </div>
          <div className="col-span-2">
            <label className={labelCls}>NOTLAR</label>
            <textarea name="notes" rows={3} className={inputCls} placeholder="Müvekkille ilgili notlar..." />
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
          <SubmitButton />
          <Link href="/dashboard/clients" className="text-gray-500 hover:text-gray-300 text-sm">İptal</Link>
        </div>
      </form>
    </div>
  )
}
