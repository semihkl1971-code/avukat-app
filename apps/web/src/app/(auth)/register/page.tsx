'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 16px', borderRadius: 12,
  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
  color: '#f1f5f9', fontSize: 14, outline: 'none', boxSizing: 'border-box',
}

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', fullName: '', barNumber: '', phone: '', firmName: '' })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)

  function set(k: string) { return (e: React.ChangeEvent<HTMLInputElement>) => setForm(f => ({ ...f, [k]: e.target.value })) }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    if (step === 1) { setStep(2); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.fullName } },
    })
    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    // E-posta onayı açıksa oturum gelmez; kullanıcıyı bilgilendir.
    if (!data.session) {
      setError('Kayıt alındı! E-posta adresinize gönderilen onay bağlantısına tıklayıp giriş yapın.')
      setLoading(false)
      return
    }

    if (data.user) {
      // Önce bekleyen bir davet var mı kontrol et — varsa yeni büro açma, mevcut büroya katıl.
      const { data: claimed } = await supabase.rpc('claim_org_invite')
      const joined = Array.isArray(claimed) ? claimed[0] : claimed
      if (joined?.organization_id) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: form.fullName,
          bar_number: form.barNumber || null,
          phone: form.phone || null,
          locale: 'tr',
        })
        router.push('/dashboard')
        router.refresh()
        return
      }

      // Org id'yi client-side üret — .select() RLS'e takılmasın diye geri okumaya gerek kalmaz.
      const orgId = crypto.randomUUID()
      const slug = (form.firmName || form.fullName).toLowerCase()
        .replace(/[ğ]/g, 'g').replace(/[ü]/g, 'u').replace(/[ş]/g, 's')
        .replace(/[ı]/g, 'i').replace(/[ö]/g, 'o').replace(/[ç]/g, 'c')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Math.random().toString(36).slice(2, 6)

      const { error: orgError } = await supabase.from('organizations').insert({
        id: orgId,
        name: form.firmName || `${form.fullName} Hukuk Bürosu`,
        slug,
        subscription_tier: 'free',
        country_code: 'TR',
      })
      if (orgError) { setError('Büro oluşturulamadı: ' + orgError.message); setLoading(false); return }

      // Profil trigger tarafından eklenmiş olabilir; upsert ile garantiye al.
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        organization_id: orgId,
        full_name: form.fullName,
        bar_number: form.barNumber || null,
        phone: form.phone || null,
        role: 'admin',
        locale: 'tr',
      })
      if (profileError) { setError('Profil oluşturulamadı: ' + profileError.message); setLoading(false); return }
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", background: '#07090f' }}>

      {/* SOL PANEL */}
      <div style={{ flex: '0 0 420px', background: 'linear-gradient(160deg,#0f0c29,#1a1040,#0d1b2a)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px', position: 'relative', overflow: 'hidden' }} className="left-panel">
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(108,99,255,0.15),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -60, width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.12),transparent 70%)', pointerEvents: 'none' }} />

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
          <span style={{ fontSize: 26 }}>⚖️</span>
          <span style={{ fontWeight: 800, fontSize: 20, color: '#fff' }}>Avukat<span style={{ color: '#a78bfa' }}>App</span></span>
        </Link>

        <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.5px' }}>14 Gün Ücretsiz<br />Deneyin</h2>
        <p style={{ color: '#6b7280', fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>Kredi kartı gerekmez. İstediğiniz zaman iptal edin.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            '✓  Sınırsız dava ve belge yükleme',
            '✓  UYAP otomatik senkronizasyon',
            '✓  WhatsApp & Gmail entegrasyonu',
            '✓  Yapay zeka destekli asistan',
            '✓  iOS & Android mobil uygulama',
          ].map(f => <div key={f} style={{ fontSize: 14, color: '#9ca3af' }}>{f}</div>)}
        </div>

        {/* Adım göstergesi */}
        <div style={{ marginTop: 56, display: 'flex', gap: 8, alignItems: 'center' }}>
          {[1, 2].map(s => (
            <div key={s} style={{ height: 4, borderRadius: 4, flex: s === step ? 2 : 1, background: s <= step ? 'linear-gradient(90deg,#6c63ff,#a855f7)' : 'rgba(255,255,255,0.1)', transition: 'flex 0.3s, background 0.3s' }} />
          ))}
          <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 4 }}>{step}/2</span>
        </div>
      </div>

      {/* SAĞ PANEL */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 13, color: '#6c63ff', fontWeight: 600, marginBottom: 8 }}>
              ADIM {step} / 2
            </div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px', marginBottom: 6 }}>
              {step === 1 ? 'Hesabınızı Oluşturun' : 'Büro Bilgileriniz'}
            </h2>
            <p style={{ color: '#6b7280', fontSize: 14 }}>
              {step === 1 ? 'Giriş bilgilerinizi girin' : 'Son birkaç bilgi kaldı'}
            </p>
          </div>

          <form onSubmit={handleRegister}>
            {step === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 7, letterSpacing: '0.3px' }}>AD SOYAD</label>
                  <input required type="text" value={form.fullName} onChange={set('fullName')} placeholder="Av. Ali Veli" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 7, letterSpacing: '0.3px' }}>E-POSTA</label>
                  <input required type="email" value={form.email} onChange={set('email')} placeholder="avukat@example.com" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 7, letterSpacing: '0.3px' }}>ŞİFRE</label>
                  <input required type="password" value={form.password} onChange={set('password')} placeholder="En az 8 karakter" style={inputStyle} minLength={8}
                    onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 7, letterSpacing: '0.3px' }}>BÜRO ADI</label>
                  <input type="text" value={form.firmName} onChange={set('firmName')} placeholder="Veli Hukuk Bürosu" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 7, letterSpacing: '0.3px' }}>BARO SİCİL NO <span style={{ color: '#4b5563', fontWeight: 400 }}>(isteğe bağlı)</span></label>
                  <input type="text" value={form.barNumber} onChange={set('barNumber')} placeholder="12345" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 7, letterSpacing: '0.3px' }}>TELEFON <span style={{ color: '#4b5563', fontWeight: 400 }}>(isteğe bağlı)</span></label>
                  <input type="tel" value={form.phone} onChange={set('phone')} placeholder="05xx xxx xx xx" style={inputStyle}
                    onFocus={e => e.target.style.borderColor = '#6c63ff'} onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'} />
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#fca5a5', marginTop: 16 }}>
                ⚠ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
              {step === 2 && (
                <button type="button" onClick={() => setStep(1)} style={{ flex: '0 0 auto', padding: '13px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
                  ← Geri
                </button>
              )}
              <button type="submit" disabled={loading} style={{ flex: 1, padding: '13px 0', borderRadius: 12, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
                {loading ? 'Oluşturuluyor...' : step === 1 ? 'Devam Et →' : 'Hesabı Oluştur →'}
              </button>
            </div>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, color: '#6b7280', fontSize: 14 }}>
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
