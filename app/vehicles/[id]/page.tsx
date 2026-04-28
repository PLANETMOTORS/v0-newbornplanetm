/**
 * VDP — Server Component (SSR)
 *
 * Fetches vehicle data directly from Supabase at request time.
 * Renders JSON-LD structured data inline (no client-side Script tag).
 * Passes pre-fetched data to VDPClient for interactive UI.
 *
 * Benefits:
 *  - No "Loading..." spinner — vehicle data is in the initial HTML
 *  - Googlebot sees full vehicle details, trust signals, pricing
 *  - JSON-LD is in the static HTML (not injected by JS)
 *  - Faster FCP / LCP — no client-side fetch waterfall
 */

import { notFound } from "next/navigation"

import { fetchVehicleForSSR } from "@/lib/vehicles/fetch-vehicle"
import { calculateAllInPrice } from "@/lib/pricing/format"
import { getPublicSiteUrl } from "@/lib/site-url"
import { DEALERSHIP_LOCATION } from "@/lib/constants/dealership"
import { getVehicleStatusDisplay } from "@/lib/vehicles/status-display"
import VDPClient from "./vdp-client"

const SITE_URL = getPublicSiteUrl()

// ── Helper: infer schema.org DriveWheelConfiguration ──
function mapDriveWheelConfiguration(drivetrain?: string | null): string | undefined {
  if (!drivetrain) return undefined
  const dt = drivetrain.toUpperCase()
  if (dt === "FWD" || dt.includes("FRONT")) return "https://schema.org/FrontWheelDriveConfiguration"
  if (dt === "RWD" || dt.includes("REAR")) return "https://schema.org/RearWheelDriveConfiguration"
  if (dt === "AWD" || dt === "4WD" || dt.includes("ALL")) return "https://schema.org/AllWheelDriveConfiguration"
  if (dt.includes("FOUR") || dt.includes("4X4")) return "https://schema.org/FourWheelDriveConfiguration"
  return drivetrain
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function VehicleDetailPage({ params }: Props) {
  const { id } = await params
  const vehicle = await fetchVehicleForSSR(id)

  if (!vehicle) {
    notFound()
  }

  // ── Build JSON-LD structured data (server-rendered in static HTML) ──
  const allInPrice = calculateAllInPrice(vehicle.price)
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""}`.trim()
  const vehicleDescription = `${vehicleName} for sale at Planet Motors. Clean Carfax, one owner, no accidents. 210-point inspected. Canada-wide delivery.`

  const vehicleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: vehicleName,
    description: vehicleDescription,
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: vehicle.year.toString(),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileage,
      unitCode: "KMT",
    },
    vehicleIdentificationNumber: vehicle.vin,
    color: vehicle.exteriorColor,
    fuelType: vehicle.fuelType,
    vehicleTransmission: vehicle.transmission,
    itemCondition: "https://schema.org/UsedCondition",
    image: vehicle.imageUrls?.[0] || vehicle.primaryImageUrl || `${SITE_URL}/og-default.jpg`,
    url: `${SITE_URL}/vehicles/${vehicle.id}`,
    ...(vehicle.engine ? { vehicleEngine: { "@type": "EngineSpecification", name: vehicle.engine } } : {}),
    ...(mapDriveWheelConfiguration(vehicle.drivetrain) ? { driveWheelConfiguration: mapDriveWheelConfiguration(vehicle.drivetrain) } : {}),
    offers: {
      "@type": "Offer",
      price: allInPrice.subtotal,
      priceCurrency: "CAD",
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: allInPrice.subtotal,
        priceCurrency: "CAD",
        valueAddedTaxIncluded: false,
      },
      // Map vehicle status → schema.org/ItemAvailability via the shared
      // status-display helper so JSON-LD, the VDP banner, and the disabled
      // CTA all stay in lockstep (single source of truth, no nested
      // ternary — Sonar S3358).
      availability: getVehicleStatusDisplay(vehicle.status).schemaAvailability,
      seller: {
        "@type": "AutoDealer",
        name: "Planet Motors",
        url: SITE_URL,
        address: {
          "@type": "PostalAddress",
          streetAddress: DEALERSHIP_LOCATION.streetAddress,
          addressLocality: DEALERSHIP_LOCATION.city,
          addressRegion: DEALERSHIP_LOCATION.province,
          postalCode: DEALERSHIP_LOCATION.postalCode,
          addressCountry: DEALERSHIP_LOCATION.country,
        },
      },
      warranty: {
        "@type": "WarrantyPromise",
        warrantyScope: "10-Day Money Back Guarantee",
      },
    },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Inventory", item: `${SITE_URL}/inventory` },
      { "@type": "ListItem", position: 3, name: vehicle.make, item: `${SITE_URL}/inventory?make=${encodeURIComponent(vehicle.make)}` },
      { "@type": "ListItem", position: 4, name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, item: `${SITE_URL}/vehicles/${vehicle.id}` },
    ],
  }

  return (
    <>
      {/* Server-rendered JSON-LD — in static HTML, no client JS needed */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(vehicleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Interactive VDP — client component with pre-fetched data */}
      <VDPClient serverVehicle={vehicle} />
    </>
  )
}

