"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { 
  ChevronLeft, ChevronRight, Heart, Share2, MapPin, Fuel, Gauge, 
  Calendar, Settings, Shield, CheckCircle, Calculator, Car, 
  FileText, History, Zap, RotateCcw, DollarSign, CreditCard,
  Phone, MessageCircle
} from "lucide-react"

// Mock vehicle data
const vehicleData = {
  id: "2024-tesla-model-3",
  year: 2024,
  make: "Tesla",
  model: "Model 3",
  trim: "Long Range AWD",
  price: 52990,
  mileage: 12500,
  exteriorColor: "Pearl White Multi-Coat",
  interiorColor: "Black Premium",
  fuelType: "Electric",
  transmission: "Single-Speed Automatic",
  drivetrain: "All-Wheel Drive",
  engine: "Dual Motor Electric",
  vin: "5YJ3E1EA1PF123456",
  stockNumber: "PM24-1234",
  range: "576 km",
  batteryHealth: 98,
  images: [
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=800&h=600&fit=crop"
  ],
  features: [
    "Autopilot", "Premium Audio", "Heated Seats", "Navigation",
    "Wireless Charging", "Premium Connectivity", "Glass Roof",
    "Power Liftgate", "LED Headlights", "19\" Sport Wheels"
  ],
  inspectionScore: 210,
  inspectionItems: [
    { category: "Exterior", passed: 45, total: 45 },
    { category: "Interior", passed: 38, total: 38 },
    { category: "Mechanical", passed: 52, total: 52 },
    { category: "Electrical", passed: 35, total: 35 },
    { category: "Safety", passed: 25, total: 25 },
    { category: "Road Test", passed: 15, total: 15 }
  ],
  history: {
    owners: 1,
    accidents: 0,
    serviceRecords: 8,
    lastServiced: "2024-02-15"
  }
}

export default function VehicleDetailPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [downPayment, setDownPayment] = useState(5000)
  const [loanTerm, setLoanTerm] = useState(60)
  const [tradeInValue, setTradeInValue] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % vehicleData.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + vehicleData.images.length) % vehicleData.images.length)
  }

  // Calculate monthly payment
  const loanAmount = vehicleData.price - downPayment - tradeInValue
  const monthlyRate = 0.0479 / 12 // 4.79% APR
  const monthlyPayment = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, loanTerm)) /
    (Math.pow(1 + monthlyRate, loanTerm) - 1)
  )

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pb-20">
        {/* Breadcrumb */}
        <div className="bg-muted/30 py-3">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/inventory" className="text-muted-foreground hover:text-foreground">
                Inventory
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">
                {vehicleData.year} {vehicleData.make} {vehicleData.model}
              </span>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                <Image
                  src={vehicleData.images[currentImageIndex]}
                  alt={`${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`}
                  fill
                  className="object-cover"
                />
                
                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* 360 View Badge */}
                <Badge className="absolute top-4 left-4 bg-primary">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  360° View Available
                </Badge>

                {/* Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isFavorite ? "bg-red-500 text-white" : "bg-background/80 hover:bg-background"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button className="w-10 h-10 bg-background/80 rounded-full flex items-center justify-center hover:bg-background transition-colors">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Image Counter */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-background/80 px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {vehicleData.images.length}
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {vehicleData.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`relative w-24 h-18 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      i === currentImageIndex ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>

              {/* Vehicle Title */}
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {vehicleData.year} {vehicleData.make} {vehicleData.model} {vehicleData.trim}
                </h1>
                <div className="flex flex-wrap gap-4 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Gauge className="h-4 w-4" />
                    {vehicleData.mileage.toLocaleString()} km
                  </span>
                  <span className="flex items-center gap-1">
                    <Fuel className="h-4 w-4" />
                    {vehicleData.fuelType}
                  </span>
                  <span className="flex items-center gap-1">
                    <Settings className="h-4 w-4" />
                    {vehicleData.transmission}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    Richmond Hill, ON
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                  <TabsTrigger value="inspection">Inspection</TabsTrigger>
                  <TabsTrigger value="history">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Exterior", value: vehicleData.exteriorColor },
                      { label: "Interior", value: vehicleData.interiorColor },
                      { label: "Drivetrain", value: vehicleData.drivetrain },
                      { label: "Engine", value: vehicleData.engine },
                      { label: "Range", value: vehicleData.range },
                      { label: "VIN", value: vehicleData.vin }
                    ].map((spec, i) => (
                      <div key={i} className="bg-muted/30 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground">{spec.label}</p>
                        <p className="font-medium text-sm">{spec.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* EV Battery Health */}
                  {vehicleData.fuelType === "Electric" && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className="h-5 w-5 text-green-500" />
                          EV Battery Health Certification
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="text-4xl font-bold text-green-500">{vehicleData.batteryHealth}%</div>
                          <div>
                            <p className="font-medium">Excellent Condition</p>
                            <p className="text-sm text-muted-foreground">
                              Independent battery health verification by certified technicians
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="features" className="pt-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {vehicleData.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 bg-muted/30 p-3 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="inspection" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          210-Point Inspection
                        </span>
                        <Badge className="bg-green-500 text-lg px-4">
                          {vehicleData.inspectionScore}/210 Passed
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {vehicleData.inspectionItems.map((item, i) => (
                          <div key={i} className="text-center p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">{item.category}</p>
                            <p className="text-xl font-bold text-green-600">
                              {item.passed}/{item.total}
                            </p>
                          </div>
                        ))}
                      </div>
                      <Button variant="outline" className="w-full mt-4">
                        <FileText className="h-4 w-4 mr-2" />
                        View Full Inspection Report
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="pt-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Vehicle History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold">{vehicleData.history.owners}</p>
                          <p className="text-sm text-muted-foreground">Previous Owners</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{vehicleData.history.accidents}</p>
                          <p className="text-sm text-muted-foreground">Accidents Reported</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold">{vehicleData.history.serviceRecords}</p>
                          <p className="text-sm text-muted-foreground">Service Records</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-lg">
                          <p className="text-2xl font-bold">Clean</p>
                          <p className="text-sm text-muted-foreground">Title Status</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full mt-4">
                        View CARFAX Report
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Right Column - Pricing & Actions */}
            <div className="space-y-6">
              {/* Price Card */}
              <Card className="sticky top-4">
                <CardContent className="p-6">
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground">Price</p>
                    <p className="text-4xl font-bold">${vehicleData.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">+ taxes & fees</p>
                  </div>

                  {/* Payment Calculator */}
                  <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Est. Monthly Payment
                      </span>
                      <span className="text-2xl font-bold">${monthlyPayment}/mo</span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Down Payment</span>
                        <span>${downPayment.toLocaleString()}</span>
                      </div>
                      <Slider
                        value={[downPayment]}
                        onValueChange={([v]) => setDownPayment(v)}
                        max={vehicleData.price * 0.5}
                        step={500}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Loan Term</span>
                        <span>{loanTerm} months</span>
                      </div>
                      <Slider
                        value={[loanTerm]}
                        onValueChange={([v]) => setLoanTerm(v)}
                        min={24}
                        max={84}
                        step={12}
                      />
                    </div>

                    <p className="text-xs text-muted-foreground">
                      *Estimated at 4.79% APR. Actual rate may vary based on credit.
                    </p>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Button className="w-full" size="lg">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Reserve for $250
                    </Button>
                    <Button variant="outline" className="w-full" size="lg">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Get Pre-Approved
                    </Button>
                    <Link href="/trade-in">
                      <Button variant="secondary" className="w-full" size="lg">
                        <Car className="h-4 w-4 mr-2" />
                        Value Your Trade-In
                      </Button>
                    </Link>
                  </div>

                  {/* Contact */}
                  <div className="mt-6 pt-6 border-t flex gap-3">
                    <Button variant="outline" className="flex-1" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      Call
                    </Button>
                    <Button variant="outline" className="flex-1" size="sm">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-3 text-xs text-center">
                    <div className="p-2 bg-muted/30 rounded">
                      <Shield className="h-4 w-4 mx-auto mb-1 text-primary" />
                      <span>10-Day Returns</span>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <CheckCircle className="h-4 w-4 mx-auto mb-1 text-green-500" />
                      <span>210-Point Inspected</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Planet Motors</p>
                      <p className="text-sm text-muted-foreground">
                        30 Major Mackenzie Dr E<br />
                        Richmond Hill, ON L4C 1G7
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Similar Vehicles */}
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Similar Vehicles</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="relative aspect-[4/3]">
                    <Image
                      src={`https://images.unsplash.com/photo-156095808${i}-b8a1929cea89?w=400&h=300&fit=crop`}
                      alt="Similar vehicle"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">2023 Tesla Model Y Long Range</h3>
                    <p className="text-sm text-muted-foreground">25,000 km | Electric | AWD</p>
                    <p className="text-xl font-bold mt-2">${(48990 + i * 1000).toLocaleString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  )
}
