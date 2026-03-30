"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, MapPin, Clock, CheckCircle, Calculator, Info } from "lucide-react"

// Planet Motors shipping location: L4C 1G7, Richmond Hill, Ontario
const ORIGIN_POSTAL_CODE = "L4C1G7"

// Delivery pricing tiers based on distance from Richmond Hill, ON (L4C 1G7)
// Updated transportation rules:
// 0-300 km: FREE
// 301-499 km: $0.70/km
// 500-999 km: $0.75/km
// 1000-2000 km: $0.80/km
// 2001-5000 km: $0.65/km (bulk rate for long distance)
const DELIVERY_TIERS = [
  { minKm: 0, maxKm: 300, cost: 0, label: "FREE" },
  { minKm: 301, maxKm: 499, costPerKm: 0.70, label: "$0.70/km" },
  { minKm: 500, maxKm: 999, costPerKm: 0.75, label: "$0.75/km" },
  { minKm: 1000, maxKm: 2000, costPerKm: 0.80, label: "$0.80/km" },
  { minKm: 2001, maxKm: 5000, costPerKm: 0.65, label: "$0.65/km" }
]

// Sample city distances from Richmond Hill (for demo purposes)
const CITY_DISTANCES: { [key: string]: { km: number; city: string; province: string } } = {
  "M5V": { km: 25, city: "Toronto", province: "ON" },
  "K1A": { km: 450, city: "Ottawa", province: "ON" },
  "H3A": { km: 540, city: "Montreal", province: "QC" },
  "V6B": { km: 4400, city: "Vancouver", province: "BC" },
  "T2P": { km: 3400, city: "Calgary", province: "AB" },
  "T5J": { km: 3100, city: "Edmonton", province: "AB" },
  "R3C": { km: 2100, city: "Winnipeg", province: "MB" },
  "S4P": { km: 2500, city: "Regina", province: "SK" },
  "B3J": { km: 1800, city: "Halifax", province: "NS" },
  "E1C": { km: 1400, city: "Moncton", province: "NB" },
  "A1C": { km: 2200, city: "St. John's", province: "NL" },
  "L4C": { km: 0, city: "Richmond Hill", province: "ON" }
}

export default function DeliveryPage() {
  const [postalCode, setPostalCode] = useState("")
  const [deliveryEstimate, setDeliveryEstimate] = useState<{
    distance: number
    cost: number
    city: string
    province: string
    deliveryDays: string
  } | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)

  const calculateDelivery = () => {
    setIsCalculating(true)
    
    setTimeout(() => {
      // Extract FSA (first 3 characters) for lookup
      const fsa = postalCode.replace(/\s/g, "").substring(0, 3).toUpperCase()
      
      // Find matching city or estimate distance
      let distance = 500 // Default distance
      let city = "Your Area"
      let province = ""
      
      if (CITY_DISTANCES[fsa]) {
        distance = CITY_DISTANCES[fsa].km
        city = CITY_DISTANCES[fsa].city
        province = CITY_DISTANCES[fsa].province
      } else {
        // Estimate based on first letter (province indicator)
        const firstLetter = fsa[0]
        const provinceDistances: { [key: string]: number } = {
          "A": 2200, // NL
          "B": 1800, // NS
          "C": 1900, // PE
          "E": 1400, // NB
          "G": 600,  // QC (Eastern)
          "H": 540,  // QC (Montreal)
          "J": 500,  // QC (Western)
          "K": 400,  // ON (Eastern)
          "L": 50,   // ON (Central)
          "M": 30,   // ON (Toronto)
          "N": 150,  // ON (Southwestern)
          "P": 400,  // ON (Northern)
          "R": 2100, // MB
          "S": 2500, // SK
          "T": 3300, // AB
          "V": 4400, // BC
          "X": 4000, // NT/NU
          "Y": 4500  // YT
        }
        distance = provinceDistances[firstLetter] || 1000
      }

      // Calculate cost based on tier
      let cost = 0
      for (const tier of DELIVERY_TIERS) {
        if (distance >= tier.minKm && distance <= tier.maxKm) {
          if (tier.cost !== undefined) {
            cost = tier.cost
          } else if (tier.costPerKm) {
            // Cost is calculated on the distance beyond the free zone
            cost = Math.round(distance * tier.costPerKm)
          }
          break
        }
      }
      // If distance exceeds 5000km, use the highest tier rate
      if (distance > 5000) {
        cost = Math.round(distance * 0.65)
      }

      // Estimate delivery days
      let deliveryDays = "2-3 business days"
      if (distance <= 300) deliveryDays = "1-2 business days"
      else if (distance <= 1000) deliveryDays = "3-5 business days"
      else if (distance <= 2500) deliveryDays = "5-7 business days"
      else deliveryDays = "7-10 business days"

      setDeliveryEstimate({ distance, cost, city, province, deliveryDays })
      setIsCalculating(false)
    }, 1500)
  }

  const formatPostalCode = (value: string) => {
    const cleaned = value.replace(/\s/g, "").toUpperCase()
    if (cleaned.length <= 3) return cleaned
    return cleaned.substring(0, 3) + " " + cleaned.substring(3, 6)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground">Nationwide Delivery</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Nationwide Delivery
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              We deliver anywhere in Canada. Enter your postal code to calculate your delivery cost.
            </p>
          </div>
        </section>

        {/* Calculator Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Delivery Cost Calculator
                  </CardTitle>
                  <CardDescription>
                    Enter your postal code to see delivery cost and estimated arrival time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <Input
                        placeholder="Enter Postal Code (e.g., M5V 1K4)"
                        value={postalCode}
                        onChange={(e) => setPostalCode(formatPostalCode(e.target.value))}
                        maxLength={7}
                        className="text-lg uppercase"
                      />
                    </div>
                    <Button 
                      onClick={calculateDelivery}
                      disabled={postalCode.replace(/\s/g, "").length < 3 || isCalculating}
                      size="lg"
                    >
                      {isCalculating ? "Calculating..." : "Calculate"}
                    </Button>
                  </div>

                  {/* Origin Info */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <MapPin className="h-4 w-4" />
                    <span>Shipping from: <strong>30 Major Mackenzie Dr E, Richmond Hill, ON L4C 1G7</strong></span>
                  </div>

                  {/* Result */}
                  {deliveryEstimate && (
                    <div className="border rounded-lg p-6 bg-gradient-to-br from-primary/5 to-accent/5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Delivering to</p>
                          <p className="text-xl font-semibold">
                            {deliveryEstimate.city}{deliveryEstimate.province && `, ${deliveryEstimate.province}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Distance</p>
                          <p className="text-xl font-semibold">{deliveryEstimate.distance.toLocaleString()} km</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                        <div className="bg-background p-4 rounded-lg text-center">
                          <Truck className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">Delivery Cost</p>
                          <p className="text-2xl font-bold text-primary">
                            {deliveryEstimate.cost === 0 ? (
                              <span className="text-green-600">FREE</span>
                            ) : (
                              `$${deliveryEstimate.cost.toLocaleString()}`
                            )}
                          </p>
                        </div>
                        <div className="bg-background p-4 rounded-lg text-center">
                          <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                          <p className="text-sm text-muted-foreground">Estimated Arrival</p>
                          <p className="text-2xl font-bold">{deliveryEstimate.deliveryDays}</p>
                        </div>
                      </div>

                      {deliveryEstimate.cost === 0 && (
                        <div className="mt-4 flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-medium">You qualify for FREE delivery!</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Pricing Tiers */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Delivery Pricing</h2>
            <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
              Transparent pricing based on distance from our Richmond Hill, Ontario location
            </p>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { range: "0 - 300 km", price: "FREE", examples: "Toronto, Hamilton, Barrie, Oshawa", highlight: true },
                  { range: "301 - 499 km", price: "$0.70/km", examples: "Ottawa, Kingston, London, Sudbury" },
                  { range: "500 - 999 km", price: "$0.75/km", examples: "Montreal, Quebec City, Thunder Bay" },
                  { range: "1,000 - 2,000 km", price: "$0.80/km", examples: "Halifax, Winnipeg, Moncton" },
                  { range: "2,001 - 5,000 km", price: "$0.65/km", examples: "Calgary, Edmonton, Regina, Vancouver" }
                ].map((tier, i) => (
                  <Card key={i} className={tier.highlight ? "border-green-500 bg-green-50" : ""}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-muted-foreground">{tier.range}</span>
                        <Badge variant={tier.highlight ? "default" : "secondary"} className={tier.highlight ? "bg-green-600" : ""}>
                          {tier.price}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{tier.examples}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <p className="text-center text-sm text-muted-foreground mt-6">
                Long-distance deliveries (2,001+ km) qualify for our reduced bulk rate of $0.65/km
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Truck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Enclosed Transport</h3>
                <p className="text-muted-foreground text-sm">
                  All vehicles are transported in enclosed carriers for maximum protection.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Fully Insured</h3>
                <p className="text-muted-foreground text-sm">
                  Complete insurance coverage during transport for your peace of mind.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                  <Clock className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Scheduled Delivery</h3>
                <p className="text-muted-foreground text-sm">
                  Choose a delivery time that works for you. Evening and weekend options available.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
