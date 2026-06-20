import type { FastifyPluginAsync } from 'fastify'
import { createClient } from '@supabase/supabase-js'
import { UyapClient, syncOrganizationCases } from '../../services/uyap/client.js'
import crypto from 'crypto'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function decrypt(encrypted: string): string {
  const key = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex')
  const [iv, content] = encrypted.split(':')
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv!, 'hex'))
  return decipher.update(content!, 'hex', 'utf8') + decipher.final('utf8')
}

export const uyapRoutes: FastifyPluginAsync = async (app) => {
  app.post('/sync/:orgId', async (req, reply) => {
    const { orgId } = req.params as { orgId: string }

    const { data: profile } = await supabase
      .from('profiles')
      .select('uyap_credentials_encrypted')
      .eq('organization_id', orgId)
      .not('uyap_credentials_encrypted', 'is', null)
      .single()

    if (!profile?.uyap_credentials_encrypted) {
      return reply.code(400).send({ error: 'UYAP credentials not configured' })
    }

    const [tcNo, password] = decrypt(profile.uyap_credentials_encrypted).split(':')
    const results = await syncOrganizationCases(orgId, tcNo!, password!, supabase)

    return { results }
  })

  app.post('/search', async (req, reply) => {
    const { esasNo, orgId } = req.body as { esasNo: string; orgId: string }

    const { data: profile } = await supabase
      .from('profiles')
      .select('uyap_credentials_encrypted')
      .eq('organization_id', orgId)
      .not('uyap_credentials_encrypted', 'is', null)
      .single()

    if (!profile?.uyap_credentials_encrypted) {
      return reply.code(400).send({ error: 'UYAP credentials not configured' })
    }

    const [tcNo, password] = decrypt(profile.uyap_credentials_encrypted).split(':')
    const client = new UyapClient(tcNo!, password!)
    const caseData = await client.searchByEsasNo(esasNo)

    if (!caseData) {
      return reply.code(404).send({ error: 'Case not found in UYAP' })
    }

    return caseData
  })
}
