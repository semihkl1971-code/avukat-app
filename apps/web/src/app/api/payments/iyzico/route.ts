import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const IYZICO_BASE = process.env.IYZICO_BASE_URL ?? 'https://sandbox-api.iyzipay.com'

const PLAN_REF_CODES: Record<string, string> = {
  starter: process.env.IYZICO_PLAN_STARTER!,
  pro: process.env.IYZICO_PLAN_PRO!,
  enterprise: process.env.IYZICO_PLAN_ENTERPRISE!,
}

function iyzicoAuth(body: string): string {
  const apiKey = process.env.IYZICO_API_KEY!
  const secretKey = process.env.IYZICO_SECRET_KEY!
  const randomString = Math.random().toString(36).slice(2)
  const hashStr = apiKey + randomString + secretKey + body
  const hash = crypto.createHash('sha256').update(hashStr, 'utf8').digest('base64')
  return `IYZWS apiKey:${apiKey}, randomKey:${randomString}, signature:${hash}`
}

export async function POST(request: NextRequest) {
  const { tier } = await request.json() as { tier: string }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id, full_name, phone').eq('id', user.id).single()
  const pricingPlanReferenceCode = PLAN_REF_CODES[tier]

  if (!pricingPlanReferenceCode) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  const body = JSON.stringify({
    locale: 'tr',
    conversationId: crypto.randomUUID(),
    pricingPlanReferenceCode,
    subscriptionInitialStatus: 'ACTIVE',
    customer: {
      name: profile?.full_name?.split(' ')[0] ?? 'Ad',
      surname: profile?.full_name?.split(' ').slice(1).join(' ') ?? 'Soyad',
      email: user.email,
      gsmNumber: profile?.phone ?? '+905000000000',
      identityNumber: '11111111111',
    },
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/iyzico/callback`,
  })

  const response = await fetch(`${IYZICO_BASE}/v2/subscription/initialize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: iyzicoAuth(body),
    },
    body,
  })

  const data = await response.json() as Record<string, unknown>

  if (data['status'] !== 'success') {
    return NextResponse.json({ error: data['errorMessage'] ?? 'iyzico error' }, { status: 400 })
  }

  return NextResponse.json({ checkoutFormContent: data['checkoutFormContent'], token: data['token'] })
}
