import { createClient } from '@/lib/supabase/server'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const { data: messages } = await supabase
    .from('messages')
    .select('*, clients(full_name)')
    .eq('organization_id', profile!.organization_id)
    .order('created_at', { ascending: false })
    .limit(50)

  const CHANNEL_ICON: Record<string, string> = { whatsapp: '💬', gmail: '📧', sms: '📱' }
  const DIR_COLOR: Record<string, string> = { inbound: 'text-green-600', outbound: 'text-blue-600' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif font-bold text-gray-900">Mesajlar</h2>
        <div className="flex gap-2">
          <a href="/dashboard/messages/compose?channel=whatsapp" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            💬 WhatsApp Gönder
          </a>
          <a href="/dashboard/messages/compose?channel=gmail" className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
            📧 E-posta Gönder
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {!messages?.length ? (
          <div className="p-10 text-center text-gray-500">
            <p className="text-4xl mb-3">💬</p>
            <p className="font-medium">Henüz mesaj yok</p>
            <p className="text-sm mt-1">WhatsApp veya Gmail entegrasyonunu ayarlardan yapılandırın</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {messages.map((m: Record<string, unknown>) => (
              <div key={m.id as string} className="flex items-start gap-4 p-4 hover:bg-gray-50 transition">
                <span className="text-xl">{CHANNEL_ICON[m.channel as string]}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 text-sm">
                      {(m.clients as Record<string, unknown>)?.full_name as string ?? m.from_address as string ?? 'Bilinmiyor'}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(m.created_at as string).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                  {m.subject ? <div className="text-xs text-gray-600 mt-0.5">{m.subject as string}</div> : null}
                  <p className="text-sm text-gray-600 mt-1 truncate">{m.body as string}</p>
                </div>
                <span className={`text-xs font-medium ${DIR_COLOR[m.direction as string]}`}>
                  {m.direction === 'inbound' ? '← Gelen' : '→ Giden'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
