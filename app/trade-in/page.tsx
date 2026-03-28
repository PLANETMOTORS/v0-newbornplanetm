"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Car, CreditCard, FileText, Search, CheckCircle, ArrowRight, DollarSign, Clock, Shield } from "lucide-react"

export default function TradeInPage() {
  const [lookupMethod, setLookupMethod] = useState<"plate" | "vin" | "manual">("plate")
  const [province, setProvince] = useState("")
  const [plateNumber, setPlateNumber] = useState("")
  const [vinNumber, setVinNumber] = useState("")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [vehicleFound, setVehicleFound] = useState(false)
  const [foundVehicle, setFoundVehicle] = useState<any>(null)

  const handlePlateLookup = async () => {
    setIsLookingUp(true)
    // Simulate API call to CARFAX or similar vehicle data service
    setTimeout(() => {
      setVehicleFound(true)
      setFoundVehicle({
        year: 2021,
        make: "Honda",
        model: "Accord",
        trim: "Sport 2.0T",
        mileage: "45,000 km",
        estimatedValue: "$28,500 - $31,200"
      })
      setIsLookingUp(false)
    }, 2000)
  }

  const handleVinLookup = async () => {
    setIsLookingUp(true)
    setTimeout(() => {
      setVehicleFound(true)
      setFoundVehicle({
        year: 2020,
        make: "Toyota",
        model: "Camry",
        trim: "XSE V6",
        mileage: "52,000 km",
        estimatedValue: "$26,800 - $29,500"
      })
      setIsLookingUp(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground">Instant Offers</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Get Your Instant Trade-In Offer
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Find out what your car is worth in seconds. We offer competitive prices and free pickup across Canada.
            </p>
          </div>
        </section>

        {/* Lookup Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Look Up Your Vehicle</CardTitle>
                  <CardDescription>
                    Enter your license plate or VIN to auto-fill your vehicle details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs value={lookupMethod} onValueChange={(v) => setLookupMethod(v as any)}>
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="plate">License Plate</TabsTrigger>
                      <TabsTrigger value="vin">VIN Number</TabsTrigger>
                      <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                    </TabsList>

                    <TabsContent value="plate" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select value={province} onValueChange={setProvince}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Province" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ON">Ontario</SelectItem>
                            <SelectItem value="BC">British Columbia</SelectItem>
                            <SelectItem value="AB">Alberta</SelectItem>
                            <SelectItem value="QC">Quebec</SelectItem>
                            <SelectItem value="MB">Manitoba</SelectItem>
                            <SelectItem value="SK">Saskatchewan</SelectItem>
                            <SelectItem value="NS">Nova Scotia</SelectItem>
                            <SelectItem value="NB">New Brunswick</SelectItem>
                            <SelectItem value="NL">Newfoundland</SelectItem>
                            <SelectItem value="PE">Prince Edward Island</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input 
                          placeholder="Enter License Plate" 
                          className="md:col-span-2 uppercase"
                          value={plateNumber}
                          onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                        />
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handlePlateLookup}
                        disabled={!province || !plateNumber || isLookingUp}
                      >
                        {isLookingUp ? (
                          <>Looking Up...</>
                        ) : (
                          <>
                            <Search className="mr-2 h-5 w-5" />
                            Look Up Vehicle
                          </>
                        )}
                      </Button>
                    </TabsContent>

                    <TabsContent value="vin" className="space-y-4">
                      <div className="space-y-2">
                        <Input 
                          placeholder="Enter 17-character VIN" 
                          className="uppercase"
                          maxLength={17}
                          value={vinNumber}
                          onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
                        />
                        <p className="text-sm text-muted-foreground">
                          Your VIN can be found on your registration, insurance card, or driver-side door jamb.
                        </p>
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={handleVinLookup}
                        disabled={vinNumber.length !== 17 || isLookingUp}
                      >
                        {isLookingUp ? (
                          <>Looking Up...</>
                        ) : (
                          <>
                            <Search className="mr-2 h-5 w-5" />
                            Look Up Vehicle
                          </>
                        )}
                      </Button>
                    </TabsContent>

                    <TabsContent value="manual" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 25 }, (_, i) => 2024 - i).map((year) => (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Make" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="honda">Honda</SelectItem>
                            <SelectItem value="toyota">Toyota</SelectItem>
                            <SelectItem value="ford">Ford</SelectItem>
                            <SelectItem value="chevrolet">Chevrolet</SelectItem>
                            <SelectItem value="bmw">BMW</SelectItem>
                            <SelectItem value="mercedes">Mercedes-Benz</SelectItem>
                            <SelectItem value="audi">Audi</SelectItem>
                            <SelectItem value="nissan">Nissan</SelectItem>
                            <SelectItem value="hyundai">Hyundai</SelectItem>
                            <SelectItem value="kia">Kia</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Model" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accord">Accord</SelectItem>
                            <SelectItem value="civic">Civic</SelectItem>
                            <SelectItem value="camry">Camry</SelectItem>
                            <SelectItem value="corolla">Corolla</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input placeholder="Enter Mileage (km)" type="number" />
                      </div>
                      <Button className="w-full" size="lg">
                        <ArrowRight className="mr-2 h-5 w-5" />
                        Continue to Valuation
                      </Button>
                    </TabsContent>
                  </Tabs>

                  {/* Vehicle Found Result */}
                  {vehicleFound && foundVehicle && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <Badge className="bg-green-600">Auto-Filled</Badge>
                        <span className="text-green-800 font-medium">Vehicle Found!</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Year:</span>
                          <p className="font-medium">{foundVehicle.year}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Make:</span>
                          <p className="font-medium">{foundVehicle.make}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Model:</span>
                          <p className="font-medium">{foundVehicle.model}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Trim:</span>
                          <p className="font-medium">{foundVehicle.trim}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Mileage:</span>
                          <p className="font-medium">{foundVehicle.mileage}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Est. Value:</span>
                          <p className="font-medium text-green-700">{foundVehicle.estimatedValue}</p>
                        </div>
                      </div>
                      <Button className="w-full mt-4 bg-green-600 hover:bg-green-700">
                        Get Your Instant Offer
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
              {[
                { icon: Car, title: "Enter Your Vehicle", desc: "Use license plate, VIN, or manual entry" },
                { icon: DollarSign, title: "Get Instant Offer", desc: "Receive a competitive offer in seconds" },
                { icon: Clock, title: "Schedule Pickup", desc: "We pick up your car for free, anywhere in Canada" },
                { icon: CreditCard, title: "Get Paid", desc: "Receive payment via e-Transfer or cheque" }
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">Step {i + 1}</div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center p-6">
                <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg mb-2">Best Price Guarantee</h3>
                <p className="text-muted-foreground text-sm">
                  We guarantee the best price for your trade-in or we will beat any competitor offer.
                </p>
              </Card>
              <Card className="text-center p-6">
                <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg mb-2">Paperwork Handled</h3>
                <p className="text-muted-foreground text-sm">
                  We handle all the paperwork including ownership transfer and lien payoff.
                </p>
              </Card>
              <Card className="text-center p-6">
                <Car className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg mb-2">Free Pickup</h3>
                <p className="text-muted-foreground text-sm">
                  Schedule free pickup from your home or office anywhere in Canada.
                </p>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
