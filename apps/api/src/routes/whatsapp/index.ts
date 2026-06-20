import type { FastifyPluginAsync } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!
const WA_PHONE_ID = process.env.WHATSAPP_PHONE_ID!
const WA_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!
const APP_SECRET = process.env.META_APP_SECRET!

export const whatsappRoutes: FastifyPluginAsync = async (app) => {
  // Meta webhook verification
  app.get('/webhook', async (req, reply) => {
    const params = req.query as Record<string, string>
    if (params['hub.mode'] === 'subscribe' && params['hub.verify_token'] === WA_VERIFY_TOKEN) {
      return reply.send(params['hub.challenge'])
    }
    return reply.code(403).send('Forbidden')
  })

  // Incoming messages
  app.post('/webhook', async (req, reply) => {
    const signature = (req.headers['x-hub-signature-256'] as string)?.replace('sha256=', '')
    const expected = crypto.createHmac('sha256', APP_SECRET).update(JSON.stringify(req.body)).digest('hex')

    if (signature !== expected) {
      return reply.code(401).send('Invalid signature')
    }

    const body = req.body as Record<string, unknown>
    const entry = (body['entry'] as Record<string, unknown>[])?.[0]
    const changes = (entry?.['changes'] as Record<string, unknown>[])?.[0]
    const value = changes?.['value'] as Record<string, unknown>
    const messages = value?.['messages'] as Record<string, unknown>[]

    for (const msg of messages ?? []) {
      const from = msg['from'] as string
      const text = (msg['text'] as Record<string, string>)?.['body']
      const msgId = msg['id'] as string

      const { data: client } = await supabase
        .from('clients')
        .select('id, organization_id')
        .eq('phone', `+${from}`)
        .single()

      if (client) {
        await supabase.from('messages').insert({
          organization_id: client.organization_id,
          client_id: client.id,
          channel: 'whatsapp',
          direction: 'inbound',
          external_message_id: msgId,
          from_address: `+${from}`,
          body: text,
          status: 'delivered',
          received_at: new Date().toISOString(),
        })
      }
    }

    return { status: 'ok' }
  })

  // Send message
  app.post('/send', async (req, reply) => {
    const { to, message, orgId } = req.body as { to: string; message: string; orgId: string }

    const { data: org } = await supabase
      .from('organizations')
      .select('subscription_tier')
      .eq('id', orgId)
      .single()

    if (!org || org.subscription_tier === 'free') {
      return reply.code(403).send({ error: 'WhatsApp requires a paid subscription' })
    }

    const response = await fetch(`https://graph.facebook.com/v21.0/${WA_PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${WA_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    })

    const data = await response.json() as Record<string, unknown>

    if (!response.ok) {
      return reply.code(400).send({ error: data['error'] })
    }

    await supabase.from('messages').insert({
      organization_id: orgId,
      channel: 'whatsapp',
      direction: 'outbound',
      external_message_id: (data['messages'] as Record<string, unknown>[])?.[0]?.['id'] as string,
      to_address: to,
      body: message,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return data
  })
}
