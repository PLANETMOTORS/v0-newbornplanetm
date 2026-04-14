"use client"

import Script from "next/script"

declare global {
  interface Window {
    fbq?: (...args: [string, ...unknown[]]) => void
  }
}

const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID

export function MetaPixel() {
  if (!META_PIXEL_ID) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${META_PIXEL_ID}');
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <iframe
          src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
          height={1}
          width={1}
          style={{ display: "none", visibility: "hidden" }}
          title="Meta Pixel"
          aria-hidden="true"
        />
      </noscript>
    </>
  )
}

// Meta Pixel event helpers
export function trackMetaEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", event, data)
  }
}

export function trackMetaViewContent(vehicle: {
  id: string
  name: string
  price: number
  make: string
}) {
  trackMetaEvent("ViewContent", {
    content_ids: [vehicle.id],
    content_name: vehicle.name,
    content_type: "vehicle",
    content_category: vehicle.make,
    value: vehicle.price,
    currency: "CAD",
  })
}

export function trackMetaAddToWishlist(vehicle: {
  id: string
  name: string
  price: number
}) {
  trackMetaEvent("AddToWishlist", {
    content_ids: [vehicle.id],
    content_name: vehicle.name,
    content_type: "vehicle",
    value: vehicle.price,
    currency: "CAD",
  })
}

export function trackMetaInitiateCheckout(vehicle: {
  id: string
  name: string
  price: number
}) {
  trackMetaEvent("InitiateCheckout", {
    content_ids: [vehicle.id],
    content_name: vehicle.name,
    content_type: "vehicle",
    value: vehicle.price,
    currency: "CAD",
    num_items: 1,
  })
}

export function trackMetaLead(formType: string) {
  trackMetaEvent("Lead", {
    content_name: formType,
    content_category: "form_submission",
  })
}

export function trackMetaPurchase(order: {
  id: string
  value: number
  vehicle: { id: string; name: string }
}) {
  trackMetaEvent("Purchase", {
    content_ids: [order.vehicle.id],
    content_name: order.vehicle.name,
    content_type: "vehicle",
    value: order.value,
    currency: "CAD",
  })
}
