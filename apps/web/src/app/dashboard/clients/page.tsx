import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Client } from '@avukat/types'

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const { data: clients } = await supabase
    .from('clients')
    .select('*')
    .eq('organization_id', profile!.organization_id!)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-gray-900">Müvekkiller</h2>
        <Link href="/dashboard/clients/new" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + Yeni Müvekkil
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Ad Soyad', 'Tür', 'E-posta', 'Telefon', 'Şehir', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!clients?.length && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-10">
                  Henüz müvekkil eklenmedi.{' '}
                  <Link href="/dashboard/clients/new" className="text-indigo-600 hover:underline">İlk müvekkili ekle</Link>
                </td>
              </tr>
            )}
            {clients?.map((c: Client) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{c.full_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.type === 'individual' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {c.type === 'individual' ? 'Bireysel' : 'Kurumsal'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">{c.email ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.city ?? '—'}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/clients/${c.id}`} className="text-indigo-600 hover:underline text-xs">Detay</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
