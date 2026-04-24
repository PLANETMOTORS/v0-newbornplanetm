"use client"


import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Battery, Zap, ThermometerSun, Shield, CheckCircle2, AlertTriangle, Info, ArrowRight, Download } from "lucide-react"

// API-ready interface for EV battery data
interface EVBatteryData {
  id: string
  vehicleId: string
  vehicleName: string
  batteryHealth: number
  originalCapacity: number // kWh
  currentCapacity: number // kWh
  originalRange: number // km
  currentRange: number // km
  chargeCycles: number
  cellBalanceStatus: "Excellent" | "Good" | "Fair" | "Poor"
  thermalHealth: "Optimal" | "Good" | "Degraded"
  fastChargeCapability: boolean
  warrantyRemaining: string
  certificationDate: string
  certificationNumber: string
  status: "Excellent" | "Very Good" | "Good" | "Fair"
}

const certificationProcess = [
  {
    step: 1,
    title: "Initial Assessment",
    description: "Complete diagnostic scan of battery management system"
  },
  {
    step: 2,
    title: "Capacity Testing",
    description: "Full charge/discharge cycle to measure actual capacity"
  },
  {
    step: 3,
    title: "Cell Balance Check",
    description: "Individual cell voltage and health verification"
  },
  {
    step: 4,
    title: "Thermal Analysis",
    description: "Battery thermal management system evaluation"
  },
  {
    step: 5,
    title: "Final Certification",
    description: "Comprehensive report with health score and warranty"
  }
]

// Sample data - will be replaced with API call: GET /api/vehicles/ev-certified
const sampleVehicles: EVBatteryData[] = [
  {
    id: "ev-cert-001",
    vehicleId: "2024-tesla-model-y",
    vehicleName: "2024 Tesla Model Y Long Range",
    batteryHealth: 98,
    originalCapacity: 75,
    currentCapacity: 73.5,
    originalRange: 533,
    currentRange: 522,
    chargeCycles: 89,
    cellBalanceStatus: "Excellent",
    thermalHealth: "Optimal",
    fastChargeCapability: true,
    warrantyRemaining: "7 years / 152,000 km",
    certificationDate: "2024-03-15",
    certificationNumber: "PM-EV-2024-0089",
    status: "Excellent"
  },
  {
    id: "ev-cert-002",
    vehicleId: "2024-porsche-taycan",
    vehicleName: "2024 Porsche Taycan 4S",
    batteryHealth: 99,
    originalCapacity: 93.4,
    currentCapacity: 92.5,
    originalRange: 465,
    currentRange: 460,
    chargeCycles: 51,
    cellBalanceStatus: "Excellent",
    thermalHealth: "Optimal",
    fastChargeCapability: true,
    warrantyRemaining: "8 years / 160,000 km",
    certificationDate: "2024-03-10",
    certificationNumber: "PM-EV-2024-0085",
    status: "Excellent"
  },
  {
    id: "ev-cert-003",
    vehicleId: "2023-mercedes-eqs",
    vehicleName: "2023 Mercedes-Benz EQS 580",
    batteryHealth: 96,
    originalCapacity: 107.8,
    currentCapacity: 103.5,
    originalRange: 547,
    currentRange: 525,
    chargeCycles: 124,
    cellBalanceStatus: "Excellent",
    thermalHealth: "Good",
    fastChargeCapability: true,
    warrantyRemaining: "6 years / 140,000 km",
    certificationDate: "2024-02-28",
    certificationNumber: "PM-EV-2024-0072",
    status: "Excellent"
  },
  {
    id: "ev-cert-004",
    vehicleId: "2023-audi-etron-gt",
    vehicleName: "2023 Audi e-tron GT RS",
    batteryHealth: 97,
    originalCapacity: 93.4,
    currentCapacity: 90.6,
    originalRange: 395,
    currentRange: 383,
    chargeCycles: 98,
    cellBalanceStatus: "Excellent",
    thermalHealth: "Optimal",
    fastChargeCapability: true,
    warrantyRemaining: "7 years / 150,000 km",
    certificationDate: "2024-03-01",
    certificationNumber: "PM-EV-2024-0075",
    status: "Excellent"
  }
]

export default function EVBatteryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" tabIndex={-1} className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="bg-linear-to-br from-primary/10 via-background to-accent/5 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
                <Battery className="w-3 h-3 mr-1" />
                EV Certified
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.01em] md:tracking-[-0.02em] text-foreground mb-6 text-balance">
                EV Battery Health Certification
              </h1>
              <p className="text-lg text-muted-foreground mb-8 text-pretty">
                Every electric vehicle at Planet Motors undergoes comprehensive battery health testing. 
                Know exactly what you&apos;re buying with our transparent certification process.
              </p>
            </div>
          </div>
        </section>

        {/* Why It Matters */}
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Battery Health Matters</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Zap className="w-10 h-10 text-primary mb-2" />
                <CardTitle>Range Confidence</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Know exactly how far you can travel on a single charge. Our testing reveals true 
                  real-world range, not just manufacturer estimates.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <ThermometerSun className="w-10 h-10 text-accent mb-2" />
                <CardTitle>Thermal Management</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Battery longevity depends on thermal health. We verify cooling systems work 
                  properly to ensure long-term reliability.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="w-10 h-10 text-green-600 mb-2" />
                <CardTitle>Warranty Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  All certified EVs include our battery health guarantee. If capacity drops below 
                  stated levels within 12 months, we&apos;ll make it right.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Certification Process */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our 5-Step Certification Process</h2>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {certificationProcess.map((item, index) => (
                  <div key={item.step} className="flex gap-4 items-start">
                    <div className="shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {item.step}
                    </div>
                    <div className="flex-1 pb-6 border-b border-border last:border-0">
                      <h3 className="font-semibold text-lg">{item.title}</h3>
                      <p className="text-muted-foreground">{item.description}</p>
                    </div>
                    {index < certificationProcess.length - 1 && (
                      <div className="hidden md:block w-px h-full bg-border absolute left-5 top-10" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Sample Certified Vehicles */}
        <section className="py-16 container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Certified EV Inventory</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Browse our selection of battery-certified electric vehicles with full transparency on health metrics.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {sampleVehicles.map((vehicle) => (
              <Card key={vehicle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-linear-to-br from-green-500/20 to-primary/20 flex items-center justify-center relative">
                  <Battery className="w-16 h-16 text-green-600/50" />
                  <Badge className="absolute top-2 right-2 bg-green-600">
                    {vehicle.batteryHealth}% Health
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-sm leading-tight">{vehicle.vehicleName}</h3>
                    <p className="text-xs text-muted-foreground">Cert #{vehicle.certificationNumber}</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Battery Health</span>
                        <span className="font-semibold text-green-600">{vehicle.batteryHealth}%</span>
                      </div>
                      <Progress value={vehicle.batteryHealth} className="h-1.5" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">Current Range</p>
                        <p className="font-semibold">{vehicle.currentRange} km</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Capacity</p>
                        <p className="font-semibold">{vehicle.currentCapacity} kWh</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Charge Cycles</p>
                        <p className="font-semibold">{vehicle.chargeCycles}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Cell Balance</p>
                        <p className="font-semibold text-green-600">{vehicle.cellBalanceStatus}</p>
                      </div>
                    </div>
                    
                    <div className="pt-2 border-t flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                        <Link href={`/vehicles/${vehicle.vehicleId}`}>
                          View Vehicle
                        </Link>
                      </Button>
                      <Button size="sm" variant="ghost" className="px-2">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link href="/inventory?fuelType=Electric">
                View All Electric Vehicles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Health Score Guide */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Understanding Battery Health Scores</h2>
            <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
              <Card className="border-green-500/30 bg-green-500/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <CardTitle className="text-green-700">Excellent (95-100%)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Like-new battery with minimal degradation. Expect full manufacturer-rated range 
                    and optimal charging speeds.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-yellow-500/30 bg-yellow-500/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-yellow-600" />
                    <CardTitle className="text-yellow-700">Good (85-94%)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Normal wear for vehicle age. Slight range reduction but still excellent for 
                    daily driving and long trips.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-orange-500/30 bg-orange-500/5">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <CardTitle className="text-orange-700">Fair (75-84%)</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Higher than average degradation. Still functional but with noticeable range 
                    reduction. Priced accordingly.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
