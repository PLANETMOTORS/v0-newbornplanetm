"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Truck, MapPin, Clock, Phone, CheckCircle, Package, Navigation, RefreshCw, ExternalLink } from "lucide-react"

interface TrackingData {
  deliveryId: string
  status: string
  statusLabel: string
  estimatedArrival: string
  driver: {
    name: string
    phone: string | null
    rating: number
    vehicleType: string
  } | null
  currentLocation: {
    lat: number
    lng: number
    city: string
    province: string
    lastUpdate: string
  } | null
  route: {
    origin: { lat: number; lng: number; address: string }
    destination: { lat: number; lng: number; address: string }
    distanceRemaining: string
    etaMinutes: number | null
  }
  timeline: Array<{
    status: string
    timestamp: string | null
    completed: boolean
    current?: boolean
  }>
  updates: Array<{
    message: string
    timestamp: string
    type: string
  }>
}

const fetcher = (url: string) => fetch(url).then(res => res.json())

const statusSteps = [
  { key: "scheduled", label: "Scheduled", icon: Clock },
  { key: "preparing", label: "Preparing", icon: Package },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "nearby", label: "Almost There", icon: Navigation },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
]

export function DeliveryTracker({ 
  deliveryId, 
  vehicleInfo 
}: { 
  deliveryId: string
  vehicleInfo?: {
    year: number
    make: string
    model: string
    image: string
  }
}) {
  const [mapUrl, setMapUrl] = useState<string | null>(null)

  const { data, error, isLoading, mutate } = useSWR<{ tracking: TrackingData; isDemo?: boolean }>(
    `/api/v1/deliveries/${deliveryId}/tracking`,
    fetcher,
    { refreshInterval: 30000 }
  )

  const tracking = data?.tracking
  const isDemo = data?.isDemo

  useEffect(() => {
    if (tracking?.currentLocation) {
      const { lat, lng } = tracking.currentLocation
      setMapUrl(`https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.02},${lat-0.02},${lng+0.02},${lat+0.02}&layer=mapnik&marker=${lat},${lng}`)
    }
  }, [tracking])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-20 bg-muted rounded"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !tracking) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Unable to load tracking information</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => mutate()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === tracking.status)
  const progress = Math.max(0, ((currentStepIndex + 1) / statusSteps.length) * 100)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Delivery Tracking
              {isDemo && <Badge variant="outline" className="ml-2 text-xs">Demo</Badge>}
            </CardTitle>
            {vehicleInfo && (
              <CardDescription>
                {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
              </CardDescription>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => mutate()} aria-label="Refresh delivery status">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Badge variant={tracking.status === "delivered" ? "default" : "secondary"}>
              {tracking.statusLabel}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {vehicleInfo && (
          <div className="flex gap-4 p-3 bg-muted rounded-lg">
            <Image
              src={vehicleInfo.image || "/placeholder.svg"}
              alt={`${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}`}
              width={96}
              height={64}
              className="object-cover rounded"
            />
            <div>
              <p className="font-semibold">
                {vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {tracking.route.destination.address}
              </p>
            </div>
          </div>
        )}

        {tracking.currentLocation && (tracking.status === "in_transit" || tracking.status === "nearby") && (
          <div className="rounded-lg overflow-hidden border">
            {mapUrl ? (
              <iframe
                src={mapUrl}
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                title="Delivery Location"
              />
            ) : (
              <div className="h-[200px] bg-muted flex items-center justify-center">
                <div className="text-center">
                  <Navigation className="w-8 h-8 mx-auto mb-2 text-primary animate-pulse" />
                  <p className="text-sm text-muted-foreground">
                    {tracking.currentLocation.city}, {tracking.currentLocation.province}
                  </p>
                  <a 
                    href={`https://www.google.com/maps?q=${tracking.currentLocation.lat},${tracking.currentLocation.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary flex items-center justify-center gap-1 mt-2"
                  >
                    Open in Google Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between">
            {statusSteps.map((step, index) => {
              const StepIcon = step.icon
              const isComplete = index <= currentStepIndex
              const isCurrent = index === currentStepIndex
              return (
                <div key={step.key} className="flex flex-col items-center gap-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isComplete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  } ${isCurrent ? "ring-2 ring-primary ring-offset-2" : ""}`}>
                    <StepIcon className="w-4 h-4" />
                  </div>
                  <span className={`text-xs text-center ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {tracking.route.etaMinutes !== null && tracking.status === "in_transit" && (
          <div className="p-4 bg-teal-50 dark:bg-teal-950 rounded-lg border border-teal-200 dark:border-teal-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-teal-800 dark:text-teal-200 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Estimated Arrival
                </p>
                <p className="text-lg font-bold text-teal-900 dark:text-teal-100 mt-1">
                  {tracking.route.etaMinutes} minutes away
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-teal-700 dark:text-teal-300">
                  {tracking.route.distanceRemaining}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Estimated Arrival</p>
            <p className="font-semibold">{tracking.estimatedArrival}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Delivery To</p>
            <p className="font-semibold truncate">{tracking.route.destination.address}</p>
          </div>
        </div>

        {tracking.driver && tracking.status !== "scheduled" && tracking.status !== "delivered" && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Your Driver</p>
              <p className="font-semibold">{tracking.driver.name}</p>
              <p className="text-xs text-muted-foreground">{tracking.driver.vehicleType}</p>
            </div>
            {tracking.driver.phone && (
              <Button variant="outline" size="sm" asChild>
                <a href={`tel:${tracking.driver.phone.replace(/[^0-9+]/g, '')}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call Driver
                </a>
              </Button>
            )}
          </div>
        )}

        {tracking.updates.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-semibold">Recent Updates</p>
            {tracking.updates.slice(0, 3).map((update) => {
              let dotColorClass: string
              if (update.type === "info") {
                dotColorClass = "bg-teal-500"
              } else if (update.type === "success") {
                dotColorClass = "bg-green-500"
              } else {
                dotColorClass = "bg-muted-foreground"
              }
              return (
              <div key={`${update.timestamp}-${update.message}`} className="flex gap-3 text-sm">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${dotColorClass}`} />
                <div>
                  <p className="text-muted-foreground">{update.message}</p>
                  <p className="text-xs text-muted-foreground/70">
                    {new Date(update.timestamp).toLocaleString("en-CA", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              )
            })}
          </div>
        )}

        <div className="flex gap-3">
          {tracking.currentLocation && (
            <Button variant="outline" className="flex-1" asChild>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${tracking.route.destination.lat},${tracking.route.destination.lng}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Open in Maps
              </a>
            </Button>
          )}
          <Button variant="outline" className="flex-1" asChild>
            <a href="/contact">
              <Phone className="w-4 h-4 mr-2" />
              Contact Support
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
