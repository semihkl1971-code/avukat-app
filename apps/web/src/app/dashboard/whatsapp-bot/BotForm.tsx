'use client'

import { useActionState, useState } from 'react'
import { saveBotSettings, type BotState } from './actions'

type Keyword = { keyword: string; reply: string }
type Initial = { enabled: boolean; firmName: string; hours: string; services: string; keywords: Keyword[] }

const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#9ca3af', letterSpacing: 0.3, display: 'block', marginBottom: 7 }
const input: React.CSSProperties = { width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 11, padding: '11px 13px', color: '#e8eaf0', fontSize: 14.5, fontFamily: 'inherit', outline: 'none' }
const card: React.CSSProperties = { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 22, marginTop: 16 }

export default function BotForm({ initial }: { initial: Initial }) {
  const [state, action, pending] = useActionState<BotState, FormData>(saveBotSettings, {})
  const [enabled, setEnabled] = useState(initial.enabled)
  const [keywords, setKeywords] = useState<Keyword[]>(initial.keywords)

  return (
    <form action={action}>
      {/* Aç/Kapa */}
      <div style={{ ...card, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Otomatik yanıt</div>
          <div style={{ fontSize: 13, color: '#8892a4', marginTop: 3 }}>Açıkken müvekkil yazınca bot otomatik cevap verir. Bir avukat sohbete yanıt yazınca bot 12 saat susar.</div>
        </div>
        <label style={{ position: 'relative', display: 'inline-block', width: 52, height: 30, flexShrink: 0, cursor: 'pointer' }}>
          <input type="checkbox" name="enabled" checked={enabled} onChange={e => setEnabled(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
          <span style={{ position: 'absolute', inset: 0, borderRadius: 30, transition: '.2s', background: enabled ? 'linear-gradient(135deg,#0d8b3d,#1ec45f)' : 'rgba(255,255,255,0.12)' }} />
          <span style={{ position: 'absolute', top: 3, left: enabled ? 25 : 3, width: 24, height: 24, borderRadius: '50%', background: '#fff', transition: '.2s' }} />
        </label>
      </div>

      {/* Özelleştirme */}
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', marginBottom: 16 }}>Bot kimliği</div>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>BÜRO ADI</label>
          <input style={input} name="firmName" defaultValue={initial.firmName} placeholder="Örn: Yılmaz Hukuk Bürosu" />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={label}>ÇALIŞMA SAATLERİ</label>
          <input style={input} name="hours" defaultValue={initial.hours} placeholder="Pazartesi–Cuma 09:00–18:00" />
        </div>
        <div>
          <label style={label}>ÇALIŞMA ALANLARI (botun bahsedeceği)</label>
          <textarea style={{ ...input, minHeight: 70, resize: 'vertical' }} name="services" defaultValue={initial.services} placeholder="Örn: Aile hukuku, iş hukuku, ceza, icra-iflas, gayrimenkul" />
        </div>
      </div>

      {/* Anahtar kelime yönlendirme */}
      <div style={card}>
        <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>Anahtar kelime yanıtları</div>
        <div style={{ fontSize: 13, color: '#8892a4', margin: '4px 0 14px' }}>Mesaj bu kelimeyi içeriyorsa AI yerine hazır yanıt gönderilir (örn. &quot;randevu&quot;).</div>
        {keywords.map((k, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
            <input style={{ ...input, flex: '0 0 130px' }} value={k.keyword} placeholder="kelime" onChange={e => setKeywords(ks => ks.map((x, j) => j === i ? { ...x, keyword: e.target.value } : x))} />
            <input style={{ ...input, flex: 1 }} value={k.reply} placeholder="gönderilecek yanıt" onChange={e => setKeywords(ks => ks.map((x, j) => j === i ? { ...x, reply: e.target.value } : x))} />
            <button type="button" onClick={() => setKeywords(ks => ks.filter((_, j) => j !== i))} style={{ flexShrink: 0, width: 40, height: 42, borderRadius: 11, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        ))}
        <button type="button" onClick={() => setKeywords(ks => [...ks, { keyword: '', reply: '' }])} style={{ marginTop: 6, padding: '9px 16px', borderRadius: 11, background: 'rgba(255,255,255,0.05)', border: '1px dashed rgba(255,255,255,0.2)', color: '#c8d0dc', cursor: 'pointer', fontSize: 13.5, fontWeight: 600 }}>+ Anahtar kelime ekle</button>
        <input type="hidden" name="keywords" value={JSON.stringify(keywords)} />
      </div>

      {/* Kaydet */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
        <button type="submit" disabled={pending} style={{ padding: '12px 26px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#0d8b3d,#1ec45f)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: pending ? 'wait' : 'pointer', opacity: pending ? 0.7 : 1, boxShadow: '0 8px 24px rgba(30,196,95,0.3)' }}>
          {pending ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
        {state.ok && <span style={{ color: '#6ee7b7', fontSize: 14, fontWeight: 600 }}>✓ Kaydedildi</span>}
        {state.error && <span style={{ color: '#fca5a5', fontSize: 14 }}>{state.error}</span>}
      </div>
    </form>
  )
}
