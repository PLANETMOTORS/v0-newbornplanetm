"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import { ChevronLeft, ChevronRight, RotateCw, Shield, Heart, Share2, Fuel, Gauge, Calendar, Car } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { RATE_FLOOR_DISPLAY } from "@/lib/rates"
import { safeNum } from "@/lib/pricing/format"
import { createClient } from "@/lib/supabase/client"

// Fetcher for featured vehicles
const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, year, make, model, trim, price, mileage, fuel_type, inspection_score, is_new_arrival, primary_image_url, image_urls')
    .eq('status', 'available')
    .order('price', { ascending: false })
    .limit(6)
  
  if (error) throw error
  return data
}

// No Unsplash placeholders — use gradient fallback for vehicles without real images

// Fallback vehicles when database is empty or loading fails
const fallbackVehicles = [
  {
    id: "featured-1",
    name: "2024 Tesla Model Y Long Range",
    price: "$54,990",
    monthlyPayment: "$654",
    image: null as string | null,
    mileage: "12,500 km",
    fuel: "Electric",
    year: "2024",
    inspectionScore: 210,
    badge: "Electric",
    badgeColor: "bg-blue-700"
  },
  {
    id: "featured-2",
    name: "2023 BMW X5 xDrive40i",
    price: "$72,900",
    monthlyPayment: "$868",
    image: null as string | null,
    mileage: "18,200 km",
    fuel: "Gasoline",
    year: "2023",
    inspectionScore: 208,
    badge: "Premium",
    badgeColor: "bg-purple-700"
  },
  {
    id: "featured-3",
    name: "2024 Toyota RAV4 Hybrid XLE",
    price: "$42,500",
    monthlyPayment: "$506",
    image: null as string | null,
    mileage: "8,400 km",
    fuel: "Hybrid",
    year: "2024",
    inspectionScore: 210,
    badge: "Fuel Saver",
    badgeColor: "bg-green-700"
  },
  {
    id: "featured-4",
    name: "2023 Audi Q5 Sportback",
    price: "$58,900",
    monthlyPayment: "$701",
    image: null as string | null,
    mileage: "22,100 km",
    fuel: "Gasoline",
    year: "2023",
    inspectionScore: 207,
    badge: "Just Arrived",
    badgeColor: "bg-green-700"
  }
]

// Transform database vehicle to showcase format
interface DbVehicle {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  price: number
  mileage: number
  fuel_type?: string
  is_new_arrival?: boolean
  inspection_score?: number
  primary_image_url?: string
  image_urls?: string[]
}

function transformToShowcase(v: DbVehicle) {
  const priceInDollars = safeNum(v.price) / 100
  
  // Determine badge
  let badge = "PM Certified"
  let badgeColor = "bg-primary"
  
  if (v.fuel_type === "Electric") {
    badge = "Electric"
    badgeColor = "bg-blue-700"
  } else if (priceInDollars > 100000) {
    badge = "Premium"
    badgeColor = "bg-purple-700"
  } else if (v.is_new_arrival) {
    badge = "Just Arrived"
    badgeColor = "bg-green-700"
  }
  
  // Use real vehicle image from HomeNet, fall back to null (gradient fallback)
  const image: string | null = v.primary_image_url || (v.image_urls && v.image_urls.length > 0 ? v.image_urls[0] : null)
  
  return {
    id: v.id,
    name: `${v.year} ${v.make} ${v.model} ${v.trim || ''}`.trim(),
    price: `$${priceInDollars.toLocaleString()}`,
    monthlyPayment: `$${(priceInDollars > 0 ? Math.round(priceInDollars / 84) : 0).toLocaleString()}`,
    image,
    mileage: `${v.mileage.toLocaleString()} km`,
    fuel: v.fuel_type || "Gasoline",
    year: v.year.toString(),
    inspectionScore: v.inspection_score || 210,
    badge,
    badgeColor
  }
}

export function VehicleShowcase({ serverVehicles }: { serverVehicles?: DbVehicle[] } = {}) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [imageError, setImageError] = useState(false)

  // Fetch vehicles from Supabase — use server-fetched data as fallbackData
  // so the first render already has real vehicle data + images (enables LCP preload).
  const { data: dbVehicles } = useSWR('showcase-vehicles', fetcher, {
    refreshInterval: 120000,
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server data matches fetcher shape
    ...(serverVehicles ? { fallbackData: serverVehicles as any } : {}),
  })

  // Transform to showcase format - use fallback if no DB data
  const isFallback = !dbVehicles || dbVehicles.length === 0
  const showcaseVehicles = useMemo(() => {
    if (!dbVehicles || dbVehicles.length === 0) return fallbackVehicles
    return dbVehicles.map(transformToShowcase)
  }, [dbVehicles])

  const currentVehicle = showcaseVehicles[currentIndex] || null

  // Reset image error when vehicle changes
  useEffect(() => {
    setImageError(false)
  }, [currentIndex])
  
  // Get the image source — null means gradient fallback
  const imageSrc = currentVehicle?.image && !imageError ? currentVehicle.image : null

  // Carousel auto-rotation - depends only on hover state and vehicle count
  useEffect(() => {
    if (isHovering || showcaseVehicles.length === 0) return
    const rotationTimer = setInterval(() => {
      setCurrentIndex((current) => (current + 1) % showcaseVehicles.length)
    }, 5000)
    return () => clearInterval(rotationTimer)
  }, [isHovering, showcaseVehicles.length])

  const goToPrevious = () => {
    if (isAnimating || showcaseVehicles.length === 0) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + showcaseVehicles.length) % showcaseVehicles.length)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const goToNext = () => {
    if (isAnimating || showcaseVehicles.length === 0) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % showcaseVehicles.length)
    setTimeout(() => setIsAnimating(false), 300)
  }

  // Always show content - fallback vehicles ensure we never have empty state
  // No loading spinner needed as fallbackVehicles are always available

  return (
    <div 
      className="relative group w-full"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Main carousel container - prevent cutoff */}
      <div className="w-full max-w-6xl mx-auto px-2 sm:px-4">
        {/* Main image container */}
        <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-linear-to-br from-[#f0f4ff] to-[#e8eef5] shadow-2xl">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={currentVehicle.name}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            onError={() => setImageError(true)}
            className={cn(
              "object-cover transition-all duration-500 [clip-path:inset(0_0_8%_0)]",
              isAnimating ? "scale-105 opacity-80" : "scale-100 opacity-100"
            )}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Car className="w-24 h-24 text-[#1e3a8a]/15" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Top badges row */}
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <Badge className={cn("text-white shadow-lg", currentVehicle.badgeColor)}>
              {currentVehicle.badge}
            </Badge>
            <div className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
              <RotateCw className="w-4 h-4 text-primary animate-spin-slow" />
              <span>360° View</span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full h-9 w-9"
              aria-label="Add to favorites"
            >
              <Heart className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full h-9 w-9"
              aria-label="Share vehicle"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Bottom info overlay — min-h prevents CLS from dynamic content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white min-h-[120px]">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-300" />
            <span className="text-sm text-green-300 font-semibold">
              {currentVehicle.inspectionScore}/210 Inspection Score
            </span>
          </div>
          <h2 className="font-bold text-xl mb-1">{currentVehicle.name}</h2>
          <div className="flex items-center gap-4 text-sm text-white/90 mb-3">
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              <span className="tabular-nums">{currentVehicle.mileage}</span>
            </span>
            <span className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5" />
              {currentVehicle.fuel}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {currentVehicle.year}
            </span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-2xl font-bold tabular-nums">{currentVehicle.price}</p>
              <p className="text-sm text-white/90">
                <span className="tabular-nums">Est. {currentVehicle.monthlyPayment}/mo at {RATE_FLOOR_DISPLAY} APR</span>
              </p>
            </div>
            <Button size="sm" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link href={isFallback ? "/inventory" : `/vehicles/${currentVehicle.id}`}>
                View Details
              </Link>
            </Button>
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="absolute inset-y-0 left-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full"
            onClick={goToPrevious}
            aria-label="Previous vehicle"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2 bg-background/80 backdrop-blur-sm hover:bg-background/90 rounded-full"
            onClick={goToNext}
            aria-label="Next vehicle"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
        </div>
      </div>
      {/* End of main carousel container */}

      {/* Thumbnail navigation */}
      <div className="mt-4 flex items-center justify-between gap-2 max-w-6xl mx-auto px-2 sm:px-4">
        {/* Left arrow - scroll thumbnails left */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={() => {
            const container = document.querySelector('.thumbnail-scroll-container')
            if (container) {
              container.scrollLeft -= 80
            }
          }}
          aria-label="Scroll thumbnails left"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {/* Thumbnail scroll container */}
        <div className="thumbnail-scroll-container flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide flex-1 px-1 py-1">
          {showcaseVehicles.slice(0, 5).map((vehicle, index) => (
            <button
              key={vehicle.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative w-12 h-9 sm:w-16 sm:h-12 rounded-lg overflow-hidden transition-all duration-200 shrink-0 border-2",
                index === currentIndex 
                  ? "border-primary shadow-md" 
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-gray-300"
              )}
              aria-label={`View ${vehicle.name}`}
            >
              {vehicle.image ? (
                <Image
                  src={vehicle.image}
                  alt={vehicle.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 bg-gray-200" />
              )}
            </button>
          ))}
        </div>

        {/* Right arrow - scroll thumbnails right */}
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-10 w-10 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors"
          onClick={() => {
            const container = document.querySelector('.thumbnail-scroll-container')
            if (container) {
              container.scrollLeft += 80
            }
          }}
          aria-label="Scroll thumbnails right"
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  )
}
