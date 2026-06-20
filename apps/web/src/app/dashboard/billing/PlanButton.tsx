'use client'

import { useState } from 'react'

interface Props {
  tier: string
  label: string
  variant: 'primary' | 'outline'
}

export default function PlanButton({ tier, label, variant }: Props) {
  const [loading, setLoading] = useState(false)
  const [token, setToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleClick() {
    if (tier === 'enterprise') {
      window.location.href = 'mailto:satis@avukatim.com?subject=Kurumsal Plan Talebi'
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/payments/paytr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Ödeme başlatılamadı')
        setLoading(false)
        return
      }
      setToken(data.token)
    } catch {
      setError('Bağlantı hatası')
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          width: '100%', padding: '11px 0', borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading ? 'wait' : 'pointer', transition: 'all .2s',
          ...(variant === 'outline'
            ? { background: 'transparent', border: '1px solid rgba(168,85,247,0.5)', color: '#c4b5fd' }
            : { background: 'linear-gradient(135deg,#6c63ff,#a855f7)', border: 'none', color: '#fff', boxShadow: '0 6px 20px rgba(108,99,255,0.35)' }),
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Yükleniyor...' : label}
      </button>

      {error && <p style={{ fontSize: 12, color: '#fca5a5', marginTop: 8 }}>{error}</p>}

      {/* PayTR ödeme iframe'i — tam ekran overlay */}
      {token && (
        <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <h3 className="font-semibold text-gray-900">Güvenli Ödeme — PayTR</h3>
              <button
                onClick={() => { setToken(null); setLoading(false) }}
                className="text-gray-400 hover:text-gray-700 text-xl leading-none"
              >
                ✕
              </button>
            </div>
            <iframe
              src={`https://www.paytr.com/odeme/guest/${token}/`}
              className="w-full flex-1"
              style={{ minHeight: 600, border: 'none' }}
              title="PayTR Ödeme"
            />
          </div>
        </div>
      )}
    </>
  )
}
