/**
 * app/cars/[make]/page.tsx
 *
 * Catch-all SSR landing page for category slugs at `/cars/<slug>`.
 *
 * Powers single-segment URLs like:
 *   /cars/tesla              (make-only)
 *   /cars/electric           (fuel-type)
 *   /cars/suv                (body-style)
 *   /cars/luxury-evs         (premium tag → fuel + isLuxury)
 *   /cars/electric-in-toronto
 *   /cars/tesla-in-richmond-hill
 *   /cars/under-50k
 *
 * Two-segment URLs like `/cars/tesla/model-3` continue to be served
 * by the existing nested `[make]/[model]/page.tsx` editorial route —
 * Next.js dynamic segments don't collide because the depth differs.
 *
 * Slugs that don't parse return a 404 so the URL surface stays
 * predictable for SEO (no soft-404s, no duplicate content).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Shield,
  Truck,
  Star,
  CheckCircle,
  ArrowRight,
  Phone,
  Battery,
} from 'lucide-react'
import {
  parseCategorySlug,
  enumerateCategorySlugs,
  KNOWN_CITIES,
} from '@/lib/seo/category-slug-parser'
import { fetchCategoryVehicles } from '@/lib/vehicles/fetch-by-filter'
import { CategoryJsonLd } from '@/components/seo/category-jsonld'
import { EmptyInventoryState } from '@/components/cars/empty-inventory-state'
import { VehicleCard } from '@/components/cars/vehicle-card'
import { pickFallbackHref } from '@/lib/cars/category-helpers'
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from '@/lib/constants/dealership'

interface PageProps {
  readonly params: Promise<{ make: string }>
}

/**
 * Pre-render the high-value category slugs at build time. Other
 * slugs that pass `parseCategorySlug` are served via on-demand SSR
 * (Next.js auto-falls-back to dynamic for missing static params).
 */
export function generateStaticParams() {
  return enumerateCategorySlugs().map((slug) => ({ make: slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { make } = await params
  const filter = parseCategorySlug(make)
  if (!filter) return { title: 'Page not found | Planet Motors' }

  return {
    title: filter.metaTitle,
    description: filter.metaDescription,
    alternates: { canonical: filter.canonicalPath },
    openGraph: {
      title: filter.metaTitle,
      description: filter.metaDescription,
      type: 'website',
      url: filter.canonicalPath,
    },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { make } = await params
  const filter = parseCategorySlug(make)
  if (!filter) notFound()

  const { vehicles, totalMatching } = await fetchCategoryVehicles(filter)
  const cityMeta = filter.citySlug ? KNOWN_CITIES[filter.citySlug] : null

  return (
    <div className="min-h-screen bg-background">
      <CategoryJsonLd filter={filter} vehicles={vehicles} />
      <Header />
      <main id="main-content" tabIndex={-1}>
        {/* Hero */}
        <section className="relative bg-linear-to-br from-primary/10 via-background to-background py-12 lg:py-16">
          <div className="container mx-auto px-4 max-w-6xl">
            <Badge className="mb-4 bg-green-100 text-green-800">
              <Shield className="w-3 h-3 mr-1" /> 100% Accident-Free Inventory
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              {filter.h1}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mb-6">
              {filter.metaDescription}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/financing">
                <Button size="lg">
                  Get Pre-Approved
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline">
                  <Phone className="w-4 h-4 mr-2" />
                  Speak to a Specialist
                </Button>
              </Link>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap gap-6 mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-2 text-sm">
                <Shield className="w-4 h-4 text-green-600" />
                210-Point Inspection
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="w-4 h-4 text-green-600" />
                10-Day Money-Back
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Battery className="w-4 h-4 text-blue-600" />
                Aviloo Battery Health (EVs)
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Star className="w-4 h-4 text-yellow-500" />
                4.8 Star Rating
              </div>
              {cityMeta && cityMeta.distance > 0 ? (
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="w-4 h-4 text-primary" />
                  Free delivery to {cityMeta.name} ({cityMeta.distance}km)
                </div>
              ) : null}
            </div>
          </div>
        </section>

        {/* Inventory grid OR empty state */}
        <section className="py-12">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="flex items-end justify-between mb-6 gap-4 flex-wrap">
              <div>
                <h2 className="text-2xl font-semibold">
                  {totalMatching} matching {totalMatching === 1 ? 'vehicle' : 'vehicles'}
                  {cityMeta ? ` available for ${cityMeta.name}` : ' in stock'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Inventory updates every 15 minutes from our HomeNet feed
                </p>
              </div>
              <Link href="/inventory">
                <Button variant="outline">
                  View full inventory
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>

            {vehicles.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {vehicles.map((v) => (
                  <VehicleCard key={v.id} vehicle={v} />
                ))}
              </div>
            ) : (
              <EmptyInventoryState
                categoryName={filter.h1}
                fallbackHref={pickFallbackHref(filter)}
                fallbackLabel="Browse closest in-stock category"
                notifyTopic={filter.canonicalPath}
              />
            )}
          </div>
        </section>

        {/* Why Planet Motors strip */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">
              Why buyers choose Planet Motors
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Shield,
                  title: '100% Accident-Free',
                  body:
                    'Every vehicle has a clean Carfax. We never list a car with frame, flood, or fire damage.',
                },
                {
                  icon: Battery,
                  title: 'Aviloo on every EV',
                  body:
                    'Independent battery health certificate before you buy — no more guessing on used EV range.',
                },
                {
                  icon: Truck,
                  title: 'Free GTA delivery',
                  body:
                    'Free home delivery within 300km of Richmond Hill. Affordable shipping Canada-wide.',
                },
                {
                  icon: CheckCircle,
                  title: '10-day money back',
                  body:
                    "If it isn't the right car, return it within 10 days. No questions, no restocking fee.",
                },
              ].map((b) => (
                <Card key={b.title} className="p-6 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <b.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{b.title}</h3>
                  <p className="text-sm text-muted-foreground">{b.body}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Phone CTA */}
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 max-w-6xl text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Questions? Talk to a Planet Motors specialist
            </h2>
            <p className="opacity-90 mb-6 max-w-2xl mx-auto">
              Our team can pull a car from inventory, set up a test drive, or coordinate
              delivery to your door. Open 7 days.
            </p>
            <Button asChild size="lg" variant="secondary">
              <a href={`tel:${PHONE_TOLL_FREE_TEL}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call {PHONE_TOLL_FREE}
              </a>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
