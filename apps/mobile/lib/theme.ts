// Avukatım mobil — web ile uyumlu koyu/premium tema
export const C = {
  bg: '#07090f',
  bg2: '#0a0913',
  card: 'rgba(255,255,255,0.04)',
  cardSolid: '#12101f',
  border: 'rgba(255,255,255,0.08)',
  borderPurple: 'rgba(108,99,255,0.3)',
  text: '#e8eaf0',
  textDim: '#8892a4',
  textMute: '#6b7280',
  primary: '#6c63ff',
  primary2: '#a855f7',
  cyan: '#22d3ee',
  green: '#34d399',
  amber: '#fbbf24',
  red: '#f87171',
  white: '#ffffff',
}

export const GRADIENT = ['#6c63ff', '#a855f7'] as const
export const GRADIENT3 = ['#6c63ff', '#a855f7', '#06b6d4'] as const

export const STATUS = {
  active: { label: 'Aktif', bg: 'rgba(108,99,255,0.16)', fg: '#a5b4fc' },
  pending: { label: 'Beklemede', bg: 'rgba(245,158,11,0.15)', fg: '#fbbf24' },
  closed: { label: 'Kapandı', bg: 'rgba(16,185,129,0.15)', fg: '#34d399' },
  archived: { label: 'Arşiv', bg: 'rgba(255,255,255,0.07)', fg: '#9ca3af' },
} as const
