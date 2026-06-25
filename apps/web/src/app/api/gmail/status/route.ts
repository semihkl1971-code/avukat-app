import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { gmailConfigured } from '@/lib/gmail'

export const runtime = 'nodejs'

export async function GET() {
  const configured = gmailConfigured()
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ configured, connected: false })
  const { data: profile } = await supabase
    .from('profiles')
    .select('gmail_refresh_token_encrypted')
    .eq('id', user.id)
    .single()
  return NextResponse.json({ configured, connected: !!profile?.gmail_refresh_token_encrypted })
}
