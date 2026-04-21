import type { Metadata } from "next"
import { CheckoutFlow } from "@/components/checkout/checkout-flow"

interface CheckoutPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: CheckoutPageProps): Promise<Metadata> {
  const { id } = await params

  let title = "Checkout | Planet Motors"
  let description =
    "Complete your vehicle purchase with Planet Motors. Secure checkout with financing options, protection plans, and free delivery."

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/v1/vehicles/${id}`, { next: { revalidate: 300 } })
    if (res.ok) {
      const json = await res.json()
      const v = json.data?.vehicle ?? json.data
      if (v) {
        const name = `${v.year} ${v.make} ${v.model}`.trim()
        title = `Buy ${name} | Planet Motors`
        description = `Purchase your ${name} online. Financing from 6.99% APR, PlanetCare protection plans, and delivery to your door.`
      }
    }
  } catch {
    // Fallback metadata is fine
  }

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: { title, description },
  }
}

export default async function CheckoutPage({ params }: CheckoutPageProps) {
  const { id } = await params
  return <CheckoutFlow vehicleId={id} />
}
