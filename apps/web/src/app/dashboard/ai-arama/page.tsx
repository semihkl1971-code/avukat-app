'use client'

import { useRef, useState } from 'react'

type Msg = { role: 'user' | 'assistant'; content: string; thinking?: string; status?: string }
type FilePayload = { data: string; mediaType: string; kind: 'image' | 'pdf' | 'text'; name: string }

// Tarayıcı Speech API minimal tip
interface SpeechRec { lang: string; continuous: boolean; interimResults: boolean; start(): void; stop(): void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null }
type SpeechWindow = Window & { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }

const SUGGESTIONS = [
  { icon: '⚖️', text: 'Kira tespit davasında izlenecek adımlar, deliller ve dikkat edilecek süreler' },
  { icon: '📄', text: 'İşçilik alacağı davasında ihbar ve kıdem tazminatı hesap tablosu hazırla' },
  { icon: '🏠', text: 'Tapu iptali ve tescil davasında zamanaşımı, görevli-yetkili mahkeme ve hazırlanacak dilekçe' },
  { icon: '💼', text: 'Ticari alacakta icra takibi: dosya açılışı, itirazın iptali stratejisi ve süreler' },
]

function render(text: string) {
  return text.split('\n').map((l, i) => {
    const b = l.split(/(\*\*[^*]+\*\*)/g).map((p, j) => p.startsWith('**') && p.endsWith('**') ? <strong key={j} style={{ color: '#e9d5ff' }}>{p.slice(2, -2)}</strong> : <span key={j}>{p}</span>)
    if (l.startsWith('### ')) return <h4 key={i} style={{ fontSize: 15, fontWeight: 700, color: '#c4b5fd', margin: '12px 0 4px' }}>{l.slice(4)}</h4>
    if (l.startsWith('## ')) return <h3 key={i} style={{ fontSize: 17, fontWeight: 800, color: '#ddd6fe', margin: '14px 0 6px' }}>{l.slice(3)}</h3>
    if (/^[-*] /.test(l)) return <div key={i} style={{ display: 'flex', gap: 8, margin: '3px 0' }}><span style={{ color: '#a855f7' }}>•</span><span>{b}</span></div>
    if (l.trim() === '') return <div key={i} style={{ height: 8 }} />
    return <p key={i} style={{ margin: '4px 0', lineHeight: 1.7 }}>{b}</p>
  })
}

export default function AiAramaPage() {
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [deep, setDeep] = useState(false)
  const [file, setFile] = useState<FilePayload | null>(null)
  const [listening, setListening] = useState(false)
  const [openThink, setOpenThink] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const recRef = useRef<SpeechRec | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function pickFile(f: File) {
    const reader = new FileReader()
    reader.onload = () => {
      const res = reader.result as string
      const data = res.split(',')[1] ?? ''
      const kind: FilePayload['kind'] = f.type.startsWith('image/') ? 'image' : f.type === 'application/pdf' ? 'pdf' : 'text'
      setFile({ data, mediaType: f.type || 'text/plain', kind, name: f.name })
    }
    reader.readAsDataURL(f)
  }

  function toggleVoice() {
    if (listening) { recRef.current?.stop(); return }
    const w = window as SpeechWindow
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition
    if (!Ctor) { alert('Tarayıcınız sesli komutu desteklemiyor (Chrome önerilir).'); return }
    const rec = new Ctor()
    rec.lang = 'tr-TR'; rec.continuous = false; rec.interimResults = true
    rec.onresult = e => { const last = e.results[e.results.length - 1]; const txt = last?.[0]?.transcript ?? ''; setInput(txt) }
    rec.onend = () => setListening(false)
    rec.onerror = () => setListening(false)
    recRef.current = rec; rec.start(); setListening(true)
  }

  async function send(text: string) {
    const q = text.trim()
    if ((!q && !file) || loading) return
    const userMsg: Msg = { role: 'user', content: q || `📎 ${file?.name}` }
    const history: Msg[] = [...messages, userMsg]
    const sentFile = file
    setMessages([...history, { role: 'assistant', content: '', thinking: '' }])
    setInput(''); setFile(null); setLoading(true)
    setOpenThink(history.length) // yeni asistan mesajının düşünme panelini aç

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(m => ({ role: m.role, content: m.content })), file: sentFile, deepResearch: deep }),
      })
      if (!res.body) throw new Error('yanıt yok')
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      let buf = '', content = '', thinking = '', status = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buf += dec.decode(value, { stream: true })
        const lines = buf.split('\n'); buf = lines.pop() ?? ''
        for (const ln of lines) {
          if (!ln.trim()) continue
          try {
            const o = JSON.parse(ln) as { t: string; d: string }
            if (o.t === 'k') thinking += o.d
            else if (o.t === 'x') content += o.d
            else if (o.t === 's') status = o.d
          } catch {}
        }
        setMessages(m => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content, thinking, status }; return c })
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
      }
      if (content) setOpenThink(null) // yanıt gelince düşünmeyi kapat
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'hata'
      setMessages(m => { const c = [...m]; c[c.length - 1] = { role: 'assistant', content: '⚠ ' + msg }; return c })
    } finally { setLoading(false) }
  }

  const empty = messages.length === 0

  return (
    <div style={{ position: 'relative', minHeight: 'calc(100vh - 120px)', borderRadius: 24, overflow: 'hidden', background: 'radial-gradient(1200px 600px at 50% -10%, rgba(124,58,237,0.25), transparent), linear-gradient(180deg,#0b0a1a,#0a0913)', border: '1px solid rgba(168,85,247,0.2)', color: '#e8eaf0' }}>
      {/* Başlık */}
      <div style={{ padding: '20px 26px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#a855f7,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 6px 24px rgba(124,58,237,0.5)' }}>🧠</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 18 }}>Yapay Zeka Hukuk Asistanı</div>
          <div style={{ fontSize: 12.5, color: '#9b8fc7' }}>Avukatım · dosya analizi · sesli komut · derin araştırma</div>
        </div>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: '#34d399', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 100, padding: '4px 12px' }}>● Çevrimiçi</span>
      </div>

      {/* Mesaj alanı */}
      <div ref={scrollRef} style={{ padding: 26, height: 'calc(100vh - 350px)', overflowY: 'auto' }}>
        {empty ? (
          <div style={{ maxWidth: 720, margin: '20px auto', textAlign: 'center' }}>
            <h2 style={{ fontSize: 'clamp(22px,3vw,30px)', fontWeight: 800, background: 'linear-gradient(135deg,#c4b5fd,#a855f7,#22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: 10 }}>Hukuki sorunuzu sorun</h2>
            <p style={{ color: '#9b8fc7', fontSize: 15, marginBottom: 28 }}>Soru sorun, belge yükleyip analiz ettirin, sesle konuşun ya da derin araştırma açın.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
              {SUGGESTIONS.map(s => (
                <button key={s.text} onClick={() => send(s.text)} style={{ textAlign: 'left', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(168,85,247,0.18)', borderRadius: 14, padding: '14px 16px', cursor: 'pointer', color: '#d8d4ea', fontSize: 13.5, display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 20 }}>{s.icon}</span>{s.text}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{ maxWidth: 820, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, background: m.role === 'user' ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#7c3aed,#a855f7)' }}>{m.role === 'user' ? '🧑‍⚖️' : '🧠'}</div>
                <div style={{ maxWidth: '82%' }}>
                  {/* Düşünme paneli */}
                  {m.role === 'assistant' && m.thinking ? (
                    <div style={{ marginBottom: 8 }}>
                      <button onClick={() => setOpenThink(openThink === i ? null : i)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.25)', borderRadius: 10, padding: '6px 12px', color: '#c4b5fd', fontSize: 12.5, cursor: 'pointer' }}>
                        <span style={{ animation: m.content ? 'none' : 'pulse 1.2s infinite' }}>💭</span> Düşünme süreci {openThink === i ? '▲' : '▼'}
                      </button>
                      {openThink === i && (
                        <div style={{ marginTop: 6, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: '12px 14px', fontSize: 13, color: '#9b8fc7', lineHeight: 1.6, fontStyle: 'italic', whiteSpace: 'pre-wrap', maxHeight: 240, overflowY: 'auto' }}>{m.thinking}</div>
                      )}
                    </div>
                  ) : null}
                  {m.status && !m.content ? <div style={{ fontSize: 12.5, color: '#7dd3fc', marginBottom: 6 }}>{m.status}</div> : null}
                  <div style={{ background: m.role === 'user' ? 'rgba(108,99,255,0.16)' : 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '12px 16px', fontSize: 14.5 }}>
                    {m.content === '' && !m.thinking ? <span style={{ color: '#8b80b3' }}>düşünüyor…</span> : m.content ? render(m.content) : <span style={{ color: '#8b80b3' }}>…</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Girdi alanı */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: 18, background: 'linear-gradient(180deg,transparent,#0a0913 35%)' }}>
        <div style={{ maxWidth: 820, margin: '0 auto' }}>
          {/* Ekli dosya çipi */}
          {file && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 10, padding: '6px 12px', marginBottom: 8, fontSize: 13, color: '#d8d4ea' }}>
              📎 {file.name} <button onClick={() => setFile(null)} style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontSize: 14 }}>✕</button>
            </div>
          )}
          <form onSubmit={e => { e.preventDefault(); send(input) }} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: 16, padding: 8 }}>
            {/* Dosya */}
            <input ref={fileRef} type="file" accept="image/*,application/pdf,.txt,.md,.doc,.docx" hidden onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); e.target.value = '' }} />
            <button type="button" title="Belge yükle" onClick={() => fileRef.current?.click()} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.06)', color: '#c4b5fd', fontSize: 18, cursor: 'pointer', flexShrink: 0 }}>📎</button>
            {/* Sesli komut */}
            <button type="button" title="Sesli komut" onClick={toggleVoice} style={{ width: 40, height: 40, borderRadius: 10, border: 'none', background: listening ? 'linear-gradient(135deg,#ef4444,#f87171)' : 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 18, cursor: 'pointer', flexShrink: 0, animation: listening ? 'pulse 1s infinite' : 'none' }}>🎤</button>
            <input value={input} onChange={e => setInput(e.target.value)} placeholder={listening ? 'Dinleniyor…' : 'Bir hukuki soru yazın veya belge yükleyin…'} disabled={loading}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 15, padding: '8px 6px', minWidth: 80 }} />
            <button type="submit" disabled={loading || (!input.trim() && !file)} style={{ padding: '10px 22px', borderRadius: 12, border: 'none', background: loading ? 'rgba(124,58,237,0.4)' : 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'default' : 'pointer', flexShrink: 0 }}>{loading ? '…' : 'Sor →'}</button>
          </form>
          {/* Derin araştırma toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 10, justifyContent: 'center' }}>
            <button onClick={() => setDeep(!deep)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: deep ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.04)', border: deep ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.1)', borderRadius: 100, padding: '6px 14px', cursor: 'pointer', fontSize: 13, color: deep ? '#67e8f9' : '#8892a4' }}>
              🔎 Derin Araştırma {deep ? 'AÇIK' : 'KAPALI'} {deep && '· web\'de güncel kaynak arar'}
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: 11, color: '#5b5380', marginTop: 8 }}>Yapay zeka hatalı olabilir; önemli kararlar için içtihatları doğrulayın.</p>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  )
}
