import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

// Lazy: anahtar yoksa modül yüklenirken patlamasın (build/deploy bozulmasın)
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY
  return key ? new Stripe(key) : null
}

const PRICE_IDS: Record<string, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE,
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  if (!stripe) return NextResponse.json({ error: 'Stripe yapılandırılmamış (global ödeme için STRIPE_SECRET_KEY gerekir).' }, { status: 503 })
  const { tier } = await request.json() as { tier: string }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('organization_id').eq('id', user.id).single()
  const { data: org } = await supabase.from('organizations').select('*').eq('id', profile!.organization_id).single()

  let customerId = org?.stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      ...(user.email ? { email: user.email } : {}),
      name: org?.name ?? undefined,
      metadata: { organization_id: org?.id ?? '' },
    })
    customerId = customer.id

    await supabase.from('organizations').update({ stripe_customer_id: customerId }).eq('id', org!.id)
  }

  const priceId = PRICE_IDS[tier]
  if (!priceId) return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?success=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing?canceled=1`,
    metadata: { organization_id: org!.id, tier },
  })

  return NextResponse.json({ url: session.url })
}
