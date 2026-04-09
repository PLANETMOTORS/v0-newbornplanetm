"use client"

import { useEffect, useState, use } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  MapPin, Phone, Clock, Truck, CheckCircle, Circle,
  ArrowLeft, RefreshCw, Navigation, User
} from "lucide-react"

interface DeliveryData {
  orderId: string
  vehicleName: string
  status: "preparing" | "in-transit" | "nearby" | "delivered"
  estimatedArrival: string
  driver: {
    name: string
    phone: string
    photo: string
  }
  currentLocation: {
    lat: number
    lng: number
    address: string
  }
  destination: {
    lat: number
    lng: number
    address: string
  }
  timeline: Array<{
    status: string
    timestamp: string
    description: string
  }>
  distanceRemaining?: string
  etaMinutes?: number
}

export default function DeliveryTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const fetchDelivery = async () => {
    try {
      const response = await fetch(`/api/delivery?orderId=${id}`)
      const data = await response.json()
      if (data.success) {
        setDelivery(data.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error("Failed to fetch delivery:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDelivery()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchDelivery, 30000)
    return () => clearInterval(interval)
  }, [id])

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing": return "bg-yellow-500"
      case "in-transit": return "bg-blue-500"
      case "nearby": return "bg-orange-500"
      case "delivered": return "bg-green-500"
      default: return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "preparing": return "Preparing for Delivery"
      case "in-transit": return "In Transit"
      case "nearby": return "Almost There!"
      case "delivered": return "Delivered"
      default: return status
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-64 mx-auto mb-4" />
            <div className="h-4 bg-muted rounded w-48 mx-auto" />
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!delivery) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Delivery Not Found</h1>
          <p className="text-muted-foreground mb-6">
            We couldn&apos;t find a delivery with order ID: {id}
          </p>
          <Button asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </main>
        <Footer />
      </div>
    )
  }

  const eta = new Date(delivery.estimatedArrival)
  const timeUntilArrival = Math.max(0, Math.round((eta.getTime() - Date.now()) / 1000 / 60))

  return (
    <div className="min-h-screen bg-muted/30">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back button */}
        <Button variant="ghost" asChild className="mb-4">
          <Link href="/" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Badge className={`${getStatusColor(delivery.status)} text-white`}>
              {getStatusLabel(delivery.status)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Order: {delivery.orderId}
            </span>
          </div>
          <h1 className="text-2xl font-bold">{delivery.vehicleName}</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main tracking area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Live GPS Map */}
            <Card>
              <CardContent className="p-0">
                <div className="relative aspect-[16/9] bg-muted rounded-lg overflow-hidden">
                  <iframe
                    src={`https://www.google.com/maps/embed/v1/directions?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || ''}&origin=${delivery.currentLocation.lat},${delivery.currentLocation.lng}&destination=${delivery.destination.lat},${delivery.destination.lng}&mode=driving`}
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Live Vehicle Tracking - Google Maps"
                    className="absolute inset-0"
                  />
                  {/* ETA overlay */}
                  <div className="absolute top-4 right-4 bg-background rounded-lg shadow-lg p-3 z-10">
                    <p className="text-xs text-muted-foreground">Estimated Arrival</p>
                    <p className="text-xl font-bold text-primary">
                      {timeUntilArrival} min
                    </p>
                  </div>
                  {/* Current location */}
                  <div className="absolute bottom-4 left-4 bg-background rounded-lg shadow-lg p-3 z-10">
                    <p className="text-xs text-muted-foreground">Current Location</p>
                    <p className="text-sm font-medium">{delivery.currentLocation.address}</p>
                  </div>
                  {/* Google Maps link */}
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${delivery.currentLocation.lat},${delivery.currentLocation.lng}&destination=${delivery.destination.lat},${delivery.destination.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm font-medium shadow-lg z-10 hover:bg-primary/90 flex items-center gap-2"
                  >
                    <Navigation className="w-4 h-4" />
                    Open in Maps
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Delivery Timeline
                  <Button variant="ghost" size="sm" onClick={fetchDelivery} className="gap-1">
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {delivery.timeline.map((event, index) => {
                    const isCompleted = index < delivery.timeline.length
                    const isLast = index === delivery.timeline.length - 1
                    return (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                          {!isLast && (
                            <div className="w-0.5 h-full bg-muted my-1" />
                          )}
                        </div>
                        <div className="pb-4">
                          <p className="font-medium">{event.status}</p>
                          <p className="text-sm text-muted-foreground">
                            {event.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(event.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}

                  {/* Pending delivery step */}
                  {delivery.status !== "delivered" && (
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <Circle className="w-5 h-5 text-muted-foreground animate-pulse" />
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Delivery Complete</p>
                        <p className="text-sm text-muted-foreground">
                          Estimated: {eta.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Driver info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Driver</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted">
                    <Image
                      src={delivery.driver.photo}
                      alt={delivery.driver.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-medium">{delivery.driver.name}</p>
                    <p className="text-sm text-muted-foreground">Planet Motors Driver</p>
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2" asChild>
                  <a href={`tel:${delivery.driver.phone}`}>
                    <Phone className="w-4 h-4" />
                    Call Driver
                  </a>
                </Button>
              </CardContent>
            </Card>

            {/* Delivery details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Truck className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Current Location</p>
                    <p className="text-sm text-muted-foreground">
                      {delivery.currentLocation.address}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">Destination</p>
                    <p className="text-sm text-muted-foreground">
                      {delivery.destination.address}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">ETA</p>
                    <p className="text-sm text-muted-foreground">
                      {eta.toLocaleTimeString()} ({timeUntilArrival} minutes)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last updated */}
            <p className="text-xs text-center text-muted-foreground">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>

            {/* Support */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 text-center">
                <p className="text-sm font-medium mb-2">Need Help?</p>
                <Button variant="outline" size="sm" asChild>
                  <a href="tel:416-985-2277">Call Support: 416-985-2277</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
