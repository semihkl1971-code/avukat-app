'use client'

import { useEffect, useRef, useState } from 'react'

// TEST MODU: hızlı görmek için true yapın (30dk→6sn). Canlıda false olmalı.
const TEST_MODE = false
const TICK = TEST_MODE ? 1500 : 30000          // kontrol sıklığı (ms)
const scale = (min: number) => (TEST_MODE ? min / 300 : min) // test'te 30dk→~6sn, 75→15sn, 120→24sn...

type Reminder = { icon: string; title: string; text: string; accent: string; bg: string; breathing?: boolean }
type Step = { at: number; reminder: Reminder } // at = dakika (program açıldığından beri)

// ── Bireysel kullanıcı: rahat, huzurlu, kademeli mola akışı ──
const INDIVIDUAL: Step[] = [
  { at: 30, reminder: { icon: '☕', title: 'Kahve molası zamanı', text: 'Yarım saattir buradasınız. Kısa bir kahve molası verin — biz dosyalarınızı bekletmeyiz, siz dinlenin.', accent: '#c79a5b', bg: 'linear-gradient(160deg,#2a1f14,#1a130b)' } },
  { at: 75, reminder: { icon: '🍽️', title: 'Yemek molası', text: 'Bir şeyler atıştırma vakti. Aç karnına en iyi savunma bile zayıflar. Afiyet olsun!', accent: '#fb923c', bg: 'linear-gradient(160deg,#2a1810,#1a0f08)' } },
  { at: 120, reminder: { icon: '🛋️', title: 'Biraz dinlenme vakti', text: '2 saattir çalışıyorsunuz. Avukatım işinizi kısaltmak için var — bu kazandığınız zamanı kendinize ayırın. 10 dakika gerçekten dinlenin.', accent: '#a855f7', bg: 'linear-gradient(160deg,#1c0f2e,#120a1f)' } },
  { at: 150, reminder: { icon: '🧘', title: 'Nefes egzersizi', text: 'Daireyle birlikte nefes alın: genişlerken alın, küçülürken verin. Üç tur yeter.', accent: '#22d3ee', bg: 'linear-gradient(160deg,#0c1f24,#0a1418)', breathing: true } },
  { at: 180, reminder: { icon: '💧', title: 'Su ve göz molası', text: 'Bir bardak su için, 20 saniye uzağa bakın. Bedeniniz bu küçük molaları sever.', accent: '#60a5fa', bg: 'linear-gradient(160deg,#0c1a2e,#0a1320)' } },
]

// ── Büro hesabı: ekip odaklı, daha seyrek, profesyonel ton ──
const FIRM: Step[] = [
  { at: 120, reminder: { icon: '👥', title: 'Ekip molası önerisi', text: 'Büronuz 2 saattir aktif. Ekibinizin de kısa bir molaya ihtiyacı olabilir — verimli bir büro, dinlenmiş bir ekiptir.', accent: '#6c63ff', bg: 'linear-gradient(160deg,#14132a,#0d0c1f)' } },
  { at: 240, reminder: { icon: '📊', title: 'Gün ortası değerlendirme', text: 'Yoğun bir tempo. İş dağılımını gözden geçirip ekibe kısa bir nefes molası vermek iyi olabilir.', accent: '#34d399', bg: 'linear-gradient(160deg,#0c2418,#0a1812)' } },
]

export default function BreakReminder({ isFirm = false }: { isFirm?: boolean }) {
  const [active, setActive] = useState<Reminder | null>(null)
  const startRef = useRef(Date.now())
  const idxRef = useRef(0)

  useEffect(() => {
    const schedule = isFirm ? FIRM : INDIVIDUAL
    const tick = setInterval(() => {
      const mins = (Date.now() - startRef.current) / 60000
      const step = schedule[idxRef.current]
      if (step && mins >= scale(step.at)) {
        setActive(step.reminder)
        idxRef.current++
        // Akış bittiyse döngüyü baştan başlat (kademeli hatırlatma devam etsin)
        if (idxRef.current >= schedule.length) { idxRef.current = 0; startRef.current = Date.now() }
      }
    }, TICK)
    return () => clearInterval(tick)
  }, [isFirm])

  if (!active) return null

  return (
    <div onClick={() => setActive(null)} style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(5,5,10,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn .3s ease' }}>
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 440, background: active.bg, border: `1px solid ${active.accent}44`, borderRadius: 26, padding: 36, textAlign: 'center', boxShadow: `0 30px 90px rgba(0,0,0,0.6), 0 0 60px ${active.accent}22`, color: '#f0ece4', position: 'relative' }}>
        {active.breathing ? (
          <div style={{ height: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: `radial-gradient(circle, ${active.accent}, ${active.accent}55)`, boxShadow: `0 0 50px ${active.accent}88`, animation: 'breathe 8s ease-in-out infinite', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>{active.icon}</div>
          </div>
        ) : (
          <div style={{ fontSize: 56, marginBottom: 12, animation: 'floaty 3s ease-in-out infinite' }}>{active.icon}</div>
        )}

        <h2 style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.5px', margin: '0 0 10px', color: active.accent }}>{active.title}</h2>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: '#cfc8bd', margin: '0 0 26px' }}>{active.text}</p>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setActive(null)} style={{ padding: '12px 26px', borderRadius: 13, border: 'none', background: active.accent, color: '#0a0a0a', fontWeight: 700, fontSize: 14.5, cursor: 'pointer' }}>Anladım ✓</button>
          <button onClick={() => setActive(null)} style={{ padding: '12px 22px', borderRadius: 13, border: '1px solid rgba(255,255,255,0.18)', background: 'transparent', color: '#cfc8bd', fontWeight: 600, fontSize: 14.5, cursor: 'pointer' }}>Şimdi değil</button>
        </div>

        <p style={{ fontSize: 11.5, color: '#8a8276', marginTop: 18 }}>{isFirm ? 'Avukatım — ekibinizin huzuru için' : 'Avukatım sizi nazikçe hatırlatır 💜'}</p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes breathe { 0%,100% { transform: scale(0.7) } 50% { transform: scale(1.25) } }
      `}</style>
    </div>
  )
}
