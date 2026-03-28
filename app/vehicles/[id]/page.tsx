"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { 
  ChevronLeft, ChevronRight, Heart, Share2, MapPin, Fuel, Gauge, 
  Calendar, Settings, Shield, CheckCircle, Calculator, Car, 
  FileText, History, Zap, RotateCcw, DollarSign, CreditCard,
  Phone, MessageCircle, Star, Clock, TrendingUp, Eye, Users,
  Award, Battery, Thermometer, Lock, Truck, ArrowRight, Play,
  Download, ExternalLink, Check, X, AlertCircle
} from "lucide-react"
import { ScheduleTestDrive } from "@/components/schedule-test-drive"

// Mock vehicle data
const vehicleData = {
  id: "2024-tesla-model-3",
  year: 2024,
  make: "Tesla",
  model: "Model 3",
  trim: "Long Range AWD",
  price: 52990,
  originalPrice: 56990,
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
  batteryCapacity: "82 kWh",
  chargingSpeed: "250 kW DC",
  images: [
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800&h=600&fit=crop"
  ],
  features: [
    "Autopilot", "Premium Audio", "Heated Seats", "Navigation",
    "Wireless Charging", "Premium Connectivity", "Glass Roof",
    "Power Liftgate", "LED Headlights", "19\" Sport Wheels",
    "Heated Steering Wheel", "Sentry Mode", "Dashcam", "Dog Mode"
  ],
  inspectionScore: 210,
  inspectionItems: [
    { category: "Exterior", passed: 45, total: 45, items: ["Paint", "Glass", "Lights", "Body Panels", "Wheels"] },
    { category: "Interior", passed: 38, total: 38, items: ["Seats", "Dashboard", "Controls", "Screens", "Climate"] },
    { category: "Mechanical", passed: 52, total: 52, items: ["Brakes", "Suspension", "Steering", "Motor", "Battery"] },
    { category: "Electrical", passed: 35, total: 35, items: ["Charging", "12V Battery", "Lights", "Sensors", "Autopilot"] },
    { category: "Safety", passed: 25, total: 25, items: ["Airbags", "Seatbelts", "Cameras", "Sensors", "Emergency"] },
    { category: "Road Test", passed: 15, total: 15, items: ["Acceleration", "Braking", "Handling", "Noise", "Range"] }
  ],
  history: {
    owners: 1,
    accidents: 0,
    serviceRecords: 8,
    lastServiced: "2024-02-15"
  },
  similarVehicles: [
    { id: "2024-tesla-model-y", name: "2024 Tesla Model Y", price: 64990, image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400" },
    { id: "2024-bmw-i4", name: "2024 BMW i4", price: 58900, image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400" },
    { id: "2024-polestar-2", name: "2024 Polestar 2", price: 54990, image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400" }
  ]
}

export default function VehicleDetailPage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [downPayment, setDownPayment] = useState(5000)
  const [loanTerm, setLoanTerm] = useState(60)
  const [tradeInValue, setTradeInValue] = useState(0)
  const [viewCount, setViewCount] = useState(47)
  const [showFullGallery, setShowFullGallery] = useState(false)

  // Simulate live viewing count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewCount(prev => prev + Math.floor(Math.random() * 3) - 1)
    }, 8000)
    return () => clearInterval(interval)
  }, [])

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

  const savings = vehicleData.originalPrice - vehicleData.price

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pb-20">
        {/* Breadcrumb */}
        <div className="bg-muted/30 py-3 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Link href="/inventory" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <ChevronLeft className="w-4 h-4" />
                  Back to Inventory
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium">
                  {vehicleData.year} {vehicleData.make} {vehicleData.model}
                </span>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {viewCount} viewing now
                </span>
                <span className="flex items-center gap-1 text-green-600">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  Available
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Images & Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-muted group">
                <Image
                  src={vehicleData.images[currentImageIndex]}
                  alt={`${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`}
                  fill
                  className="object-cover"
                  priority
                />
                
                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-all opacity-0 group-hover:opacity-100"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Top Left Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  <Badge className="bg-green-500 text-white shadow-lg">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    210/210 Inspected
                  </Badge>
                  <Badge className="bg-primary shadow-lg">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    360° View Available
                  </Badge>
                  {savings > 0 && (
                    <Badge className="bg-red-500 text-white shadow-lg">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Save ${savings.toLocaleString()}
                    </Badge>
                  )}
                </div>

                {/* Top Right Actions */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => setIsFavorite(!isFavorite)}
                    className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg ${
                      isFavorite ? "bg-red-500 text-white" : "bg-background/90 backdrop-blur-sm hover:bg-background"
                    }`}
                  >
                    <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
                  </button>
                  <button className="w-11 h-11 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-background transition-all shadow-lg">
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>

                {/* Bottom Controls */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <button className="flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full hover:bg-background transition-all">
                    <Play className="w-4 h-4" />
                    <span className="text-sm font-medium">Play 360° View</span>
                  </button>
                  <div className="flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-sm rounded-full">
                    <span className="text-sm">{currentImageIndex + 1} / {vehicleData.images.length}</span>
                  </div>
                </div>
              </div>

              {/* Thumbnail Strip */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {vehicleData.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      i === currentImageIndex ? "border-primary ring-2 ring-primary ring-offset-2" : "border-transparent opacity-70 hover:opacity-100"
                    }`}
                  >
                    <Image src={img} alt="" fill className="object-cover" />
                  </button>
                ))}
              </div>

              {/* Vehicle Title */}
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {vehicleData.year} {vehicleData.make} {vehicleData.model}
                  </h1>
                  <p className="text-lg text-muted-foreground mt-1">{vehicleData.trim}</p>
                  <div className="flex flex-wrap gap-4 mt-3 text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Gauge className="h-4 w-4" />
                      {vehicleData.mileage.toLocaleString()} km
                    </span>
                    <span className="flex items-center gap-1">
                      <Fuel className="h-4 w-4" />
                      {vehicleData.fuelType}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-4 w-4 text-green-500" />
                      {vehicleData.range} range
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      Richmond Hill, ON
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">4.9 (124 reviews)</span>
                </div>
              </div>

              {/* EV Battery Card - Prominent for Electric */}
              {vehicleData.fuelType === "Electric" && (
                <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Battery className="h-5 w-5 text-green-600" />
                      EV Battery Health Certification
                      <Badge className="ml-auto bg-green-600">Exclusive Feature</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 bg-background rounded-xl">
                        <div className="text-4xl font-bold text-green-600">{vehicleData.batteryHealth}%</div>
                        <p className="text-sm text-muted-foreground mt-1">State of Health</p>
                      </div>
                      <div className="text-center p-4 bg-background rounded-xl">
                        <div className="text-2xl font-bold">{vehicleData.batteryCapacity}</div>
                        <p className="text-sm text-muted-foreground mt-1">Battery Capacity</p>
                      </div>
                      <div className="text-center p-4 bg-background rounded-xl">
                        <div className="text-2xl font-bold">{vehicleData.range}</div>
                        <p className="text-sm text-muted-foreground mt-1">Est. Range</p>
                      </div>
                      <div className="text-center p-4 bg-background rounded-xl">
                        <div className="text-2xl font-bold">{vehicleData.chargingSpeed}</div>
                        <p className="text-sm text-muted-foreground mt-1">Max Charge Speed</p>
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-background rounded-lg flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                      <p className="text-sm">
                        <span className="font-medium">Verified by certified EV technicians.</span>{" "}
                        Battery health tested using manufacturer diagnostic tools - a feature Clutch and Carvana don&apos;t offer.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Tabs */}
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4 h-12">
                  <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="features" className="text-sm">Features</TabsTrigger>
                  <TabsTrigger value="inspection" className="text-sm">Inspection</TabsTrigger>
                  <TabsTrigger value="history" className="text-sm">History</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6 pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      { label: "Exterior", value: vehicleData.exteriorColor, icon: Car },
                      { label: "Interior", value: vehicleData.interiorColor, icon: Car },
                      { label: "Drivetrain", value: vehicleData.drivetrain, icon: Settings },
                      { label: "Engine", value: vehicleData.engine, icon: Zap },
                      { label: "Transmission", value: vehicleData.transmission, icon: Settings },
                      { label: "VIN", value: vehicleData.vin, icon: FileText }
                    ].map((spec, i) => (
                      <div key={i} className="bg-muted/30 p-4 rounded-xl border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <spec.icon className="w-4 h-4 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">{spec.label}</p>
                        </div>
                        <p className="font-medium">{spec.value}</p>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="features" className="pt-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {vehicleData.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3 bg-muted/30 p-3 rounded-lg border border-border">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="inspection" className="pt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          210-Point Inspection Report
                        </span>
                        <Badge className="bg-green-500 text-lg px-4 py-1">
                          {vehicleData.inspectionScore}/210 Passed
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        60 more inspection points than Clutch or Carvana. Full transparency on every vehicle.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {vehicleData.inspectionItems.map((item, i) => (
                          <div key={i} className="text-center p-4 bg-muted/30 rounded-xl border border-border">
                            <p className="text-sm text-muted-foreground mb-1">{item.category}</p>
                            <p className="text-2xl font-bold text-green-600">
                              {item.passed}/{item.total}
                            </p>
                            <div className="w-full bg-muted rounded-full h-2 mt-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${(item.passed / item.total) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" className="flex-1">
                          <FileText className="h-4 w-4 mr-2" />
                          View Full Report
                        </Button>
                        <Button variant="outline" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="history" className="pt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Vehicle History Report
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-muted/30 rounded-xl border border-border">
                          <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-2xl font-bold">{vehicleData.history.owners}</p>
                          <p className="text-sm text-muted-foreground">Previous Owner</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                          <CheckCircle className="w-6 h-6 mx-auto mb-2 text-green-600" />
                          <p className="text-2xl font-bold text-green-600">{vehicleData.history.accidents}</p>
                          <p className="text-sm text-muted-foreground">Accidents</p>
                        </div>
                        <div className="text-center p-4 bg-muted/30 rounded-xl border border-border">
                          <FileText className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-2xl font-bold">{vehicleData.history.serviceRecords}</p>
                          <p className="text-sm text-muted-foreground">Service Records</p>
                        </div>
                        <div className="text-center p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
                          <Shield className="w-6 h-6 mx-auto mb-2 text-green-600" />
                          <p className="text-2xl font-bold text-green-600">Clean</p>
                          <p className="text-sm text-muted-foreground">Title Status</p>
                        </div>
                      </div>
                      <Button variant="outline" className="w-full" asChild>
                        <Link href="#">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Full CARFAX Report
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Similar Vehicles */}
              <div className="pt-8">
                <h2 className="text-xl font-semibold mb-4">Similar Vehicles</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {vehicleData.similarVehicles.map((vehicle) => (
                    <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative aspect-[16/10]">
                          <Image src={vehicle.image} alt={vehicle.name} fill className="object-cover" />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold">{vehicle.name}</h3>
                          <p className="text-lg font-bold text-primary">${vehicle.price.toLocaleString()}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Pricing & Actions */}
            <div className="space-y-6">
              {/* Price Card */}
              <Card className="sticky top-24 shadow-xl border-2">
                <CardContent className="p-6">
                  {/* Urgency Banner */}
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-700 dark:text-amber-400">
                      <span className="font-semibold">{viewCount} people</span> viewing this vehicle
                    </span>
                  </div>

                  {/* Price */}
                  <div className="mb-6">
                    {savings > 0 && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg text-muted-foreground line-through">
                          ${vehicleData.originalPrice.toLocaleString()}
                        </span>
                        <Badge className="bg-red-500">Save ${savings.toLocaleString()}</Badge>
                      </div>
                    )}
                    <p className="text-4xl font-bold">${vehicleData.price.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">+ taxes & licensing fees</p>
                  </div>

                  {/* Payment Calculator */}
                  <div className="space-y-4 mb-6 p-4 bg-muted/30 rounded-xl border border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium flex items-center gap-2">
                        <Calculator className="h-4 w-4" />
                        Est. Monthly Payment
                      </span>
                      <span className="text-2xl font-bold text-primary">${monthlyPayment}/mo</span>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Down Payment</span>
                        <span className="font-medium">${downPayment.toLocaleString()}</span>
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
                        <span className="font-medium">{loanTerm} months</span>
                      </div>
                      <Slider
                        value={[loanTerm]}
                        onValueChange={([v]) => setLoanTerm(v)}
                        min={24}
                        max={84}
                        step={12}
                      />
                    </div>

                    <div className="pt-2 border-t border-border text-xs text-muted-foreground">
                      *Estimated at 4.79% APR from Desjardins. Actual rate may vary.
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="space-y-3">
                    <Button className="w-full h-12 text-lg" size="lg">
                      <Lock className="h-5 w-5 mr-2" />
                      Reserve for $250
                    </Button>
                    <ScheduleTestDrive 
                      vehicleTitle={`${vehicleData.year} ${vehicleData.make} ${vehicleData.model} ${vehicleData.trim}`}
                      vehicleId={vehicleData.id}
                      trigger={
                        <Button variant="outline" className="w-full h-12" size="lg">
                          <Calendar className="h-5 w-5 mr-2" />
                          Schedule Test Drive
                        </Button>
                      }
                    />
                    <Button variant="outline" className="w-full h-12" size="lg">
                      <CreditCard className="h-5 w-5 mr-2" />
                      Get Pre-Approved
                    </Button>
                    <Button variant="secondary" className="w-full h-12" size="lg" asChild>
                      <Link href="/trade-in">
                        <Car className="h-5 w-5 mr-2" />
                        Value Your Trade-In
                      </Link>
                    </Button>
                  </div>

                  {/* Contact */}
                  <div className="mt-6 pt-6 border-t flex gap-3">
                    <Button variant="outline" className="flex-1" asChild>
                      <Link href="tel:1-866-787-3332">
                        <Phone className="h-4 w-4 mr-1" />
                        Call
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-6 pt-6 border-t grid grid-cols-2 gap-3 text-xs text-center">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <Shield className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <span className="font-medium">10-Day Returns</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <Truck className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <span className="font-medium">Free Delivery</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <CheckCircle className="h-5 w-5 mx-auto mb-1 text-green-500" />
                      <span className="font-medium">210-Point Inspected</span>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <Award className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <span className="font-medium">OMVIC Licensed</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Location Card */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Planet Motors</p>
                      <p className="text-sm text-muted-foreground">
                        30 Major Mackenzie Dr E<br />
                        Richmond Hill, ON L4C 1G7
                      </p>
                      <Button variant="link" className="px-0 h-auto mt-1" asChild>
                        <Link href="/schedule">
                          Schedule Test Drive
                          <ArrowRight className="w-3 h-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Comparison CTA */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2">Compare Before You Buy</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    See how Planet Motors beats Clutch and Carvana on price, inspection, and service.
                  </p>
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/compare">
                      View Comparison
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
