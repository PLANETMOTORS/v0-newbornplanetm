"use client"

import Script from "next/script"
import { useCookieConsent } from "@/lib/hooks/use-cookie-consent"

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export function GoogleTagManager() {
  const { hasAnalyticsConsent } = useCookieConsent()

  if (!GTM_ID || !hasAnalyticsConsent) return null

  return (
    <Script id="gtm" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}
    </Script>
  )
}

export function GoogleTagManagerNoScript() {
  const { hasAnalyticsConsent } = useCookieConsent()

  if (!GTM_ID || !hasAnalyticsConsent) return null

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  )
}

// DataLayer push helper
export function pushToDataLayer(data: Record<string, unknown>) {
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push(data)
  }
}

// Enhanced e-commerce events
export function trackProductView(vehicle: {
  id: string
  name: string
  price: number
  make: string
  model: string
  year: number
  fuelType: string
}) {
  pushToDataLayer({
    event: "view_item",
    ecommerce: {
      items: [
        {
          item_id: vehicle.id,
          item_name: vehicle.name,
          item_brand: vehicle.make,
          item_category: vehicle.fuelType,
          item_category2: vehicle.model,
          item_variant: String(vehicle.year),
          price: vehicle.price,
          currency: "CAD",
        },
      ],
    },
  })
}

export function trackProductClick(vehicle: {
  id: string
  name: string
  price: number
  position: number
}) {
  pushToDataLayer({
    event: "select_item",
    ecommerce: {
      items: [
        {
          item_id: vehicle.id,
          item_name: vehicle.name,
          price: vehicle.price,
          index: vehicle.position,
          currency: "CAD",
        },
      ],
    },
  })
}

export function trackFormSubmission(formName: string, formData?: Record<string, unknown>) {
  pushToDataLayer({
    event: "form_submission",
    form_name: formName,
    form_data: formData,
  })
}

export function trackPhoneClick(phoneNumber: string) {
  pushToDataLayer({
    event: "phone_click",
    phone_number: phoneNumber,
  })
}

export function trackChatOpen() {
  pushToDataLayer({
    event: "chat_open",
  })
}
