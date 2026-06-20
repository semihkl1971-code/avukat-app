import type { Metadata } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import './globals.css'

// Türkçe alan adı (IDN): görünen hâli avukatım.com, ASCII (punycode) karşılığı xn--avukatm-wfb.com
const SITE_URL = 'https://www.avukatım.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Avukatım — Hukuk Bürosu Yönetim Platformu',
    template: '%s · Avukatım',
  },
  description:
    'Avukatım, Türk avukatlar için UYAP entegrasyonlu, WhatsApp & Gmail birleşik iletişimli, yapay zeka destekli hukuk bürosu yönetim platformu. 14 gün ücretsiz deneyin.',
  applicationName: 'Avukatım',
  keywords: [
    'avukatım', 'avukat yazılımı', 'hukuk bürosu yönetimi', 'UYAP entegrasyonu',
    'dava takip programı', 'avukat uygulaması', 'hukuk otomasyonu', 'müvekkil yönetimi',
  ],
  authors: [{ name: 'Avukatım' }],
  creator: 'Avukatım',
  publisher: 'Avukatım',
  alternates: { canonical: SITE_URL },
  openGraph: {
    type: 'website',
    locale: 'tr_TR',
    url: SITE_URL,
    siteName: 'Avukatım',
    title: 'Avukatım — Hukuk Bürosu Yönetim Platformu',
    description:
      'UYAP entegrasyonu, WhatsApp & Gmail birleşik gelen kutusu ve yapay zeka destekli hukuki araştırma — tek platformda.',
    images: [{ url: '/posters/tanitim.jpg', width: 1280, height: 720, alt: 'Avukatım tanıtım' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Avukatım — Hukuk Bürosu Yönetim Platformu',
    description: 'Türk avukatlar için UYAP entegrasyonlu, yapay zeka destekli hukuk bürosu platformu.',
    images: ['/posters/tanitim.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: { icon: '/favicon.ico' },
}

// Google'ın arama sonucunda site adını "Avukatım" göstermesi için yapısal veri
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Avukatım',
      inLanguage: 'tr-TR',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Avukatım',
      url: SITE_URL,
      logo: `${SITE_URL}/icon.png`,
      description: 'Türk avukatlar için hukuk bürosu yönetim platformu.',
      areaServed: 'TR',
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Avukatım',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      offers: { '@type': 'Offer', price: '799', priceCurrency: 'TRY' },
      aggregateRating: { '@type': 'AggregateRating', ratingValue: '4.9', ratingCount: '2400' },
    },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
