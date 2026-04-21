"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MapPin, Truck, Loader2 } from "lucide-react"

export interface DeliveryData {
  deliveryType: "pickup" | "delivery"
  deliveryCost: number
  deliveryDistance: number
  deliveryMessage: string
}

interface DeliveryOptionsStepProps {
  data: DeliveryData
  postalCode: string
  onChange: (data: DeliveryData) => void
  onContinue: () => void
}

export function DeliveryOptionsStep({ data, postalCode, onChange, onContinue }: DeliveryOptionsStepProps) {
  const [isCalculating, setIsCalculating] = useState(false)
  const dataRef = useRef(data)
  dataRef.current = data

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!postalCode || postalCode.replace(/\s/g, '').length < 6) return

    let cancelled = false
    setIsCalculating(true)

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/deliveries/quote?postalCode=${encodeURIComponent(postalCode)}`)
        if (res.ok && !cancelled) {
          const json = await res.json()
          onChangeRef.current({
            ...dataRef.current,
            deliveryCost: json.deliveryCost ?? 0,
            deliveryDistance: json.distanceKm ?? 0,
            deliveryMessage: json.message ?? "",
          })
        }
      } catch {
        if (!cancelled) {
          onChangeRef.current({ ...dataRef.current, deliveryCost: 0, deliveryDistance: 0, deliveryMessage: "Free delivery" })
        }
      } finally {
        if (!cancelled) setIsCalculating(false)
      }
    }, 400)

    return () => { cancelled = true; clearTimeout(timer) }
  }, [postalCode])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">How do you want to get your car?</h1>
        <p className="text-muted-foreground">
          Choose between picking it up at our dealership or having it delivered to your door.
        </p>
      </div>

      <div className="grid gap-4">
        <Card
          className={`cursor-pointer transition-colors ${
            data.deliveryType === "pickup" ? "border-blue-600 bg-blue-50" : "hover:border-blue-300"
          }`}
          onClick={() => onChange({ ...data, deliveryType: "pickup" })}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <MapPin className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Pick it up</h3>
              <p className="text-sm text-muted-foreground">
                Planet Motors — 30 Major Mackenzie Dr E, Richmond Hill, ON
              </p>
              <p className="text-sm font-medium text-green-600 mt-1">Free</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${
            data.deliveryType === "delivery" ? "border-blue-600 bg-blue-50" : "hover:border-blue-300"
          }`}
          onClick={() => onChange({ ...data, deliveryType: "delivery" })}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Truck className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Have it delivered</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ll bring your vehicle right to your door.
              </p>
              {isCalculating ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Calculating delivery cost…
                </span>
              ) : (
                <p className="text-sm font-medium mt-1">
                  {data.deliveryCost === 0 ? (
                    <span className="text-green-600">Free delivery</span>
                  ) : (
                    <span>${data.deliveryCost.toLocaleString()}</span>
                  )}
                  {data.deliveryDistance > 0 && (
                    <span className="text-muted-foreground ml-1">
                      ({data.deliveryDistance} km)
                    </span>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Button onClick={onContinue} className="w-full h-12 text-base font-semibold">
        Continue
      </Button>
    </div>
  )
}
