"use client"

import Image from "next/image"
import Link from "next/link"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { ArrowRight, Battery, Car, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { getVehicleImage } from "@/lib/vehicle-images"

type FeaturedTab = "all" | "electric" | "suvs"

type FeaturedVehicle = {
  id: string
  year: number
  make: string
  model: string
  priceCents: number
  monthlyPayment: number
  mileageLabel: string
  badge: string
  isEV: boolean
  isSUV: boolean
  isAvilooCertified: boolean
  imageUrl: string | null
}

const fallbackVehicles: FeaturedVehicle[] = [
  {
    id: "fallback-1",
    year: 2024,
    make: "Tesla",
    model: "Model 3",
    priceCents: 4290000,
    monthlyPayment: 399,
    mileageLabel: "358 km range",
    badge: "Popular",
    isEV: true,
    isSUV: false,
    isAvilooCertified: true,
    imageUrl: null,
  },
  {
    id: "fallback-2",
    year: 2024,
    make: "Toyota",
    model: "RAV4 Hybrid",
    priceCents: 3850000,
    monthlyPayment: 349,
    mileageLabel: "41 MPG",
    badge: "Fuel Saver",
    isEV: false,
    isSUV: true,
    isAvilooCertified: false,
    imageUrl: null,
  },
  {
    id: "fallback-3",
    year: 2024,
    make: "Hyundai",
    model: "Ioniq 5",
    priceCents: 4850000,
    monthlyPayment: 449,
    mileageLabel: "488 km range",
    badge: "New Arrival",
    isEV: true,
    isSUV: true,
    isAvilooCertified: true,
    imageUrl: null,
  },
  {
    id: "fallback-4",
    year: 2023,
    make: "Honda",
    model: "CR-V",
    priceCents: 3490000,
    monthlyPayment: 319,
    mileageLabel: "30 MPG",
    badge: "Popular",
    isEV: false,
    isSUV: true,
    isAvilooCertified: false,
    imageUrl: null,
  },
  {
    id: "fallback-5",
    year: 2023,
    make: "Ford",
    model: "Mustang Mach-E",
    priceCents: 5290000,
    monthlyPayment: 489,
    mileageLabel: "402 km range",
    badge: "Premium",
    isEV: true,
    isSUV: true,
    isAvilooCertified: true,
    imageUrl: null,
  },
  {
    id: "fallback-6",
    year: 2022,
    make: "BMW",
    model: "X3",
    priceCents: 4490000,
    monthlyPayment: 419,
    mileageLabel: "26 MPG",
    badge: "Luxury",
    isEV: false,
    isSUV: true,
    isAvilooCertified: false,
    imageUrl: null,
  },
]

function getBadgeClassName(badge: string) {
  if (badge === "Popular") return "bg-[#1e3a8a] text-white"
  if (badge === "Fuel Saver") return "bg-green-700 text-white"
  if (badge === "New Arrival") return "bg-orange-700 text-white"
  if (badge === "Premium") return "bg-purple-700 text-white"
  if (badge === "Luxury") return "bg-amber-700 text-white"
  return "bg-gray-700 text-white"
}

const featuredFetcher = async (): Promise<FeaturedVehicle[]> => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, year, make, model, price, mileage, fuel_type, body_style, featured, inspection_score, primary_image_url, image_urls")
    .eq("status", "available")
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(12)

  if (error) {
    throw error
  }

  const mapped = (data || []).map((vehicle) => {
    const priceCents = Number(vehicle.price || 0)
    const monthlyPayment = Math.max(1, Math.round((priceCents / 100) / 108))
    const fuelType = String(vehicle.fuel_type || "")
    const isEV = fuelType.toLowerCase() === "electric"
    const bodyStyle = String(vehicle.body_style || "").toLowerCase()
    const isSUV = bodyStyle.includes("sport utility") || bodyStyle.includes("suv")

    // Get the best available image using the helper
    const imageUrl = getVehicleImage({
      primary_image_url: vehicle.primary_image_url,
      image_urls: vehicle.image_urls,
      make: String(vehicle.make || ""),
    })

    return {
      id: String(vehicle.id),
      year: Number(vehicle.year || 0),
      make: String(vehicle.make || ""),
      model: String(vehicle.model || ""),
      priceCents,
      monthlyPayment,
      mileageLabel: `${Math.max(0, Math.round(Number(vehicle.mileage || 0))).toLocaleString()} km`,
      badge: vehicle.featured ? "Popular" : (isEV ? "Electric" : "Certified"),
      isEV,
      isSUV,
      isAvilooCertified: isEV && Number(vehicle.inspection_score || 0) >= 200,
      imageUrl: imageUrl || null,
    }
  })

  return mapped
}

export function HomepageFeaturedVehicles() {
  const [activeTab, setActiveTab] = useState<FeaturedTab>("all")
  const { data, error } = useSWR("homepage-featured-vehicles", featuredFetcher, {
    refreshInterval: 120000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })

  // Only use fallback vehicles when the fetch actually fails.
  // On initial load (data === undefined, no error) or empty results, skip fallback.
  const isFallback = !!error

  const filteredVehicles = useMemo(() => {
    const vehicles = error ? fallbackVehicles : (data ?? [])
    return vehicles.filter((vehicle) => {
      if (activeTab === "electric") return vehicle.isEV
      if (activeTab === "suvs") return vehicle.isSUV
      return true
    }).slice(0, 6)
  }, [activeTab, data, error])

  return (
    <section className="py-16" style={{ backgroundColor: "#FFFFFF" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-[#1e3a8a]">Featured Vehicles</h2>
            <p className="text-gray-600 mt-1">Quality vehicles ready for delivery</p>
          </div>

          <div className="flex items-center gap-1 bg-[#eef2f7] rounded-lg p-1">
            {[
              { key: "all", label: "All" },
              { key: "electric", label: "Electric" },
              { key: "suvs", label: "SUVs" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as FeaturedTab)}
                className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                  activeTab === tab.key ? "bg-[#1e3a8a] text-white" : "text-gray-600 hover:bg-[#e4eaf2]"
                }`}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white rounded-xl border border-[#dce3ed] overflow-hidden hover:shadow-lg transition-shadow group"
            >
              <div className="relative aspect-[4/3] bg-gradient-to-br from-[#f0f4ff] to-[#e8eef5] overflow-hidden">
                {/* Vehicle image or gradient fallback */}
                {vehicle.imageUrl ? (
                  <Image
                    src={vehicle.imageUrl}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    fill
                    loading="lazy"
                    className="object-cover group-hover:scale-105 transition-transform duration-500 [clip-path:inset(0_0_8%_0)]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    onError={(e) => {
                      // Hide broken image, fallback gradient + icon shows through
                      (e.target as HTMLImageElement).style.display = "none"
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Car className="w-16 h-16 text-[#1e3a8a]/15" />
                  </div>
                )}

                {/* Badges */}
                <div className="absolute top-3 left-3 z-10">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getBadgeClassName(vehicle.badge)}`}>
                    {vehicle.badge}
                  </span>
                </div>

                {vehicle.isAvilooCertified && (
                  <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-semibold text-green-700 shadow-sm">
                    <Battery className="w-3 h-3" />
                    Aviloo Certified
                  </div>
                )}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h3>
                  {vehicle.isEV && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-800 bg-green-50 px-2 py-0.5 rounded-full">
                      <Zap className="w-3 h-3" />
                      EV
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1 tabular-nums">{vehicle.mileageLabel}</p>

                <div className="flex items-center justify-between mt-4">
                  <div>
                    <div className="text-xl font-bold text-[#1e3a8a] tabular-nums">
                      ${(vehicle.priceCents / 100).toLocaleString()}
                    </div>
                    <div className="text-sm font-semibold text-gray-700 tabular-nums">
                      or <span className="font-bold">${vehicle.monthlyPayment}/mo</span>
                    </div>
                  </div>
                  <Button size="sm" className="bg-[#1e3a8a] hover:bg-[#172554]" asChild>
                    <Link href={isFallback ? "/inventory" : `/vehicles/${vehicle.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" size="lg" className="border-2 border-[#1e3a8a] text-[#1e3a8a] hover:bg-[#1e3a8a] hover:text-white" asChild>
            <Link href="/inventory">
              View All Inventory
              <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
