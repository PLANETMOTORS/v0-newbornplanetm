"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

import { 
  Battery, BatteryCharging, Zap, Shield, ThermometerSun,
  Gauge, FileCheck, Award, TrendingUp,
  Car, ArrowRight, Phone
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

// API-ready interface for battery health data
// Sample EV vehicles with battery health data
const evVehicles = [
  {
    id: "2024-tesla-model-y",
    name: "2024 Tesla Model Y Long Range AWD",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&h=400&fit=crop",
    price: 64990,
    mileage: 12450,
    batteryHealth: 98,
    originalRange: 533,
    currentRange: 522,
    batteryCapacity: "75 kWh",
    warranty: "8 years / 192,000 km",
    fastChargeSpeed: "250 kW",
    stockNumber: "PM73254025"
  },
  {
    id: "2024-porsche-taycan",
    name: "2024 Porsche Taycan 4S Performance",
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&h=400&fit=crop",
    price: 134500,
    mileage: 5100,
    batteryHealth: 99,
    originalRange: 465,
    currentRange: 460,
    batteryCapacity: "93.4 kWh",
    warranty: "8 years / 160,000 km",
    fastChargeSpeed: "270 kW",
    stockNumber: "PM73254028"
  },
  {
    id: "2023-mercedes-eqs",
    name: "2023 Mercedes-Benz EQS 580 4MATIC",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=600&h=400&fit=crop",
    price: 156900,
    mileage: 3800,
    batteryHealth: 100,
    originalRange: 547,
    currentRange: 547,
    batteryCapacity: "107.8 kWh",
    warranty: "8 years / 160,000 km",
    fastChargeSpeed: "200 kW",
    stockNumber: "PM73254029"
  },
  {
    id: "2023-bmw-i4",
    name: "2023 BMW i4 M50 xDrive",
    image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop",
    price: 72900,
    mileage: 18200,
    batteryHealth: 96,
    originalRange: 435,
    currentRange: 418,
    batteryCapacity: "83.9 kWh",
    warranty: "8 years / 160,000 km",
    fastChargeSpeed: "205 kW",
    stockNumber: "PM73254030"
  },
  {
    id: "2024-rivian-r1s",
    name: "2024 Rivian R1S Adventure",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&h=400&fit=crop",
    price: 98500,
    mileage: 8900,
    batteryHealth: 97,
    originalRange: 505,
    currentRange: 490,
    batteryCapacity: "135 kWh",
    warranty: "8 years / 280,000 km",
    fastChargeSpeed: "220 kW",
    stockNumber: "PM73254031"
  }
]

export default function EVBatteryHealthPage() {
  const [selectedVehicle, setSelectedVehicle] = useState(evVehicles[0])

  const getBatteryHealthColor = (health: number) => {
    if (health >= 95) return "text-green-600"
    if (health >= 85) return "text-yellow-600"
    if (health >= 70) return "text-orange-600"
    return "text-red-600"
  }

  const getBatteryHealthBadge = (health: number) => {
    if (health >= 95) return { label: "Excellent", color: "bg-green-500" }
    if (health >= 85) return { label: "Good", color: "bg-yellow-500" }
    if (health >= 70) return { label: "Fair", color: "bg-orange-500" }
    return { label: "Poor", color: "bg-red-500" }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary via-primary to-green-700 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-4 bg-green-500/20 text-green-100 border-green-400/30">
                <BatteryCharging className="h-4 w-4 mr-1" />
                Powered by Aviloo — Independent EV battery diagnostics, trusted in 30+ countries
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] md:tracking-[-0.02em] text-primary-foreground mb-6">
                Certified EV Battery Health
              </h1>
              <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
                Every electric vehicle at Planet Motors comes with an independent Aviloo FLASH test —
                the same battery certification trusted by dealerships across 30+ countries.
                Know your battery&apos;s true State of Health before you buy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/inventory?fuelType=Electric">
                  <Button size="lg" className="h-14 px-8 text-lg bg-white text-primary hover:bg-white/90">
                    Browse EVs
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="h-14 px-8 text-lg bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white">
                    <Phone className="mr-2 h-5 w-5" />
                    Speak to an Expert
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Indicators */}
        <section className="py-8 border-b bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Battery className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-bold text-lg">100%</p>
                  <p className="text-sm text-muted-foreground">EVs Tested</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-bold text-lg">Aviloo</p>
                  <p className="text-sm text-muted-foreground">Certified</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-bold text-lg">Warranty</p>
                  <p className="text-sm text-muted-foreground">Included</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Award className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-lg">95%+</p>
                  <p className="text-sm text-muted-foreground">Avg Health</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Test */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                What the Aviloo FLASH Test Measures
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                An independent, manufacturer-agnostic diagnostic covering every critical battery metric
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <Battery className="h-7 w-7 text-green-600" />
                  </div>
                  <CardTitle>State of Health (SoH)</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We measure the battery&apos;s current maximum capacity compared to its original 
                    capacity when new. This gives you an accurate picture of remaining battery life.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Gauge className="h-7 w-7 text-blue-600" />
                  </div>
                  <CardTitle>Range Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Compare the current estimated range against the manufacturer&apos;s original 
                    specifications. Know exactly how far you can drive on a full charge.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <ThermometerSun className="h-7 w-7 text-purple-600" />
                  </div>
                  <CardTitle>Thermal Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    We test the battery&apos;s cooling and heating systems to ensure optimal 
                    performance in Canadian weather conditions year-round.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="h-7 w-7 text-orange-600" />
                  </div>
                  <CardTitle>Charging Capability</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Verify DC fast charging speeds and Level 2 charging performance. 
                    We test all charging ports and onboard charger functionality.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-4">
                    <TrendingUp className="h-7 w-7 text-red-600" />
                  </div>
                  <CardTitle>Degradation Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Calculate how quickly the battery has degraded over time and mileage. 
                    This helps predict future battery performance and longevity.
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader>
                  <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-4">
                    <Shield className="h-7 w-7 text-teal-600" />
                  </div>
                  <CardTitle>Warranty Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Full documentation of remaining manufacturer battery warranty coverage. 
                    Most EVs include 8-year / 160,000+ km battery warranties.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Aviloo Certificate Showcase */}
        <section className="py-16 bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-green-100 text-green-800 border-green-300">
                <Award className="h-4 w-4 mr-1" />
                Real Certificate Data
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Sample Aviloo FLASH Certificate
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Here&apos;s what an actual Aviloo battery health report looks like —
                independent, transparent, and backed by data
              </p>
            </div>

            {/* Actual Aviloo Certificate Image — visual proof */}
            <div className="max-w-2xl mx-auto mb-10">
              <div className="rounded-xl overflow-hidden shadow-lg border border-green-200">
                <Image
                  src="/images/aviloo-sample-certificate.jpg"
                  alt="Aviloo FLASH Test Certificate — 2023 Tesla Model 3, 95.1% State of Health"
                  width={1132}
                  height={1600}
                  className="w-full h-auto"
                  priority
                />
              </div>
              <p className="text-sm text-muted-foreground text-center mt-3">
                Actual Aviloo FLASH certificate from a vehicle in our inventory (VIN redacted for privacy)
              </p>
            </div>

            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden border-2 border-green-200">
                <div className="grid md:grid-cols-2">
                  {/* Certificate Summary */}
                  <div className="p-8 bg-white dark:bg-card">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                        <FileCheck className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">Aviloo FLASH Test</p>
                        <p className="text-sm text-muted-foreground">2023 Tesla Model 3</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* SOH */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold">State of Health</span>
                          <span className="text-3xl font-bold text-green-600">95.1%</span>
                        </div>
                        <Progress value={95.1} className="h-3" />
                        <p className="text-sm text-muted-foreground mt-1">Excellent — minimal degradation</p>
                      </div>

                      {/* Energy */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Available Energy</p>
                          <p className="text-2xl font-bold">75 kWh</p>
                          <p className="text-xs text-muted-foreground">of 79 kWh original</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-4">
                          <p className="text-sm text-muted-foreground">Estimated Range</p>
                          <p className="text-2xl font-bold">415 km</p>
                          <p className="text-xs text-muted-foreground">of 436 km original</p>
                        </div>
                      </div>

                      {/* Verdict */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-950/30 dark:border-green-800">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-green-800 dark:text-green-400">Aviloo Verdict</span>
                        </div>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Battery in excellent condition. Capacity loss is well within expected range for
                          vehicle age and mileage. No cell imbalance detected.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* What Aviloo Is */}
                  <div className="p-8 bg-muted/30 flex flex-col justify-center">
                    <h3 className="text-xl font-bold mb-4">What is Aviloo?</h3>
                    <p className="text-muted-foreground mb-4">
                      Aviloo is Europe&apos;s leading independent EV battery diagnostics company,
                      trusted by dealerships, insurers, and fleet operators across 30+ countries.
                    </p>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-start gap-2">
                        <Shield className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Independent:</strong> Not affiliated with any manufacturer — unbiased results</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Gauge className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Scientific:</strong> Tests 100+ battery parameters in under 20 minutes</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <FileCheck className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Certified:</strong> ISO-compliant testing methodology used across 30+ countries</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingUp className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                        <span><strong>Trusted:</strong> Over 100,000 batteries tested worldwide</span>
                      </li>
                    </ul>
                    <p className="text-sm text-muted-foreground mt-6">
                      One of the first Canadian dealerships to adopt Aviloo certification
                      on every pre-owned EV — at no extra cost to you.
                    </p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* Sample Reports */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Battery Health by Vehicle
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                View real battery health data from EVs in our inventory
              </p>
            </div>

            <div className="max-w-6xl mx-auto">
              {/* Vehicle Selector */}
              <div className="flex flex-wrap gap-3 justify-center mb-8">
                {evVehicles.map(vehicle => (
                  <Button
                    key={vehicle.id}
                    variant={selectedVehicle.id === vehicle.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedVehicle(vehicle)}
                  >
                    {vehicle.name.split(" ").slice(0, 3).join(" ")}
                  </Button>
                ))}
              </div>

              {/* Report Card */}
              <Card className="overflow-hidden">
                <div className="grid lg:grid-cols-2">
                  {/* Vehicle Image */}
                  <div className="relative aspect-[4/3] lg:aspect-auto bg-muted">
                    <Image
                      src={selectedVehicle.image}
                      alt={selectedVehicle.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                    <div className="absolute top-4 left-4">
                      <Badge className={getBatteryHealthBadge(selectedVehicle.batteryHealth).color}>
                        <Battery className="h-3 w-3 mr-1" />
                        {selectedVehicle.batteryHealth}% Health
                      </Badge>
                    </div>
                  </div>

                  {/* Report Details */}
                  <div className="p-6 lg:p-8">
                    <div className="mb-6">
                      <p className="text-sm text-muted-foreground mb-1">Stock #{selectedVehicle.stockNumber}</p>
                      <h3 className="text-2xl font-bold mb-2">{selectedVehicle.name}</h3>
                      <p className="text-3xl font-bold text-primary">${selectedVehicle.price.toLocaleString()}</p>
                    </div>

                    {/* Battery Health Meter */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold">Battery State of Health</span>
                        <span className={`text-2xl font-bold ${getBatteryHealthColor(selectedVehicle.batteryHealth)}`}>
                          {selectedVehicle.batteryHealth}%
                        </span>
                      </div>
                      <Progress value={selectedVehicle.batteryHealth} className="h-4" />
                      <p className="text-sm text-muted-foreground mt-2">
                        {selectedVehicle.batteryHealth >= 95 
                          ? "Excellent condition - minimal degradation"
                          : selectedVehicle.batteryHealth >= 85
                          ? "Good condition - normal wear"
                          : "Fair condition - expected for age/mileage"}
                      </p>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Current Range</p>
                        <p className="text-xl font-bold">{selectedVehicle.currentRange} km</p>
                        <p className="text-xs text-muted-foreground">
                          Original: {selectedVehicle.originalRange} km
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Battery Capacity</p>
                        <p className="text-xl font-bold">{selectedVehicle.batteryCapacity}</p>
                        <p className="text-xs text-muted-foreground">
                          Usable capacity
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Mileage</p>
                        <p className="text-xl font-bold">{selectedVehicle.mileage.toLocaleString()} km</p>
                        <p className="text-xs text-muted-foreground">
                          Odometer reading
                        </p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-4">
                        <p className="text-sm text-muted-foreground">Fast Charge</p>
                        <p className="text-xl font-bold">{selectedVehicle.fastChargeSpeed}</p>
                        <p className="text-xs text-muted-foreground">
                          Max DC charging
                        </p>
                      </div>
                    </div>

                    {/* Warranty */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="h-5 w-5 text-green-600" />
                        <span className="font-semibold text-green-800">Battery Warranty</span>
                      </div>
                      <p className="text-green-700">{selectedVehicle.warranty}</p>
                    </div>

                    <div className="flex gap-3">
                      <Link href={`/vehicles/${selectedVehicle.stockNumber}`} className="flex-1">
                        <Button className="w-full" size="lg">View Vehicle</Button>
                      </Link>
                      <Link href="/contact">
                        <Button variant="outline" size="lg">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  Frequently Asked Questions
                </h2>
                <p className="text-xl text-muted-foreground">
                  Everything you need to know about EV battery health
                </p>
              </div>

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="text-left">
                    What is battery State of Health (SoH)?
                  </AccordionTrigger>
                  <AccordionContent>
                    State of Health (SoH) is a measurement that compares the battery&apos;s current 
                    maximum capacity to its original capacity when new. A 100% SoH means the battery 
                    holds the same charge as it did when new. Over time, all batteries naturally 
                    degrade, so a used EV might have 90-98% SoH, which is completely normal and healthy.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-2">
                  <AccordionTrigger className="text-left">
                    How do you test EV battery health?
                  </AccordionTrigger>
                  <AccordionContent>
                    We use the Aviloo FLASH test — an independent, ISO-compliant diagnostic that connects
                    directly to the vehicle&apos;s battery management system. In under 20 minutes, it reads
                    cell voltages, temperatures, charge cycles, and calculates true State of Health.
                    The result is an independent certificate, not a manufacturer self-report.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-3">
                  <AccordionTrigger className="text-left">
                    What is considered a healthy battery percentage?
                  </AccordionTrigger>
                  <AccordionContent>
                    <ul className="space-y-2">
                      <li><strong>95-100%:</strong> Excellent - Like new condition</li>
                      <li><strong>85-94%:</strong> Good - Normal wear for age</li>
                      <li><strong>70-84%:</strong> Fair - Higher mileage or older vehicle</li>
                      <li><strong>Below 70%:</strong> May need battery service soon</li>
                    </ul>
                    <p className="mt-3">
                      Most EVs at Planet Motors have 95%+ battery health due to our strict quality standards.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-4">
                  <AccordionTrigger className="text-left">
                    How long do EV batteries last?
                  </AccordionTrigger>
                  <AccordionContent>
                    Modern EV batteries are designed to last 300,000-500,000 km or 15-20 years. 
                    Most manufacturers warrant their batteries for 8 years or 160,000-240,000 km 
                    with a minimum of 70% capacity remaining. Tesla warranties their batteries up 
                    to 240,000 km. Real-world data shows most EVs retain over 80% capacity even 
                    after 200,000 km.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-5">
                  <AccordionTrigger className="text-left">
                    What affects EV battery degradation?
                  </AccordionTrigger>
                  <AccordionContent>
                    Several factors influence battery degradation:
                    <ul className="mt-2 space-y-1">
                      <li>• Frequent DC fast charging (some impact)</li>
                      <li>• Extreme hot or cold temperatures</li>
                      <li>• Regularly charging to 100% or depleting to 0%</li>
                      <li>• High mileage and age</li>
                    </ul>
                    <p className="mt-3">
                      Modern EVs have sophisticated thermal management systems that minimize 
                      these effects. Proper charging habits (keeping between 20-80% daily) 
                      help preserve battery life.
                    </p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="item-6">
                  <AccordionTrigger className="text-left">
                    Is the battery covered under warranty?
                  </AccordionTrigger>
                  <AccordionContent>
                    Yes! All EV batteries at Planet Motors come with the remaining manufacturer 
                    warranty, which typically covers 8 years or 160,000-240,000 km. The warranty 
                    usually guarantees the battery will maintain at least 70% of its original 
                    capacity. We provide full warranty documentation with every EV purchase.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
              Ready to Go Electric?
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
              Browse our Aviloo-certified pre-owned EVs — every one with a transparent battery health report included at no extra cost
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/vehicles?fuelType=Electric">
                <Button size="lg" variant="secondary" className="h-14 px-8 text-lg">
                  <Car className="mr-2 h-5 w-5" />
                  Browse Electric Vehicles
                </Button>
              </Link>
              <Link href="/trade-in">
                <Button size="lg" variant="secondary" className="h-14 px-8 text-lg">
                  Trade In Your Gas Car
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
