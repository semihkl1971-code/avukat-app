import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Plan fiyatları (TRY, kuruş cinsinden — PayTR tutarı ×100 ister)
const PLAN_PRICES: Record<string, { amount: number; name: string }> = {
  starter: { amount: 29900, name: 'Başlangıç Plan (Aylık)' },
  pro: { amount: 59900, name: 'Profesyonel Plan (Aylık)' },
}

export async function POST(request: NextRequest) {
  const merchantId = process.env.PAYTR_MERCHANT_ID
  const merchantKey = process.env.PAYTR_MERCHANT_KEY
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT

  if (!merchantId || !merchantKey || !merchantSalt) {
    return NextResponse.json({ error: 'PayTR yapılandırılmamış. .env dosyasına anahtarları ekleyin.' }, { status: 500 })
  }

  const { tier } = (await request.json()) as { tier: string }
  const plan = PLAN_PRICES[tier]
  if (!plan) {
    return NextResponse.json({ error: 'Geçersiz plan' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Oturum bulunamadı' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('organization_id, full_name, phone')
    .eq('id', user.id)
    .single()

  if (!profile?.organization_id) {
    return NextResponse.json({ error: 'Organizasyon bulunamadı' }, { status: 400 })
  }

  // Kullanıcı IP'si
  const userIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  // Benzersiz sipariş no (sadece alfanümerik)
  const merchantOid = 'AV' + Date.now() + Math.random().toString(36).slice(2, 8).replace(/[^a-z0-9]/gi, '')

  const email = user.email ?? 'musteri@avukatim.com'
  const paymentAmount = plan.amount
  const testMode = process.env.PAYTR_TEST_MODE ?? '1'
  const noInstallment = '0'
  const maxInstallment = '0'
  const currency = 'TL'

  const userBasket = Buffer.from(
    JSON.stringify([[plan.name, (paymentAmount / 100).toFixed(2), 1]])
  ).toString('base64')

  // Hash: merchant_id + user_ip + merchant_oid + email + payment_amount + user_basket + no_installment + max_installment + currency + test_mode
  const hashStr =
    merchantId + userIp + merchantOid + email + paymentAmount + userBasket + noInstallment + maxInstallment + currency + testMode
  const paytrToken = crypto
    .createHmac('sha256', merchantKey)
    .update(hashStr + merchantSalt)
    .digest('base64')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3002'

  const form: Record<string, string> = {
    merchant_id: merchantId,
    user_ip: userIp,
    merchant_oid: merchantOid,
    email,
    payment_amount: String(paymentAmount),
    paytr_token: paytrToken,
    user_basket: userBasket,
    debug_on: '1',
    no_installment: noInstallment,
    max_installment: maxInstallment,
    user_name: profile.full_name ?? 'Avukat',
    user_address: 'Türkiye',
    user_phone: profile.phone ?? '05000000000',
    merchant_ok_url: `${appUrl}/dashboard/billing?status=success`,
    merchant_fail_url: `${appUrl}/dashboard/billing?status=fail`,
    timeout_limit: '30',
    currency,
    test_mode: testMode,
    lang: 'tr',
  }

  const body = new URLSearchParams(form).toString()

  const paytrRes = await fetch('https://www.paytr.com/odeme/api/get-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const result = (await paytrRes.json()) as { status: string; token?: string; reason?: string }

  if (result.status !== 'success') {
    return NextResponse.json({ error: `PayTR hatası: ${result.reason ?? 'bilinmeyen'}` }, { status: 400 })
  }

  // Bekleyen ödeme kaydı (callback bu kayıttan tier'ı bulacak)
  const admin = createAdminClient()
  await admin.from('payment_intents').insert({
    merchant_oid: merchantOid,
    organization_id: profile.organization_id,
    tier,
    amount: paymentAmount,
    provider: 'paytr',
    status: 'pending',
  })

  return NextResponse.json({ token: result.token, merchantOid })
}
