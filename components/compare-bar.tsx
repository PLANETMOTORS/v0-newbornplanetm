"use client"

import { useCompare } from "@/contexts/compare-context"
import { Button } from "@/components/ui/button"
import { X, GitCompare, ChevronUp } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"

export function CompareBar() {
  const { compareList, vehicles, removeFromCompare, clearCompare } = useCompare()
  const [isExpanded, setIsExpanded] = useState(true)

  if (compareList.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg will-change-transform" style={{ contain: 'layout' }}>
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-t-lg flex items-center gap-2 shadow-lg"
      >
        <GitCompare className="h-4 w-4" />
        Compare ({compareList.length}/3)
        <ChevronUp className={`h-4 w-4 transition-transform ${isExpanded ? "" : "rotate-180"}`} />
      </button>

      {isExpanded && (
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Vehicle Thumbnails */}
            <div className="flex items-center gap-4 flex-1 overflow-x-auto">
              {vehicles.slice(0, 3).map(vehicle => (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-3 bg-muted rounded-lg p-2 pr-3 min-w-fit"
                >
                  <Image
                    src={vehicle.image}
                    alt={vehicle.name}
                    width={64}
                    height={48}
                    className="object-cover rounded"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate max-w-[150px]">
                      {vehicle.name.split(" ").slice(0, 3).join(" ")}
                    </p>
                    <p className="text-sm text-primary font-bold">
                      ${vehicle.price.toLocaleString()}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromCompare(vehicle.id)}
                    className="ml-2 p-1 hover:bg-background rounded-full"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>
              ))}

              {/* Empty Slots */}
              {Array.from({ length: 3 - compareList.length }).map((_, i) => (
                <Link
                  key={`empty-${i}`}
                  href="/inventory"
                  className="w-[200px] h-16 border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center hover:border-primary/40 hover:bg-muted/40 transition-colors"
                >
                  <span className="text-sm text-muted-foreground">Add vehicle</span>
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <Button variant="ghost" size="sm" onClick={clearCompare}>
                Clear All
              </Button>
              <Link href="/compare">
                <Button size="lg" disabled={compareList.length < 2}>
                  <GitCompare className="h-4 w-4 mr-2" />
                  Compare {compareList.length} Vehicles
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
