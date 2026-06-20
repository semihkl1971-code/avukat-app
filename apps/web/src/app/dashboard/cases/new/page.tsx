import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import NewCaseForm from './NewCaseForm'

export default async function NewCasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user!.id).single()

  const { data: clients } = await supabase
    .from('clients')
    .select('id, full_name')
    .eq('organization_id', profile!.organization_id!)
    .order('full_name')

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/cases" className="hover:text-indigo-600">Davalar</Link>
        <span>/</span>
        <span className="text-gray-900">Yeni Dava</span>
      </div>

      <h2 className="text-2xl font-serif font-bold text-gray-900">Yeni Dava Ekle</h2>

      {!clients?.length ? (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-5 py-4 text-sm">
          Dava eklemek için önce en az bir müvekkil oluşturmalısınız.{' '}
          <Link href="/dashboard/clients/new" className="font-semibold underline">Müvekkil ekle →</Link>
        </div>
      ) : (
        <NewCaseForm clients={clients} />
      )}
    </div>
  )
}
