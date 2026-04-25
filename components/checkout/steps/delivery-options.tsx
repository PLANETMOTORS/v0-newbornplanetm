"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, Truck, Loader2, Calendar } from "lucide-react"
import { DEALERSHIP_LOCATION } from "@/lib/constants/dealership"

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

function getEstimatedDate(baseDate: Date, daysFromNow: number): string {
  const d = new Date(baseDate)
  d.setDate(d.getDate() + daysFromNow)
  return d.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })
}

export function DeliveryOptionsStep({ data, postalCode, onChange, onContinue }: Readonly<DeliveryOptionsStepProps>) {
  const [isCalculating, setIsCalculating] = useState(false)
  const [baseDate, setBaseDate] = useState<Date | null>(null)
  const dataRef = useRef(data)
  dataRef.current = data

  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  // Set base date after client mount to avoid hydration mismatch
  useEffect(() => {
    setBaseDate(new Date())
  }, [])

  const pickupDate = useMemo(() => baseDate ? getEstimatedDate(baseDate, 1) : "", [baseDate])
  const deliveryDate = useMemo(() => baseDate ? getEstimatedDate(baseDate, data.deliveryDistance > 200 ? 5 : 3) : "", [baseDate, data.deliveryDistance])

  useEffect(() => {
    if (!postalCode || postalCode.replaceAll(/\s/g, '').length < 6) return

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
        <h1 className="text-2xl font-bold tracking-[-0.01em] mb-1">Choose pickup or delivery</h1>
        <p className="text-muted-foreground">
          Choose between picking it up at our dealership or having it delivered to your door.
        </p>
      </div>

      <div className="grid gap-4">
        <Card
          className={`cursor-pointer transition-colors relative ${
            data.deliveryType === "pickup" ? "border-blue-600 bg-blue-50" : "hover:border-blue-300"
          }`}
          onClick={() => onChange({ ...data, deliveryType: "pickup" })}
        >
          <div className="absolute -top-3 left-4">
            <Badge className="bg-green-700 text-white text-xs px-2.5 py-0.5 shadow-sm">
              Soonest option
            </Badge>
          </div>
          <CardContent className="p-6 pt-7">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <MapPin className="w-7 h-7 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Pick it up</h3>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    {pickupDate ? `Pickup as soon as ${pickupDate}` : "Pickup available soon"}
                  </p>
                </div>
              </div>
              <span className="text-lg font-bold text-green-600 whitespace-nowrap">+$0</span>
            </div>
            <div className="ml-[4.5rem] mt-2">
              <p className="text-sm font-semibold">Planet Motors</p>
              <p className="text-sm text-muted-foreground">
                {DEALERSHIP_LOCATION.streetAddress}, {DEALERSHIP_LOCATION.city}, {DEALERSHIP_LOCATION.province} {DEALERSHIP_LOCATION.postalCode}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${
            data.deliveryType === "delivery" ? "border-blue-600 bg-blue-50" : "hover:border-blue-300"
          }`}
          onClick={() => onChange({ ...data, deliveryType: "delivery" })}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Truck className="w-7 h-7 text-blue-600" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Have it delivered</h3>
                  {!isCalculating && data.deliveryCost != null && deliveryDate ? (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                      <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                      Delivery as soon as {deliveryDate}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Delivery available
                    </p>
                  )}
                </div>
              </div>
              {isCalculating || data.deliveryCost == null ? (
                <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                  <span className="sr-only">Calculating delivery quote</span>
                </span>
              ) : (
                <span className={`text-lg font-bold whitespace-nowrap ${
                  data.deliveryCost === 0 ? "text-green-600" : ""
                }`}>
                  {data.deliveryCost === 0 ? "+$0" : `+$${data.deliveryCost.toLocaleString()}`}
                </span>
              )}
            </div>
            <div className="ml-[4.5rem] mt-2">
              <p className="text-sm font-semibold">Hassle-free home delivery</p>
              <p className="text-sm text-muted-foreground">
                We&apos;ll bring your vehicle right to your doorstep.
                {data.deliveryDistance > 0 && ` (${data.deliveryDistance} km from dealership)`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        *Delivery dates are estimates and may vary. Home delivery fee is based on distance.
      </p>

      <Button onClick={onContinue} className="w-full h-12 text-base font-semibold">
        Continue
      </Button>
    </div>
  )
}