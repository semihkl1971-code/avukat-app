'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 12,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 6, letterSpacing: '0.3px' }

// TC Kimlik doğrulama (11 hane + algoritma)
function validTC(tc: string): boolean {
  if (!/^[1-9][0-9]{10}$/.test(tc)) return false
  const d = tc.split('').map(Number)
  const odd = d[0] + d[2] + d[4] + d[6] + d[8]
  const even = d[1] + d[3] + d[5] + d[7]
  if ((odd * 7 - even) % 10 !== d[9]) return false
  if (d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 !== d[10]) return false
  return true
}

// Şifre gücü kuralları
function passwordChecks(p: string) {
  return {
    len: p.length >= 8,
    upper: /[A-ZĞÜŞİÖÇ]/.test(p),
    lower: /[a-zğüşıöç]/.test(p),
    digit: /[0-9]/.test(p),
  }
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ fullName: '', tc: '', email: '', phone: '', firmName: '', barNumber: '', password: '', password2: '' })
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  function set(k: string) { return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value })) }

  const pc = passwordChecks(form.password)
  const pwScore = Object.values(pc).filter(Boolean).length
  const pwOk = pc.len && pc.upper && pc.lower && pc.digit

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.fullName.trim()) return setError('Ad soyad zorunludur.')
    if (!validTC(form.tc)) return setError('Geçerli bir TC Kimlik No girin (11 hane).')
    if (!form.phone.trim()) return setError('Telefon numarası zorunludur.')
    if (!form.firmName.trim()) return setError('Büro adı zorunludur.')
    if (!pwOk) return setError('Şifre çok zayıf — en az 8 karakter, büyük-küçük harf ve rakam içermeli.')
    if (form.password !== form.password2) return setError('Şifreler eşleşmiyor.')

    setLoading(true)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        data: {
          full_name: form.fullName.trim(),
          tc_kimlik: form.tc,
          phone: form.phone.trim(),
          bar_number: form.barNumber.trim(),
          firm_name: form.firmName.trim(),
        },
      },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    // E-posta onayı açıksa oturum gelmez → doğrulama ekranı göster (org'u trigger oluşturur)
    if (!data.session) { setDone(true); setLoading(false); return }

    if (data.user) {
      // Davet varsa mevcut büroya katıl
      const { data: claimed } = await supabase.rpc('claim_org_invite')
      const joined = Array.isArray(claimed) ? claimed[0] : claimed
      if (joined?.organization_id) {
        await supabase.from('profiles').upsert({ id: data.user.id, full_name: form.fullName.trim(), bar_number: form.barNumber.trim() || null, phone: form.phone.trim() || null, locale: 'tr' })
        router.push('/dashboard'); router.refresh(); return
      }

      // Yeni büro oluştur (org id client-side)
      const orgId = crypto.randomUUID()
      const slug = (form.firmName || form.fullName).toLowerCase()
        .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).slice(2, 6)
      const { error: orgError } = await supabase.from('organizations').insert({ id: orgId, name: form.firmName.trim(), slug, subscription_tier: 'free', country_code: 'TR' })
      if (orgError) { setError('Büro oluşturulamadı: ' + orgError.message); setLoading(false); return }
      const { error: pErr } = await supabase.from('profiles').upsert({ id: data.user.id, organization_id: orgId, full_name: form.fullName.trim(), bar_number: form.barNumber.trim() || null, phone: form.phone.trim() || null, role: 'admin', locale: 'tr' })
      if (pErr) { setError('Profil oluşturulamadı: ' + pErr.message); setLoading(false); return }
    }
    // Kayıt sonrası önce abonelik (plan seçimi), sonra panel
    router.push('/dashboard/billing?welcome=1'); router.refresh()
  }

  // E-posta onay ekranı
  if (done) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#07090f', fontFamily: "'Inter','Segoe UI',sans-serif", padding: 24 }}>
        <div style={{ maxWidth: 440, textAlign: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 20, padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📧</div>
          <h2 style={{ color: '#f1f5f9', fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>E-postanızı doğrulayın</h2>
          <p style={{ color: '#9ca3af', fontSize: 15, lineHeight: 1.7, margin: '0 0 24px' }}>
            <strong style={{ color: '#e8eaf0' }}>{form.email}</strong> adresine bir onay bağlantısı gönderdik. Bağlantıya tıklayıp hesabınızı doğrulayın, ardından giriş yapıp planınızı seçin.
          </p>
          <Link href="/login" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: 12, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', textDecoration: 'none', fontWeight: 700 }}>Giriş Yap</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", background: '#07090f' }}>
      {/* SOL PANEL */}
      <div style={{ flex: '0 0 400px', background: 'linear-gradient(160deg,#0f0c29,#1a1040,#0d1b2a)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 48, position: 'relative', overflow: 'hidden' }} className="left-panel">
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(108,99,255,0.15),transparent 70%)' }} />
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 48 }}>
          <span style={{ fontSize: 26 }}>⚖️</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#fff' }}>Avukat<span style={{ color: '#a78bfa' }}>ım</span></span>
        </Link>
        <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.5px' }}>14 Gün Ücretsiz<br />Deneyin</h2>
        <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, marginBottom: 36 }}>Kredi kartı gerekmez. İstediğiniz zaman iptal edin.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {['✓  UYAP otomatik senkronizasyon', '✓  WhatsApp & yapay zeka asistanı', '✓  Müvekkil, dava ve belge yönetimi', '✓  Web, masaüstü ve mobil'].map(f => <div key={f} style={{ fontSize: 14, color: '#9ca3af' }}>{f}</div>)}
        </div>
      </div>

      {/* SAĞ PANEL — tek sütun, tüm alanlar alt alta */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px', margin: '0 0 6px' }}>Hesabınızı Oluşturun</h2>
          <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 28px' }}>Büronuzu birkaç dakikada kurun.</p>

          <form onSubmit={handleRegister}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>AD SOYAD</label>
                <input required value={form.fullName} onChange={set('fullName')} placeholder="Av. Ali Veli" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>TC KİMLİK NO</label>
                <input required value={form.tc} onChange={set('tc')} placeholder="11 haneli" inputMode="numeric" maxLength={11} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>E-POSTA</label>
                <input required type="email" value={form.email} onChange={set('email')} placeholder="avukat@example.com" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>TELEFON</label>
                <input required type="tel" value={form.phone} onChange={set('phone')} placeholder="05xx xxx xx xx" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>BÜRO ADI</label>
                <input required value={form.firmName} onChange={set('firmName')} placeholder="Veli Hukuk Bürosu" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>BARO SİCİL NO</label>
                <input value={form.barNumber} onChange={set('barNumber')} placeholder="12345" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>ŞİFRE</label>
                <div style={{ position: 'relative' }}>
                  <input required type={showPass ? 'text' : 'password'} value={form.password} onChange={set('password')} placeholder="Güçlü bir şifre" style={inputStyle} />
                  <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}>{showPass ? '🙈' : '👁'}</button>
                </div>
                {form.password && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                      {[0, 1, 2, 3].map(i => <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i < pwScore ? (pwScore <= 2 ? '#ef4444' : pwScore === 3 ? '#f59e0b' : '#1ec45f') : 'rgba(255,255,255,0.1)' }} />)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', fontSize: 11.5 }}>
                      {[['len', '8+ karakter'], ['upper', 'Büyük harf'], ['lower', 'Küçük harf'], ['digit', 'Rakam']].map(([k, t]) => (
                        <span key={k} style={{ color: pc[k as keyof typeof pc] ? '#6ee7b7' : '#6b7280' }}>{pc[k as keyof typeof pc] ? '✓' : '○'} {t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label style={labelStyle}>ŞİFRE TEKRAR</label>
                <input required type={showPass ? 'text' : 'password'} value={form.password2} onChange={set('password2')} placeholder="Şifrenizi tekrar girin" style={{ ...inputStyle, borderColor: form.password2 && form.password !== form.password2 ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)' }} />
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#fca5a5', marginTop: 16 }}>⚠ {error}</div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', marginTop: 22, padding: '14px 0', borderRadius: 12, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Oluşturuluyor...' : 'Hesabı Oluştur ve Plan Seç →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', margin: '20px 0 40px', color: '#6b7280', fontSize: 14 }}>
            Zaten hesabınız var mı?{' '}
            <Link href="/login" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>Giriş Yapın</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) { .left-panel { display: none !important; } }
        input::placeholder { color: #4b5563 !important; }
      `}</style>
    </div>
  )
}
