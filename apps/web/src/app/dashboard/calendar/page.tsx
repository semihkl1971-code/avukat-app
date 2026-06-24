import { createClient } from '@/lib/supabase/server'

export default async function CalendarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)

  const { data: hearings } = await supabase
    .from('hearings')
    .select('*, cases(title, case_number)')
    .eq('organization_id', profile!.organization_id!)
    .gte('scheduled_at', startOfMonth.toISOString())
    .lte('scheduled_at', endOfMonth.toISOString())
    .order('scheduled_at')

  const grouped: Record<string, typeof hearings> = {}
  hearings?.forEach(h => {
    const day = new Date(h.scheduled_at).toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    if (!grouped[day]) grouped[day] = []
    grouped[day]!.push(h)
  })

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-gray-100">
          Duruşma Takvimi — {now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
        </h2>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="bg-[#0e1019] rounded-xl shadow-sm border border-white/10 p-12 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="font-medium text-gray-300">Bu ay duruşma bulunamadı</p>
          <p className="text-sm text-gray-500 mt-1">Yeni duruşmalar Davalar sayfasından eklenebilir</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([day, items]) => (
            <div key={day} className="bg-[#0e1019] rounded-xl shadow-sm border border-white/10 overflow-hidden">
              <div className="bg-violet-500/10 px-5 py-3 border-b border-white/10">
                <h3 className="font-semibold text-violet-200 text-sm capitalize">{day}</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {items?.map(h => {
                  const caseData = h.cases as { title: string; case_number?: string } | null
                  return (
                    <div key={h.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/5">
                      <div className="text-center min-w-16">
                        <div className="text-lg font-bold text-violet-300">
                          {new Date(h.scheduled_at).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-100">{caseData?.title ?? 'Dava'}</div>
                        <div className="text-sm text-gray-500">{h.court_name ?? '—'} {h.courtroom ? `· ${h.courtroom}` : ''}</div>
                      </div>
                      {h.uyap_synced && (
                        <span className="text-xs bg-purple-500/15 text-purple-300 px-2 py-0.5 rounded-full">UYAP</span>
                      )}
                      {h.outcome && (
                        <span className="text-xs bg-green-500/15 text-green-300 px-2 py-0.5 rounded-full">{h.outcome}</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
