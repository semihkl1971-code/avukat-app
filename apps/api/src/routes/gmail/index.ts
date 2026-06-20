import type { FastifyPluginAsync } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { google } from 'googleapis'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  return iv.toString('hex') + ':' + cipher.update(text, 'utf8', 'hex') + cipher.final('hex')
}

function decrypt(encrypted: string): string {
  const [iv, content] = encrypted.split(':')
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, Buffer.from(iv!, 'hex'))
  return decipher.update(content!, 'hex', 'utf8') + decipher.final('utf8')
}

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.API_URL}/gmail/callback`
  )
}

export const gmailRoutes: FastifyPluginAsync = async (app) => {
  // OAuth initiation
  app.get('/auth/:userId', async (req) => {
    const auth = getOAuth2Client()
    const url = auth.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/gmail.readonly', 'https://www.googleapis.com/auth/gmail.send'],
      state: (req.params as Record<string, string>)['userId'],
    })
    return { url }
  })

  // OAuth callback
  app.get('/callback', async (req, reply) => {
    const { code, state: userId } = req.query as { code: string; state: string }
    const auth = getOAuth2Client()
    const { tokens } = await auth.getToken(code)

    if (tokens.refresh_token) {
      await supabase
        .from('profiles')
        .update({ gmail_refresh_token_encrypted: encrypt(tokens.refresh_token) })
        .eq('id', userId)
    }

    return reply.redirect(`${process.env.WEB_URL}/dashboard/settings?gmail=connected`)
  })

  // Sync emails
  app.post('/sync/:userId', async (req) => {
    const { userId } = req.params as { userId: string }

    const { data: profile } = await supabase
      .from('profiles')
      .select('gmail_refresh_token_encrypted, organization_id')
      .eq('id', userId)
      .single()

    if (!profile?.gmail_refresh_token_encrypted) {
      return { synced: 0, error: 'Gmail not connected' }
    }

    const auth = getOAuth2Client()
    auth.setCredentials({ refresh_token: decrypt(profile.gmail_refresh_token_encrypted) })
    const gmail = google.gmail({ version: 'v1', auth })

    const { data: list } = await gmail.users.messages.list({
      userId: 'me',
      maxResults: 20,
      q: 'is:unread',
    })

    let synced = 0

    for (const item of list.messages ?? []) {
      const { data: msg } = await gmail.users.messages.get({ userId: 'me', id: item.id!, format: 'metadata', metadataHeaders: ['From', 'To', 'Subject'] })

      const headers = msg.payload?.headers ?? []
      const from = headers.find(h => h.name === 'From')?.value ?? ''
      const subject = headers.find(h => h.name === 'Subject')?.value ?? ''
      const snippet = msg.snippet ?? ''

      const emailMatch = from.match(/<(.+?)>/) ?? [null, from]
      const fromEmail = emailMatch[1] ?? from

      const { data: client } = await supabase.from('clients').select('id').eq('email', fromEmail).eq('organization_id', profile.organization_id).single()

      await supabase.from('messages').upsert({
        organization_id: profile.organization_id,
        client_id: client?.id,
        channel: 'gmail',
        direction: 'inbound',
        external_message_id: item.id,
        from_address: fromEmail,
        subject,
        body: snippet,
        status: 'delivered',
        received_at: new Date(Number(msg.internalDate)).toISOString(),
      }, { onConflict: 'external_message_id' })

      synced++
    }

    return { synced }
  })

  // Send email
  app.post('/send', async (req, reply) => {
    const { userId, to, subject, body } = req.body as { userId: string; to: string; subject: string; body: string }

    const { data: profile } = await supabase
      .from('profiles')
      .select('gmail_refresh_token_encrypted, organization_id')
      .eq('id', userId)
      .single()

    if (!profile?.gmail_refresh_token_encrypted) {
      return reply.code(400).send({ error: 'Gmail not connected' })
    }

    const auth = getOAuth2Client()
    auth.setCredentials({ refresh_token: decrypt(profile.gmail_refresh_token_encrypted) })
    const gmail = google.gmail({ version: 'v1', auth })

    const message = [`To: ${to}`, `Subject: ${subject}`, '', body].join('\n')
    const encoded = Buffer.from(message).toString('base64url')

    await gmail.users.messages.send({ userId: 'me', requestBody: { raw: encoded } })

    await supabase.from('messages').insert({
      organization_id: profile.organization_id,
      channel: 'gmail',
      direction: 'outbound',
      to_address: to,
      subject,
      body,
      status: 'sent',
      sent_at: new Date().toISOString(),
    })

    return { success: true }
  })
}
