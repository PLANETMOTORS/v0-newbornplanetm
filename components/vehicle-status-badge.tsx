import { cn } from "@/lib/utils"

// Vehicle status badge styles and labels
export const statusBadgeStyles: Record<string, string> = {
  'available': '',
  'in-transit': 'bg-teal-600 text-white',
  'reserved': 'bg-yellow-600 text-white',
  'pending': 'bg-orange-600 text-white',
  'sold': 'bg-red-600 text-white',
}

export const statusLabels: Record<string, string> = {
  'available': 'Available',
  'in-transit': 'In Transit',
  'reserved': 'Reserved',
  'pending': 'Sale Pending',
  'sold': 'Sold',
}

interface VehicleStatusBadgeProps {
  status: string
  estimatedArrival?: string
  className?: string
}

export function VehicleStatusBadge({ status, estimatedArrival, className }: VehicleStatusBadgeProps) {
  if (status === 'available') return null

  return (
    <div className={cn(
      "px-3 py-1.5 text-xs font-bold uppercase tracking-widest shadow-lg rounded-sm",
      statusBadgeStyles[status],
      className
    )}>
      {statusLabels[status]}
      {status === 'in-transit' && estimatedArrival && (
        <span className="block text-[10px] font-normal normal-case tracking-normal mt-0.5">
          ETA: {estimatedArrival}
        </span>
      )}
    </div>
  )
}

interface SoldOverlayProps {
  className?: string
}

export function SoldOverlay({ className }: SoldOverlayProps) {
  return (
    <div className={cn("absolute inset-0 bg-black/20 flex items-center justify-center", className)}>
      <span className="bg-red-600 text-white px-6 py-2 text-lg font-bold uppercase tracking-widest -rotate-12 shadow-xl">
        Sold
      </span>
    </div>
  )
}

// Helper functions
export function isVehicleSold(status: string): boolean {
  return status === 'sold'
}

export function isVehicleUnavailable(status: string): boolean {
  return status === 'sold' || status === 'pending'
}
