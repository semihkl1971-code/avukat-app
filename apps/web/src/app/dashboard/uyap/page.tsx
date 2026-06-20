import { createClient } from '@/lib/supabase/server'
import UyapAutoSync from './UyapAutoSync'

export default async function UyapPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, uyap_credentials_encrypted')
    .eq('id', user!.id)
    .single()

  const hasUyap = !!profile?.uyap_credentials_encrypted

  const { data: syncLogs } = await supabase
    .from('uyap_sync_log')
    .select('*')
    .eq('organization_id', profile!.organization_id)
    .order('synced_at', { ascending: false })
    .limit(10)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-gray-900">UYAP Entegrasyonu</h2>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${hasUyap ? 'bg-green-100' : 'bg-gray-100'}`}>
            🏛
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900">UYAP Bağlantısı</h3>
            <p className={`text-sm mt-0.5 ${hasUyap ? 'text-green-600' : 'text-gray-500'}`}>
              {hasUyap ? '✓ Bağlı — Kimlik bilgileri kayıtlı' : 'Bağlı değil — UYAP kimlik bilgilerinizi girin'}
            </p>
          </div>
          {hasUyap && (
            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">Aktif</span>
          )}
        </div>

        {!hasUyap && (
          <form action="/api/uyap/connect" method="POST" className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">TC Kimlik No</label>
                <input name="tcNo" type="text" maxLength={11} pattern="[0-9]{11}"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="12345678901" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">UYAP Şifre</label>
                <input name="password" type="password"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••" />
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-3 rounded-lg">
              ⚠ Kimlik bilgileriniz AES-256 şifrelenerek saklanır. UYAP'a yalnızca güvenli bağlantı üzerinden erişilir.
            </div>
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition">
              UYAP'a Bağlan
            </button>
          </form>
        )}

        {hasUyap && (
          <div className="mt-4 flex gap-3">
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition">
              🔄 Şimdi Senkronize Et
            </button>
            <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
              Bağlantıyı Kaldır
            </button>
          </div>
        )}
      </div>

      <UyapAutoSync />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Özellikler</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: '📋', title: 'Dava Sorgulama', desc: 'UYAP\'tan dava bilgilerini otomatik çekin', available: true },
            { icon: '📅', title: 'Duruşma Takibi', desc: 'Duruşma tarihlerini otomatik senkronize edin', available: true },
            { icon: '📄', title: 'Belge Görüntüleme', desc: 'UYAP belgelerine platforma erişin', available: true },
            { icon: '✍', title: 'Belge Gönderme', desc: 'e-imza ile UYAP\'a belge gönderin', available: false },
            { icon: '🔔', title: 'Otomatik Uyarılar', desc: 'Duruşma günü WhatsApp ile hatırlatma', available: true },
            { icon: '📊', title: 'Dava Analizi', desc: 'UYAP verilerinden otomatik raporlar', available: false },
          ].map(f => (
            <div key={f.title} className={`p-4 rounded-lg border ${f.available ? 'border-indigo-100 bg-indigo-50' : 'border-gray-100 bg-gray-50'}`}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className={`font-medium text-sm ${f.available ? 'text-indigo-900' : 'text-gray-500'}`}>{f.title}</div>
              <div className="text-xs text-gray-500 mt-1">{f.desc}</div>
              {!f.available && <span className="text-xs text-amber-600 mt-1 block">Yakında</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Senkronizasyon Geçmişi</h3>
        {!syncLogs?.length ? (
          <p className="text-sm text-gray-500">Henüz senkronizasyon yapılmadı.</p>
        ) : (
          <div className="space-y-2">
            {syncLogs.map((log: Record<string, unknown>) => (
              <div key={log.id as string} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className={`font-medium ${log.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>
                    {log.status === 'success' ? '✓ Başarılı' : '✗ Hata'}
                  </span>
                  <span className="text-gray-500 ml-2">{log.sync_type as string}</span>
                </div>
                <span className="text-gray-400 text-xs">
                  {new Date(log.synced_at as string).toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
