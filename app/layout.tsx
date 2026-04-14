import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { GoogleAnalytics } from '@/components/analytics/google-analytics'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/components/analytics/google-tag-manager'
import { MetaPixel } from '@/components/analytics/meta-pixel'
import { LiveChatWidget } from '@/components/live-chat-widget'
import { CompareProvider } from '@/lib/compare-context'
import { FavoritesProvider } from '@/lib/favorites-context'
import { AuthProvider } from '@/contexts/auth-context'
import { CompareBar } from '@/components/compare-bar'
import { Toaster } from '@/components/ui/sonner'
import { OrganizationJsonLd, LocalBusinessJsonLd, WebsiteSearchJsonLd } from '@/components/seo/json-ld'
import { getPublicSiteUrl } from '@/lib/site-url'
import './globals.css'
import './stability-fixes.css'

// Planet Motors - OMVIC Licensed Dealer - Production Ready

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair'
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
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planet Motors | Premium Used Car Dealership',
    description: 'Shop certified pre-owned vehicles with free Carfax reports and nationwide delivery.',
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
    <html lang="en" className="bg-background" data-scroll-behavior="smooth">
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        
        <GoogleAnalytics />
        <GoogleTagManager />
        <MetaPixel />
        <OrganizationJsonLd />
        <LocalBusinessJsonLd />
        <WebsiteSearchJsonLd />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <GoogleTagManagerNoScript />
        <AuthProvider>
          <FavoritesProvider>
            <CompareProvider>
              {children}
              <CompareBar />
              <LiveChatWidget />
              <Toaster richColors position="top-right" />
            </CompareProvider>
          </FavoritesProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
