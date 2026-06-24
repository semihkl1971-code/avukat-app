'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Gavel, Users, UsersRound, FileText, Calendar,
  MessageSquare, Sparkles, Landmark, Wallet, ShieldCheck, CreditCard,
  Settings, LogOut, Scale,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const NAV: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/dashboard', label: 'Panel', icon: LayoutDashboard },
  { href: '/dashboard/cases', label: 'Davalar', icon: Gavel },
  { href: '/dashboard/clients', label: 'Müvekkiller', icon: Users },
  { href: '/dashboard/ekip', label: 'Ekip', icon: UsersRound },
  { href: '/dashboard/documents', label: 'Belgeler', icon: FileText },
  { href: '/dashboard/calendar', label: 'Takvim', icon: Calendar },
  { href: '/dashboard/messages', label: 'Mesajlar', icon: MessageSquare },
  { href: '/dashboard/ai-arama', label: 'AI Asistan', icon: Sparkles },
  { href: '/dashboard/uyap', label: 'UYAP', icon: Landmark },
  { href: '/dashboard/odemeler', label: 'Ödeme Takibi', icon: Wallet },
  { href: '/dashboard/guvenlik', label: 'Siber Güvenlik', icon: ShieldCheck },
  { href: '/dashboard/billing', label: 'Abonelik', icon: CreditCard },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: Settings },
]

export default function Sidebar({ profile }: { profile: Record<string, unknown> | null }) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const org = profile?.organizations as Record<string, unknown> | null
  const tier = (org?.subscription_tier as string) ?? 'free'
  const TIER_LABEL: Record<string, string> = { free: 'Ücretsiz', starter: 'Başlangıç', pro: 'Profesyonel', enterprise: 'Kurumsal' }

  return (
    <aside style={{ width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column', background: 'linear-gradient(180deg,#0b0d18,#08090f)', borderRight: '1px solid rgba(255,255,255,0.06)', color: '#e8eaf0', fontFamily: "'Inter','Segoe UI',sans-serif" }}>
      {/* Marka */}
      <div style={{ padding: '20px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6c63ff,#a855f7)', display: 'grid', placeItems: 'center', boxShadow: '0 6px 18px rgba(108,99,255,0.4)' }}>
            <Scale size={18} color="#fff" />
          </div>
          <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.5px' }}>Avukat<span style={{ color: '#8b80ff' }}>ım</span></span>
        </div>
        <p style={{ color: '#8892a4', fontSize: 12, margin: '12px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {(org?.name as string) ?? 'Hukuk Bürosu'}
        </p>
        <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 600, background: 'rgba(108,99,255,0.15)', border: '1px solid rgba(108,99,255,0.3)', color: '#c4b5fd', padding: '2px 10px', borderRadius: 100 }}>
          {TIER_LABEL[tier]}
        </span>
      </div>

      {/* Navigasyon */}
      <nav style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="dash-nav"
              aria-current={active ? 'page' : undefined}
              style={{
                position: 'relative',
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', marginBottom: 2, borderRadius: 11,
                fontSize: 14, fontWeight: active ? 600 : 500, textDecoration: 'none',
                color: active ? '#fff' : '#9aa3b4',
                background: active ? 'linear-gradient(135deg,rgba(108,99,255,0.2),rgba(168,85,247,0.1))' : 'transparent',
                boxShadow: active ? 'inset 3px 0 0 #8b80ff' : 'none',
              }}
            >
              <Icon size={18} color={active ? '#a78bfa' : 'currentColor'} strokeWidth={active ? 2.2 : 1.9} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Kullanıcı + çıkış */}
      <div style={{ padding: '14px 18px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ fontSize: 12.5, color: '#cbd5e1', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {(profile?.full_name as string) ?? 'Avukat'}
        </div>
        <button
          onClick={handleLogout}
          className="dash-logout"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#8892a4', fontSize: 12.5, fontWeight: 500, padding: 0 }}
        >
          <LogOut size={15} /> Çıkış Yap
        </button>
      </div>

      <style>{`
        .dash-nav:hover { background: rgba(255,255,255,0.05) !important; color: #fff !important; }
        .dash-logout:hover { color: #fff !important; }
      `}</style>
    </aside>
  )
}
