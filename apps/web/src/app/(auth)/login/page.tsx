'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  useEffect(() => {
    if (searchParams.get('demo') === 'true') {
      setEmail('demo@avukatim.com')
      setPassword('Demo123456!')
    }
  }, [searchParams])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('E-posta veya şifre hatalı.'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter','Segoe UI',sans-serif", background: '#07090f' }}>

      {/* ── SOL PANEL ── */}
      <div style={{ flex: '0 0 480px', background: 'linear-gradient(160deg,#0f0c29,#1a1040,#0d1b2a)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px', position: 'relative', overflow: 'hidden' }} className="left-panel">
        {/* Dekoratif daireler */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle,rgba(108,99,255,0.15),transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(168,85,247,0.12),transparent 70%)', pointerEvents: 'none' }} />

        <div>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 64 }}>
            <span style={{ fontSize: 28 }}>⚖️</span>
            <span style={{ fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.5px' }}>Avukat<span style={{ color: '#a78bfa' }}>ım</span></span>
          </Link>

          <h1 style={{ fontSize: 36, fontWeight: 800, color: '#fff', lineHeight: 1.2, marginBottom: 16, letterSpacing: '-1px' }}>
            Hukuk Büronuzu<br />Dijitale Taşıyın
          </h1>
          <p style={{ fontSize: 15, color: '#8892a4', lineHeight: 1.7, marginBottom: 48 }}>
            UYAP entegrasyonu, WhatsApp & Gmail iletişimi ve yapay zeka destekli dava yönetimiyle hukuk pratiğinizi dönüştürün.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              { icon: '🏛', title: 'UYAP Entegrasyonu', desc: 'Dava ve duruşmalarınızı otomatik senkronize edin' },
              { icon: '💬', title: 'Birleşik Gelen Kutusu', desc: 'WhatsApp ve Gmail tek yerden' },
              { icon: '⚡', title: 'Yapay Zeka Asistan', desc: 'Dilekçe yazma ve hukuki araştırma' },
            ].map(f => (
              <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(108,99,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                <div>
                  <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: 14 }}>{f.title}</div>
                  <div style={{ color: '#6b7280', fontSize: 13, marginTop: 2 }}>{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[1,2,3,4,5].map(i => <span key={i} style={{ color: '#f59e0b', fontSize: 16 }}>★</span>)}
          </div>
          <p style={{ color: '#9ca3af', fontSize: 13, lineHeight: 1.6, marginTop: 8, marginBottom: 10 }}>
            &quot;Avukatım sayesinde dava takibimiz %60 hızlandı. UYAP entegrasyonu gerçekten hayat kurtarıyor.&quot;
          </p>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#c4b5fd' }}>Av. Mehmet Yılmaz — İstanbul Barosu</div>
        </div>
      </div>

      {/* ── SAĞ PANEL (FORM) ── */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px', marginBottom: 8 }}>Tekrar Hoş Geldiniz</h2>
            <p style={{ color: '#6b7280', fontSize: 15 }}>Hesabınıza giriş yapın</p>
          </div>

          {/* Demo */}
          <Link href="/login?demo=true" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 0', borderRadius: 12, background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.25)', color: '#a78bfa', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 10, textDecoration: 'none' }}>
            🖥 Demo Hesabıyla Dene
            <span style={{ fontSize: 11, background: 'rgba(108,99,255,0.2)', padding: '2px 8px', borderRadius: 6 }}>demo@avukatim.com</span>
          </Link>

          {/* Google */}
          <button onClick={handleGoogle} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, padding: '13px 0', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 24, transition: 'background 0.2s' }}>
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Google ile Giriş Yap
          </button>

          {/* Ayırıcı */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{ color: '#4b5563', fontSize: 13 }}>veya e-posta ile</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#9ca3af', marginBottom: 8, letterSpacing: '0.3px' }}>E-POSTA</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="avukat@example.com"
                style={{ width: '100%', padding: '13px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                onFocus={e => e.target.style.borderColor = '#6c63ff'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.3px' }}>ŞİFRE</label>
                <a href="#" style={{ fontSize: 13, color: '#6c63ff', textDecoration: 'none' }}>Şifremi Unuttum</a>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ width: '100%', padding: '13px 46px 13px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: 15, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }}
                  onFocus={e => e.target.style.borderColor = '#6c63ff'}
                  onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 16 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', fontSize: 14, color: '#fca5a5', marginBottom: 16 }}>
                ⚠ {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ width: '100%', padding: '14px 0', borderRadius: 12, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, transition: 'opacity 0.2s' }}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, color: '#6b7280', fontSize: 14 }}>
            Hesabınız yok mu?{' '}
            <Link href="/register" style={{ color: '#a78bfa', fontWeight: 600, textDecoration: 'none' }}>
              Ücretsiz Kayıt Olun
            </Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: 32, color: '#374151', fontSize: 12, lineHeight: 1.6 }}>
            Giriş yaparak{' '}
            <a href="#" style={{ color: '#6b7280' }}>Kullanım Şartları</a> ve{' '}
            <a href="#" style={{ color: '#6b7280' }}>Gizlilik Politikası</a>&apos;nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .left-panel { display: none !important; }
        }
      `}</style>
    </div>
  )
}
