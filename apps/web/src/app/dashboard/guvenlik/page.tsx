'use client'

import { useEffect, useState } from 'react'
import { getSecuritySettings, saveSecuritySettings, type SecurityRow } from '../tracking-actions'

type Sec = SecurityRow
const DEFAULTS: Sec = { two_fa: false, device_lock: true, ip_allowlist: false, auto_logout: true, encrypt_docs: true, phishing_guard: true }

const ACTIVITY = [
  { t: 'Başarılı giriş', d: 'İstanbul, TR · Chrome', when: '2 saat önce', ok: true },
  { t: 'UYAP senkronizasyonu', d: 'Şifreli kanal · TLS 1.3', when: '5 saat önce', ok: true },
  { t: 'Engellenen giriş denemesi', d: 'Bilinmeyen IP · Almanya', when: 'Dün 23:14', ok: false },
  { t: 'Belge dışa aktarıldı', d: 'Av. Selin A. · 2 dosya', when: '2 gün önce', ok: true },
]

export default function GuvenlikPage() {
  const [s, setS] = useState<Sec>(DEFAULTS)
  useEffect(() => { getSecuritySettings().then(setS) }, [])
  function save(next: Partial<Sec>) { const m = { ...s, ...next }; setS(m); saveSecuritySettings(m) }

  // Güvenlik skoru: açık koruma sayısına göre
  const flags = Object.values(s)
  const score = Math.round((flags.filter(Boolean).length / flags.length) * 100)
  const scoreColor = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444'

  const Toggle = ({ on, onClick }: { on: boolean; onClick: () => void }) => (
    <button onClick={onClick} style={{ width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer', background: on ? '#10b981' : '#d1d5db', position: 'relative', flexShrink: 0 }}>
      <span style={{ position: 'absolute', top: 2, left: on ? 22 : 2, width: 20, height: 20, borderRadius: '50%', background: '#fff', transition: 'left .2s' }} />
    </button>
  )

  const CONTROLS: { key: keyof Sec; icon: string; title: string; desc: string }[] = [
    { key: 'two_fa', icon: '🔐', title: 'İki Faktörlü Doğrulama (2FA)', desc: 'Girişte SMS/uygulama kodu zorunlu olur' },
    { key: 'device_lock', icon: '📱', title: 'Cihaz Kilidi', desc: 'Yalnızca onaylı cihazlardan erişim' },
    { key: 'ip_allowlist', icon: '🌐', title: 'IP Beyaz Listesi', desc: 'Sadece büronuzun IP adreslerinden giriş' },
    { key: 'auto_logout', icon: '⏱️', title: 'Otomatik Oturum Kapatma', desc: '15 dk hareketsizlikte oturumu kapat' },
    { key: 'encrypt_docs', icon: '🔒', title: 'Belge Şifreleme (AES-256)', desc: 'Tüm dosyalar uçtan uca şifrelenir' },
    { key: 'phishing_guard', icon: '🛡️', title: 'Oltalama & Kötü Amaçlı Bağlantı Koruması', desc: 'Gelen mesajlardaki riskli linkleri engelle' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-serif font-bold text-gray-900">Siber Güvenlik Merkezi</h2>
        <p className="text-sm text-gray-500 mt-1">Müvekkil verileriniz ve dava dosyalarınız için güvenlik kalkanı.</p>
      </div>

      {/* Skor + özet */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-5">
          <div style={{ position: 'relative', width: 84, height: 84 }}>
            <svg width="84" height="84" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="42" cy="42" r="36" fill="none" stroke="#eef2f7" strokeWidth="8" />
              <circle cx="42" cy="42" r="36" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 36}`} strokeDashoffset={`${2 * Math.PI * 36 * (1 - score / 100)}`} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: scoreColor }}>{score}</div>
          </div>
          <div>
            <div className="font-semibold text-gray-900">Güvenlik Skoru</div>
            <div className="text-sm text-gray-500">{score >= 80 ? 'Mükemmel koruma' : score >= 50 ? 'İyi — geliştirilebilir' : 'Zayıf — önlem alın'}</div>
          </div>
        </div>
        {[
          { icon: '🔒', label: 'Şifreleme', val: 'AES-256 Aktif', color: 'text-green-600' },
          { icon: '🇹🇷', label: 'Veri Lokasyonu', val: 'Türkiye (KVKK)', color: 'text-green-600' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4">
            <div className="text-3xl">{c.icon}</div>
            <div><div className="text-xs text-gray-500">{c.label}</div><div className={`font-semibold ${c.color}`}>{c.val}</div></div>
          </div>
        ))}
      </div>

      {/* Kontroller */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Güvenlik Kontrolleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {CONTROLS.map(c => (
            <div key={c.key} className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className="text-xl">{c.icon}</span>
                <div><div className="font-medium text-sm text-gray-800">{c.title}</div><div className="text-xs text-gray-500">{c.desc}</div></div>
              </div>
              <Toggle on={s[c.key]} onClick={() => save({ [c.key]: !s[c.key] })} />
            </div>
          ))}
        </div>
      </div>

      {/* Tehdit / aktivite günlüğü */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Güvenlik Günlüğü</h3>
        <div className="space-y-2">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg" style={{ background: a.ok ? '#f9fafb' : '#fef2f2' }}>
              <div className="flex items-center gap-3">
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: a.ok ? '#10b981' : '#ef4444' }} />
                <div><div className="text-sm font-medium text-gray-800">{a.t}</div><div className="text-xs text-gray-500">{a.d}</div></div>
              </div>
              <span className="text-xs text-gray-400">{a.when}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
