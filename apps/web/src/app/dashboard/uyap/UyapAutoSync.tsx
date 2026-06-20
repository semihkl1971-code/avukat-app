'use client'

import { useEffect, useState } from 'react'

type Settings = { autoDownload: boolean; whatsappNotify: boolean; phone: string; folder: string }
const KEY = 'uyap_autosync'
const DEFAULTS: Settings = { autoDownload: true, whatsappNotify: true, phone: '', folder: 'UYAP-Belgeler' }

export default function UyapAutoSync() {
  const [s, setS] = useState<Settings>(DEFAULTS)
  const [status, setStatus] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    try { const v = localStorage.getItem(KEY); if (v) setS({ ...DEFAULTS, ...JSON.parse(v) }) } catch {}
  }, [])

  function save(next: Partial<Settings>) {
    const merged = { ...s, ...next }
    setS(merged)
    localStorage.setItem(KEY, JSON.stringify(merged))
  }

  // Tarayıcı üzerinden bilgisayara otomatik kayıt (yeni UYAP belgesi geldiğinde tetiklenir)
  async function testFlow() {
    setTesting(true); setStatus(null)
    try {
      if (s.autoDownload) {
        const content = `UYAP Belge (örnek)\nİndirilme: ${new Date().toLocaleString('tr-TR')}\nKlasör: ${s.folder}\n`
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `${s.folder}-ornek-belge.txt`
        a.click()
        URL.revokeObjectURL(a.href)
      }
      if (s.whatsappNotify) {
        const res = await fetch('/api/uyap/notify', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: s.phone, document: 'Örnek UYAP belgesi', case: 'Test Davası 2026/1' }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error ?? 'bildirim hatası')
      }
      setStatus('✓ Test tamam: ' + [s.autoDownload && 'belge bilgisayara indirildi', s.whatsappNotify && 'WhatsApp bildirimi gönderildi'].filter(Boolean).join(' · '))
    } catch (e) {
      setStatus('⚠ ' + (e instanceof Error ? e.message : 'hata'))
    } finally { setTesting(false) }
  }

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: on ? '#4f46e5' : '#d1d5db', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
    </button>
  )

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="font-semibold text-gray-900 mb-1">Otomatik Belge Kaydı & Bildirim</h3>
      <p className="text-sm text-gray-500 mb-5">UYAP&apos;tan yeni bir belge düştüğünde otomatik olarak bilgisayarınıza kaydedilsin ve telefonunuza WhatsApp bildirimi gelsin.</p>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm text-gray-800">💾 Bilgisayara otomatik indir</div>
            <div className="text-xs text-gray-500">Yeni belgeler &quot;{s.folder}&quot; klasörüne otomatik kaydedilir</div>
          </div>
          <Toggle on={s.autoDownload} onClick={() => save({ autoDownload: !s.autoDownload })} />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-sm text-gray-800">📲 WhatsApp telefon bildirimi</div>
            <div className="text-xs text-gray-500">Yeni belge geldiğinde telefonunuza anlık mesaj</div>
          </div>
          <Toggle on={s.whatsappNotify} onClick={() => save({ whatsappNotify: !s.whatsappNotify })} />
        </div>

        {s.whatsappNotify && (
          <input
            value={s.phone}
            onChange={e => save({ phone: e.target.value })}
            placeholder="Bildirim telefonu: +905xxxxxxxxx"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
          />
        )}

        <div className="flex items-center gap-3 pt-2">
          <button onClick={testFlow} disabled={testing} className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
            {testing ? 'Test ediliyor…' : '⚡ Akışı Test Et'}
          </button>
          {status && <span className="text-sm text-gray-600">{status}</span>}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 text-xs p-3 rounded-lg mt-5">
        💡 Tam otomatik (arka planda, tarayıcı kapalıyken) kayıt için <strong>Avukatım Masaüstü</strong> uygulaması gerekir; tarayıcı içi indirme ise belge görüntülenince otomatik tetiklenir.
      </div>
    </div>
  )
}
