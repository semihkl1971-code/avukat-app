import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { authUrl, gmailConfigured } from '@/lib/gmail'

export const runtime = 'nodejs'

const base = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://avukat-web-avukat1.vercel.app').replace(/\/$/, '')

// Gmail bağlama başlat: kullanıcıyı Google izin ekranına yönlendir
export async function GET() {
  if (!gmailConfigured()) {
    return NextResponse.redirect(`${base()}/dashboard/settings?gmail=notconfigured`)
  }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${base()}/login`)
  return NextResponse.redirect(authUrl(user.id))
}
