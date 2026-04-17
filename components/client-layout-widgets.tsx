"use client"

import dynamic from 'next/dynamic'

// Analytics — only render after hydration; gated by cookie consent internally
const GoogleAnalytics = dynamic(
  () => import('@/components/analytics/google-analytics').then(m => ({ default: m.GoogleAnalytics })),
  { ssr: false }
)
const GoogleTagManager = dynamic(
  () => import('@/components/analytics/google-tag-manager').then(m => ({ default: m.GoogleTagManager })),
  { ssr: false }
)
const GoogleTagManagerNoScript = dynamic(
  () => import('@/components/analytics/google-tag-manager').then(m => ({ default: m.GoogleTagManagerNoScript })),
  { ssr: false }
)
const MetaPixel = dynamic(
  () => import('@/components/analytics/meta-pixel').then(m => ({ default: m.MetaPixel })),
  { ssr: false }
)

// Cookie consent & UTM — client-only, lazy-loaded
const CookieConsentBanner = dynamic(
  () => import('@/components/cookie-consent-banner').then(m => ({ default: m.CookieConsentBanner })),
  { ssr: false }
)
const UTMTracker = dynamic(
  () => import('@/components/utm-tracker').then(m => ({ default: m.UTMTracker })),
  { ssr: false }
)

// UI widgets — not needed for first paint
const Toaster = dynamic(
  () => import('@/components/ui/sonner').then(m => ({ default: m.Toaster })),
  { ssr: false }
)
const LiveChatWidget = dynamic(
  () => import('@/components/live-chat-widget').then(m => ({ default: m.LiveChatWidget })),
  { ssr: false }
)
const CompareBar = dynamic(
  () => import('@/components/compare-bar').then(m => ({ default: m.CompareBar })),
  { ssr: false }
)

// Vercel Analytics & SpeedInsights — only load when deployed on Vercel.
// On Netlify these try to fetch /_vercel/insights/script.js which 404s,
// wasting network requests and producing console errors.
const VercelAnalytics = dynamic(
  () => import('@vercel/analytics/next').then(m => ({ default: m.Analytics })),
  { ssr: false }
)
const VercelSpeedInsights = dynamic(
  () => import('@vercel/speed-insights/next').then(m => ({ default: m.SpeedInsights })),
  { ssr: false }
)

/**
 * Client-only layout widgets.
 * Extracted from layout.tsx because `dynamic(..., { ssr: false })` is not
 * allowed in Server Components (Next.js 16+).
 */
// Only render Vercel telemetry when deployed on Vercel (NEXT_PUBLIC_VERCEL_URL is auto-set).
// On Netlify, /_vercel/insights/script.js returns 404 causing wasted requests + console errors.
const isVercelDeploy = !!process.env.NEXT_PUBLIC_VERCEL_URL

export function ClientLayoutWidgets() {
  return (
    <>
      <CompareBar />
      <LiveChatWidget />
      <Toaster richColors position="top-right" />
      <CookieConsentBanner />
      <UTMTracker />
      <GoogleAnalytics />
      <GoogleTagManager />
      <GoogleTagManagerNoScript />
      <MetaPixel />
      {isVercelDeploy && <VercelAnalytics />}
      {isVercelDeploy && <VercelSpeedInsights />}
    </>
  )
}
