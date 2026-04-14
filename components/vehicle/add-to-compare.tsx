"use client"

import { Button } from "@/components/ui/button"
import { GitCompare, Check } from "lucide-react"
import { useCompare, CompareVehicle } from "@/contexts/compare-context"
import { toast } from "sonner"

interface PartialVehicle {
  id: string
  name: string
  image: string
  price: number
  mileage?: number
  year?: number
}

interface AddToCompareProps {
  vehicle: PartialVehicle
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function AddToCompare({ vehicle, variant = "outline", size = "sm", className }: AddToCompareProps) {
  const { addToCompare, removeFromCompare, isInCompare, vehicles, maxItems } = useCompare()

  const inComparison = isInCompare(vehicle.id)

  const handleClick = () => {
    if (inComparison) {
      removeFromCompare(vehicle.id)
      toast.success("Removed from comparison")
    } else {
      if (vehicles.length >= maxItems) {
        toast.error(`Maximum ${maxItems} vehicles can be compared`)
        return
      }
      // Create a full CompareVehicle with defaults for missing fields
      const fullVehicle: CompareVehicle = {
        id: vehicle.id,
        name: vehicle.name,
        image: vehicle.image,
        price: vehicle.price,
        mileage: vehicle.mileage || 0,
        fuelType: 'Gasoline',
        range: 'N/A',
        horsepower: 0,
        acceleration: 'N/A',
        seating: 5,
        cargo: 'N/A',
        warranty: 'Standard',
        transmission: 'Automatic',
        drivetrain: 'FWD',
        inspectionScore: 210,
        features: []
      }
      addToCompare(vehicle.id, fullVehicle)
      toast.success("Added to comparison")
    }
  }

  return (
    <Button
      variant={inComparison ? "default" : variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      {inComparison ? (
        <>
          <Check className="w-4 h-4 mr-1" />
          In Compare
        </>
      ) : (
        <>
          <GitCompare className="w-4 h-4 mr-1" />
          Compare
        </>
      )}
    </Button>
  )
}
