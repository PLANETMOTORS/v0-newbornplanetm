"use client"

import { Button } from "@/components/ui/button"
import { GitCompare, Check } from "lucide-react"
import { useCompare, CompareVehicle } from "@/lib/compare-context"
import { toast } from "sonner"

interface AddToCompareProps {
  vehicle: CompareVehicle
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
      addToCompare(vehicle.id, vehicle)
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
