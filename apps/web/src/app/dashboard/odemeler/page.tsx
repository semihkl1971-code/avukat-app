'use client'

import { useEffect, useMemo, useState } from 'react'
import { listPayments, addPaymentRecord, setPaymentPaid, deletePaymentRecord, type PaymentRow } from '../tracking-actions'

const fmt = (n: number) => n.toLocaleString('tr-TR') + ' ₺'

export default function OdemelerPage() {
  const [items, setItems] = useState<PaymentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ client: '', desc: '', amount: '', due: '' })

  async function reload() { setItems(await listPayments()); setLoading(false) }
  useEffect(() => { reload() }, [])

  const today = new Date().toISOString().slice(0, 10)
  const totals = useMemo(() => {
    const num = (p: PaymentRow) => Number(p.amount)
    const paid = items.filter(i => i.paid).reduce((s, i) => s + num(i), 0)
    const pending = items.filter(i => !i.paid).reduce((s, i) => s + num(i), 0)
    const overdue = items.filter(i => !i.paid && i.due_date && i.due_date < today).reduce((s, i) => s + num(i), 0)
    return { paid, pending, overdue }
  }, [items, today])

  async function add(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client || !form.amount) return
    await addPaymentRecord({ client_name: form.client, description: form.desc, amount: Number(form.amount), due_date: form.due || today })
    setForm({ client: '', desc: '', amount: '', due: '' })
    reload()
  }
  const togglePaid = async (i: PaymentRow) => { await setPaymentPaid(i.id, !i.paid); reload() }
  const remove = async (id: string) => { await deletePaymentRecord(id); reload() }

  const inputCls: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }

  const STATS = [
    { label: 'Tahsil Edilen', val: totals.paid, color: '#34d399', icon: '✅', glow: 'rgba(16,185,129,0.25)' },
    { label: 'Bekleyen', val: totals.pending, color: '#fbbf24', icon: '⏳', glow: 'rgba(245,158,11,0.22)' },
    { label: 'Gecikmiş', val: totals.overdue, color: '#f87171', icon: '⚠️', glow: 'rgba(239,68,68,0.22)' },
  ]

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", borderRadius: 24, overflow: 'hidden', background: 'radial-gradient(1000px 500px at 50% -15%, rgba(108,99,255,0.22), transparent), linear-gradient(180deg,#0a0913,#07090f)', border: '1px solid rgba(108,99,255,0.18)', color: '#e8eaf0', minHeight: 'calc(100vh - 130px)' }}>
      <div style={{ padding: 'clamp(22px,4vw,36px)' }}>
        {/* Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 26 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 8px 28px rgba(108,99,255,0.5)' }}>💰</div>
          <div>
            <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>Müvekkil Ödeme Takibi</h2>
            <p style={{ color: '#8892a4', fontSize: 14, margin: '2px 0 0' }}>Vekalet ücretleri, taksitler ve tahsilatlar tek ekranda.</p>
          </div>
        </div>

        {/* Özet kartları */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 22 }}>
          {STATS.map(c => (
            <div key={c.label} style={{ position: 'relative', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 22, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: c.glow, filter: 'blur(30px)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
                <span style={{ fontSize: 26 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 12.5, color: '#8892a4' }}>{c.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: c.color, marginTop: 2 }}>{fmt(c.val)}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Yeni kayıt formu */}
        <form onSubmit={add} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 18, padding: 18, marginBottom: 22 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
            <input style={inputCls} placeholder="Müvekkil adı" value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} />
            <input style={{ ...inputCls, gridColumn: 'span 2' }} placeholder="Açıklama (ör. vekalet ücreti)" value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} />
            <input style={inputCls} type="number" placeholder="Tutar ₺" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
            <input style={inputCls} type="date" value={form.due} onChange={e => setForm({ ...form, due: e.target.value })} />
          </div>
          <button type="submit" style={{ marginTop: 14, padding: '11px 24px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', boxShadow: '0 6px 20px rgba(108,99,255,0.35)' }}>+ Ödeme Ekle</button>
        </form>

        {/* Liste */}
        <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Yükleniyor…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: 48, textAlign: 'center', color: '#8892a4' }}>
              <div style={{ fontSize: 40, marginBottom: 8 }}>🧾</div>Henüz ödeme kaydı yok. Yukarıdan ekleyin.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, minWidth: 640 }}>
                <thead>
                  <tr style={{ textAlign: 'left', color: '#6b7280', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                    {['Müvekkil', 'Açıklama', 'Tutar', 'Vade', 'Durum', ''].map((h, i) => (
                      <th key={i} style={{ padding: '14px 18px', fontWeight: 600, fontSize: 12.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => {
                    const overdue = !i.paid && !!i.due_date && i.due_date < today
                    const c = i.paid ? { bg: 'rgba(16,185,129,0.15)', fg: '#34d399', t: 'Ödendi' } : overdue ? { bg: 'rgba(239,68,68,0.15)', fg: '#f87171', t: 'Gecikmiş' } : { bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24', t: 'Bekliyor' }
                    return (
                      <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '13px 18px', fontWeight: 600, color: '#f1f5f9' }}>{i.client_name}</td>
                        <td style={{ padding: '13px 18px', color: '#9ca3af' }}>{i.description || '—'}</td>
                        <td style={{ padding: '13px 18px', fontWeight: 700, color: '#fff' }}>{fmt(Number(i.amount))}</td>
                        <td style={{ padding: '13px 18px', color: '#8892a4' }}>{i.due_date ? new Date(i.due_date).toLocaleDateString('tr-TR') : '—'}</td>
                        <td style={{ padding: '13px 18px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 11px', borderRadius: 100, background: c.bg, color: c.fg }}>{c.t}</span>
                        </td>
                        <td style={{ padding: '13px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button onClick={() => togglePaid(i)} style={{ background: 'none', border: 'none', color: '#a89fff', fontSize: 12.5, cursor: 'pointer', marginRight: 12 }}>{i.paid ? 'Geri al' : '✓ Ödendi'}</button>
                          <button onClick={() => remove(i.id)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12.5, cursor: 'pointer' }}>Sil</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
