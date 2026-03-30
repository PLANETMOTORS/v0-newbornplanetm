"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { ChevronLeft, ChevronRight, RotateCw, Shield, Eye, Heart, Share2, Fuel, Gauge, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// Premium demo vehicles for showcase
const showcaseVehicles = [
  {
    id: "tesla-model-y",
    name: "2024 Tesla Model Y Long Range",
    price: "$64,990",
    monthlyPayment: "$489",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80",
    mileage: "12,450 km",
    fuel: "Electric",
    year: "2024",
    inspectionScore: 210,
    badge: "Just Arrived",
    badgeColor: "bg-green-500"
  },
  {
    id: "bmw-m4",
    name: "2024 BMW M4 Competition xDrive",
    price: "$89,900",
    monthlyPayment: "$699",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&auto=format&fit=crop&q=80",
    mileage: "8,200 km",
    fuel: "Premium",
    year: "2024",
    inspectionScore: 208,
    badge: "Hot Deal",
    badgeColor: "bg-accent"
  },
  {
    id: "porsche-taycan",
    name: "2024 Porsche Taycan 4S",
    price: "$134,500",
    monthlyPayment: "$1,089",
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&auto=format&fit=crop&q=80",
    mileage: "5,100 km",
    fuel: "Electric",
    year: "2024",
    inspectionScore: 210,
    badge: "Premium",
    badgeColor: "bg-primary"
  },
  {
    id: "mercedes-eqs",
    name: "2024 Mercedes-Benz EQS 580",
    price: "$156,900",
    monthlyPayment: "$1,249",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80",
    mileage: "3,800 km",
    fuel: "Electric",
    year: "2024",
    inspectionScore: 210,
    badge: "Certified",
    badgeColor: "bg-blue-500"
  },
]

export function VehicleShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [isHovering, setIsHovering] = useState(false)
  const [viewCount, setViewCount] = useState(47)

  const currentVehicle = showcaseVehicles[currentIndex]

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
    if (isHovering) return
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % showcaseVehicles.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [isHovering])

  const goToPrevious = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev - 1 + showcaseVehicles.length) % showcaseVehicles.length)
    setTimeout(() => setIsAnimating(false), 300)
  }

  const goToNext = () => {
    if (isAnimating) return
    setIsAnimating(true)
    setCurrentIndex((prev) => (prev + 1) % showcaseVehicles.length)
    setTimeout(() => setIsAnimating(false), 300)
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
          sizes="(max-width: 768px) 100vw, 50vw"
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
