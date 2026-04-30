import Link from "next/link"
import type { Metadata } from "next"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Search, Phone, Car } from "lucide-react"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"

/**
 * VDP `not-found.tsx` — rendered when `fetchVehicleForSSR()` returns null
 * inside `app/vehicles/[id]/page.tsx`. Next.js automatically responds with
 * HTTP 404 in this case.
 *
 * The hard-delete path was retired (see lib/homenet/parser.ts), so in
 * production this surface is mostly hit by:
 *   - typo'd / hand-edited URLs
 *   - bots probing for vulnerabilities
 *   - very old links to vehicles purged before the soft-delete migration
 *
 * For all of those we want a branded "vehicle no longer available" page
 * instead of the generic site-wide 404, with clear paths back into
 * inventory and a phone CTA. We also send `noindex, follow` so search
 * engines drop the URL but still discover the new inventory links.
 */
export const metadata: Metadata = {
  title: "Vehicle No Longer Available | Planet Motors",
  description:
    "This vehicle is no longer in our inventory. Browse hundreds of certified pre-owned vehicles ready for Canada-wide delivery from Planet Motors.",
  robots: { index: false, follow: true },
}

export default function VehicleNotFound() {
  return (
    <>
      <Header />
      <main className="min-h-[70vh] bg-background flex items-center justify-center p-4">
        <div className="max-w-2xl w-full text-center">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
            <Car className="w-12 h-12 text-primary" aria-hidden="true" />
          </div>

          <h1 className="text-3xl font-bold tracking-[-0.01em] text-foreground mb-4">
            This vehicle is no longer available
          </h1>
          <p className="text-muted-foreground mb-8 text-lg">
            Looks like this one drove off our lot. We have hundreds more
            certified pre-owned vehicles ready for you, with new arrivals
            every week.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
            <Button asChild size="lg">
              <Link href="/inventory">
                <Search className="w-4 h-4 mr-2" aria-hidden="true" />
                Browse Available Inventory
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <a href={`tel:${PHONE_TOLL_FREE_TEL}`}>
                <Phone className="w-4 h-4 mr-2" aria-hidden="true" />
                Call {PHONE_TOLL_FREE}
              </a>
            </Button>
          </div>

          <div className="pt-8 border-t">
            <p className="text-sm text-muted-foreground mb-4">
              Looking for something specific? Our team can help you find it.
            </p>
            <Link href="/contact" className="text-primary hover:underline">
              Tell us what you&apos;re looking for &rarr;
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
