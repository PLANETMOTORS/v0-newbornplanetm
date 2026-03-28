import type { Metadata, Viewport } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LiveChat } from '@/components/live-chat'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter'
});

const playfair = Playfair_Display({ 
  subsets: ["latin"],
  variable: '--font-playfair'
});

export const metadata: Metadata = {
  title: 'Planet Motors | Premium Used Car Dealership in Ontario',
  description: 'Shop 9,500+ certified pre-owned vehicles with free Carfax reports, 210-point inspections, and nationwide delivery. Get pre-approved in minutes.',
  keywords: 'used cars, pre-owned vehicles, car dealership, Ontario, Toronto, Richmond Hill, financing, trade-in',
  authors: [{ name: 'Planet Motors' }],
  openGraph: {
    title: 'Planet Motors | Premium Used Car Dealership',
    description: 'Shop 9,500+ certified pre-owned vehicles with free Carfax reports and nationwide delivery.',
    url: 'https://planetmotors.ca',
    siteName: 'Planet Motors',
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Planet Motors | Premium Used Car Dealership',
    description: 'Shop 9,500+ certified pre-owned vehicles with free Carfax reports and nationwide delivery.',
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
    <html lang="en">
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        {children}
        <LiveChat />
        <Analytics />
      </body>
    </html>
  )
}
