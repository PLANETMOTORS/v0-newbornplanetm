"use client"

import Script from "next/script"

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[]
  }
}

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID
const SGTM_URL = process.env.NEXT_PUBLIC_SGTM_URL

/**
 * When NEXT_PUBLIC_SGTM_URL is set (e.g. https://capig.planetmotors.ca),
 * GTM loads from the server-side container via Stape. This avoids ad blockers
 * and improves match rates for server-side events (Meta CAPI, TikTok Events API).
 */
function getGtmScriptUrl(): string {
  if (SGTM_URL) {
    const base = SGTM_URL.replace(/\/$/, '')
    return `${base}/gtm.js?id=${GTM_ID}`
  }
  return `https://www.googletagmanager.com/gtm.js?id=${GTM_ID}`
}

export function GoogleTagManager() {
  if (!GTM_ID) return null

  const scriptUrl = getGtmScriptUrl()

  return (
    <Script id="gtm" strategy="afterInteractive">
      {`
        globalThis.dataLayer = globalThis.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}

        gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          wait_for_update: 500,
        });

        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s);j.async=true;j.src='${scriptUrl}';f.parentNode.insertBefore(j,f);
        })(globalThis,document,'script','dataLayer','${GTM_ID}');
      `}
    </Script>
  )
}

export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null

  const noscriptBase = SGTM_URL
    ? `${SGTM_URL.replace(/\/$/, '')}/ns.html`
    : 'https://www.googletagmanager.com/ns.html'

  return (
    <noscript>
      <iframe
        title="Google Tag Manager"
        src={`${noscriptBase}?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
      />
    </noscript>
  )
}

// DataLayer push helper
export function pushToDataLayer(data: Record<string, unknown>) {
  if (globalThis.window === undefined) return
  const w = globalThis.window as typeof globalThis.window & {
    dataLayer?: Array<Record<string, unknown>>
  }
  w.dataLayer = w.dataLayer ?? []
  w.dataLayer.push(data)
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
