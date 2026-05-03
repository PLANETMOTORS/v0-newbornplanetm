/**
 * components/cars/vehicle-card.tsx
 *
 * Listing-grid card used by the `/cars/[slug]` category landing pages.
 * Extracted from `app/cars/[make]/page.tsx` so the markup is unit-
 * testable in jsdom without the Server Component harness.
 */

import Link from 'next/link'
import Image from 'next/image'
import { Battery, Zap } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import type { CategoryVehicle } from '@/lib/vehicles/fetch-by-filter'
import { formatPrice, formatKm } from '@/lib/cars/category-helpers'

interface Props {
  readonly vehicle: CategoryVehicle
  /** Mark as LCP candidate (above-fold cards). Adds priority + fetchPriority="high". */
  readonly priority?: boolean
}

export function VehicleCard({ vehicle: v, priority = false }: Props) {
  return (
    <Link
      href={`/vehicles/${v.id}`}
      className="group"
      data-testid="vehicle-card-link"
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative aspect-[4/3] bg-muted">
          {v.primaryImageUrl ? (
            <Image
              src={v.primaryImageUrl}
              alt={`${v.year} ${v.make} ${v.model}`}
              fill
              className="object-cover group-hover:scale-[1.02] transition-transform"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
              {...(priority
                ? { priority: true, fetchPriority: 'high' as const }
                : { loading: 'lazy' as const })}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              No image yet
            </div>
          )}
          {v.isEv ? (
            <Badge className="absolute top-2 left-2 bg-green-600">
              <Zap className="w-3 h-3 mr-1" /> EV
            </Badge>
          ) : null}
          {v.evBatteryHealthPercent != null && (
            <Badge className="absolute top-2 right-2 bg-blue-600">
              <Battery className="w-3 h-3 mr-1" /> {v.evBatteryHealthPercent}% SOH
            </Badge>
          )}
        </div>
        <CardContent className="p-4 flex flex-col gap-1 flex-1">
          <h3 className="font-semibold leading-tight">
            {v.year} {v.make} {v.model}
            {v.trim ? <span className="text-muted-foreground"> {v.trim}</span> : null}
          </h3>
          <p className="text-2xl font-bold text-primary">{formatPrice(v.price)}</p>
          <p className="text-sm text-muted-foreground">
            {formatKm(v.mileage)}
            {v.bodyStyle ? ` • ${v.bodyStyle}` : ''}
            {v.fuelType ? ` • ${v.fuelType}` : ''}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}
