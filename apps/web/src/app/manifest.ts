import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Avukatım — Hukuk Bürosu Yönetim Platformu',
    short_name: 'Avukatım',
    description: 'UYAP entegrasyonlu, yapay zeka destekli hukuk bürosu yönetim platformu.',
    start_url: '/dashboard',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#07090f',
    theme_color: '#6c63ff',
    lang: 'tr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
