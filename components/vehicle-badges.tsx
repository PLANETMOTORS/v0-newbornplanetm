import { Badge } from "@/components/ui/badge"
import {
  TrendingDown,
  Sparkles,
  Clock,
  AlertCircle,
  CheckCircle2,
  Battery
} from "lucide-react"

interface VehicleBadgesProps {
  isNew?: boolean
  isPriceDrop?: boolean
  priceDropAmount?: number
  isPopular?: boolean
  daysOnLot?: number
  isSalePending?: boolean
  hasCarfax?: boolean
  hasCBB?: boolean
  isEVCertified?: boolean
  batteryHealth?: number
  isHotDeal?: boolean
}

export function VehicleBadges({
  isNew,
  isPriceDrop,
  priceDropAmount,
  isPopular,
  daysOnLot,
  isSalePending,
  hasCarfax,
  hasCBB,
  isEVCertified,
  batteryHealth,
  isHotDeal
}: VehicleBadgesProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {/* Sale Pending - Most Important */}
      {isSalePending && (
        <Badge variant="destructive" className="bg-orange-500">
          <AlertCircle className="w-3 h-3 mr-1" />
          Sale Pending
        </Badge>
      )}

      {/* Just Arrived */}
      {isNew && daysOnLot && daysOnLot <= 3 && (
        <Badge className="bg-blue-500">
          <Sparkles className="w-3 h-3 mr-1" />
          Just Arrived
        </Badge>
      )}

      {/* Hot Deal */}
      {isHotDeal && (
        <Badge className="bg-red-500">
          <Zap className="w-3 h-3 mr-1" />
          Hot Deal
        </Badge>
      )}

      {/* Price Drop */}
      {isPriceDrop && (
        <Badge className="bg-green-500">
          <TrendingDown className="w-3 h-3 mr-1" />
          {priceDropAmount ? `$${priceDropAmount.toLocaleString()} Off` : "Price Drop"}
        </Badge>
      )}

      {/* EV Battery Certified */}
      {isEVCertified && (
        <Badge variant="outline" className="border-green-500 text-green-600">
          <Battery className="w-3 h-3 mr-1" />
          {batteryHealth ? `${batteryHealth}% Battery` : "EV Certified"}
        </Badge>
      )}

      {/* Carfax */}
      {hasCarfax && (
        <Badge variant="outline" className="border-blue-500 text-blue-600">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Carfax
        </Badge>
      )}

      {/* CBB */}
      {hasCBB && (
        <Badge variant="outline" className="border-amber-500 text-amber-600">
          <Shield className="w-3 h-3 mr-1" />
          CBB
        </Badge>
      )}
    </div>
  )
}

// Individual badge components for flexible use
export function NewArrivalBadge() {
  return (
    <Badge className="bg-blue-500">
      <Sparkles className="w-3 h-3 mr-1" />
      Just Arrived
    </Badge>
  )
}

export function PriceDropBadge({ amount }: { amount?: number }) {
  return (
    <Badge className="bg-green-500">
      <TrendingDown className="w-3 h-3 mr-1" />
      {amount ? `$${amount.toLocaleString()} Off` : "Price Drop"}
    </Badge>
  )
}



export function SalePendingBadge() {
  return (
    <Badge variant="destructive" className="bg-orange-500">
      <AlertCircle className="w-3 h-3 mr-1" />
      Sale Pending
    </Badge>
  )
}

export function CarfaxBadge() {
  return (
    <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">
      <CheckCircle2 className="w-3 h-3 mr-1" />
      Carfax Verified
    </Badge>
  )
}

export function CBBBadge() {
  return (
    <Badge variant="outline" className="border-amber-500 text-amber-600 bg-amber-50">
      <Shield className="w-3 h-3 mr-1" />
      CBB Valued
    </Badge>
  )
}

export function EVCertifiedBadge({ batteryHealth }: { batteryHealth?: number }) {
  return (
    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50">
      <Battery className="w-3 h-3 mr-1" />
      {batteryHealth ? `${batteryHealth}% Battery Health` : "EV Certified"}
    </Badge>
  )
}

export function DaysOnLotBadge({ days }: { days: number }) {
  return (
    <Badge variant="outline" className="text-muted-foreground">
      <Clock className="w-3 h-3 mr-1" />
      {days} days on lot
    </Badge>
  )
}
