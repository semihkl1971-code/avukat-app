import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import crypto from 'crypto'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

const TIER_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER ?? '']: 'starter',
  [process.env.STRIPE_PRICE_PRO ?? '']: 'pro',
  [process.env.STRIPE_PRICE_ENTERPRISE ?? '']: 'enterprise',
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const stripeSignature = request.headers.get('stripe-signature')
  const iyzicoSignature = request.headers.get('x-iyzico-signature')

  if (stripeSignature) {
    return handleStripeWebhook(body, stripeSignature)
  }

  if (iyzicoSignature) {
    return handleIyzicoWebhook(body, iyzicoSignature)
  }

  return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
}

async function handleStripeWebhook(body: string, signature: string) {
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 })
  }

  const supabase = await createClient()

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string
    const priceId = sub.items.data[0]?.price.id ?? ''
    const tier = TIER_MAP[priceId] ?? 'free'

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (org) {
      await supabase.from('organizations').update({
        subscription_tier: tier,
        subscription_status: sub.status,
        stripe_subscription_id: sub.id,
      }).eq('id', org.id)

      await supabase.from('subscription_events').insert({
        organization_id: org.id,
        event_type: event.type,
        provider: 'stripe',
        provider_event_id: event.id,
        payload: event.data.object as unknown as Record<string, unknown>,
      })
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object as Stripe.Subscription
    const customerId = sub.customer as string

    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('stripe_customer_id', customerId)
      .single()

    if (org) {
      await supabase.from('organizations').update({
        subscription_tier: 'free',
        subscription_status: 'canceled',
      }).eq('id', org.id)
    }
  }

  return NextResponse.json({ received: true })
}

async function handleIyzicoWebhook(body: string, signature: string) {
  const secretKey = process.env.IYZICO_SECRET_KEY!
  const expected = crypto.createHmac('sha1', secretKey).update(body).digest('base64')

  if (signature !== expected) {
    return NextResponse.json({ error: 'Invalid iyzico signature' }, { status: 400 })
  }

  const payload = JSON.parse(body) as Record<string, string>
  const supabase = await createClient()

  const refCode = payload['subscriptionReferenceCode']
  const status = payload['status']
  const tier = (payload['pricingPlanName'] ?? '').toLowerCase().includes('pro') ? 'pro'
    : (payload['pricingPlanName'] ?? '').toLowerCase().includes('starter') ? 'starter'
    : 'free'

  if (refCode) {
    const { data: org } = await supabase
      .from('organizations')
      .select('id')
      .eq('iyzico_subscription_reference_code', refCode)
      .single()

    if (org) {
      await supabase.from('organizations').update({
        subscription_tier: status === 'ACTIVE' ? tier : 'free',
        subscription_status: status === 'ACTIVE' ? 'active' : 'canceled',
      }).eq('id', org.id)

      await supabase.from('subscription_events').insert({
        organization_id: org.id,
        event_type: `iyzico.${status}`,
        provider: 'iyzico',
        provider_event_id: refCode,
        payload: payload as Record<string, unknown>,
      })
    }
  }

  return NextResponse.json({ status: 'ok' })
}
