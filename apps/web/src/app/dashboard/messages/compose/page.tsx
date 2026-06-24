import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ComposeForm from './ComposeForm'

export default async function ComposePage({ searchParams }: { searchParams: Promise<{ channel?: string }> }) {
  const { channel } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name, phone, email')
    .eq('organization_id', profile!.organization_id)
    .order('full_name')

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/messages" className="hover:text-gray-500">Mesajlar</Link>
        <span>/</span>
        <span className="text-gray-500">Yeni Mesaj</span>
      </div>
      <h2 className="text-2xl font-serif font-bold text-gray-100">Yeni Mesaj</h2>
      <ComposeForm clients={clients ?? []} initialChannel={channel ?? 'whatsapp'} />
    </div>
  )
}
