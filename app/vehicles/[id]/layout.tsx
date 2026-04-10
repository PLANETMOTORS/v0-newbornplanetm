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

    const title = `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""} — Planet Motors`
    const description = [
      `$${(v.price ?? 0).toLocaleString()}`,
      v.mileage ? `${(v.mileage as number).toLocaleString()} km` : null,
      v.fuel_type,
      v.transmission,
      v.exterior_color,
    ]
      .filter(Boolean)
      .join(" · ")

    const imageUrl = v.primary_image_url ?? `${baseUrl}/og-default.jpg`

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `${baseUrl}/vehicles/${id}`,
        siteName: "Planet Motors",
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
        canonical: `${baseUrl}/vehicles/${id}`,
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
  return <>{children}</>
}
