"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Car, CheckCircle, ArrowRight, DollarSign, Clock, Shield, Camera, Upload, Zap, 
  TrendingUp, Star, Truck, Phone, ChevronRight, Sparkles, Target, Award, MapPin, 
  Calendar, Users, ThumbsUp, Banknote, FileCheck, HandCoins, Building2, CreditCard,
  CircleDollarSign, ArrowUpRight, Timer, BadgeCheck, Gift, Heart, Percent, Lock, Search
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

const testimonials = [
  {
    name: "Michael Chen",
    location: "Toronto, ON",
    car: "2020 Tesla Model 3",
    amount: "$42,500",
    quote: "Got $3,000 more than Clutch offered. Payment was in my account the next day.",
    rating: 5,
    avatar: "MC"
  },
  {
    name: "Sarah Williams",
    location: "Vancouver, BC",
    car: "2021 BMW X5",
    amount: "$58,900",
    quote: "Easiest car sale ever. They picked it up from my house and paid me on the spot.",
    rating: 5,
    avatar: "SW"
  },
  {
    name: "David Kumar",
    location: "Calgary, AB",
    car: "2019 Honda Accord",
    amount: "$24,200",
    quote: "Beat CarGurus and AutoTrader offers by $2,800. Highly recommend!",
    rating: 5,
    avatar: "DK"
  },
]

const comparisons = [
  { feature: "Online Offer Time", planetMotors: "60 seconds", competitors: "24-48 hours" },
  { feature: "Price Guarantee", planetMotors: "7 days", competitors: "None" },
  { feature: "Free Pickup", planetMotors: "Canada-wide", competitors: "Limited areas" },
  { feature: "Payment Speed", planetMotors: "Same day", competitors: "3-5 days" },
  { feature: "Price Match", planetMotors: "$500 guarantee", competitors: "No" },
  { feature: "Paperwork", planetMotors: "We handle it", competitors: "You do it" },
]

const recentSales = [
  { car: "2022 Toyota RAV4 XLE", location: "Toronto", time: "2 hours ago", amount: "$34,500" },
  { car: "2021 Honda CR-V Touring", location: "Ottawa", time: "4 hours ago", amount: "$31,200" },
  { car: "2023 Tesla Model Y", location: "Vancouver", time: "5 hours ago", amount: "$52,800" },
  { car: "2020 BMW 3 Series", location: "Calgary", time: "Yesterday", amount: "$38,900" },
]

export default function SellYourCarPage() {
  const [step, setStep] = useState(1)
  const [lookupMethod, setLookupMethod] = useState<"plate" | "vin" | "manual">("plate")
  const [province, setProvince] = useState("")
  const [plateNumber, setPlateNumber] = useState("")
  const [vinNumber, setVinNumber] = useState("")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [vehicleFound, setVehicleFound] = useState(false)
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedMake, setSelectedMake] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedTrim, setSelectedTrim] = useState("")
  const [mileage, setMileage] = useState("")
  const [condition, setCondition] = useState("good")
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationProgress, setCalculationProgress] = useState(0)
  const [calculationStep, setCalculationStep] = useState("")
  const [showOffer, setShowOffer] = useState(false)
  const [offer, setOffer] = useState<any>(null)
  const [liveViewers, setLiveViewers] = useState(47)
  
  // Contact details
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [postalCode, setPostalCode] = useState("")
  
  // Condition questions
  const [hasAccident, setHasAccident] = useState(false)
  const [hasMechanicalIssues, setHasMechanicalIssues] = useState(false)
  const [hasLien, setHasLien] = useState(false)
  const [payoffAmount, setPayoffAmount] = useState("")

  // Simulate live viewers with deterministic pattern
  useEffect(() => {
    let tick = 0
    const interval = setInterval(() => {
      tick++
      const change = (tick % 5) - 2 // cycles: -2, -1, 0, 1, 2
      setLiveViewers(prev => Math.max(20, Math.min(40, prev + change)))
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const handlePlateLookup = async () => {
    if (!province || !plateNumber) return
    setIsLookingUp(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setVehicleFound(true)
    setSelectedYear("2021")
    setSelectedMake("Honda")
    setSelectedModel("Accord")
    setSelectedTrim("Sport 2.0T")
    setMileage("45000")
    setIsLookingUp(false)
    setStep(2)
  }

  const handleVinLookup = async () => {
    if (!vinNumber || vinNumber.length < 17) return
    setIsLookingUp(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setVehicleFound(true)
    setSelectedYear("2022")
    setSelectedMake("Tesla")
    setSelectedModel("Model 3")
    setSelectedTrim("Long Range")
    setMileage("32000")
    setIsLookingUp(false)
    setStep(2)
  }

  const calculateOffer = async () => {
    setIsCalculating(true)
    setCalculationProgress(0)
    
    const steps = [
      "Analyzing Canadian Black Book data...",
      "Checking 150+ auction records...",
      "Evaluating market demand in your area...",
      "Applying condition adjustments...",
      "Calculating your best offer..."
    ]
    
    for (let i = 0; i < steps.length; i++) {
      setCalculationStep(steps[i])
      await new Promise(resolve => setTimeout(resolve, 800))
      setCalculationProgress((i + 1) * 20)
    }
    
    const baseValue = 32500
    const conditionMultiplier = conditionOptions.find(c => c.value === condition)?.multiplier || 1
    let finalValue = baseValue * conditionMultiplier
    
    if (hasAccident) finalValue *= 0.85
    if (hasMechanicalIssues) finalValue *= 0.92
    
    const midValue = Math.round(finalValue / 100) * 100
    const equity = hasLien && payoffAmount ? midValue - parseFloat(payoffAmount) : midValue
    
    setOffer({
      offerNumber: `PM-SELL-${Date.now().toString(36).toUpperCase()}`,
      vehicle: `${selectedYear} ${selectedMake} ${selectedModel}`,
      mileage: mileage,
      condition: condition,
      offerAmount: midValue,
      bonus: 500,
      totalOffer: midValue + 500,
      payoff: hasLien ? parseFloat(payoffAmount) || 0 : 0,
      equity: equity + 500,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
      comparison: {
        clutch: Math.round(midValue * 0.92 / 100) * 100,
        carvana: Math.round(midValue * 0.88 / 100) * 100,
        carmax: Math.round(midValue * 0.90 / 100) * 100,
        dealerTrade: Math.round(midValue * 0.85 / 100) * 100,
      }
    })
    
    setIsCalculating(false)
    setShowOffer(true)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Premium Hero Section */}
        <section className="relative bg-gradient-to-br from-primary via-primary to-primary/90 pt-16 pb-24 overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0">
            <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-accent/20 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
            <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-white/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
          </div>
          
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          
          <div className="container mx-auto px-4 relative">
            {/* Live activity badge */}
            <div className="flex justify-center mb-8">
              <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md text-white px-5 py-2.5 rounded-full border border-white/20">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                </span>
                <span className="text-sm font-medium">{liveViewers} sellers getting offers right now</span>
                <span className="w-px h-4 bg-white/30" />
                <span className="text-sm text-white/70">Updated live</span>
              </div>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="text-center lg:text-left">
                <Badge className="bg-accent text-accent-foreground mb-6 px-4 py-1.5">
                  <Gift className="h-3.5 w-3.5 mr-1.5" />
                  Limited Time: $500 Bonus on All Offers
                </Badge>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1]">
                  Get Paid More<br />
                  <span className="text-white/90">For Your Car</span>
                </h1>
                
                <p className="text-xl text-white/80 mb-8 max-w-lg">
                  Instant cash offer in 60 seconds. We beat Clutch, Carvana, and CarMax prices - 
                  guaranteed, or we&apos;ll pay you $500.
                </p>
                
                {/* Social proof stats */}
                <div className="grid grid-cols-3 gap-3 sm:gap-8 mb-10">
                  <div className="text-center lg:text-left">
                    <div className="text-2xl sm:text-4xl font-bold text-white mb-1">$18M+</div>
                    <div className="text-xs sm:text-sm text-white/60">Paid to Sellers</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl sm:text-4xl font-bold text-white mb-1">24hrs</div>
                    <div className="text-xs sm:text-sm text-white/60">Avg. Payment</div>
                  </div>
                  <div className="text-center lg:text-left">
                    <div className="text-2xl sm:text-4xl font-bold text-white mb-1">4.9</div>
                    <div className="flex items-center gap-0.5 justify-center lg:justify-start">
                      {[1,2,3,4,5].map(i => <Star key={i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-400 fill-amber-400" />)}
                    </div>
                  </div>
                </div>
                
                {/* Trust badges */}
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm px-3 py-1.5">
                    <Shield className="h-3.5 w-3.5 mr-1.5" /> $500 Price Beat Guarantee
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm px-3 py-1.5">
                    <Truck className="h-3.5 w-3.5 mr-1.5" /> Free Canada-Wide Pickup
                  </Badge>
                  <Badge variant="outline" className="bg-white/10 text-white border-white/20 backdrop-blur-sm px-3 py-1.5">
                    <Banknote className="h-3.5 w-3.5 mr-1.5" /> Same-Day Payment
                  </Badge>
                </div>
              </div>
              
              {/* Main Form Card */}
              <div className="lg:pl-4">
                {!showOffer ? (
                  <Card className="shadow-2xl border-0 overflow-hidden">
                    {/* Card Header with gradient */}
                    <div className="bg-gradient-to-r from-primary/5 to-accent/5 px-6 py-4 border-b">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold">Get Your Instant Offer</h2>
                          <p className="text-sm text-muted-foreground">Takes less than 60 seconds</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          <Lock className="h-3.5 w-3.5" />
                          Secure
                        </div>
                      </div>
                    </div>
                    
                    <CardContent className="p-6">
                      {step === 1 && (
                        <div className="space-y-5">
                          <Tabs value={lookupMethod} onValueChange={(v: "plate" | "vin" | "manual") => setLookupMethod(v)}>
                            <TabsList className="grid w-full grid-cols-3 mb-4">
                              <TabsTrigger value="plate" className="text-xs sm:text-sm">License Plate</TabsTrigger>
                              <TabsTrigger value="vin" className="text-xs sm:text-sm">VIN Number</TabsTrigger>
                              <TabsTrigger value="manual" className="text-xs sm:text-sm">Manual Entry</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="plate" className="space-y-4">
                              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm">
                                <p className="text-primary font-medium">Fastest way to get your offer</p>
                                <p className="text-muted-foreground text-xs mt-1">We&apos;ll automatically retrieve your vehicle details</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <Select value={province} onValueChange={setProvince}>
                                  <SelectTrigger className="h-12">
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
                                    <SelectItem value="PE">PEI</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Input 
                                  placeholder="License Plate" 
                                  className="col-span-2 h-12 uppercase text-lg tracking-wider font-mono"
                                  value={plateNumber}
                                  onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                                  maxLength={8}
                                />
                              </div>
                              <Button 
                                className="w-full h-14 text-lg font-semibold"
                                size="lg"
                                onClick={handlePlateLookup}
                                disabled={!province || !plateNumber || isLookingUp}
                              >
                                {isLookingUp ? (
                                  <>
                                    <span className="animate-spin mr-2">&#9696;</span>
                                    Looking up your vehicle...
                                  </>
                                ) : (
                                  <>
                                    Look Up My Vehicle
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                  </>
                                )}
                              </Button>
                            </TabsContent>
                            
                            <TabsContent value="vin" className="space-y-4">
                              <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                <p className="font-medium">Where to find your VIN</p>
                                <p className="text-muted-foreground text-xs mt-1">Check your dashboard (driver side), door jamb, or registration documents</p>
                              </div>
                              <Input 
                                placeholder="Enter 17-character VIN" 
                                className="h-12 uppercase text-lg tracking-wider font-mono"
                                value={vinNumber}
                                onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
                                maxLength={17}
                              />
                              <div className="text-xs text-muted-foreground text-center">
                                {vinNumber.length}/17 characters
                              </div>
                              <Button 
                                className="w-full h-14 text-lg font-semibold"
                                size="lg"
                                onClick={handleVinLookup}
                                disabled={vinNumber.length < 17 || isLookingUp}
                              >
                                {isLookingUp ? (
                                  <>
                                    <span className="animate-spin mr-2">&#9696;</span>
                                    Decoding VIN...
                                  </>
                                ) : (
                                  <>
                                    Decode VIN
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                  </>
                                )}
                              </Button>
                            </TabsContent>
                            
                            <TabsContent value="manual" className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">Year</Label>
                                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="h-12">
                                      <SelectValue placeholder="Select Year" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: 25 }, (_, i) => 2025 - i).map((year) => (
                                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">Make</Label>
                                  <Select value={selectedMake} onValueChange={(v) => { setSelectedMake(v); setSelectedModel(""); }}>
                                    <SelectTrigger className="h-12">
                                      <SelectValue placeholder="Select Make" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.keys(vehicleMakes).map((make) => (
                                        <SelectItem key={make} value={make}>{make}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">Model</Label>
                                  <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedMake}>
                                    <SelectTrigger className="h-12">
                                      <SelectValue placeholder="Select Model" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedMake && vehicleMakes[selectedMake as keyof typeof vehicleMakes]?.map((model) => (
                                        <SelectItem key={model} value={model}>{model}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <Label className="text-sm font-medium mb-2 block">Mileage (km)</Label>
                                  <Input 
                                    placeholder="e.g. 45,000" 
                                    className="h-12"
                                    value={mileage}
                                    onChange={(e) => setMileage(e.target.value)}
                                  />
                                </div>
                              </div>
                              
                              <Button 
                                className="w-full h-14 text-lg font-semibold"
                                size="lg"
                                onClick={() => setStep(2)}
                                disabled={!selectedYear || !selectedMake || !selectedModel || !mileage}
                              >
                                Continue
                                <ArrowRight className="ml-2 h-5 w-5" />
                              </Button>
                            </TabsContent>
                          </Tabs>
                        </div>
                      )}
                      
                      {step === 2 && (
                        <div className="space-y-5">
                          <div>
                            <Label className="text-sm font-medium mb-3 block">Vehicle Condition</Label>
                            <div className="grid gap-3">
                              {conditionOptions.map((opt) => (
                                <div 
                                  key={opt.value}
                                  className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                                    condition === opt.value 
                                      ? "border-primary bg-primary/5" 
                                      : "border-border hover:border-primary/30"
                                  }`}
                                  onClick={() => setCondition(opt.value)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold">{opt.label}</div>
                                      <div className="text-sm text-muted-foreground">{opt.description}</div>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                      condition === opt.value ? "border-primary bg-primary" : "border-muted-foreground"
                                    }`}>
                                      {condition === opt.value && <CheckCircle className="h-4 w-4 text-white" />}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                id="accident" 
                                checked={hasAccident} 
                                onCheckedChange={(c) => setHasAccident(c as boolean)} 
                              />
                              <Label htmlFor="accident" className="text-sm cursor-pointer">
                                Has this vehicle been in an accident?
                              </Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                id="mechanical" 
                                checked={hasMechanicalIssues} 
                                onCheckedChange={(c) => setHasMechanicalIssues(c as boolean)} 
                              />
                              <Label htmlFor="mechanical" className="text-sm cursor-pointer">
                                Any mechanical issues or warning lights?
                              </Label>
                            </div>
                            <div className="flex items-center gap-3">
                              <Checkbox 
                                id="lien" 
                                checked={hasLien} 
                                onCheckedChange={(c) => setHasLien(c as boolean)} 
                              />
                              <Label htmlFor="lien" className="text-sm cursor-pointer">
                                Is there an outstanding loan or lien?
                              </Label>
                            </div>
                            {hasLien && (
                              <div className="pl-7">
                                <Input 
                                  placeholder="Remaining payoff amount" 
                                  className="h-10"
                                  value={payoffAmount}
                                  onChange={(e) => setPayoffAmount(e.target.value)}
                                />
                              </div>
                            )}
                          </div>
                          
                          <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(1)}>
                              Back
                            </Button>
                            <Button className="flex-1 h-12" onClick={() => setStep(3)}>
                              Continue
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                      
                      {step === 3 && (
                        <div className="space-y-5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">First Name</Label>
                              <Input 
                                placeholder="John" 
                                className="h-12"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Last Name</Label>
                              <Input 
                                placeholder="Smith" 
                                className="h-12"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium mb-2 block">Email Address</Label>
                            <Input 
                              type="email"
                              placeholder="john@example.com" 
                              className="h-12"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Phone Number</Label>
                              <Input 
                                placeholder="(416) 555-0123" 
                                className="h-12"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label className="text-sm font-medium mb-2 block">Postal Code</Label>
                              <Input 
                                placeholder="M5V 1A1" 
                                className="h-12"
                                value={postalCode}
                                onChange={(e) => setPostalCode(e.target.value.toUpperCase())}
                              />
                            </div>
                          </div>
                          
                          <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 h-12" onClick={() => setStep(2)}>
                              Back
                            </Button>
                            <Button 
                              className="flex-1 h-14 text-lg font-semibold"
                              onClick={calculateOffer}
                              disabled={!firstName || !email || !phone}
                            >
                              Get My Cash Offer
                              <Sparkles className="ml-2 h-5 w-5" />
                            </Button>
                          </div>
                          
                          <p className="text-xs text-center text-muted-foreground">
                            By submitting, you agree to our Privacy Policy. No spam, ever.
                          </p>
                        </div>
                      )}
                      
                      {/* Calculation Animation */}
                      {isCalculating && (
                        <div className="py-8 text-center">
                          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                            <CircleDollarSign className="h-10 w-10 text-primary animate-pulse" />
                          </div>
                          <h3 className="text-xl font-semibold mb-2">Calculating Your Offer</h3>
                          <p className="text-muted-foreground mb-6">{calculationStep}</p>
                          <Progress value={calculationProgress} className="h-2 max-w-xs mx-auto" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  /* Offer Card */
                  <Card className="shadow-2xl border-0 overflow-hidden">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-6 text-white text-center">
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-3">
                        <CheckCircle className="h-4 w-4" />
                        Offer Generated
                      </div>
                      <h2 className="text-2xl font-bold mb-1">Your Cash Offer</h2>
                      <p className="text-white/80 text-sm">Offer #{offer?.offerNumber}</p>
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="text-center mb-6">
                        <div className="text-5xl font-bold text-foreground mb-2">
                          ${offer?.totalOffer.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-green-600 font-medium">
                          <Gift className="h-4 w-4" />
                          Includes $500 bonus
                        </div>
                      </div>
                      
                      <div className="bg-muted/50 rounded-xl p-4 mb-6">
                        <div className="flex items-center gap-3 mb-3">
                          <Car className="h-5 w-5 text-primary" />
                          <span className="font-semibold">{offer?.vehicle}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Mileage:</span>
                            <span>{parseInt(offer?.mileage).toLocaleString()} km</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Condition:</span>
                            <span className="capitalize">{offer?.condition}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Competitor comparison */}
                      <div className="mb-6">
                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                          You&apos;re Getting More With Us
                        </h4>
                        <div className="space-y-2">
                          {[
                            { name: "Clutch.ca", value: offer?.comparison.clutch },
                            { name: "Carvana", value: offer?.comparison.carvana },
                            { name: "CarMax", value: offer?.comparison.carmax },
                            { name: "Dealer Trade-In", value: offer?.comparison.dealerTrade },
                          ].map((comp) => (
                            <div key={comp.name} className="flex items-center justify-between py-2 border-b border-border/50">
                              <span className="text-muted-foreground">{comp.name}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground line-through">${comp.value?.toLocaleString()}</span>
                                <Badge variant="secondary" className="bg-green-100 text-green-700">
                                  +${(offer?.totalOffer - comp.value).toLocaleString()}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                        <Timer className="h-4 w-4" />
                        Offer valid until {offer?.validUntil}
                      </div>
                      
                      <div className="space-y-3">
                        <Button className="w-full h-14 text-lg font-semibold bg-green-600 hover:bg-green-700">
                          <Banknote className="mr-2 h-5 w-5" />
                          Accept & Schedule Pickup
                        </Button>
                        <Button variant="outline" className="w-full h-12">
                          <Phone className="mr-2 h-4 w-4" />
                          Call to Discuss: 1-866-787-3332
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </section>
        
        {/* How We Beat The Competition */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge variant="outline" className="mb-4 px-4 py-1">
                <TrendingUp className="w-3 h-3 mr-1" />
                Why We Pay More
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                How We Beat Clutch, Carvana & CarMax
              </h2>
              <p className="text-muted-foreground">
                We&apos;re not middlemen. We buy cars directly, which means we can pay you more.
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden border-2">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2">
                        <th className="text-left p-5 font-semibold">Feature</th>
                        <th className="p-5 text-center bg-primary/10 border-x-2 border-primary/20">
                          <div className="flex items-center justify-center gap-2">
                            <Award className="h-5 w-5 text-primary" />
                            <span className="font-bold text-primary">Planet Motors</span>
                          </div>
                        </th>
                        <th className="p-5 text-center text-muted-foreground">Others</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisons.map((row, index) => (
                        <tr key={row.feature} className={index % 2 === 0 ? "" : "bg-muted/30"}>
                          <td className="p-4 font-medium">{row.feature}</td>
                          <td className="p-4 text-center bg-primary/5 border-x border-primary/10">
                            <span className="font-semibold text-primary">{row.planetMotors}</span>
                          </td>
                          <td className="p-4 text-center text-muted-foreground">{row.competitors}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        </section>
        
        {/* Recent Sales Ticker */}
        <section className="py-6 bg-primary text-white overflow-hidden">
          <div className="flex items-center gap-8 animate-marquee">
            {[...recentSales, ...recentSales].map((sale, i) => (
              <div key={i} className="flex items-center gap-4 whitespace-nowrap">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="font-semibold">{sale.car}</span>
                <span className="text-white/70">{sale.location}</span>
                <span className="font-bold text-green-400">{sale.amount}</span>
                <span className="text-white/50">{sale.time}</span>
                <span className="w-px h-4 bg-white/30 mx-4" />
              </div>
            ))}
          </div>
        </section>
        
        {/* Testimonials */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trusted by 15,000+ Sellers
              </h2>
              <p className="text-muted-foreground">
                See why Canadians choose Planet Motors over the competition.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {testimonials.map((t) => (
                <Card key={t.name} className="border-2 hover:border-primary/30 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`h-5 w-5 ${i <= t.rating ? "text-amber-400 fill-amber-400" : "text-muted"}`} />
                      ))}
                    </div>
                    <p className="text-foreground mb-6">&quot;{t.quote}&quot;</p>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                        {t.avatar}
                      </div>
                      <div>
                        <div className="font-semibold">{t.name}</div>
                        <div className="text-sm text-muted-foreground">{t.car}</div>
                        <div className="text-sm font-semibold text-green-600">{t.amount}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
        
        {/* How It Works */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Sell Your Car in 3 Simple Steps
              </h2>
              <p className="text-muted-foreground">
                No dealerships, no strangers, no hassle. Sell from your couch.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  step: 1,
                  icon: Car,
                  title: "Get Your Instant Offer",
                  description: "Enter your vehicle details and get a competitive cash offer in 60 seconds.",
                  time: "60 seconds"
                },
                {
                  step: 2,
                  icon: Calendar,
                  title: "Schedule Free Pickup",
                  description: "Choose a time that works for you. We'll come to your home or office.",
                  time: "Your schedule"
                },
                {
                  step: 3,
                  icon: Banknote,
                  title: "Get Paid Same Day",
                  description: "We verify your vehicle and pay you instantly via e-transfer or cheque.",
                  time: "Same day"
                }
              ].map((s) => (
                <div key={s.step} className="relative">
                  <Card className="h-full border-2 hover:border-primary/30 hover:shadow-lg transition-all">
                    <CardContent className="p-8 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-6">
                        <s.icon className="h-8 w-8" />
                      </div>
                      <Badge variant="secondary" className="mb-4">{s.time}</Badge>
                      <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                      <p className="text-muted-foreground">{s.description}</p>
                    </CardContent>
                  </Card>
                  {s.step < 3 && (
                    <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ChevronRight className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Final CTA */}
        <section className="py-20 bg-gradient-to-br from-primary to-primary/90 text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="max-w-3xl mx-auto">
              <Badge className="bg-white/20 text-white border-white/30 mb-6">
                <Sparkles className="h-3 w-3 mr-1" />
                Limited Time Offer
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Get $500 Extra on Your Offer
              </h2>
              <p className="text-xl text-white/80 mb-8 max-w-xl mx-auto">
                For a limited time, we&apos;re adding $500 to every accepted offer. Don&apos;t miss out.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button size="lg" variant="secondary" className="h-14 px-8 text-lg">
                  Get My Cash Offer
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/30 text-white hover:bg-white/10">
                  <Phone className="mr-2 h-5 w-5" />
                  1-866-787-3332
                </Button>
              </div>
              <p className="mt-6 text-white/60 text-sm">
                No obligation. See your offer in 60 seconds.
              </p>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
      
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
