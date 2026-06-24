import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: caseData } = await supabase
    .from('cases')
    .select('*, clients(full_name, phone, email), hearings(id, scheduled_at, court_name, outcome), documents(id, name, created_at)')
    .eq('id', id)
    .single()

  if (!caseData) notFound()

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-500/15 text-green-300',
    pending: 'bg-yellow-500/15 text-yellow-300',
    closed: 'bg-white/5 text-gray-500',
    archived: 'bg-red-500/15 text-red-400',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/cases" className="hover:text-violet-300">Davalar</Link>
        <span>/</span>
        <span className="text-gray-100">{caseData.title}</span>
      </div>

      <div className="bg-[#0e1019] rounded-xl shadow-sm border border-white/10 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-serif font-bold text-gray-100">{caseData.title}</h2>
            <div className="flex items-center gap-3 mt-2">
              {caseData.case_number && (
                <span className="text-sm text-gray-500">Esas: {caseData.case_number}</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[caseData.status]}`}>
                {caseData.status}
              </span>
              {caseData.uyap_case_id && (
                <span className="px-2 py-0.5 bg-blue-500/15 text-blue-300 rounded-full text-xs font-medium">UYAP ✓</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Müvekkil', value: caseData.clients?.full_name },
            { label: 'Mahkeme', value: caseData.court_name },
            { label: 'Dava Türü', value: caseData.case_type },
            { label: 'Açılış Tarihi', value: caseData.opened_at ? new Date(caseData.opened_at).toLocaleDateString('tr-TR') : null },
            { label: 'Sonraki Duruşma', value: caseData.next_hearing_at ? new Date(caseData.next_hearing_at).toLocaleDateString('tr-TR') : null },
            { label: 'Müvekkil Telefon', value: caseData.clients?.phone },
          ].map(item => item.value ? (
            <div key={item.label}>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{item.label}</div>
              <div className="text-sm font-medium text-gray-100 mt-0.5">{item.value}</div>
            </div>
          ) : null)}
        </div>

        {caseData.description && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">Açıklama</div>
            <p className="text-sm text-gray-300">{caseData.description}</p>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-[#0e1019] rounded-xl shadow-sm border border-white/10 p-6">
          <h3 className="font-semibold text-gray-100 mb-4">Duruşmalar ({caseData.hearings?.length ?? 0})</h3>
          {!caseData.hearings?.length ? (
            <p className="text-sm text-gray-500">Duruşma kaydı yok.</p>
          ) : (
            <div className="space-y-2">
              {caseData.hearings.map((h: Record<string, unknown>) => (
                <div key={h.id as string} className="flex items-center justify-between text-sm p-2 bg-transparent rounded-lg">
                  <div>
                    <div className="font-medium">{new Date(h.scheduled_at as string).toLocaleDateString('tr-TR')}</div>
                    <div className="text-gray-500 text-xs">{h.court_name as string}</div>
                  </div>
                  {h.outcome ? <span className="text-xs text-gray-500">{h.outcome as string}</span> : null}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#0e1019] rounded-xl shadow-sm border border-white/10 p-6">
          <h3 className="font-semibold text-gray-100 mb-4">Belgeler ({caseData.documents?.length ?? 0})</h3>
          {!caseData.documents?.length ? (
            <p className="text-sm text-gray-500">Belge yok.</p>
          ) : (
            <div className="space-y-2">
              {caseData.documents.map((d: Record<string, unknown>) => (
                <div key={d.id as string} className="flex items-center gap-2 text-sm p-2 bg-transparent rounded-lg">
                  <span>📄</span>
                  <span className="flex-1 truncate">{d.name as string}</span>
                  <span className="text-xs text-gray-500">{new Date(d.created_at as string).toLocaleDateString('tr-TR')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
