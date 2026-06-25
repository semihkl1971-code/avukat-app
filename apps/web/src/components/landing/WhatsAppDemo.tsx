'use client'

import { useEffect, useState } from 'react'

type Msg = { role: 'client' | 'bot'; text: string }

const CONVO: Msg[] = [
  { role: 'client', text: 'Merhaba, boşanma davası açmak istiyorum 🙏' },
  { role: 'bot', text: 'Merhaba! 👋 Yardımcı olalım. Adınız, eşinizin adı ve çocuğunuz var mı? Avukatımız en kısa sürede dönecek.' },
  { role: 'client', text: 'Randevu alabilir miyim?' },
  { role: 'bot', text: 'Tabii! 📅 Uygun gününüzü yazın. Çalışma saatlerimiz Pzt–Cuma 09:00–18:00.' },
]

export default function WhatsAppDemo() {
  const [count, setCount] = useState(0)
  const [typing, setTyping] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(CONVO.length)
      return
    }
    let active = true
    const timers: ReturnType<typeof setTimeout>[] = []
    const run = () => {
      setCount(0); setTyping(false)
      let delay = 700
      CONVO.forEach((m, i) => {
        if (m.role === 'bot') {
          timers.push(setTimeout(() => active && setTyping(true), delay))
          delay += 1500
          timers.push(setTimeout(() => { if (active) { setTyping(false); setCount(i + 1) } }, delay))
        } else {
          timers.push(setTimeout(() => active && setCount(i + 1), delay))
        }
        delay += 1700
      })
      timers.push(setTimeout(() => active && run(), delay + 2600))
    }
    run()
    return () => { active = false; timers.forEach(clearTimeout) }
  }, [])

  return (
    <div className="wa-stage">
      <div className="wa-glow" />
      <div className="wa-phone">
        <div className="wa-screen">
          {/* Üst bar */}
          <div className="wa-head">
            <div className="wa-ava">🤖</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="wa-name">Avukatım Asistanı</div>
              <div className="wa-on">çevrimiçi</div>
            </div>
            <span style={{ fontSize: 15, opacity: 0.85 }}>📞</span>
          </div>
          {/* Sohbet */}
          <div className="wa-body">
            {CONVO.slice(0, count).map((m, i) => (
              <div key={i} className={`wa-row ${m.role}`}>
                <div className={`wa-bubble ${m.role}`}>{m.text}</div>
              </div>
            ))}
            {typing && (
              <div className="wa-row bot">
                <div className="wa-bubble bot wa-typing"><span /><span /><span /></div>
              </div>
            )}
          </div>
          {/* Giriş çubuğu */}
          <div className="wa-input"><span>Mesaj yazın…</span><div className="wa-send">➤</div></div>
        </div>
      </div>

      <style>{`
        .wa-stage { position: relative; width: 280px; max-width: 80vw; margin: 0 auto; perspective: 1200px; }
        .wa-glow { position: absolute; inset: -14% -10% -8%; background: radial-gradient(closest-side, rgba(30,196,95,0.32), transparent 72%); filter: blur(26px); z-index: 0; }
        .wa-phone {
          position: relative; z-index: 1; aspect-ratio: 9/19; border-radius: 38px; padding: 9px;
          background: linear-gradient(155deg,#1f2a25,#11160f 60%,#0b0e09);
          box-shadow: 0 50px 110px rgba(0,0,0,.6), 0 0 70px rgba(30,196,95,.18), inset 0 0 0 2px rgba(255,255,255,.06);
          transform: rotateY(-14deg) rotateX(5deg); transform-style: preserve-3d;
          animation: wa-float 6s ease-in-out infinite; transition: transform .5s ease;
        }
        .wa-phone:hover { transform: rotateY(0deg) rotateX(0deg) scale(1.03); }
        .wa-screen { width: 100%; height: 100%; border-radius: 30px; overflow: hidden; display: flex; flex-direction: column; background: #0b141a; }
        .wa-head { display: flex; align-items: center; gap: 9px; padding: 12px 12px 10px; background: linear-gradient(135deg,#1f7a4d,#128c4b); color: #fff; }
        .wa-ava { width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.18); display: grid; place-items: center; font-size: 17px; }
        .wa-name { font-size: 13.5px; font-weight: 700; line-height: 1.1; }
        .wa-on { font-size: 10.5px; color: #c7f5da; }
        .wa-body { flex: 1; padding: 12px 10px; display: flex; flex-direction: column; gap: 8px; overflow: hidden;
          background: #0b141a url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpath d='M0 39h40M39 0v40' stroke='%23ffffff08' stroke-width='1'/%3E%3C/svg%3E"); }
        .wa-row { display: flex; }
        .wa-row.client { justify-content: flex-start; }
        .wa-row.bot { justify-content: flex-end; }
        .wa-bubble { max-width: 80%; padding: 8px 11px; border-radius: 12px; font-size: 12px; line-height: 1.42; color: #e9edef;
          animation: wa-in .35s cubic-bezier(.2,.8,.2,1) both; box-shadow: 0 1px 1px rgba(0,0,0,.25); }
        .wa-bubble.client { background: #1f2c34; border-top-left-radius: 4px; }
        .wa-bubble.bot { background: #005c4b; border-top-right-radius: 4px; }
        .wa-typing { display: inline-flex; gap: 4px; align-items: center; padding: 11px 13px; }
        .wa-typing span { width: 6px; height: 6px; border-radius: 50%; background: #8fd0b6; animation: wa-blink 1.2s infinite; }
        .wa-typing span:nth-child(2) { animation-delay: .2s; } .wa-typing span:nth-child(3) { animation-delay: .4s; }
        .wa-input { display: flex; align-items: center; gap: 8px; padding: 9px 10px; background: #0b141a; }
        .wa-input span { flex: 1; background: #1f2c34; color: #67787f; font-size: 11.5px; padding: 8px 12px; border-radius: 18px; }
        .wa-send { width: 30px; height: 30px; border-radius: 50%; background: #128c4b; color: #fff; display: grid; place-items: center; font-size: 13px; }
        @keyframes wa-float { 0%,100% { transform: rotateY(-14deg) rotateX(5deg) translateY(0); } 50% { transform: rotateY(-10deg) rotateX(3deg) translateY(-12px); } }
        @keyframes wa-in { from { opacity: 0; transform: translateY(8px) scale(.96); } to { opacity: 1; transform: none; } }
        @keyframes wa-blink { 0%,60%,100% { opacity: .35; } 30% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .wa-phone { animation: none; } .wa-bubble { animation: none; } }
      `}</style>
    </div>
  )
}
