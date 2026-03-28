"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Car, CreditCard, FileText, Search, CheckCircle, ArrowRight, DollarSign, Clock, Shield, 
  Camera, Upload, Zap, TrendingUp, Star, Truck, Phone, MessageSquare, ChevronRight,
  AlertCircle, Sparkles, Target, Award, MapPin, Calendar, Users, ThumbsUp
} from "lucide-react"

// Vehicle makes with models
const vehicleMakes = {
  "Acura": ["ILX", "Integra", "MDX", "NSX", "RDX", "TLX"],
  "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "Q3", "Q5", "Q7", "Q8", "RS6", "S4"],
  "BMW": ["2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "iX", "i4"],
  "Chevrolet": ["Blazer", "Bolt", "Camaro", "Colorado", "Corvette", "Equinox", "Malibu", "Silverado", "Suburban", "Tahoe", "Traverse"],
  "Ford": ["Bronco", "Edge", "Escape", "Explorer", "F-150", "Maverick", "Mustang", "Ranger"],
  "Honda": ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Passport", "Pilot", "Ridgeline"],
  "Hyundai": ["Elantra", "Ioniq 5", "Ioniq 6", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson"],
  "Jeep": ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Wagoneer", "Wrangler"],
  "Kia": ["EV6", "Forte", "K5", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
  "Lexus": ["ES", "GX", "IS", "LC", "LS", "LX", "NX", "RX", "TX", "UX"],
  "Mazda": ["CX-30", "CX-5", "CX-50", "CX-9", "CX-90", "Mazda3", "MX-5 Miata"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "G-Class", "GLA", "GLC", "GLE", "GLS", "S-Class", "EQE", "EQS"],
  "Nissan": ["Altima", "Ariya", "Frontier", "Kicks", "Leaf", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan", "Z"],
  "Porsche": ["911", "Boxster", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
  "Ram": ["1500", "2500", "3500"],
  "Subaru": ["Ascent", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "Solterra", "WRX"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  "Toyota": ["4Runner", "bZ4X", "Camry", "Corolla", "GR86", "Highlander", "Prius", "RAV4", "Sequoia", "Sienna", "Supra", "Tacoma", "Tundra", "Venza"],
  "Volkswagen": ["Atlas", "Golf", "GTI", "ID.4", "Jetta", "Taos", "Tiguan"],
  "Volvo": ["C40", "S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"],
}

const conditionOptions = [
  { value: "excellent", label: "Excellent", description: "Like new, no visible wear, all features work perfectly", multiplier: 1.1 },
  { value: "good", label: "Good", description: "Minor wear, small scratches, everything functions properly", multiplier: 1.0 },
  { value: "fair", label: "Fair", description: "Noticeable wear, some cosmetic issues, may need minor repairs", multiplier: 0.9 },
  { value: "poor", label: "Poor", description: "Significant wear, mechanical or body issues, needs work", multiplier: 0.75 },
]

export default function TradeInPage() {
  const [step, setStep] = useState(1)
  const [lookupMethod, setLookupMethod] = useState<"plate" | "vin" | "manual">("plate")
  const [province, setProvince] = useState("")
  const [plateNumber, setPlateNumber] = useState("")
  const [vinNumber, setVinNumber] = useState("")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [vehicleFound, setVehicleFound] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationProgress, setCalculationProgress] = useState(0)
  
  // Vehicle details
  const [foundVehicle, setFoundVehicle] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedMake, setSelectedMake] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedTrim, setSelectedTrim] = useState("")
  const [mileage, setMileage] = useState("")
  const [condition, setCondition] = useState("good")
  
  // Condition questions
  const [hasAccident, setHasAccident] = useState(false)
  const [hasMechanicalIssues, setHasMechanicalIssues] = useState(false)
  const [hasLien, setHasLien] = useState(false)
  const [payoffAmount, setPayoffAmount] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  
  // Photos
  const [photos, setPhotos] = useState<string[]>([])
  
  // Contact info
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [postalCode, setPostalCode] = useState("")
  
  // Offer
  const [offer, setOffer] = useState<any>(null)

  const handlePlateLookup = async () => {
    setIsLookingUp(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setVehicleFound(true)
    setFoundVehicle({
      year: 2021,
      make: "Honda",
      model: "Accord",
      trim: "Sport 2.0T",
      vin: "1HGCV2F34MA012345",
      estimatedMileage: "45,000",
      color: "Crystal Black Pearl",
    })
    setSelectedYear("2021")
    setSelectedMake("Honda")
    setSelectedModel("Accord")
    setSelectedTrim("Sport 2.0T")
    setMileage("45000")
    setIsLookingUp(false)
  }

  const handleVinLookup = async () => {
    setIsLookingUp(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setVehicleFound(true)
    setFoundVehicle({
      year: 2022,
      make: "Tesla",
      model: "Model 3",
      trim: "Long Range",
      vin: vinNumber,
      estimatedMileage: "32,000",
      color: "Pearl White",
    })
    setSelectedYear("2022")
    setSelectedMake("Tesla")
    setSelectedModel("Model 3")
    setSelectedTrim("Long Range")
    setMileage("32000")
    setIsLookingUp(false)
  }

  const calculateOffer = async () => {
    setIsCalculating(true)
    setCalculationProgress(0)
    
    // Simulate calculation with progress
    const steps = [
      "Checking Canadian Black Book values...",
      "Analyzing market demand...",
      "Reviewing auction data...",
      "Calculating condition adjustments...",
      "Generating your offer..."
    ]
    
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 600))
      setCalculationProgress((i + 1) * 20)
    }
    
    // Calculate base value
    const baseValue = 28500
    const conditionMultiplier = conditionOptions.find(c => c.value === condition)?.multiplier || 1
    let finalValue = baseValue * conditionMultiplier
    
    // Adjustments
    if (hasAccident) finalValue *= 0.85
    if (hasMechanicalIssues) finalValue *= 0.92
    
    // Calculate range
    const lowValue = Math.round(finalValue * 0.95 / 100) * 100
    const highValue = Math.round(finalValue * 1.05 / 100) * 100
    const midValue = Math.round(finalValue / 100) * 100
    
    // Calculate equity if lien
    const equity = hasLien && payoffAmount ? midValue - parseFloat(payoffAmount) : midValue
    
    setOffer({
      offerNumber: `PM-${Date.now().toString(36).toUpperCase()}`,
      vehicle: `${selectedYear} ${selectedMake} ${selectedModel} ${selectedTrim}`,
      mileage: mileage,
      condition: condition,
      cbbValue: {
        low: lowValue,
        mid: midValue,
        high: highValue,
      },
      adjustments: [
        hasAccident && { reason: "Accident history", amount: -(baseValue * 0.15) },
        hasMechanicalIssues && { reason: "Mechanical issues", amount: -(baseValue * 0.08) },
      ].filter(Boolean),
      offerAmount: midValue,
      payoff: hasLien ? parseFloat(payoffAmount) || 0 : 0,
      equity: equity,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
      comparison: {
        privateSale: Math.round(midValue * 1.15 / 100) * 100,
        dealerTrade: Math.round(midValue * 0.88 / 100) * 100,
      }
    })
    
    setIsCalculating(false)
    setShowOffer(true)
  }

  const nextStep = () => setStep(s => Math.min(s + 1, 4))
  const prevStep = () => setStep(s => Math.max(s - 1, 1))

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section - Premium Design */}
        <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 py-20 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          </div>
          
          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6">
                  <Sparkles className="h-4 w-4" />
                  <span className="text-sm font-medium">Powered by Canadian Black Book</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance">
                  Get Your Instant<br />Trade-In Offer
                </h1>
                <p className="text-xl text-white/90 mb-8 max-w-lg">
                  Find out what your car is worth in 60 seconds. Competitive prices, free pickup, and payment within 24 hours.
                </p>
                
                {/* Stats */}
                <div className="grid grid-cols-3 gap-6 text-white mb-8">
                  <div className="text-center lg:text-left">
                    <div className="text-3xl font-bold">$12M+</div>
                    <div className="text-sm text-white/70">Paid to Canadians</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-3xl font-bold">15K+</div>
                    <div className="text-sm text-white/70">Cars Purchased</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-3xl font-bold">4.9/5</div>
                    <div className="text-sm text-white/70">Customer Rating</div>
                  </div>
                </div>
                
                {/* Trust badges */}
                <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Shield className="h-3 w-3 mr-1" /> Best Price Guarantee
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Truck className="h-3 w-3 mr-1" /> Free Pickup Canada-Wide
                  </Badge>
                  <Badge variant="secondary" className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                    <Zap className="h-3 w-3 mr-1" /> 24h Payment
                  </Badge>
                </div>
              </div>
              
              {/* Quick Value Check */}
              <div className="lg:pl-8">
                <Card className="shadow-2xl border-0">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-2xl">Start Your Offer</CardTitle>
                        <CardDescription>Takes less than 60 seconds</CardDescription>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1,2,3,4,5].map(i => <Star key={i} className="h-4 w-4 fill-current" />)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <Select value={selectedYear} onValueChange={setSelectedYear}>
                        <SelectTrigger>
                          <SelectValue placeholder="Year" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 25 }, (_, i) => 2025 - i).map((year) => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedMake} onValueChange={(v) => { setSelectedMake(v); setSelectedModel(""); }}>
                        <SelectTrigger>
                          <SelectValue placeholder="Make" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(vehicleMakes).map((make) => (
                            <SelectItem key={make} value={make}>{make}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedMake}>
                        <SelectTrigger>
                          <SelectValue placeholder="Model" />
                        </SelectTrigger>
                        <SelectContent>
                          {selectedMake && vehicleMakes[selectedMake as keyof typeof vehicleMakes]?.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input 
                        placeholder="Mileage (km)" 
                        type="number"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full h-12 text-lg"
                      size="lg"
                      onClick={() => { setStep(2); setVehicleFound(true); }}
                      disabled={!selectedYear || !selectedMake || !selectedModel || !mileage}
                    >
                      Get My Instant Offer
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      No phone calls, no spam. See your offer instantly.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Main Wizard Section */}
        {!showOffer && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                {/* Progress Steps */}
                <div className="flex items-center justify-between mb-8 px-4">
                  {[
                    { num: 1, label: "Vehicle Info" },
                    { num: 2, label: "Condition" },
                    { num: 3, label: "Photos" },
                    { num: 4, label: "Your Offer" },
                  ].map((s, i) => (
                    <div key={s.num} className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                        step >= s.num 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {step > s.num ? <CheckCircle className="h-5 w-5" /> : s.num}
                      </div>
                      <span className={`ml-2 hidden sm:block text-sm ${
                        step >= s.num ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}>
                        {s.label}
                      </span>
                      {i < 3 && (
                        <div className={`hidden sm:block w-12 lg:w-24 h-0.5 mx-3 ${
                          step > s.num ? "bg-primary" : "bg-muted"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step 1: Vehicle Info */}
                {step === 1 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        Vehicle Information
                      </CardTitle>
                      <CardDescription>
                        Enter your vehicle details or look it up automatically
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
                                <SelectValue placeholder="Province" />
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
                              placeholder="License Plate" 
                              className="md:col-span-2 uppercase text-lg tracking-wider font-mono"
                              value={plateNumber}
                              onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                            />
                          </div>
                          <Button 
                            className="w-full h-12" 
                            size="lg"
                            onClick={handlePlateLookup}
                            disabled={!province || !plateNumber || isLookingUp}
                          >
                            {isLookingUp ? (
                              <><span className="animate-pulse">Looking Up Vehicle...</span></>
                            ) : (
                              <><Search className="mr-2 h-5 w-5" />Look Up Vehicle</>
                            )}
                          </Button>
                        </TabsContent>

                        <TabsContent value="vin" className="space-y-4">
                          <div className="space-y-2">
                            <Input 
                              placeholder="Enter 17-character VIN" 
                              className="uppercase text-lg tracking-wider font-mono"
                              maxLength={17}
                              value={vinNumber}
                              onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
                            />
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Find your VIN on your registration, insurance card, or driver-side door jamb
                            </p>
                          </div>
                          <Button 
                            className="w-full h-12" 
                            size="lg"
                            onClick={handleVinLookup}
                            disabled={vinNumber.length !== 17 || isLookingUp}
                          >
                            {isLookingUp ? (
                              <><span className="animate-pulse">Looking Up Vehicle...</span></>
                            ) : (
                              <><Search className="mr-2 h-5 w-5" />Look Up Vehicle</>
                            )}
                          </Button>
                        </TabsContent>

                        <TabsContent value="manual" className="space-y-4">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <Select value={selectedYear} onValueChange={setSelectedYear}>
                              <SelectTrigger>
                                <SelectValue placeholder="Year" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.from({ length: 25 }, (_, i) => 2025 - i).map((year) => (
                                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={selectedMake} onValueChange={(v) => { setSelectedMake(v); setSelectedModel(""); }}>
                              <SelectTrigger>
                                <SelectValue placeholder="Make" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(vehicleMakes).map((make) => (
                                  <SelectItem key={make} value={make}>{make}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedMake}>
                              <SelectTrigger>
                                <SelectValue placeholder="Model" />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedMake && vehicleMakes[selectedMake as keyof typeof vehicleMakes]?.map((model) => (
                                  <SelectItem key={model} value={model}>{model}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input 
                              placeholder="Trim (optional)" 
                              value={selectedTrim}
                              onChange={(e) => setSelectedTrim(e.target.value)}
                            />
                          </div>
                          <Input 
                            placeholder="Current Mileage (km)" 
                            type="number"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value)}
                            className="text-lg"
                          />
                          <Button 
                            className="w-full h-12" 
                            size="lg"
                            onClick={() => { setVehicleFound(true); nextStep(); }}
                            disabled={!selectedYear || !selectedMake || !selectedModel || !mileage}
                          >
                            <ArrowRight className="mr-2 h-5 w-5" />
                            Continue
                          </Button>
                        </TabsContent>
                      </Tabs>

                      {/* Vehicle Found Result */}
                      {vehicleFound && foundVehicle && lookupMethod !== "manual" && (
                        <div className="mt-6 p-5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-xl">
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-green-800 dark:text-green-200 font-semibold">Vehicle Found!</span>
                            <Badge className="bg-green-600 text-white ml-auto">Auto-Filled</Badge>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Year</span>
                              <p className="font-semibold text-lg">{foundVehicle.year}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Make</span>
                              <p className="font-semibold text-lg">{foundVehicle.make}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Model</span>
                              <p className="font-semibold text-lg">{foundVehicle.model}</p>
                            </div>
                            <div>
                              <span className="text-xs text-muted-foreground uppercase tracking-wide">Trim</span>
                              <p className="font-semibold text-lg">{foundVehicle.trim}</p>
                            </div>
                          </div>
                          <Button className="w-full mt-4 bg-green-600 hover:bg-green-700 h-12" onClick={nextStep}>
                            Continue with This Vehicle
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Step 2: Condition */}
                {step === 2 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Vehicle Condition
                      </CardTitle>
                      <CardDescription>
                        Help us give you the most accurate offer
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Vehicle Summary */}
                      <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{selectedYear} {selectedMake} {selectedModel} {selectedTrim}</p>
                          <p className="text-sm text-muted-foreground">{parseInt(mileage).toLocaleString()} km</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setStep(1)}>Edit</Button>
                      </div>

                      {/* Condition Selection */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Overall Condition</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {conditionOptions.map((opt) => (
                            <div
                              key={opt.value}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                condition === opt.value 
                                  ? "border-primary bg-primary/5" 
                                  : "border-muted hover:border-primary/50"
                              }`}
                              onClick={() => setCondition(opt.value)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">{opt.label}</span>
                                {condition === opt.value && <CheckCircle className="h-5 w-5 text-primary" />}
                              </div>
                              <p className="text-sm text-muted-foreground">{opt.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Additional Questions */}
                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base font-semibold">Additional Information</Label>
                        
                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                          <Checkbox 
                            id="accident" 
                            checked={hasAccident}
                            onCheckedChange={(c) => setHasAccident(c as boolean)}
                          />
                          <div className="space-y-1">
                            <Label htmlFor="accident" className="cursor-pointer font-medium">
                              Has this vehicle been in an accident?
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Include any collision, even minor fender benders
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                          <Checkbox 
                            id="mechanical" 
                            checked={hasMechanicalIssues}
                            onCheckedChange={(c) => setHasMechanicalIssues(c as boolean)}
                          />
                          <div className="space-y-1">
                            <Label htmlFor="mechanical" className="cursor-pointer font-medium">
                              Are there any mechanical issues?
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Check engine light, transmission issues, unusual sounds, etc.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                          <Checkbox 
                            id="lien" 
                            checked={hasLien}
                            onCheckedChange={(c) => setHasLien(c as boolean)}
                          />
                          <div className="space-y-1">
                            <Label htmlFor="lien" className="cursor-pointer font-medium">
                              Is there a loan or lien on this vehicle?
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              We can pay off your lender directly
                            </p>
                          </div>
                        </div>

                        {hasLien && (
                          <div className="ml-7 space-y-2">
                            <Label>Approximate Payoff Amount</Label>
                            <Input 
                              type="number" 
                              placeholder="Enter payoff amount"
                              value={payoffAmount}
                              onChange={(e) => setPayoffAmount(e.target.value)}
                              className="max-w-xs"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Additional Notes (optional)</Label>
                          <Textarea 
                            placeholder="Any other details about your vehicle..."
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={prevStep} className="flex-1">
                          Back
                        </Button>
                        <Button onClick={nextStep} className="flex-1">
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Photos */}
                {step === 3 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-primary" />
                        Add Photos (Optional)
                      </CardTitle>
                      <CardDescription>
                        Photos can increase your offer by up to 10%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Photo Upload Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["Front", "Back", "Interior", "Dashboard"].map((angle, i) => (
                          <div 
                            key={angle}
                            className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                          >
                            <Upload className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{angle}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">Photos boost your offer!</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Vehicles with photos typically receive offers 5-10% higher than those without.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={prevStep} className="flex-1">
                          Back
                        </Button>
                        <Button variant="outline" onClick={nextStep} className="flex-1">
                          Skip for Now
                        </Button>
                        <Button onClick={nextStep} className="flex-1">
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Get Offer */}
                {step === 4 && !isCalculating && !showOffer && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Get Your Instant Offer
                      </CardTitle>
                      <CardDescription>
                        Enter your contact info to receive your offer
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Vehicle Summary */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="font-semibold text-lg">{selectedYear} {selectedMake} {selectedModel} {selectedTrim}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          <span>{parseInt(mileage).toLocaleString()} km</span>
                          <span>|</span>
                          <span className="capitalize">{condition} condition</span>
                          {hasAccident && <><span>|</span><span>Accident history</span></>}
                        </div>
                      </div>

                      {/* Contact Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email Address</Label>
                          <Input 
                            type="email" 
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number</Label>
                          <Input 
                            type="tel" 
                            placeholder="(416) 555-1234"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Postal Code</Label>
                          <Input 
                            placeholder="A1A 1A1"
                            value={postalCode}
                            onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                            className="max-w-xs uppercase"
                          />
                          <p className="text-xs text-muted-foreground">For scheduling free pickup</p>
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">Your privacy is protected</p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              We never share your information. No spam calls, guaranteed.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={prevStep} className="flex-1">
                          Back
                        </Button>
                        <Button 
                          onClick={calculateOffer} 
                          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-lg"
                          disabled={!email || !phone}
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          Get My Offer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Calculating Animation */}
                {isCalculating && (
                  <Card className="shadow-lg">
                    <CardContent className="py-16 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <DollarSign className="h-10 w-10 text-primary animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Calculating Your Offer...</h3>
                      <Progress value={calculationProgress} className="max-w-md mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Checking Canadian Black Book values and market data
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Offer Display */}
        {showOffer && offer && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Your Instant Offer is Ready!</h2>
                  <p className="text-muted-foreground">Offer #{offer.offerNumber} | Valid until {offer.validUntil}</p>
                </div>

                {/* Main Offer Card */}
                <Card className="shadow-2xl border-2 border-primary mb-8 overflow-hidden">
                  <div className="bg-primary text-primary-foreground p-6 text-center">
                    <p className="text-sm uppercase tracking-wide mb-2">Your Planet Motors Trade-In Offer</p>
                    <p className="text-5xl font-bold">${offer.offerAmount.toLocaleString()}</p>
                    <p className="text-sm mt-2 opacity-80">Powered by Canadian Black Book</p>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    {/* Vehicle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold text-lg">{offer.vehicle}</p>
                        <p className="text-sm text-muted-foreground">{parseInt(offer.mileage).toLocaleString()} km | {offer.condition} condition</p>
                      </div>
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* CBB Value Range */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">CBB Value Range</span>
                        <span className="font-medium">${offer.cbbValue.low.toLocaleString()} - ${offer.cbbValue.high.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    {/* Payoff/Equity */}
                    {offer.payoff > 0 && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span>Trade-In Offer</span>
                          <span className="font-medium">${offer.offerAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Loan Payoff</span>
                          <span className="font-medium">-${offer.payoff.toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold text-lg">
                          <span>Your Equity</span>
                          <span className={offer.equity >= 0 ? "text-green-600" : "text-red-600"}>
                            ${Math.abs(offer.equity).toLocaleString()}
                            {offer.equity < 0 && " owed"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Comparison */}
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Dealer Trade-In</p>
                        <p className="font-medium text-muted-foreground line-through">${offer.comparison.dealerTrade.toLocaleString()}</p>
                      </div>
                      <div className="text-center border-x">
                        <p className="text-sm text-primary font-medium mb-1">Planet Motors</p>
                        <p className="font-bold text-xl text-primary">${offer.offerAmount.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Private Sale (Est.)</p>
                        <p className="font-medium text-muted-foreground">${offer.comparison.privateSale.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Why Planet Motors */}
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div>
                        <Zap className="h-6 w-6 mx-auto mb-1 text-primary" />
                        <p className="font-medium">Instant Offer</p>
                        <p className="text-xs text-muted-foreground">No waiting</p>
                      </div>
                      <div>
                        <Truck className="h-6 w-6 mx-auto mb-1 text-primary" />
                        <p className="font-medium">Free Pickup</p>
                        <p className="text-xs text-muted-foreground">Canada-wide</p>
                      </div>
                      <div>
                        <CreditCard className="h-6 w-6 mx-auto mb-1 text-primary" />
                        <p className="font-medium">24h Payment</p>
                        <p className="text-xs text-muted-foreground">E-Transfer or cheque</p>
                      </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <Button size="lg" className="h-14 text-lg bg-accent hover:bg-accent/90 text-accent-foreground">
                        <ThumbsUp className="mr-2 h-5 w-5" />
                        Accept Offer
                      </Button>
                      <Button size="lg" variant="outline" className="h-14 text-lg">
                        <Car className="mr-2 h-5 w-5" />
                        Apply to a Purchase
                      </Button>
                    </div>

                    <p className="text-center text-sm text-muted-foreground">
                      Questions? Call us at <strong>1-866-787-3332</strong>
                    </p>
                  </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      What Happens Next?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">1</div>
                        <div>
                          <h4 className="font-semibold">Accept Your Offer</h4>
                          <p className="text-sm text-muted-foreground">Click accept and confirm your details</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">2</div>
                        <div>
                          <h4 className="font-semibold">Schedule Pickup</h4>
                          <p className="text-sm text-muted-foreground">We come to you, anywhere in Canada</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">3</div>
                        <div>
                          <h4 className="font-semibold">Get Paid</h4>
                          <p className="text-sm text-muted-foreground">Payment within 24 hours via e-Transfer</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* How It Works - Better than Clutch */}
        {!showOffer && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <Badge className="mb-4">Why Planet Motors</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  The Smarter Way to Trade-In
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Skip the dealership games. Get a fair price in 60 seconds, not 6 hours.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { 
                    icon: Zap, 
                    title: "60-Second Offers", 
                    desc: "Get an instant offer powered by Canadian Black Book. No waiting, no haggling.",
                    highlight: "vs. 2-3 days at Clutch"
                  },
                  { 
                    icon: TrendingUp, 
                    title: "Best Price Guarantee", 
                    desc: "We beat any competitor offer by $500 or we will give you $100.",
                    highlight: "Guaranteed"
                  },
                  { 
                    icon: Truck, 
                    title: "Free Canada-Wide Pickup", 
                    desc: "We come to your home or office. No need to drive anywhere.",
                    highlight: "100% Free"
                  },
                  { 
                    icon: CreditCard, 
                    title: "24-Hour Payment", 
                    desc: "Get paid within 24 hours via e-Transfer or certified cheque.",
                    highlight: "Fast Cash"
                  },
                ].map((item, i) => (
                  <Card key={i} className="relative overflow-hidden border-2 hover:border-primary transition-all group">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <item.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{item.desc}</p>
                      <Badge variant="secondary" className="text-xs">
                        {item.highlight}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Comparison Table */}
        {!showOffer && (
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">How We Compare</h2>
                <p className="text-muted-foreground">See why Canadians choose Planet Motors</p>
              </div>
              
              <div className="max-w-4xl mx-auto overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left p-4">Feature</th>
                      <th className="p-4 bg-primary text-primary-foreground rounded-t-lg">
                        <div className="flex items-center justify-center gap-2">
                          <Award className="h-5 w-5" />
                          Planet Motors
                        </div>
                      </th>
                      <th className="p-4 text-muted-foreground">Clutch</th>
                      <th className="p-4 text-muted-foreground">Traditional Dealer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Offer Speed", "60 seconds", "2-3 days", "2+ hours"],
                      ["Price Guarantee", "Beat by $500", "No", "No"],
                      ["Pickup Service", "Free, Canada-wide", "$299", "N/A"],
                      ["Payment Time", "24 hours", "3-5 days", "Same day (cheque)"],
                      ["Valuation Source", "Canadian Black Book", "Internal", "Trade-in guides"],
                      ["Phone Calls Required", "None", "Multiple", "Many"],
                      ["Haggling", "No games", "Some", "Expected"],
                    ].map(([feature, pm, clutch, dealer], i) => (
                      <tr key={i} className="border-b">
                        <td className="p-4 font-medium">{feature}</td>
                        <td className="p-4 bg-primary/5 text-center font-semibold text-primary">{pm}</td>
                        <td className="p-4 text-center text-muted-foreground">{clutch}</td>
                        <td className="p-4 text-center text-muted-foreground">{dealer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        {!showOffer && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">What Canadians Are Saying</h2>
                <div className="flex items-center justify-center gap-2 text-amber-500">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
                  <span className="ml-2 text-foreground font-medium">4.9/5 from 2,500+ reviews</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    name: "Sarah M.",
                    location: "Toronto, ON",
                    text: "Got $3,000 more than what the dealer offered. The whole process took 30 minutes and they picked up my car from work!",
                    rating: 5,
                  },
                  {
                    name: "Mike R.",
                    location: "Vancouver, BC",
                    text: "No games, no haggling. Just a fair price and quick payment. Exactly what I was looking for. Way better than dealing with Craigslist.",
                    rating: 5,
                  },
                  {
                    name: "Jennifer L.",
                    location: "Calgary, AB",
                    text: "They paid off my loan directly and e-Transferred my equity the next day. So easy compared to trading in at a dealership.",
                    rating: 5,
                  },
                ].map((review, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-center gap-1 mb-3 text-amber-500">
                      {Array(review.rating).fill(0).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">&quot;{review.text}&quot;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{review.name}</p>
                        <p className="text-sm text-muted-foreground">{review.location}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        {!showOffer && (
          <section className="py-20 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Your Offer?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of Canadians who have already traded in their vehicles with Planet Motors.
              </p>
              <Button 
                size="lg" 
                variant="secondary" 
                className="h-14 px-8 text-lg"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Get My Instant Offer
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-4 text-sm opacity-70">
                No phone calls. No spam. See your offer in 60 seconds.
              </p>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  )
}
