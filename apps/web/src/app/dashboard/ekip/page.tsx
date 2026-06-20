'use client'

import { useEffect, useState } from 'react'
import { getTeam, inviteMember, revokeInvite, setMemberRole, removeMember, type TeamData } from './ekip-actions'

const ROLE_LABEL: Record<string, string> = { admin: 'Yönetici', lawyer: 'Avukat', assistant: 'Asistan' }
const ROLE_COLOR: Record<string, { bg: string; fg: string }> = {
  admin: { bg: 'rgba(168,85,247,0.18)', fg: '#c4b5fd' },
  lawyer: { bg: 'rgba(108,99,255,0.16)', fg: '#a5b4fc' },
  assistant: { bg: 'rgba(255,255,255,0.07)', fg: '#9ca3af' },
}

export default function EkipPage() {
  const [data, setData] = useState<TeamData | null>(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [invRole, setInvRole] = useState('lawyer')
  const [msg, setMsg] = useState<{ ok?: boolean; text: string } | null>(null)

  async function reload() { setData(await getTeam()); setLoading(false) }
  useEffect(() => { reload() }, [])

  const isAdmin = data?.currentRole === 'admin'
  const seatUsed = (data?.members.length ?? 0) + (data?.invites.length ?? 0)
  const seatMax = data?.maxLawyers ?? 1
  const unlimited = seatMax === -1
  const seatFull = !unlimited && seatUsed >= seatMax

  async function doInvite(e: React.FormEvent) {
    e.preventDefault()
    setMsg(null)
    if (seatFull) { setMsg({ text: 'Koltuk limiti doldu. Daha üst bir plana geçin.' }); return }
    const r = await inviteMember(email, invRole)
    if (r.error) setMsg({ text: r.error })
    else { setMsg({ ok: true, text: 'Davet oluşturuldu. Bu e-posta ile kayıt olan kişi otomatik büronuza katılır.' }); setEmail(''); reload() }
  }

  const inputCls: React.CSSProperties = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '11px 14px', color: '#fff', fontSize: 14, outline: 'none' }

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", borderRadius: 24, overflow: 'hidden', background: 'radial-gradient(1000px 500px at 50% -15%, rgba(108,99,255,0.22), transparent), linear-gradient(180deg,#0a0913,#07090f)', border: '1px solid rgba(108,99,255,0.18)', color: '#e8eaf0', minHeight: 'calc(100vh - 130px)' }}>
      <div style={{ padding: 'clamp(22px,4vw,36px)' }}>
        {/* Başlık + koltuk */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22, flexWrap: 'wrap' }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 8px 28px rgba(108,99,255,0.5)' }}>👥</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h2 style={{ fontSize: 'clamp(22px,3vw,28px)', fontWeight: 800, letterSpacing: '-0.5px', margin: 0 }}>Ekip Yönetimi</h2>
            <p style={{ color: '#8892a4', fontSize: 14, margin: '2px 0 0' }}>Avukatları davet edin, rol ve yetkilerini yönetin.</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12.5, color: '#8892a4' }}>Koltuk Kullanımı</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: seatFull ? '#f87171' : '#c4b5fd' }}>{seatUsed} / {unlimited ? '∞' : seatMax}</div>
          </div>
        </div>

        {loading ? <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Yükleniyor…</div> : (
        <>
          {/* Davet formu (sadece admin) */}
          {isAdmin ? (
            <form onSubmit={doInvite} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: 18, padding: 18, marginBottom: 22 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 15 }}>Yeni Üye Davet Et</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <input style={{ ...inputCls, flex: 1, minWidth: 200 }} type="email" placeholder="avukat@eposta.com" value={email} onChange={e => setEmail(e.target.value)} />
                <select style={{ ...inputCls, cursor: 'pointer' }} value={invRole} onChange={e => setInvRole(e.target.value)}>
                  <option value="lawyer">Avukat</option>
                  <option value="assistant">Asistan</option>
                  <option value="admin">Yönetici</option>
                </select>
                <button type="submit" disabled={seatFull} style={{ padding: '11px 22px', borderRadius: 12, border: 'none', background: seatFull ? 'rgba(108,99,255,0.3)' : 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: seatFull ? 'not-allowed' : 'pointer' }}>+ Davet Et</button>
              </div>
              {msg && <div style={{ marginTop: 10, fontSize: 13, color: msg.ok ? '#6ee7b7' : '#fca5a5' }}>{msg.ok ? '✓ ' : '⚠ '}{msg.text}</div>}
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 10 }}>💡 Davet edilen kişi bu e-posta ile kayıt olunca otomatik olarak büronuza, seçtiğiniz rolle katılır.</p>
            </form>
          ) : (
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px', marginBottom: 22, fontSize: 13.5, color: '#8892a4' }}>
              ℹ️ Ekip yönetimi (davet, rol değiştirme) yalnızca <strong style={{ color: '#c4b5fd' }}>Yönetici</strong> rolündeki kullanıcılar tarafından yapılabilir.
            </div>
          )}

          {/* Bekleyen davetler */}
          {data && data.invites.length > 0 && (
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, padding: 18, marginBottom: 22 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14, color: '#fbbf24' }}>⏳ Bekleyen Davetler ({data.invites.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {data.invites.map(inv => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 14px' }}>
                    <span style={{ fontSize: 14 }}>{inv.email}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 100, ...ROLE_COLOR[inv.role], background: ROLE_COLOR[inv.role]?.bg, color: ROLE_COLOR[inv.role]?.fg }}>{ROLE_LABEL[inv.role]}</span>
                      {isAdmin && <button onClick={async () => { await revokeInvite(inv.id); reload() }} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12.5, cursor: 'pointer' }}>İptal</button>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Üyeler */}
          <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 18, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', fontWeight: 700, fontSize: 14 }}>Ekip Üyeleri ({data?.members.length})</div>
            {data?.members.map(m => {
              const isSelf = m.id === data.currentUserId
              const rc = ROLE_COLOR[m.role] ?? ROLE_COLOR.assistant!
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6c63ff,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>{(m.full_name ?? '?').charAt(0).toUpperCase()}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{m.full_name ?? 'İsimsiz'} {isSelf && <span style={{ fontSize: 11, color: '#6b7280' }}>(siz)</span>}</div>
                    <div style={{ fontSize: 12.5, color: '#6b7280' }}>{m.bar_number ? `Baro: ${m.bar_number}` : ''}{m.phone ? ` · ${m.phone}` : ''}</div>
                  </div>
                  {isAdmin && !isSelf ? (
                    <>
                      <select value={m.role} onChange={async e => { await setMemberRole(m.id, e.target.value); reload() }} style={{ ...inputCls, padding: '7px 10px', fontSize: 13, cursor: 'pointer' }}>
                        <option value="admin">Yönetici</option>
                        <option value="lawyer">Avukat</option>
                        <option value="assistant">Asistan</option>
                      </select>
                      <button onClick={async () => { if (confirm(`${m.full_name} bürodan çıkarılsın mı?`)) { await removeMember(m.id); reload() } }} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 12.5, cursor: 'pointer' }}>Çıkar</button>
                    </>
                  ) : (
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 12px', borderRadius: 100, background: rc.bg, color: rc.fg }}>{ROLE_LABEL[m.role]}</span>
                  )}
                </div>
              )
            })}
          </div>
        </>
        )}
      </div>
    </div>
  )
}
