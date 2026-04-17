import type { Metadata } from "next"

interface Props {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://planetmotors.ca"
    const res = await fetch(`${baseUrl}/api/v1/vehicles/${encodeURIComponent(id)}`, {
      next: { revalidate: 300 },
    })

    if (!res.ok) throw new Error("not found")

    const json = await res.json()
    const v = json?.data?.vehicle

    if (!v) throw new Error("empty")

    const title = `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""} for Sale | Planet Motors`
    const descParts = [
      `$${(v.price ?? 0).toLocaleString()}`,
      v.mileage ? `${(v.mileage as number).toLocaleString()} km` : null,
      v.fuel_type,
      v.transmission,
      v.exterior_color,
    ]
      .filter(Boolean)
      .join(" · ")
    const certifiedSuffix = v.is_certified
      ? " PM Certified with 210-point inspection, free Carfax, and nationwide delivery."
      : " Free Carfax and nationwide delivery."
    const description = `${v.year} ${v.make} ${v.model} — ${descParts}.${certifiedSuffix}`

    const imageUrl = v.primary_image_url ?? `${baseUrl}/og-default.jpg`
    const encodedId = encodeURIComponent(id)

    return {
      title,
      description,
      keywords: [
        `${v.year} ${v.make} ${v.model} for sale`,
        `used ${v.make} ${v.model} Ontario`,
        `${v.make} ${v.model} price`,
        `certified pre-owned ${v.make}`,
        v.is_ev ? `used electric ${v.make}` : null,
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
        ...(v.stock_number ? { "stock-number": v.stock_number } : {}),
      },
    }
  } catch {
    return {
      title: "Vehicle Details — Planet Motors",
      description: "Browse our certified pre-owned inventory at Planet Motors.",
    }
  }
}

export default function VehicleLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Drivee / Pirelly 360° viewer — only loaded on VDP pages where it's needed */}
      <script
        src="https://us-central1-pirelly360.cloudfunctions.net/iframe-script-server"
        async
        defer
      />
      {children}
    </>
  )
}
