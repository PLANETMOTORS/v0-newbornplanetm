"use client"

import Link from "next/link"
import Image from "next/image"
import { RotateCw, Heart, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { cn } from "@/lib/utils"

// Demo vehicle data
const vehicles = [
  {
    id: "bmw-m4-2024-001",
    name: "2024 BMW M4 Competition",
    price: 84900,
    mileage: 1250,
    condition: "New",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=600&auto=format&fit=crop&q=80",
    has360: true,
  },
  {
    id: "mercedes-amg-gt-2024-001",
    name: "2024 Mercedes-AMG GT",
    price: 142500,
    mileage: 850,
    condition: "New",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&auto=format&fit=crop&q=80",
    has360: true,
  },
  {
    id: "porsche-911-2024-001",
    name: "2024 Porsche 911 Carrera",
    price: 116950,
    mileage: 500,
    condition: "New",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&auto=format&fit=crop&q=80",
    has360: true,
  },
  {
    id: "audi-rs7-2024-001",
    name: "2024 Audi RS7 Sportback",
    price: 128900,
    mileage: 2100,
    condition: "Certified Pre-Owned",
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=600&auto=format&fit=crop&q=80",
    has360: true,
  },
  {
    id: "tesla-model-s-2024-001",
    name: "2024 Tesla Model S Plaid",
    price: 104990,
    mileage: 3200,
    condition: "Pre-Owned",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&auto=format&fit=crop&q=80",
    has360: true,
  },
  {
    id: "range-rover-2024-001",
    name: "2024 Range Rover Sport",
    price: 89500,
    mileage: 1800,
    condition: "New",
    image: "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=600&auto=format&fit=crop&q=80",
    has360: true,
  },
  {
    id: "bmw-x5-2024-001",
    name: "2024 BMW X5 M Competition",
    price: 112900,
    mileage: 4500,
    condition: "Certified Pre-Owned",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&auto=format&fit=crop&q=80",
    has360: true,
  },
  {
    id: "lexus-lc-2024-001",
    name: "2024 Lexus LC 500",
    price: 98500,
    mileage: 2800,
    condition: "New",
    image: "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&auto=format&fit=crop&q=80",
    has360: true,
  },
  {
    id: "jaguar-f-type-2024-001",
    name: "2024 Jaguar F-Type R",
    price: 108500,
    mileage: 1200,
    condition: "New",
    image: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=600&auto=format&fit=crop&q=80",
    has360: true,
  },
]

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

function formatMileage(mileage: number): string {
  return new Intl.NumberFormat("en-US").format(mileage) + " mi"
}

interface VehicleCardProps {
  vehicle: (typeof vehicles)[0]
}

function VehicleCard({ vehicle }: VehicleCardProps) {
  const [isFavorite, setIsFavorite] = useState(false)

  return (
    <div className="group bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow min-w-0" style={{ contain: 'layout style' }}>
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={vehicle.image}
          alt={vehicle.name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {vehicle.has360 && (
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <RotateCw className="w-3 h-3" />
              360°
            </span>
          )}
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            vehicle.condition === "New" 
              ? "bg-accent text-accent-foreground" 
              : "bg-secondary text-secondary-foreground"
          )}>
            {vehicle.condition}
          </span>
        </div>

        {/* Favorite button */}
        <button
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 w-8 h-8 bg-background/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-colors"
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-colors",
              isFavorite ? "fill-destructive text-destructive" : "text-muted-foreground"
            )}
          />
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-base line-clamp-1">{vehicle.name}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {formatMileage(vehicle.mileage)}
        </p>
        <div className="mt-4 flex items-center justify-between">
          <span className="font-serif text-xl font-semibold text-primary">
            {formatPrice(vehicle.price)}
          </span>
          <Button size="sm" variant="outline" asChild>
            <Link href={`/viewer/${vehicle.id}`}>
              View Details
              <ExternalLink className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

export function VehicleGrid() {
  return (
    <div>
      {/* Results count */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{vehicles.length}</span> of{" "}
          <span className="font-medium text-foreground">available</span> vehicles
        </p>
        <select className="text-sm border border-border rounded-lg px-3 py-2 bg-background">
          <option>Sort by: Featured</option>
          <option>Price: Low to High</option>
          <option>Price: High to Low</option>
          <option>Mileage: Low to High</option>
          <option>Year: Newest First</option>
        </select>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-6" style={{ contain: 'layout' }}>
        {vehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      {/* Load more */}
      <div className="mt-12 text-center">
        <Button variant="outline" size="lg">
          Load More Vehicles
        </Button>
      </div>
    </div>
  )
}
