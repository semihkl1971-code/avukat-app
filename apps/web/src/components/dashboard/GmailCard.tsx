'use client'

import { useEffect, useState } from 'react'

export default function GmailCard() {
  const [state, setState] = useState<{ configured: boolean; connected: boolean } | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/gmail/status').then(r => r.json()).then(setState).catch(() => setState({ configured: false, connected: false }))
    const q = new URLSearchParams(window.location.search).get('gmail')
    if (q === 'connected') setMsg('✓ Gmail bağlandı')
    else if (q === 'error') setMsg('✕ Bağlantı tamamlanamadı, tekrar deneyin')
    else if (q === 'notconfigured') setMsg('Gmail henüz yapılandırılmadı (yönetici kurulumu gerekli)')
  }, [])

  async function sync() {
    setSyncing(true); setMsg(null)
    try {
      const r = await fetch('/api/gmail/sync', { method: 'POST' })
      const d = await r.json()
      setMsg(r.ok ? `✓ ${d.synced ?? 0} yeni e-posta panele alındı` : '✕ ' + (d.error ?? 'Senkronizasyon hatası'))
    } catch { setMsg('✕ Bağlantı hatası') }
    setSyncing(false)
  }

  const connected = state?.connected
  const configured = state?.configured

  return (
    <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14, padding: 18, background: 'rgba(255,255,255,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: 'rgba(245,158,11,0.15)', display: 'grid', placeItems: 'center', fontSize: 20 }}>📧</div>
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 15 }}>Gmail</div>
          <div style={{ fontSize: 12.5, color: '#8892a4' }}>
            {!configured ? 'Kurulum bekleniyor' : connected ? 'Bağlı — gelen/giden e-posta panelde' : 'Google hesabınızı bağlayın'}
          </div>
        </div>
        {connected ? (
          <span style={{ fontSize: 12, fontWeight: 700, color: '#6ee7b7', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', padding: '4px 12px', borderRadius: 100 }}>Bağlı ✓</span>
        ) : (
          <a href="/api/gmail/auth" style={{ fontSize: 13, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg,#ea4335,#fbbc05)', padding: '9px 18px', borderRadius: 10, textDecoration: 'none', pointerEvents: configured ? 'auto' : 'none', opacity: configured ? 1 : 0.5 }}>Gmail&apos;i Bağla</a>
        )}
      </div>

      {connected && (
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <button onClick={sync} disabled={syncing} style={{ fontSize: 13, fontWeight: 600, color: '#fff', background: syncing ? 'rgba(255,255,255,0.1)' : 'rgba(108,99,255,0.9)', border: 'none', padding: '9px 16px', borderRadius: 10, cursor: syncing ? 'wait' : 'pointer' }}>
            {syncing ? 'Senkronize ediliyor…' : '↻ Gelen e-postaları senkronize et'}
          </button>
          <a href="/api/gmail/auth" style={{ fontSize: 12.5, color: '#8892a4', textDecoration: 'underline' }}>Yeniden bağla</a>
        </div>
      )}

      {msg && <div style={{ marginTop: 12, fontSize: 13, color: msg.startsWith('✓') ? '#6ee7b7' : '#fca5a5' }}>{msg}</div>}
    </div>
  )
}
