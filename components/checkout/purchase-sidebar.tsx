"use client"

import Image from "next/image"
import { CheckCircle, ChevronRight, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface PurchaseStep {
  id: string
  label: string
  timeEstimate: string
  status: "complete" | "current" | "upcoming"
}

interface PurchaseSidebarProps {
  vehicle: {
    year: number
    make: string
    model: string
    trim?: string
    imageUrl?: string
  }
  steps: PurchaseStep[]
  onStepClick: (stepIndex: number) => void
}

export function PurchaseSidebar({ vehicle, steps, onStepClick }: PurchaseSidebarProps) {
  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
  const completedCount = steps.filter(s => s.status === "complete").length
  const allDone = completedCount === steps.length

  return (
    <aside className="w-full lg:w-80 xl:w-[340px] shrink-0">
      <div className="lg:sticky lg:top-4 space-y-4">
        {/* Vehicle Card */}
        <div className="flex items-center gap-3 p-4 bg-background rounded-xl border">
          {vehicle.imageUrl ? (
            <Image
              src={vehicle.imageUrl}
              alt={vehicleName}
              width={80}
              height={56}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-20 h-14 bg-muted rounded-lg flex items-center justify-center text-xs text-muted-foreground">
              No image
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{vehicleName}</p>
            {vehicle.trim && (
              <p className="text-xs text-muted-foreground truncate">{vehicle.trim}</p>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="bg-background rounded-xl border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm">Purchase process</h2>
            <span className={cn(
              "text-xs font-medium px-2.5 py-0.5 rounded-full",
              allDone
                ? "bg-green-100 text-green-700"
                : "bg-blue-100 text-blue-700"
            )}>
              {allDone ? "Complete" : "In progress"}
            </span>
          </div>

          <nav className="space-y-0.5">
            {steps.map((step, idx) => {
              const canClick = step.status === "complete" || step.status === "current"
              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={!canClick}
                  onClick={() => canClick && onStepClick(idx)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-colors",
                    step.status === "current" && "bg-blue-50 border-l-4 border-blue-600",
                    step.status === "complete" && "hover:bg-muted/50 cursor-pointer",
                    step.status === "upcoming" && "opacity-60 cursor-default"
                  )}
                >
                  {/* Status icon */}
                  <span className="shrink-0">
                    {step.status === "complete" ? (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    ) : step.status === "current" ? (
                      <div className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                    )}
                  </span>

                  {/* Label + time */}
                  <span className="flex-1 min-w-0">
                    <span className={cn(
                      "block text-sm font-medium",
                      step.status === "current" && "text-blue-700",
                      step.status === "upcoming" && "text-muted-foreground"
                    )}>
                      {step.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {step.status === "complete" ? "Complete" : (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          About {step.timeEstimate}
                        </span>
                      )}
                    </span>
                  </span>

                  {/* Chevron */}
                  <ChevronRight className={cn(
                    "w-4 h-4 shrink-0",
                    step.status === "current" ? "text-blue-600" : "text-muted-foreground/50"
                  )} />
                </button>
              )
            })}
          </nav>

          {/* Finalize */}
          <div className="mt-4 pt-4 border-t flex items-center justify-between">
            <span className="font-semibold text-sm">Finalize purchase</span>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Up next
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
