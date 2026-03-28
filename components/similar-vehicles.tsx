"use client"

import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Gauge, Fuel, Battery, ChevronRight, MapPin, Truck } from "lucide-react"

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

const similarVehicles: SimilarVehicle[] = [
  {
    id: "2024-tesla-model-y",
    year: 2024,
    make: "Tesla",
    model: "Model Y",
    trim: "Long Range AWD",
    price: 64990,
    mileage: 12450,
    fuelType: "Electric",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&auto=format&fit=crop&q=80",
    batteryHealth: 98,
    range: "533 km"
  },
  {
    id: "2024-bmw-i4",
    year: 2024,
    make: "BMW",
    model: "i4",
    trim: "eDrive40",
    price: 58900,
    mileage: 15200,
    fuelType: "Electric",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&auto=format&fit=crop&q=80",
    batteryHealth: 97,
    range: "435 km"
  },
  {
    id: "2023-mercedes-eqe",
    year: 2023,
    make: "Mercedes-Benz",
    model: "EQE",
    trim: "350 4MATIC",
    price: 72500,
    mileage: 8900,
    fuelType: "Electric",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&auto=format&fit=crop&q=80",
    batteryHealth: 99,
    range: "495 km"
  },
  {
    id: "2024-audi-etron-gt",
    year: 2024,
    make: "Audi",
    model: "e-tron GT",
    trim: "quattro",
    price: 119900,
    mileage: 4200,
    fuelType: "Electric",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&auto=format&fit=crop&q=80",
    batteryHealth: 100,
    range: "383 km"
  }
]

export function SimilarVehicles({ currentVehicleId, make, priceRange }: SimilarVehiclesProps) {
  // Filter similar vehicles (same make or similar price range, excluding current)
  const filtered = similarVehicles
    .filter(v => v.id !== currentVehicleId)
    .filter(v => v.make === make || (v.price >= priceRange * 0.7 && v.price <= priceRange * 1.3))
    .slice(0, 4)

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
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={vehicle.image}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
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
                      Free Delivery
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
