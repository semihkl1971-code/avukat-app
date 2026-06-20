'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV = [
  { href: '/dashboard', label: 'Panel', icon: '⊞' },
  { href: '/dashboard/cases', label: 'Davalar', icon: '⚖' },
  { href: '/dashboard/clients', label: 'Müvekkiller', icon: '👤' },
  { href: '/dashboard/ekip', label: 'Ekip', icon: '👥' },
  { href: '/dashboard/documents', label: 'Belgeler', icon: '📄' },
  { href: '/dashboard/calendar', label: 'Takvim', icon: '📅' },
  { href: '/dashboard/messages', label: 'Mesajlar', icon: '💬' },
  { href: '/dashboard/ai-arama', label: 'AI Asistan', icon: '🧠' },
  { href: '/dashboard/uyap', label: 'UYAP', icon: '🏛' },
  { href: '/dashboard/odemeler', label: 'Ödeme Takibi', icon: '💰' },
  { href: '/dashboard/guvenlik', label: 'Siber Güvenlik', icon: '🛡' },
  { href: '/dashboard/billing', label: 'Abonelik', icon: '💳' },
  { href: '/dashboard/settings', label: 'Ayarlar', icon: '⚙' },
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
    <aside className="w-60 bg-indigo-900 text-white flex flex-col shrink-0">
      <div className="px-5 py-6 border-b border-indigo-800">
        <h1 className="text-xl font-serif font-bold">Avukatım</h1>
        <p className="text-indigo-300 text-xs mt-0.5 truncate">
          {(org?.name as string) ?? 'Hukuk Bürosu'}
        </p>
        <span className="inline-block mt-2 text-xs bg-indigo-700 text-indigo-200 px-2 py-0.5 rounded-full">
          {TIER_LABEL[tier]}
        </span>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        {NAV.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                active ? 'bg-indigo-700 text-white' : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-indigo-800">
        <div className="text-xs text-indigo-300 mb-3 truncate">
          {(profile?.full_name as string) ?? 'Avukat'}
        </div>
        <button
          onClick={handleLogout}
          className="w-full text-left text-xs text-indigo-300 hover:text-white transition"
        >
          Çıkış Yap →
        </button>
      </div>
    </aside>
  )
}
