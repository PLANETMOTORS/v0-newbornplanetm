"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { X, GitCompare, ChevronRight } from "lucide-react"
import { useCompare } from "@/lib/compare-context"

export function ComparisonBar() {
  const { vehicles, removeFromCompare, clearCompare } = useCompare()

  if (vehicles.length === 0) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Vehicle previews */}
          <div className="flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground whitespace-nowrap">
              <GitCompare className="w-4 h-4" />
              Compare ({vehicles.length}/4)
            </div>

            {vehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="flex items-center gap-2 bg-muted rounded-lg px-2 py-1.5 min-w-fit"
              >
                <div className="relative w-12 h-8 rounded overflow-hidden">
                  <Image
                    src={vehicle.image || "/placeholder.svg"}
                    alt={vehicle.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium truncate max-w-[100px]">{vehicle.name}</p>
                  <p className="text-xs text-muted-foreground">${vehicle.price.toLocaleString()}</p>
                </div>
                <button
                  onClick={() => removeFromCompare(vehicle.id)}
                  className="p-1 hover:bg-background rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={clearCompare}>
              Clear All
            </Button>
            <Button asChild size="sm" disabled={vehicles.length < 2}>
              <Link href="/compare" className="gap-1">
                Compare
                <ChevronRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
