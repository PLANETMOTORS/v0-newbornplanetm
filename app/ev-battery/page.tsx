"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Battery, Zap, ThermometerSun, Clock, Shield, CheckCircle2, AlertTriangle, Info } from "lucide-react"

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

const sampleVehicles = [
  {
    name: "2023 Tesla Model 3",
    batteryHealth: 97,
    originalRange: 358,
    currentRange: 347,
    cycles: 142,
    status: "Excellent"
  },
  {
    name: "2022 Ford Mustang Mach-E",
    batteryHealth: 94,
    originalRange: 314,
    currentRange: 295,
    cycles: 287,
    status: "Very Good"
  },
  {
    name: "2021 Chevrolet Bolt EV",
    batteryHealth: 91,
    originalRange: 417,
    currentRange: 379,
    cycles: 412,
    status: "Good"
  }
]

export default function EVBatteryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-accent/5 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Badge className="mb-4 bg-green-500/10 text-green-600 border-green-500/20">
                <Battery className="w-3 h-3 mr-1" />
                EV Certified
              </Badge>
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-6 text-balance">
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
          <h2 className="text-3xl font-serif font-bold text-center mb-12">Why Battery Health Matters</h2>
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
            <h2 className="text-3xl font-serif font-bold text-center mb-12">Our 5-Step Certification Process</h2>
            <div className="max-w-4xl mx-auto">
              <div className="space-y-6">
                {certificationProcess.map((item, index) => (
                  <div key={item.step} className="flex gap-4 items-start">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
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
          <h2 className="text-3xl font-serif font-bold text-center mb-4">Certified EV Inventory</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Browse our selection of battery-certified electric vehicles with full transparency on health metrics.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {sampleVehicles.map((vehicle) => (
              <Card key={vehicle.name} className="overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <Battery className="w-16 h-16 text-primary/50" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{vehicle.name}</h3>
                    <Badge variant={vehicle.batteryHealth >= 95 ? "default" : vehicle.batteryHealth >= 90 ? "secondary" : "outline"}>
                      {vehicle.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Battery Health</span>
                        <span className="font-medium">{vehicle.batteryHealth}%</span>
                      </div>
                      <Progress value={vehicle.batteryHealth} className="h-2" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Original Range</p>
                        <p className="font-medium">{vehicle.originalRange} km</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Range</p>
                        <p className="font-medium">{vehicle.currentRange} km</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Charge Cycles</p>
                        <p className="font-medium">{vehicle.cycles}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Degradation</p>
                        <p className="font-medium">{100 - vehicle.batteryHealth}%</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Health Score Guide */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-serif font-bold text-center mb-12">Understanding Battery Health Scores</h2>
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
