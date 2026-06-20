import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Case } from '@avukat/types'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  closed: 'bg-gray-100 text-gray-600',
  archived: 'bg-red-100 text-red-600',
}
const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif', pending: 'Beklemede', closed: 'Kapandı', archived: 'Arşivlendi',
}

export default async function CasesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const { data: cases } = await supabase
    .from('cases')
    .select('*, clients(full_name)')
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-gray-900">Davalar</h2>
        <Link
          href="/dashboard/cases/new"
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Yeni Dava
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Başlık', 'Esas No', 'Müvekkil', 'Mahkeme', 'Durum', 'Sonraki Duruşma', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {!cases?.length && (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-10">
                  Henüz dava eklenmedi.{' '}
                  <Link href="/dashboard/cases/new" className="text-indigo-600 hover:underline">İlk davayı ekle</Link>
                </td>
              </tr>
            )}
            {cases?.map((c: Case & { clients: { full_name: string } }) => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900 truncate max-w-xs">{c.title}</td>
                <td className="px-4 py-3 text-gray-600">{c.case_number ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600">{c.clients?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 truncate max-w-xs">{c.court_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {c.next_hearing_at ? new Date(c.next_hearing_at).toLocaleDateString('tr-TR') : '—'}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/cases/${c.id}`} className="text-indigo-600 hover:underline text-xs">Detay</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
