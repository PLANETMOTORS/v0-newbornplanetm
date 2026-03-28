"use client"

import Script from "next/script"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', {
            page_title: document.title,
            page_location: window.location.href,
          });
        `}
      </Script>
    </>
  )
}

// Event tracking helpers
export function trackEvent(action: string, category: string, label?: string, value?: number) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// E-commerce tracking
export function trackViewItem(vehicle: {
  id: string
  name: string
  price: number
  make: string
  model: string
}) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "view_item", {
      currency: "CAD",
      value: vehicle.price,
      items: [
        {
          item_id: vehicle.id,
          item_name: vehicle.name,
          item_brand: vehicle.make,
          item_category: vehicle.model,
          price: vehicle.price,
        },
      ],
    })
  }
}

export function trackAddToWishlist(vehicle: {
  id: string
  name: string
  price: number
}) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "add_to_wishlist", {
      currency: "CAD",
      value: vehicle.price,
      items: [{ item_id: vehicle.id, item_name: vehicle.name, price: vehicle.price }],
    })
  }
}

export function trackBeginCheckout(vehicle: {
  id: string
  name: string
  price: number
}) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "begin_checkout", {
      currency: "CAD",
      value: vehicle.price,
      items: [{ item_id: vehicle.id, item_name: vehicle.name, price: vehicle.price }],
    })
  }
}

export function trackPurchase(order: {
  transaction_id: string
  value: number
  vehicle: { id: string; name: string; price: number }
}) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "purchase", {
      transaction_id: order.transaction_id,
      currency: "CAD",
      value: order.value,
      items: [
        {
          item_id: order.vehicle.id,
          item_name: order.vehicle.name,
          price: order.vehicle.price,
        },
      ],
    })
  }
}

export function trackLead(form_type: string, vehicle_id?: string) {
  if (typeof window !== "undefined" && (window as any).gtag) {
    (window as any).gtag("event", "generate_lead", {
      currency: "CAD",
      value: 100, // Estimated lead value
      form_type: form_type,
      vehicle_id: vehicle_id,
    })
  }
}
