import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Case } from '@avukat/types'

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-500/15 text-green-300',
  pending: 'bg-yellow-500/15 text-yellow-300',
  closed: 'bg-white/5 text-gray-500',
  archived: 'bg-red-500/15 text-red-400',
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
        <h2 className="text-2xl font-serif font-bold text-gray-100">Davalar</h2>
        <Link
          href="/dashboard/cases/new"
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
        >
          + Yeni Dava
        </Link>
      </div>

      <div className="bg-[#0e1019] rounded-xl shadow-sm border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-transparent border-b border-white/10">
            <tr>
              {['Başlık', 'Esas No', 'Müvekkil', 'Mahkeme', 'Durum', 'Sonraki Duruşma', ''].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {!cases?.length && (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 py-10">
                  Henüz dava eklenmedi.{' '}
                  <Link href="/dashboard/cases/new" className="text-violet-300 hover:underline">İlk davayı ekle</Link>
                </td>
              </tr>
            )}
            {cases?.map((c: Case & { clients: { full_name: string } }) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium text-gray-100 truncate max-w-xs">{c.title}</td>
                <td className="px-4 py-3 text-gray-500">{c.case_number ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{c.clients?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{c.court_name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[c.status]}`}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">
                  {c.next_hearing_at ? new Date(c.next_hearing_at).toLocaleDateString('tr-TR') : '—'}
                </td>
                <td className="px-4 py-3">
                  <Link href={`/dashboard/cases/${c.id}`} className="text-violet-300 hover:underline text-xs">Detay</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
