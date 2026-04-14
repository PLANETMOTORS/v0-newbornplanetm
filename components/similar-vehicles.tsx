"use client"

import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Gauge, Fuel, Battery, ChevronRight, Truck, Car } from "lucide-react"

interface SimilarVehicle {
  id: string
  year: number
  make: string
  model: string
  trim: string
  price: number
  mileage: number
  fuelType: string
  image: string
  batteryHealth?: number
  range?: string
}

interface SimilarVehiclesProps {
  currentVehicleId: string
  make: string
  priceRange: number
}

interface ApiVehicle {
  id: string
  year: number
  make: string
  model: string
  trim: string | null
  price: number
  mileage: number
  fuel_type: string | null
  primary_image_url: string | null
  battery_health?: number | null
  range_km?: number | null
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to load similar vehicles")
  return res.json()
}

function toSimilarVehicle(v: ApiVehicle): SimilarVehicle {
  return {
    id: v.id,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim ?? "",
    price: v.price,
    mileage: v.mileage,
    fuelType: v.fuel_type ?? "Gasoline",
    image: v.primary_image_url ?? "",
    batteryHealth: v.battery_health ?? undefined,
    range: v.range_km ? `${v.range_km} km` : undefined,
  }
}

export function SimilarVehicles({ currentVehicleId, make, priceRange }: SimilarVehiclesProps) {
  // Fetch similar vehicles from the API — benefits from CDN caching
  const apiUrl = `/api/v1/vehicles?make=${encodeURIComponent(make)}&status=available&limit=8&sort=created_at&order=desc`
  const { data } = useSWR(make ? apiUrl : null, fetcher, {
    dedupingInterval: 300_000, // 5 min — same as CDN TTL
    revalidateOnFocus: false,
  })

  const rawVehicles: ApiVehicle[] = data?.data?.vehicles ?? []
  const filtered: SimilarVehicle[] = rawVehicles
    .filter(v => v.id !== currentVehicleId)
    .filter(v => v.price >= priceRange * 0.7 && v.price <= priceRange * 1.3)
    .slice(0, 4)
    .map(toSimilarVehicle)

  if (filtered.length === 0) return null

  return (
    <section className="py-12 bg-muted/30">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Similar Vehicles</h2>
            <p className="text-muted-foreground">You might also be interested in these</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/inventory">
              View All Inventory
              <ChevronRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map((vehicle) => (
            <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
              <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-[#f0f4ff] to-[#e8eef5]">
                  {vehicle.image ? (
                    <Image
                      src={vehicle.image}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Car className="w-12 h-12 text-[#1e3a8a]/15" />
                    </div>
                  )}
                  {vehicle.fuelType === "Electric" && (
                    <Badge className="absolute top-2 left-2 bg-green-500">
                      <Battery className="h-3 w-3 mr-1" />
                      {vehicle.batteryHealth}% Battery
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={(e) => e.preventDefault()}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{vehicle.trim}</p>
                  
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Gauge className="h-3.5 w-3.5" />
                      {vehicle.mileage.toLocaleString()} km
                    </span>
                    {vehicle.range && (
                      <span className="flex items-center gap-1">
                        <Fuel className="h-3.5 w-3.5" />
                        {vehicle.range}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      ${vehicle.price.toLocaleString()}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      <Truck className="h-3 w-3 mr-1" />
                      Nationwide Delivery
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
