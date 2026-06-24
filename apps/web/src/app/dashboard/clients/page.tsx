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
        <h2 className="text-2xl font-serif font-bold text-gray-100">Müvekkiller</h2>
        <Link href="/dashboard/clients/new" className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
          + Yeni Müvekkil
        </Link>
      </div>

      <div className="bg-[#0e1019] rounded-xl shadow-sm border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-transparent border-b border-white/10">
            <tr>
              {['Ad Soyad', 'Tür', 'E-posta', 'Telefon', 'Şehir', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {!clients?.length && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-10">
                  Henüz müvekkil eklenmedi.{' '}
                  <Link href="/dashboard/clients/new" className="text-violet-300 hover:underline">İlk müvekkili ekle</Link>
                </td>
              </tr>
            )}
            {clients?.map((c: Client) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-gray-100">{c.full_name}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.type === 'individual' ? 'bg-blue-500/15 text-blue-300' : 'bg-purple-500/15 text-purple-300'}`}>
                    {c.type === 'individual' ? 'Bireysel' : 'Kurumsal'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{c.email ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.phone ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.city ?? '—'}</td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/clients/${c.id}`} className="text-violet-300 hover:underline text-xs">Detay</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
