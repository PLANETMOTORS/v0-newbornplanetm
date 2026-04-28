/**
 * VDP Layout — generateMetadata with trust-forward positioning.
 *
 * Uses the same server-side data fetcher as page.tsx (deduplicated
 * by React `cache()`) so there's zero extra DB cost.
 */

import type { Metadata } from "next"
import { fetchVehicleForSSR } from "@/lib/vehicles/fetch-vehicle"
import { getPublicSiteUrl } from "@/lib/site-url"

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params
    const baseUrl = getPublicSiteUrl()

    // Direct DB query (deduplicated with page.tsx via React cache())
    const v = await fetchVehicleForSSR(id)
    if (!v) throw new Error("not found")

    // ── Trust-forward title ──
    const title = `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""} — Used for Sale | Planet Motors`

    // ── Trust-forward description ──
    // Lead with trust signals: Aviloo battery health (EVs), clean Carfax, one owner
    const trustParts: string[] = []

    // Aviloo battery health prefix for EVs
    if (v.isEv && v.evBatteryHealthPercent) {
      trustParts.push(`Aviloo Certified ${v.evBatteryHealthPercent}% Battery Health`)
    }

    // Core trust signals
    trustParts.push("Clean Carfax")
    trustParts.push("No Accidents")

    const trustPrefix = trustParts.join(". ") + "."

    const specParts = [
      `$${v.price.toLocaleString()}`,
      v.mileage ? `${v.mileage.toLocaleString()} km` : null,
      v.fuelType,
      v.transmission,
      v.exteriorColor,
    ].filter(Boolean).join(" · ")

    const certifiedSuffix = v.isCertified
      ? " PM Certified with 210-point inspection. Canada-wide delivery."
      : " Canada-wide delivery."

    const description = `${trustPrefix} ${v.year} ${v.make} ${v.model} — ${specParts}.${certifiedSuffix}`

    const imageUrl = v.primaryImageUrl ?? `${baseUrl}/og-default.jpg`
    const encodedId = encodeURIComponent(id)

    return {
      title,
      description,
      keywords: [
        `${v.year} ${v.make} ${v.model} for sale`,
        `used ${v.make} ${v.model} Ontario`,
        `${v.make} ${v.model} price Canada`,
        `certified pre-owned ${v.make}`,
        v.isEv ? `used electric ${v.make}` : null,
        v.isEv ? `EV battery health ${v.make}` : null,
        "clean carfax",
        "no accidents",
        "canada-wide delivery",
      ].filter(Boolean).join(", "),
      openGraph: {
        title,
        description,
        url: `${baseUrl}/vehicles/${encodedId}`,
        siteName: "Planet Motors",
        locale: "en_CA",
        images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
      alternates: {
        canonical: `${baseUrl}/vehicles/${encodedId}`,
      },
      other: {
        ...(v.vin ? { vin: v.vin } : {}),
        ...(v.stockNumber ? { "stock-number": v.stockNumber } : {}),
      },
    }
  } catch {
    return {
      title: "Vehicle Details — Planet Motors",
      description: "Browse our certified pre-owned inventory at Planet Motors. Clean Carfax, 210-point inspected, Canada-wide delivery.",
    }
  }
}

export default function VehicleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>
}
