import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// PayTR bu endpoint'e sunucu-sunucu POST yapar (oturum cookie'si YOK).
// Bildirim URL'si olarak PayTR panelinden bu adres ayarlanmalı:
//   https://SITENIZ.com/api/payments/paytr/callback
export async function POST(request: NextRequest) {
  const merchantKey = process.env.PAYTR_MERCHANT_KEY
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT

  if (!merchantKey || !merchantSalt) {
    return new NextResponse('PayTR yapılandırılmamış', { status: 500 })
  }

  const formData = await request.formData()
  const callback = Object.fromEntries(formData.entries()) as Record<string, string>

  const merchantOid = callback.merchant_oid
  const status = callback.status
  const totalAmount = callback.total_amount
  const receivedHash = callback.hash

  if (!merchantOid || !status || !receivedHash) {
    return new NextResponse('Eksik parametre', { status: 400 })
  }

  // Hash doğrulama: merchant_oid + merchant_salt + status + total_amount
  const expectedHash = crypto
    .createHmac('sha256', merchantKey)
    .update(merchantOid + merchantSalt + status + totalAmount)
    .digest('base64')

  if (receivedHash !== expectedHash) {
    // Hatalı hash — manipüle edilmiş istek. Maddi zarara karşı işlemi durdur.
    return new NextResponse('PAYTR notification failed: bad hash', { status: 400 })
  }

  const admin = createAdminClient()

  // Bekleyen ödeme kaydını bul
  const { data: intent } = await admin
    .from('payment_intents')
    .select('*')
    .eq('merchant_oid', merchantOid)
    .single()

  if (!intent) {
    // Kayıt yoksa bile PayTR'a OK dön (tekrar denemesini engelle)
    return new NextResponse('OK')
  }

  // Idempotency: zaten işlenmişse tekrar işleme
  if (intent.status === 'paid' || intent.status === 'failed') {
    return new NextResponse('OK')
  }

  if (status === 'success') {
    // Aboneliği aktive et
    await admin
      .from('organizations')
      .update({
        subscription_tier: intent.tier,
        subscription_status: 'active',
      })
      .eq('id', intent.organization_id)

    await admin
      .from('payment_intents')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('merchant_oid', merchantOid)

    await admin.from('subscription_events').insert({
      organization_id: intent.organization_id,
      event_type: 'paytr.success',
      provider: 'paytr',
      provider_event_id: merchantOid,
      payload: callback as Record<string, unknown>,
    })
  } else {
    await admin
      .from('payment_intents')
      .update({ status: 'failed' })
      .eq('merchant_oid', merchantOid)

    await admin.from('subscription_events').insert({
      organization_id: intent.organization_id,
      event_type: 'paytr.failed',
      provider: 'paytr',
      provider_event_id: merchantOid,
      payload: callback as Record<string, unknown>,
    })
  }

  // PayTR'a mutlaka "OK" dönülmeli, aksi halde bildirimi tekrar gönderir
  return new NextResponse('OK')
}
