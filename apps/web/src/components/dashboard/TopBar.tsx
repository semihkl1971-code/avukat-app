'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

interface Props {
  user: User
  profile: Record<string, unknown> | null
}

export default function TopBar({ profile }: Props) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) router.push(`/dashboard/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Dava, müvekkil, belge ara..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
          />
        </div>
      </form>

      <div className="flex items-center gap-4 ml-4">
        <button className="text-gray-500 hover:text-gray-700 relative">
          🔔
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-sm">
            {((profile?.full_name as string) ?? 'A')[0]?.toUpperCase()}
          </div>
          <span className="text-sm text-gray-700 hidden sm:block">
            {(profile?.full_name as string) ?? 'Avukat'}
          </span>
        </div>
      </div>
    </header>
  )
}
