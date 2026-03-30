"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import { ChevronLeft, ChevronRight, RotateCw, Shield, Eye, Heart, Share2, Fuel, Gauge, Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

// Fetcher for featured vehicles
const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('status', 'available')
    .order('price', { ascending: false })
    .limit(6)
  
  if (error) throw error
  return data
}

// Make-specific placeholder images
const makePlaceholders: Record<string, string> = {
  'Tesla': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80',
  'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
  'Audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
  'Toyota': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80',
  'Hyundai': 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&auto=format&fit=crop&q=80',
  'Kia': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&auto=format&fit=crop&q=80',
  'Chevrolet': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
  'Volkswagen': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
  'Jeep': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
  'Honda': 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&auto=format&fit=crop&q=80',
  'Lexus': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
  'default': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=80'
}

// Transform database vehicle to showcase format
function transformToShowcase(v: any) {
  const priceInDollars = v.price / 100
  
  // Determine badge
  let badge = "PM Certified"
  let badgeColor = "bg-primary"
  
  if (v.fuel_type === "Electric") {
    badge = "Electric"
    badgeColor = "bg-blue-500"
  } else if (priceInDollars > 100000) {
    badge = "Premium"
    badgeColor = "bg-purple-500"
  } else if (v.is_new_arrival) {
    badge = "Just Arrived"
    badgeColor = "bg-green-500"
  }
  
  // Check if primary_image_url is a valid image URL (not a VDP page URL)
  // Valid sources: cpsimg.com (carpages CDN), unsplash, direct image files
  const isValidImageUrl = v.primary_image_url && 
    !v.primary_image_url.includes('planetmotors.ca') &&
    (v.primary_image_url.includes('.jpg') || 
     v.primary_image_url.includes('.png') || 
     v.primary_image_url.includes('.webp') ||
     v.primary_image_url.includes('unsplash.com') ||
     v.primary_image_url.includes('carpages.ca') ||
     v.primary_image_url.includes('cpsimg.com'))
  
  // Use valid image URL or fall back to make-specific placeholder
  const image = isValidImageUrl 
    ? v.primary_image_url 
    : (makePlaceholders[v.make] || makePlaceholders['default'])
  
  return {
    id: v.id,
    name: `${v.year} ${v.make} ${v.model} ${v.trim || ''}`.trim(),
    price: `$${priceInDollars.toLocaleString()}`,
    monthlyPayment: `$${Math.round(priceInDollars / 84).toLocaleString()}`,
    image,
    mileage: `${v.mileage.toLocaleString()} km`,
    fuel: v.fuel_type || "Gasoline",
    year: v.year.toString(),
    inspectionScore: v.inspection_score || 210,
    badge,
    badgeColor
  }
}

export function VehicleShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [viewCount, setViewCount] = useState(47)

  // Fetch vehicles from Supabase
  const { data: dbVehicles, isLoading } = useSWR('showcase-vehicles', fetcher, {
    refreshInterval: 60000
  })

  // Transform to showcase format
  const showcaseVehicles = useMemo(() => {
    if (!dbVehicles || dbVehicles.length === 0) return []
    return dbVehicles.map(transformToShowcase)
  }, [dbVehicles])

  const currentVehicle = showcaseVehicles[currentIndex] || null

  // Simulate live viewing count with deterministic pattern
  useEffect(() => {
    let tick = 0
    const interval = setInterval(() => {
      tick++
      const change = (tick % 3) - 1 // cycles: -1, 0, 1
      setViewCount(prev => Math.max(40, Math.min(60, prev + change)))
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Auto-rotate when not hovering
  useEffect(() => {
    if (isHovering || showcaseVehicles.length === 0) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcaseVehicles.length)
    }, 5000)
    return () => clearInterval(interval)
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

  // Loading state
  if (isLoading || !currentVehicle) {
    return (
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted shadow-2xl flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div 
      className="relative group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Main image container */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted shadow-2xl">
        <Image
          src={currentVehicle.image}
          alt={currentVehicle.name}
          fill
          priority
          loading="eager"
          sizes="(max-width: 768px) 100vw, 50vw"
          unoptimized={currentVehicle.image.includes('cpsimg.com')}
          className={cn(
            "object-cover transition-all duration-500",
            isAnimating ? "scale-105 opacity-80" : "scale-100 opacity-100"
          )}
        />

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

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400 font-medium">
              {currentVehicle.inspectionScore}/210 Inspection Score
            </span>
          </div>
          <h3 className="font-semibold text-xl mb-1">{currentVehicle.name}</h3>
          <div className="flex items-center gap-4 text-sm text-white/80 mb-3">
            <span className="flex items-center gap-1">
              <Gauge className="w-3.5 h-3.5" />
              {currentVehicle.mileage}
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
              <p className="text-2xl font-bold">{currentVehicle.price}</p>
              <p className="text-sm text-white/70">
                Est. {currentVehicle.monthlyPayment}/mo at 4.79% APR
              </p>
            </div>
            <Button size="sm" className="bg-white text-primary hover:bg-white/90" asChild>
              <Link href={`/vehicles/${currentVehicle.id}`}>
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

      {/* Thumbnail navigation */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex gap-2">
          {showcaseVehicles.map((vehicle, index) => (
            <button
              key={vehicle.id}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "relative w-16 h-12 rounded-lg overflow-hidden transition-all duration-200",
                index === currentIndex 
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                  : "opacity-60 hover:opacity-100"
              )}
              aria-label={`View ${vehicle.name}`}
            >
              <Image
                src={vehicle.image}
                alt={vehicle.name}
                fill
                sizes="80px"
                className="object-cover"
                unoptimized={vehicle.image.includes('cpsimg.com')}
              />
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Eye className="w-4 h-4" />
          <span>{viewCount} viewing</span>
        </div>
      </div>
    </div>
  )
}
