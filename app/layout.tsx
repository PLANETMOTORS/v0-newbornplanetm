import type { Metadata, Viewport } from 'next'
import { partytownSnippet } from '@builder.io/partytown/integration'
import { Inter } from 'next/font/google'
import { CompareProvider } from '@/contexts/compare-context'
import { FavoritesProvider } from '@/contexts/favorites-context'
import { AuthProvider } from '@/contexts/auth-context'
import { OrganizationJsonLd, WebsiteSearchJsonLd } from '@/components/seo/json-ld'
import { DynamicLocalBusinessJsonLd } from '@/components/seo/dynamic-local-business-jsonld'
import { ClientLayoutWidgets } from '@/components/client-layout-widgets'
import { SerwistProvider } from './serwist'
import { getPublicSiteUrl } from '@/lib/site-url'
import './globals.css'
import './stability-fixes.css'

// Planet Motors - OMVIC Licensed Dealer - Production Ready

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});


const SITE_URL = getPublicSiteUrl()

export const metadata: Metadata = {
  // Title kept under 60 chars so Google does not truncate it in SERPs.
  // Description carries the longer Hybrid/PHEV breadth claim.
  title: 'Used EVs Canada — Aviloo Battery-Certified | Planet Motors',
  description: "Canada's battery-health certified used EVs. Aviloo battery health reports, 210-point inspection, Canada-wide delivery. Plus inspected used hybrids and PHEVs. OMVIC licensed.",
  keywords: 'used EVs Canada, used hybrids Canada, used PHEVs Canada, Aviloo certified, battery-health certified, pre-owned electric vehicles, used car dealership Richmond Hill, EV battery health, Canada-wide delivery, OMVIC licensed, financing, trade-in',
  authors: [{ name: 'Planet Motors' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Planet Motors',
  },
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  openGraph: {
    title: 'Used EVs Canada — Aviloo Battery-Certified | Planet Motors',
    description: "Canada's battery-health certified used EVs. Aviloo battery health reports, 210-point inspection, Canada-wide delivery. Plus inspected used hybrids and PHEVs. OMVIC licensed.",
    url: SITE_URL,
    siteName: 'Planet Motors',
    locale: 'en_CA',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/planet-motors-logo.png`,
        width: 1200,
        height: 630,
        alt: 'Planet Motors — OMVIC Licensed Used Car Dealership, Richmond Hill Ontario',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Used EVs Canada — Aviloo Battery-Certified',
    description: "Canada's battery-health certified used EVs. Aviloo battery health reports. 210-point inspected. Canada-wide delivery.",
    images: [`${SITE_URL}/images/planet-motors-logo.png`],
  },
  metadataBase: new URL(SITE_URL),
  // Canonical is set per-page to avoid all sub-pages inheriting '/'
  // Each page must define its own alternates.canonical
  alternates: {
    languages: {
      'en-CA': SITE_URL,
      'x-default': SITE_URL,
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e3a5f' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-CA" className="bg-background" data-scroll-behavior="smooth">
      <head>
        {/* Preconnect to Supabase for faster API/auth calls */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
        {/* Preconnect to GTM/GA4 — reduces TTI by ~200ms (Lighthouse recommendation) */}
        <link rel="preconnect" href="https://www.googletagmanager.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Preconnect to Meta Pixel CDN — reduces LCP impact */}
        <link rel="preconnect" href="https://connect.facebook.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://connect.facebook.net" />
        {/* Preconnect to vehicle image CDN for faster LCP */}
        <link rel="preconnect" href="https://content.homenetiol.com" />
        <link rel="preconnect" href="https://photos.homenetiol.com" />


        {/* Partytown — offloads GTM/analytics to Web Worker, improves TTI */}
        <script
          dangerouslySetInnerHTML={{
            __html: partytownSnippet({
              forward: ["dataLayer.push", "fbq"],
              lib: "/_next/static/~partytown/",
            }),
          }}
        />
        {/* JSON-LD structured data — server-rendered, lightweight */}
        <OrganizationJsonLd />
        <DynamicLocalBusinessJsonLd />
        <WebsiteSearchJsonLd />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <SerwistProvider swUrl="/sw.js" disable={process.env.NODE_ENV === 'development'}>
          <AuthProvider>
            <FavoritesProvider>
              <CompareProvider>
                {children}
                {/* Client-only widgets: analytics, chat, toaster, compare bar, etc. */}
                <ClientLayoutWidgets />
              </CompareProvider>
            </FavoritesProvider>
          </AuthProvider>
        </SerwistProvider>
      </body>
    </html>
  )
}
