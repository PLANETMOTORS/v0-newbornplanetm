import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { CompareProvider } from '@/contexts/compare-context'
import { FavoritesProvider } from '@/contexts/favorites-context'
import { AuthProvider } from '@/contexts/auth-context'
import { OrganizationJsonLd, LocalBusinessJsonLd, WebsiteSearchJsonLd } from '@/components/seo/json-ld'
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

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: '--font-playfair',
  display: 'swap',
  preload: false,  // Decorative font — don't block first paint
});

const SITE_URL = getPublicSiteUrl()

export const metadata: Metadata = {
  title: 'Planet Motors | Premium Used Car Dealership - Nationwide Delivery',
  description: 'Shop certified pre-owned vehicles with free Carfax reports, 210-point inspections, and nationwide delivery across Canada. Get pre-approved in minutes.',
  keywords: 'used cars, pre-owned vehicles, car dealership, Canada, Ontario, Toronto, Richmond Hill, financing, trade-in, nationwide delivery',
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
    title: 'Planet Motors | Premium Used Car Dealership',
    description: 'Shop certified pre-owned vehicles with free Carfax reports and nationwide delivery across Canada.',
    url: SITE_URL,
    siteName: 'Planet Motors',
    locale: 'en_CA',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/images/planet-motors-logo.png`,
        width: 800,
        height: 320,
        alt: 'Planet Motors - Fairness & Integrity',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planet Motors | Premium Used Car Dealership',
    description: 'Shop certified pre-owned vehicles with free Carfax reports and nationwide delivery.',
    images: [`${SITE_URL}/images/planet-motors-logo.png`],
  },
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
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
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en-CA" className="bg-background" data-scroll-behavior="smooth">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* Preconnect to Supabase for faster API/auth calls */}
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="preconnect" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        {/* Preconnect to vehicle image CDN for faster LCP */}
        <link rel="preconnect" href="https://content.homenetiol.com" />
        <link rel="preconnect" href="https://photos.homenetiol.com" />

        {/* JSON-LD structured data — server-rendered, lightweight */}
        <OrganizationJsonLd />
        <LocalBusinessJsonLd />
        <WebsiteSearchJsonLd />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
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
