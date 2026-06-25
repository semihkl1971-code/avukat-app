'use client'

import { useState } from 'react'
import GmailCard from '@/components/dashboard/GmailCard'

const SECTIONS = [
  { id: 'profile', label: 'Profil & Hesap', icon: '👤' },
  { id: 'firm', label: 'Büro Bilgileri', icon: '🏢' },
  { id: 'notifications', label: 'Bildirimler', icon: '🔔' },
  { id: 'integrations', label: 'Entegrasyonlar', icon: '🔗' },
  { id: 'security', label: 'Güvenlik', icon: '🔒' },
]

export default function SettingsPage() {
  const [active, setActive] = useState('profile')
  const [saved, setSaved] = useState(false)

  function handleSave() {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5">
      <h2 className="text-2xl font-serif font-bold text-gray-100">Ayarlar</h2>

      <div className="flex gap-6">
        {/* Sidebar */}
        <div className="w-52 shrink-0">
          <nav className="bg-[#0e1019] rounded-xl shadow-sm border border-white/10 overflow-hidden">
            {SECTIONS.map(s => (
              <button key={s.id} onClick={() => setActive(s.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition border-b border-white/10 last:border-0 ${active === s.id ? 'bg-violet-500/10 text-violet-300 font-semibold' : 'text-gray-500 hover:bg-white/5'}`}>
                <span>{s.icon}</span> {s.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 bg-[#0e1019] rounded-xl shadow-sm border border-white/10 p-6">
          {active === 'profile' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-100 text-lg border-b pb-3">Profil Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">AD SOYAD</label>
                  <input className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="Av. Ad Soyad" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">BARO SİCİL NO</label>
                  <input className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="12345" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">TELEFON</label>
                  <input className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="05xx xxx xx xx" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">DİL</label>
                  <select className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500">
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {active === 'firm' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-100 text-lg border-b pb-3">Büro Bilgileri</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-2">BÜRO ADI</label>
                  <input className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="Hukuk Bürosu Adı" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">ŞEHİR</label>
                  <input className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="İstanbul" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">BARO</label>
                  <input className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-violet-500" placeholder="İstanbul Barosu" />
                </div>
              </div>
            </div>
          )}

          {active === 'notifications' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-100 text-lg border-b pb-3">Bildirim Ayarları</h3>
              <div className="space-y-4">
                {[
                  { label: 'Duruşma hatırlatmaları', desc: 'Duruşmadan 24 saat önce bildirim', key: 'hearing' },
                  { label: 'UYAP güncellemeleri', desc: 'Dava durumu değiştiğinde bildirim', key: 'uyap' },
                  { label: 'Yeni mesajlar', desc: 'WhatsApp veya Gmail mesajlarında bildirim', key: 'messages' },
                  { label: 'Ödeme bildirimleri', desc: 'Fatura ve ödeme hatırlatmaları', key: 'payments' },
                ].map(n => (
                  <div key={n.key} className="flex items-center justify-between p-4 rounded-lg border border-white/10 bg-transparent">
                    <div>
                      <div className="font-medium text-gray-100 text-sm">{n.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{n.desc}</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-5 peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-[#0e1019] after:rounded-full after:h-4 after:w-4 after:transition peer-checked:bg-violet-600" />
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {active === 'integrations' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-100 text-lg border-b pb-3">Entegrasyonlar</h3>
              <div className="space-y-3">
                {[
                  { name: 'UYAP', icon: '🏛', desc: 'Adalet Bakanlığı dava takip sistemi', status: 'Bağlı', color: 'text-green-400 bg-green-500/15' },
                  { name: 'WhatsApp Business', icon: '💬', desc: 'Meta Cloud API mesajlaşma', status: 'Bağlı', color: 'text-green-400 bg-green-500/15' },
                ].map(i => (
                  <div key={i.name} className="flex items-center justify-between p-4 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{i.icon}</span>
                      <div>
                        <div className="font-medium text-gray-100 text-sm">{i.name}</div>
                        <div className="text-xs text-gray-500">{i.desc}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${i.color}`}>{i.status}</span>
                  </div>
                ))}
                <GmailCard />
              </div>
            </div>
          )}

          {active === 'security' && (
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-100 text-lg border-b pb-3">Güvenlik</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">MEVCUT ŞİFRE</label>
                  <input type="password" className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">YENİ ŞİFRE</label>
                  <input type="password" className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-2">YENİ ŞİFRE (TEKRAR)</label>
                  <input type="password" className="w-full border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500" />
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center gap-3 pt-6 border-t border-white/10">
            <button onClick={handleSave} className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition">
              {saved ? '✓ Kaydedildi' : 'Kaydet'}
            </button>
            <button className="text-gray-500 hover:text-gray-300 text-sm">İptal</button>
          </div>
        </div>
      </div>
    </div>
  )
}
