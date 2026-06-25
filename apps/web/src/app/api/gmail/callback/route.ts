import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { exchangeCode, encrypt } from '@/lib/gmail'

export const runtime = 'nodejs'

const base = () => (process.env.NEXT_PUBLIC_APP_URL || 'https://avukat-web-avukat1.vercel.app').replace(/\/$/, '')

// Google'dan dönüş: code'u token'a çevir, refresh token'ı şifreli sakla
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state') // userId
  if (req.nextUrl.searchParams.get('error') || !code || !state) {
    return NextResponse.redirect(`${base()}/dashboard/settings?gmail=error`)
  }

  const tokens = await exchangeCode(code)
  if (!tokens.refresh_token) {
    // refresh_token yalnızca ilk onayda gelir; prompt=consent ile garanti
    return NextResponse.redirect(`${base()}/dashboard/settings?gmail=error`)
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  await sb.from('profiles').update({ gmail_refresh_token_encrypted: encrypt(tokens.refresh_token) }).eq('id', state)

  return NextResponse.redirect(`${base()}/dashboard/settings?gmail=connected`)
}
