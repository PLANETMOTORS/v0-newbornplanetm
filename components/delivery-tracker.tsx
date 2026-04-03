"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Truck, MapPin, Clock, Phone, CheckCircle, Package, Navigation } from "lucide-react"

interface DeliveryStatus {
  id: string
  status: "scheduled" | "preparing" | "in_transit" | "arriving_soon" | "delivered"
  vehicle: {
    year: number
    make: string
    model: string
    image: string
  }
  scheduledDate: string
  estimatedArrival: string
  driverName?: string
  driverPhone?: string
  currentLocation?: string
  deliveryAddress: string
}

const statusSteps = [
  { key: "scheduled", label: "Scheduled", icon: Clock },
  { key: "preparing", label: "Preparing", icon: Package },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "arriving_soon", label: "Arriving Soon", icon: Navigation },
  { key: "delivered", label: "Delivered", icon: CheckCircle },
]

export function DeliveryTracker({ deliveryId }: { deliveryId: string }) {
  const [delivery, setDelivery] = useState<DeliveryStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching delivery status
    const fetchDelivery = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      setDelivery({
        id: deliveryId,
        status: "in_transit",
        vehicle: {
          year: 2023,
          make: "Tesla",
          model: "Model 3",
          image: "/placeholder.svg"
        },
        scheduledDate: "March 30, 2026",
        estimatedArrival: "2:30 PM - 4:30 PM",
        driverName: "Michael Chen",
        driverPhone: "416-985-2277",
        currentLocation: "Highway 401, Approaching Toronto",
        deliveryAddress: "123 Main Street, Toronto, ON M5V 1A1"
      })
      setIsLoading(false)
    }
    fetchDelivery()
  }, [deliveryId])

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

  if (!delivery) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Delivery not found</p>
        </CardContent>
      </Card>
    )
  }

  const currentStepIndex = statusSteps.findIndex(s => s.key === delivery.status)
  const progress = ((currentStepIndex + 1) / statusSteps.length) * 100

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5" />
              Delivery Tracking
            </CardTitle>
            <CardDescription>
              {delivery.vehicle.year} {delivery.vehicle.make} {delivery.vehicle.model}
            </CardDescription>
          </div>
          <Badge variant={delivery.status === "delivered" ? "default" : "secondary"}>
            {statusSteps.find(s => s.key === delivery.status)?.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vehicle Card */}
        <div className="flex gap-4 p-3 bg-muted rounded-lg">
          <Image
            src={delivery.vehicle.image}
            alt={`${delivery.vehicle.year} ${delivery.vehicle.make} ${delivery.vehicle.model}`}
            width={96}
            height={64}
            className="object-cover rounded"
          />
          <div>
            <p className="font-semibold">
              {delivery.vehicle.year} {delivery.vehicle.make} {delivery.vehicle.model}
            </p>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              Delivering to: {delivery.deliveryAddress}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
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
                  <span className={`text-xs ${isComplete ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Current Status */}
        {delivery.currentLocation && delivery.status === "in_transit" && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <Navigation className="w-4 h-4 animate-pulse" />
              Current Location
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {delivery.currentLocation}
            </p>
          </div>
        )}

        {/* Delivery Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Scheduled Date</p>
            <p className="font-medium">{delivery.scheduledDate}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Estimated Arrival</p>
            <p className="font-medium">{delivery.estimatedArrival}</p>
          </div>
        </div>

        {/* Driver Info */}
        {delivery.driverName && delivery.status !== "scheduled" && delivery.status !== "delivered" && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-muted-foreground">Your Driver</p>
              <p className="font-medium">{delivery.driverName}</p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href={`tel:${delivery.driverPhone}`}>
                <Phone className="w-4 h-4 mr-2" />
                Call Driver
              </a>
            </Button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1">
            View on Map
          </Button>
          <Button variant="outline" className="flex-1">
            <Phone className="w-4 h-4 mr-2" />
            Contact Support
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
