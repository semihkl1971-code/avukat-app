import type { UyapCase, UyapHearing } from '@avukat/types'

const MOCK_CASES: UyapCase[] = [
  {
    uyapCaseId: 'UYAP-2024-001',
    esasNo: '2024/1234',
    mahkeme: 'İstanbul 1. Asliye Hukuk Mahkemesi',
    davaYonu: 'Davacı',
    davaKonusu: 'Alacak Davası',
    durum: 'Devam Ediyor',
    acilisTarihi: '2024-01-15',
    sonIslemTarihi: '2024-11-20',
  },
  {
    uyapCaseId: 'UYAP-2024-002',
    esasNo: '2024/5678',
    mahkeme: 'İstanbul 3. İş Mahkemesi',
    davaYonu: 'Davalı',
    davaKonusu: 'İşçi Alacakları',
    durum: 'Devam Ediyor',
    acilisTarihi: '2024-03-01',
    sonIslemTarihi: '2024-11-15',
  },
]

const MOCK_HEARINGS: UyapHearing[] = [
  {
    uyapCaseId: 'UYAP-2024-001',
    durusmaTarihi: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]!,
    saat: '09:30',
    mahkemeSalonu: 'Salon 5',
    durusmaNo: 3,
  },
  {
    uyapCaseId: 'UYAP-2024-002',
    durusmaTarihi: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]!,
    saat: '14:00',
    mahkemeSalonu: 'Salon 12',
    durusmaNo: 1,
  },
]

export const mockUyap = {
  getCasesByLawyer: (_tcNo: string): UyapCase[] => MOCK_CASES,

  getHearingsByCaseId: (uyapCaseId: string): UyapHearing[] =>
    MOCK_HEARINGS.filter(h => h.uyapCaseId === uyapCaseId),

  searchCase: (esasNo: string): UyapCase | null =>
    MOCK_CASES.find(c => c.esasNo === esasNo) ?? null,
}
