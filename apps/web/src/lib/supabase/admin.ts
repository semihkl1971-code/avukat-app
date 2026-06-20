import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client — RLS'i bypass eder.
 * SADECE sunucu tarafında, güvenilir webhook/callback'lerde kullanılmalı.
 * Asla client component'e veya tarayıcıya sızdırılmamalı.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createSupabaseClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
