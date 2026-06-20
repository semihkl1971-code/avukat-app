import { mockUyap } from './mock-server.js'
import type { UyapCase, UyapHearing, UyapSyncResult } from '@avukat/types'

const USE_MOCK = process.env.UYAP_MOCK === 'true' || process.env.NODE_ENV !== 'production'

export class UyapClient {
  private tcNo: string
  private password: string

  constructor(tcNo: string, password: string) {
    this.tcNo = tcNo
    this.password = password
  }

  async getCases(): Promise<UyapCase[]> {
    if (USE_MOCK) return mockUyap.getCasesByLawyer(this.tcNo)

    // Gerçek UYAP SOAP entegrasyonu — Adalet Bakanlığı'ndan erişim gerektirir
    // WSDL: https://uyap.gov.tr/wsdl/... (kapalı, başvuru gerekli)
    throw new Error('UYAP production credentials required. Set UYAP_MOCK=true for development.')
  }

  async getHearings(uyapCaseId: string): Promise<UyapHearing[]> {
    if (USE_MOCK) return mockUyap.getHearingsByCaseId(uyapCaseId)
    throw new Error('UYAP production not configured')
  }

  async searchByEsasNo(esasNo: string): Promise<UyapCase | null> {
    if (USE_MOCK) return mockUyap.searchCase(esasNo)
    throw new Error('UYAP production not configured')
  }
}

export async function syncOrganizationCases(
  orgId: string,
  tcNo: string,
  password: string,
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>
): Promise<UyapSyncResult[]> {
  const client = new UyapClient(tcNo, password)
  const results: UyapSyncResult[] = []

  const { data: cases } = await supabase
    .from('cases')
    .select('id, uyap_case_id')
    .eq('organization_id', orgId)
    .not('uyap_case_id', 'is', null)

  for (const c of cases ?? []) {
    try {
      const hearings = await client.getHearings(c.uyap_case_id!)

      for (const h of hearings) {
        const scheduledAt = `${h.durusmaTarihi}T${h.saat}:00`

        await supabase.from('hearings').upsert({
          case_id: c.id,
          organization_id: orgId,
          scheduled_at: scheduledAt,
          court_name: h.mahkemeSalonu,
          uyap_synced: true,
        }, { onConflict: 'case_id,scheduled_at' })
      }

      await supabase.from('cases').update({
        next_hearing_at: hearings[0] ? `${hearings[0].durusmaTarihi}T${hearings[0].saat}:00` : null,
        updated_at: new Date().toISOString(),
      }).eq('id', c.id)

      await supabase.from('uyap_sync_log').insert({
        organization_id: orgId,
        case_id: c.id,
        sync_type: 'hearings',
        status: 'success',
        response: { hearingsFound: hearings.length },
      })

      results.push({ success: true, caseId: c.id, hearingsFound: hearings.length, documentsFound: 0 })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'

      await supabase.from('uyap_sync_log').insert({
        organization_id: orgId,
        case_id: c.id,
        sync_type: 'hearings',
        status: 'error',
        error_message: message,
      })

      results.push({ success: false, caseId: c.id, hearingsFound: 0, documentsFound: 0, error: message })
    }
  }

  return results
}
