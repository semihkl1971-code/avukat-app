import crypto from 'crypto'

// Gmail entegrasyonu — googleapis paketi yerine doğrudan REST (hafif).
// Env (Vercel): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ENCRYPTION_KEY (32 bayt hex).

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
]

export function gmailConfigured(): boolean {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.ENCRYPTION_KEY)
}

function key(): Buffer {
  return Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
}

// AES-256-GCM şifreleme (refresh token için)
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('hex'), tag.toString('hex'), enc.toString('hex')].join(':')
}

export function decrypt(data: string): string {
  const [iv, tag, enc] = data.split(':')
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'hex'))
  decipher.setAuthTag(Buffer.from(tag, 'hex'))
  return Buffer.concat([decipher.update(Buffer.from(enc, 'hex')), decipher.final()]).toString('utf8')
}

export function redirectUri(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://avukat-web-avukat1.vercel.app'
  return `${base.replace(/\/$/, '')}/api/gmail/callback`
}

export function authUrl(state: string): string {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri(),
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${p.toString()}`
}

export async function exchangeCode(code: string): Promise<{ refresh_token?: string; access_token?: string; error?: string }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri(),
      grant_type: 'authorization_code',
    }),
  })
  return res.json()
}

// Refresh token'dan taze access token
export async function accessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const d = (await res.json()) as { access_token?: string }
  return d.access_token ?? null
}

// E-posta gönder (RFC 2822 + base64url)
export async function sendGmail(accessTok: string, to: string, subject: string, body: string): Promise<{ id?: string; error?: string }> {
  const mime = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    body,
  ].join('\r\n')
  const raw = Buffer.from(mime).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessTok}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw }),
  })
  const d = (await res.json()) as { id?: string; error?: { message?: string } }
  return res.ok ? { id: d.id } : { error: d.error?.message ?? 'Gmail gönderilemedi' }
}

type GmailHeader = { name: string; value: string }
type GmailMsg = { id: string; snippet?: string; payload?: { headers?: GmailHeader[] } }

// Okunmamış gelen e-postaları getir (metadata)
export async function fetchUnread(accessTok: string, max = 15): Promise<{ id: string; from: string; subject: string; snippet: string }[]> {
  const list = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages?q=is:unread+in:inbox&maxResults=${max}`, {
    headers: { Authorization: `Bearer ${accessTok}` },
  })
  if (!list.ok) return []
  const lj = (await list.json()) as { messages?: { id: string }[] }
  const out: { id: string; from: string; subject: string; snippet: string }[] = []
  for (const m of lj.messages ?? []) {
    const r = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`, {
      headers: { Authorization: `Bearer ${accessTok}` },
    })
    if (!r.ok) continue
    const msg = (await r.json()) as GmailMsg
    const h = (n: string) => msg.payload?.headers?.find(x => x.name.toLowerCase() === n.toLowerCase())?.value ?? ''
    out.push({ id: msg.id, from: h('From'), subject: h('Subject'), snippet: msg.snippet ?? '' })
  }
  return out
}

// "Ad Soyad <mail@x.com>" → mail@x.com
export function parseEmail(from: string): string {
  const m = from.match(/<([^>]+)>/)
  return (m ? m[1] : from).trim().toLowerCase()
}
