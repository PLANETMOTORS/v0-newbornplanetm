"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, RotateCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

// Demo vehicles for showcase
const showcaseVehicles = [
  {
    id: "bmw-m4",
    name: "2024 BMW M4 Competition",
    price: "$84,900",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "mercedes-amg",
    name: "2024 Mercedes-AMG GT",
    price: "$142,500",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80",
  },
  {
    id: "porsche-911",
    name: "2024 Porsche 911 Carrera",
    price: "$116,950",
    image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80",
  },
]

export function VehicleShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const currentVehicle = showcaseVehicles[currentIndex]

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
    <div className="relative">
      {/* Main image container */}
      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted">
        <img
          src={currentVehicle.image}
          alt={currentVehicle.name}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
            isAnimating ? "opacity-80" : "opacity-100"
          )}
        />

        {/* 360 view badge */}
        <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 text-sm">
          <RotateCw className="w-4 h-4 text-primary" />
          <span>360° View Available</span>
        </div>

        {/* Navigation arrows */}
        <div className="absolute inset-y-0 left-0 flex items-center">
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
        <div className="absolute inset-y-0 right-0 flex items-center">
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

      {/* Vehicle info */}
      <div className="mt-6 flex items-end justify-between">
        <div>
          <h3 className="font-semibold text-lg">{currentVehicle.name}</h3>
          <p className="text-muted-foreground text-sm">Starting at {currentVehicle.price}</p>
        </div>
        <div className="flex gap-2">
          {showcaseVehicles.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-colors",
                index === currentIndex ? "bg-primary" : "bg-border hover:bg-muted-foreground"
              )}
              aria-label={`Go to vehicle ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
