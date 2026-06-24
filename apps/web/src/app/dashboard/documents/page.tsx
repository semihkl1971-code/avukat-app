import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Document } from '@avukat/types'

const SOURCE_LABELS: Record<string, string> = { upload: 'Yüklendi', uyap: 'UYAP', email: 'E-posta', whatsapp: 'WhatsApp' }
const SOURCE_COLORS: Record<string, string> = { upload: 'bg-blue-500/15 text-blue-300', uyap: 'bg-purple-500/15 text-purple-300', email: 'bg-red-500/15 text-red-300', whatsapp: 'bg-green-500/15 text-green-300' }

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const { data: documents } = await supabase
    .from('documents')
    .select('*, cases(title), clients(full_name)')
    .eq('organization_id', profile!.organization_id!)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-gray-100">Belgeler</h2>
        <label className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition cursor-pointer">
          + Belge Yükle
          <input type="file" className="hidden" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
        </label>
      </div>

      <div className="bg-[#0e1019] rounded-xl shadow-sm border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-transparent border-b border-white/10">
            <tr>
              {['Belge Adı', 'Kaynak', 'Dava', 'Müvekkil', 'Boyut', 'Tarih'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {!documents?.length && (
              <tr>
                <td colSpan={6} className="text-center text-gray-500 py-10">
                  Henüz belge yüklenmedi.
                </td>
              </tr>
            )}
            {documents?.map((d: Document & { cases: { title: string } | null; clients: { full_name: string } | null }) => (
              <tr key={d.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {d.mime_type?.includes('pdf') ? '📄' : d.mime_type?.includes('image') ? '🖼' : '📝'}
                    </span>
                    <span className="font-medium text-gray-100 truncate max-w-xs">{d.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SOURCE_COLORS[d.source] ?? 'bg-white/5 text-gray-500'}`}>
                    {SOURCE_LABELS[d.source] ?? d.source}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500 truncate max-w-xs">{d.cases?.title ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{d.clients?.full_name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{d.file_size ? formatBytes(d.file_size) : '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(d.created_at).toLocaleDateString('tr-TR')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
