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
import { Input } from "@/components/ui/input"
import { 
  ChevronLeft, ChevronRight, Heart, Share2, MapPin, Fuel, Gauge, 
  Calendar, Settings, Shield, CheckCircle, Calculator, Car, 
  FileText, History, Zap, RotateCcw, DollarSign, CreditCard,
  Phone, MessageCircle, Star, Clock, TrendingUp, Eye, Users,
  Award, Battery, Thermometer, Lock, Truck, ArrowRight, Play,
  Download, ExternalLink, Check, X, AlertCircle, Bell, Expand,
  Key, Sofa, Cog, Info
} from "lucide-react"
import { ScheduleTestDrive } from "@/components/schedule-test-drive"
import { SimilarVehicles } from "@/components/similar-vehicles"
import { ReserveVehicleModal } from "@/components/reserve-vehicle-modal"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
  transmission: "Automatic",
  drivetrain: "AWD",
  engine: "Dual Motor",
  seats: 5,
  keys: 2,
  vin: "5YJ3E1EA1PF123456",
  stockNumber: "PM24-1234",
  carfaxUrl: "https://www.carfax.ca/vehicle/5YJ3E1EA1PF123456",
  carfaxScore: "No Accidents Reported",
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
  interiorImages: [
    "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop",
    "https://images.unsplash.com/photo-1571127236794-81c0bbfe1ce3?w=800&h=600&fit=crop"
  ],
  features: {
    comfortConvenience: ["Heated Seats", "Power Liftgate", "Wireless Charging", "Premium Audio"],
    safetySecurity: ["Autopilot", "Collision Avoidance", "Blind Spot Monitoring", "360 Camera"],
    entertainmentTech: ["15\" Touchscreen", "Premium Connectivity", "Bluetooth", "USB-C Ports"],
    brakingTraction: ["Regenerative Braking", "Traction Control", "ABS", "Stability Control"]
  },
  specs: {
    range: "576 km",
    exterior: "Pearl White",
    interior: "Black",
    drive: "AWD"
  },
  packages: ["Premium Package", "Enhanced Autopilot"],
  inspectionScore: 210,
  inspectionCategories: [
    { name: "VIN & History", points: 10, icon: "history" },
    { name: "Powertrain & Engine", points: 22, icon: "engine" },
    { name: "Brakes & Suspension", points: 13, icon: "brakes" },
    { name: "Tyres & Wheels", points: 8, icon: "wheel" },
    { name: "Exterior", points: 21, icon: "car" },
    { name: "Interior", points: 20, icon: "interior" },
    { name: "Drive Test", points: 10, icon: "drive" },
    { name: "EV Systems", points: 12, icon: "ev" },
    { name: "Detailing & Safety", points: 94, icon: "safety" }
  ],
  inspectionItems: [
    { category: "Under the hood", status: "Passed" },
    { category: "Exterior", status: "Passed" },
    { category: "Interior", status: "Passed" },
    { category: "How it drives", status: "Passed" },
    { category: "How it looks", status: "Passed" },
    { category: "Detailing", status: "Passed" },
    { category: "History", status: "No reported accidents" }
  ],
  vinHistoryItems: [
    { item: "VIN verified (door jamb, dash, frame)", status: "Pass" },
    { item: "Lien search — no outstanding liens", status: "Pass" },
    { item: "CARFAX Canada history report clear", status: "Pass" },
    { item: "All outstanding recalls cleared", status: "Pass" },
    { item: "RCMP/CPIC stolen vehicle check — clear", status: "Pass" },
    { item: "Odometer accuracy verified", status: "Pass" },
    { item: "Clean Ontario title — no branding", status: "Pass" },
    { item: "No flood or water damage history", status: "Pass" },
    { item: "Airbag deployment history — none", status: "Pass" },
    { item: "Structural integrity — no frame damage", status: "Pass" }
  ],
  fullInspection: {
    vinHistory: [
      "VIN verified (door jamb, dash, frame)",
      "Lien search — no outstanding liens",
      "CARFAX Canada history report clear",
      "All outstanding recalls cleared",
      "RCMP/CPIC stolen vehicle check — clear",
      "Odometer accuracy verified",
      "Clean Ontario title — no branding",
      "No flood or water damage history",
      "Airbag deployment history — none",
      "Structural integrity — no frame damage"
    ],
    powertrainEngine: [
      "Engine oil level & condition",
      "Transmission fluid level & condition",
      "12V battery load test ≥ 75% capacity",
      "Alternator output & charging system",
      "Water pump — no leaks or noise",
      "Ignition system & spark plugs",
      "Fuel system — no leaks, proper pressure",
      "Radiator & coolant system",
      "Coolant level & freeze protection",
      "A/C system — cold air output verified",
      "No oil, coolant, or fluid leaks",
      "Belts & hoses — no cracks or wear",
      "Engine mounts — secure, no excess vibration",
      "Exhaust manifold — no leaks",
      "Catalytic converter function",
      "Timing belt/chain condition",
      "Valve cover gaskets — no leaks",
      "PCV valve function",
      "Air filter condition",
      "Throttle body & idle quality",
      "Turbo/supercharger (if equipped)",
      "Engine computer — no stored codes"
    ],
    brakesSuspension: [
      "Master cylinder & brake fluid level",
      "Front brake pad thickness ≥ 4mm",
      "Rear brake pad thickness ≥ 4mm",
      "Rotors & drums — no scoring or warping",
      "Brake calipers — no leaks, proper movement",
      "Brake lines & hoses — no damage",
      "Parking brake function verified",
      "Springs & shock absorbers — no leaks",
      "Control arm bushings & ball joints",
      "CV joints & axle boots",
      "Steering rack & tie rods",
      "Power steering fluid & pump operation",
      "Wheel bearings — no noise or play"
    ],
    tyresWheels: [
      "Tread depth all four tyres ≥ 4/32\"",
      "No uneven wear, bulges or cracks",
      "Tyre pressure set to spec",
      "Alloy rims — no cracks or bends",
      "Valve stems & caps intact",
      "Lug nuts torqued to spec",
      "TPMS sensors functional",
      "Spare tyre & jack kit present"
    ],
    exterior: [
      "Exhaust system & Ontario emissions",
      "All exterior lights — headlights, tail, signal, fog",
      "Door locks, handles & hinges",
      "Windshield & glass — no chips, cracks",
      "Body panels — no damage, rust or corrosion",
      "Wipers, mirrors, bumpers & trim",
      "Hood, trunk & fuel door operation",
      "Paint condition assessment",
      "Undercarriage inspection",
      "Frame & structural integrity",
      "Door seals & weatherstripping",
      "Antenna & exterior accessories",
      "Licence plate lights",
      "Tow hooks & recovery points",
      "Roof rails (if equipped)",
      "Sunroof/moonroof operation",
      "Convertible top (if equipped)",
      "Running boards/side steps",
      "Mud flaps & wheel well liners",
      "Trailer hitch (if equipped)",
      "Parking sensors verified"
    ],
    interior: [
      "Instrument cluster & all warning lights",
      "Infotainment, navigation & Bluetooth",
      "All seats — power, heat, fold function",
      "Seatbelts, airbag system & SRS light",
      "HVAC, defroster & cabin air filter",
      "USB ports, horn, key fob & owner's manual",
      "Power windows all positions",
      "Power door locks",
      "Interior lighting — dome, map, ambient",
      "Sunvisors & vanity mirrors",
      "Center console & storage compartments",
      "Cup holders & armrests",
      "Carpet & floor mat condition",
      "Headliner condition",
      "Rear seat access & function",
      "Child seat anchors (LATCH)",
      "Trunk/cargo area condition",
      "12V/USB charging ports",
      "Garage door opener (if equipped)",
      "Voice control system"
    ],
    driveTest: [
      "Cold start & idle quality",
      "Transmission — smooth shifts all gears",
      "Braking performance — straight stop",
      "Acceleration & throttle response",
      "No abnormal suspension noise",
      "Drivetrain — no vibration or clunking",
      "10 km road test completed",
      "ADAS features — lane assist, AEB verified",
      "Regen braking function (EV/hybrid)",
      "No warning lights at end of road test"
    ],
    evSystems: [
      "High-voltage battery SOH & SOC",
      "Battery management system (BMS) — no faults",
      "Charge port — no damage, latches correctly",
      "L1 & L2 charging verified",
      "DC fast charging (if equipped)",
      "HV cables & connectors — no damage",
      "Electric motor — no noise or fault codes",
      "Battery thermal management system",
      "On-board charger (OBC) function",
      "Autopilot / FSD hardware (Tesla)",
      "Software version — latest OTA update",
      "Energy consumption within range spec"
    ],
    detailingSafety: [
      "Paint depth measurement — OEM thickness confirmed",
      "Dent & paintwork inspection — PDR where required",
      "Clay bar, paint correction & ceramic coat prep",
      "Full interior detail — vacuum, shampoo, odour elimination",
      "Ontario SSC safety standards certificate issued",
      "OMVIC disclosure package prepared & signed",
      "All keys, remotes & charge cables present",
      "OBD-II full diagnostic — zero fault codes",
      "Advanced safety systems — camera, radar, park sensors",
      "Final QC sign-off by certified Planet Motors technician"
    ]
  },
  conditionItems: [
    "Vehicle passes Ontario Safety Standards Certificate requirements",
    "All mechanical systems inspected by a licensed technician",
    "Battery state of health verified (for EVs)",
    "Professionally detailed — interior and exterior"
  ],
  ratings: {
    overall: 4.8,
    description: "The 2024 Tesla Model 3 combines cutting-edge technology with exceptional performance. Perfect for Canadian drivers looking for a premium EV experience.",
    categories: [
      { name: "Performance", score: 4.9 },
      { name: "Efficiency", score: 5.0 },
      { name: "Comfort", score: 4.5 },
      { name: "Tech", score: 5.0 },
      { name: "Space", score: 4.2 },
      { name: "Reliability", score: 4.7 },
      { name: "Safety", score: 4.9 }
    ]
  },
  protectionPackages: [
    {
      name: "Basic",
      paymentMethod: "Cash only",
      moneyBack: true,
      dueAtCheckout: "Full purchase price",
      warranty: "—",
      tireRim: "—",
      gapCoverage: "—",
      lifeDisability: "—",
      price: "Included"
    },
    {
      name: "Essential Shield",
      paymentMethod: "Cash or Finance",
      moneyBack: true,
      dueAtCheckout: "$250 refundable deposit",
      warranty: "Standard",
      tireRim: "—",
      gapCoverage: "$50K",
      lifeDisability: "—",
      price: "$1,950"
    },
    {
      name: "Planet Care™",
      paymentMethod: "Cash or Finance",
      moneyBack: true,
      dueAtCheckout: "$250 refundable deposit",
      warranty: "Extended to 2034",
      tireRim: "—",
      gapCoverage: "$60K",
      lifeDisability: "~$1M life",
      price: "$3,000",
      recommended: true
    },
    {
      name: "Planet Care Plus™",
      paymentMethod: "Finance only",
      moneyBack: true,
      dueAtCheckout: "$250 refundable deposit",
      warranty: "Extended to 2034",
      tireRim: true,
      gapCoverage: "$60K",
      lifeDisability: "~$1M life",
      price: "$4,850"
    }
  ],
  pricing: {
    vehiclePrice: 52990,
    deliveryFee: 0,
    hst: 6889,
    omvicFee: 22,
    certificationFee: 595,
    licensingReg: 59,
    totalWithHst: 60555
  },
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
  const [activeTab, setActiveTab] = useState("photos")
  const [imageType, setImageType] = useState<"exterior" | "interior">("exterior")
  const [postalCode, setPostalCode] = useState("")
  const [viewCount, setViewCount] = useState(78)
  const [showInspectionModal, setShowInspectionModal] = useState(false)

  // Simulate live viewing count
  useEffect(() => {
    const interval = setInterval(() => {
      setViewCount(prev => Math.max(50, prev + Math.floor(Math.random() * 3) - 1))
    }, 8000)
    return () => clearInterval(interval)
  }, [])

  const nextImage = () => {
    const images = imageType === "exterior" ? vehicleData.images : vehicleData.interiorImages
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    const images = imageType === "exterior" ? vehicleData.images : vehicleData.interiorImages
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  const currentImages = imageType === "exterior" ? vehicleData.images : vehicleData.interiorImages
  const savings = vehicleData.originalPrice - vehicleData.price
  const biweeklyPayment = Math.round(vehicleData.price / 208) // Rough estimate for 8 years

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pb-20">
        {/* Breadcrumb */}
        <div className="bg-muted/30 py-3 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-sm">
              <Link href="/inventory" className="text-muted-foreground hover:text-foreground">
                All cars
              </Link>
              <span className="text-muted-foreground">›</span>
              <Link href={`/inventory?make=${vehicleData.make}`} className="text-muted-foreground hover:text-foreground">
                {vehicleData.make}
              </Link>
              <span className="text-muted-foreground">›</span>
              <span>{vehicleData.model}</span>
            </div>
          </div>
        </div>

        {/* Vehicle Title Bar */}
        <div className="border-b py-4">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold">
              {vehicleData.year} {vehicleData.make} {vehicleData.model}
            </h1>
            <p className="text-muted-foreground">
              {vehicleData.trim} · {vehicleData.mileage.toLocaleString()} km
            </p>
          </div>
        </div>

        {/* Main Tabs */}
        <div className="border-b sticky top-16 bg-background z-40">
          <div className="container mx-auto px-4">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="h-12 bg-transparent p-0 gap-0">
                {["Photos", "Overview", "Features", "Inspection", "Pricing", "Ratings", "Protection"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab.toLowerCase()}
                    className="h-12 px-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Content */}
            <div className="lg:col-span-2">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Photos Tab */}
                <TabsContent value="photos" className="mt-0 space-y-4">
                  <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-muted group">
                    <Image
                      src={currentImages[currentImageIndex]}
                      alt={`${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`}
                      fill
                      className="object-cover"
                      priority
                    />
                    
                    {/* Views Badge */}
                    <Badge className="absolute top-4 left-4 bg-red-500 text-white">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {viewCount}+ views today
                    </Badge>

                    {/* Expand Button */}
                    <button className="absolute top-4 right-4 w-10 h-10 bg-background/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-background transition">
                      <Expand className="w-5 h-5" />
                    </button>
                    
                    {/* Navigation Arrows */}
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-background transition opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-background transition opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Image Type Toggle */}
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant={imageType === "exterior" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => { setImageType("exterior"); setCurrentImageIndex(0) }}
                    >
                      Exterior
                    </Button>
                    <Button 
                      variant={imageType === "interior" ? "default" : "outline"} 
                      size="sm"
                      onClick={() => { setImageType("interior"); setCurrentImageIndex(0) }}
                    >
                      Interior
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Play className="w-4 h-4" />
                          Video Walkaround
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Video Walkaround - {vehicleData.title}</DialogTitle>
                        </DialogHeader>
                        <div className="aspect-video bg-black rounded-lg flex items-center justify-center">
                          <div className="text-center text-white">
                            <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                            <p className="text-lg">360° Video Walkaround</p>
                            <p className="text-sm text-white/70 mt-2">Watch a complete interior & exterior tour of this vehicle</p>
                            <Button variant="secondary" size="lg" className="mt-6">
                              <Play className="w-5 h-5 mr-2" />
                              Play Video
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mt-4">
                          <Button variant="outline" size="sm" className="justify-start">
                            <Car className="w-4 h-4 mr-2" /> Exterior Tour
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start">
                            <Users className="w-4 h-4 mr-2" /> Interior Tour
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start">
                            <Zap className="w-4 h-4 mr-2" /> Engine Bay
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Thumbnails */}
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {currentImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                          i === currentImageIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <Image src={img} alt="" fill className="object-cover" />
                      </button>
                    ))}
                  </div>

                  {/* Trade and Upgrade CTA */}
                  <Card className="bg-primary text-primary-foreground">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">Trade and upgrade</h3>
                        <p className="text-sm text-primary-foreground/80">Apply your old car&apos;s value to your purchase.</p>
                      </div>
                      <Button variant="secondary" size="sm" asChild>
                        <Link href="/trade-in">Get trade-in value →</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Overview</h2>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>VIN <span className="font-mono text-foreground">{vehicleData.vin}</span></span>
                      <span>Stock # <span className="font-medium text-foreground">{vehicleData.stockNumber}</span></span>
                    </div>
                  </div>

                  <Link href="#" className="text-primary text-sm flex items-center gap-1 hover:underline">
                    <ExternalLink className="w-4 h-4" />
                    View Full Listing on planetmotors.app →
                  </Link>

                  {/* Vehicle Details Icons */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Settings className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">TRANSMISSION</span>
                      <span className="text-sm font-medium">{vehicleData.transmission}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Fuel className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">FUEL TYPE</span>
                      <span className="text-sm font-medium">{vehicleData.fuelType}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">ENGINE</span>
                      <span className="text-sm font-medium">{vehicleData.engine}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">SEATS</span>
                      <span className="text-sm font-medium">{vehicleData.seats} seats</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Key className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">KEYS</span>
                      <span className="text-sm font-medium">{vehicleData.keys} keys</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">HISTORY</span>
                      <Badge variant="outline" className="text-xs border-red-500 text-red-600">CARFAX</Badge>
                    </div>
                  </div>

                  {/* Highlights */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">HIGHLIGHTS</h3>
                    <div className="flex flex-wrap gap-3">
                      <Card className="flex-1 min-w-[140px]">
                        <CardContent className="p-3 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-pink-500" />
                          <div>
                            <p className="font-medium text-sm">No accidents</p>
                            <p className="text-xs text-muted-foreground">Reported by Carfax</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="flex-1 min-w-[140px]">
                        <CardContent className="p-3 flex items-center gap-2">
                          <Gauge className="w-5 h-5 text-muted-foreground" />
                          <p className="font-medium text-sm">{vehicleData.mileage.toLocaleString()} km</p>
                        </CardContent>
                      </Card>
                      <Card className="flex-1 min-w-[140px]">
                        <CardContent className="p-3 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-purple-500" />
                          <div>
                            <p className="font-medium text-sm">Safety certified</p>
                            <p className="text-xs text-muted-foreground">Ontario Safety Certificate</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Delivery Options */}
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">GET IT TOMORROW</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card className="bg-primary/5 border-primary/20">
                        <CardContent className="p-4">
                          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-3">
                            <Car className="w-6 h-6 text-primary" />
                          </div>
                          <h4 className="font-semibold">Pick up at Planet Motors</h4>
                          <p className="text-sm text-green-600 font-medium">FREE</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            30 Major Mackenzie Dr E, Richmond Hill, ON. Open Mon–Sat.
                          </p>
                          <Button className="mt-3" size="sm">Start purchase</Button>
                        </CardContent>
                      </Card>
                      <Card className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
                        <CardContent className="p-4">
                          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mb-3">
                            <Truck className="w-6 h-6 text-red-600" />
                          </div>
                          <h4 className="font-semibold">Home delivery</h4>
                          <p className="text-sm text-muted-foreground">Delivery fee applies *</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            We&apos;ll deliver anywhere in Ontario & Canada.
                          </p>
                          <Button variant="outline" className="mt-3" size="sm">Start purchase</Button>
                        </CardContent>
                      </Card>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      * Delivery is an additional service that brings the car to your driveway.
                    </p>
                  </div>

                  {/* Better than a test drive */}
                  <Card className="border-2">
                    <CardHeader>
                      <CardTitle className="text-lg">Better than a test drive — Try it for 10 days!</CardTitle>
                      <p className="text-sm text-muted-foreground">All our cars come with a 10-day money back guarantee</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-4 p-4 bg-primary/5 rounded-lg">
                          <p className="font-semibold">The Planet Motors way 🏆</p>
                          <div>
                            <p className="font-medium">10 days to try it out</p>
                            <p className="text-sm text-muted-foreground">take your time to know the car</p>
                          </div>
                          <div>
                            <p className="font-medium">You pick your route</p>
                            <p className="text-sm text-muted-foreground">city, highway, night, rain, etc.</p>
                          </div>
                          <div>
                            <p className="font-medium">Completely unaccompanied</p>
                            <p className="text-sm text-muted-foreground">no pressure, no rush</p>
                          </div>
                          <div>
                            <p className="font-medium">Full money-back guarantee</p>
                            <p className="text-sm text-muted-foreground">for any reason</p>
                          </div>
                        </div>
                        <div className="space-y-4 p-4">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-muted-foreground">The old way</p>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">vs</span>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Only 15 mins on average</p>
                            <p className="text-sm text-muted-foreground">limited feel for comfort or quirks</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Seller picks route</p>
                            <p className="text-sm text-muted-foreground">limited speeds/conditions</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">Accompanied by salesperson</p>
                            <p className="text-sm text-muted-foreground">pressure to decide</p>
                          </div>
                          <div>
                            <p className="font-medium text-muted-foreground">No return option</p>
                            <p className="text-sm text-muted-foreground">sale is final</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="mt-0 space-y-6">
                  <h2 className="text-xl font-semibold">Features and specs</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Features */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">FEATURES</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Comfort & Convenience</span>
                          <span className="font-medium">Heated Seats</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Safety & Security</span>
                          <span className="font-medium">Autopilot</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Entertainment & Tech</span>
                          <span className="font-medium">15&quot; Touchscreen</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Braking & Traction</span>
                          <span className="font-medium">Brake Assist</span>
                        </div>
                        <Button variant="link" className="p-0 h-auto text-primary">
                          View all features →
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Specs */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">SPECS</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Range</span>
                          <span className="font-medium">{vehicleData.range}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Exterior</span>
                          <span className="font-medium">{vehicleData.exteriorColor}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Interior</span>
                          <span className="font-medium">{vehicleData.interiorColor}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Drive</span>
                          <span className="font-medium">{vehicleData.drivetrain}</span>
                        </div>
                        <Button variant="link" className="p-0 h-auto text-primary">
                          View all specs →
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Packages */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">PACKAGES</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {vehicleData.packages.map((pkg, i) => (
                        <div key={i} className="py-3 border-b last:border-b-0">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{pkg}</span>
                            <Button variant="link" className="p-0 h-auto text-primary text-sm">
                              3 features →
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Inspection Tab */}
                <TabsContent value="inspection" className="mt-0 space-y-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{vehicleData.inspectionScore}</span>
                    </div>
                    <h2 className="text-2xl font-bold">210-Point Inspection</h2>
                    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                      This vehicle has been carefully inspected and reconditioned to ensure it meets our high safety and performance standards.
                    </p>
                  </div>

                  {/* PM Certified Badge */}
                  <Card className="border-2 border-primary/20">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <Shield className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold">PM Certified™</p>
                        <p className="text-sm text-muted-foreground">This vehicle passed our 210-point inspection.</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Inspection Items */}
                  <Card>
                    <CardContent className="p-0">
                      {vehicleData.inspectionItems.map((item, i) => (
                        <div key={i} className="flex justify-between items-center px-4 py-3 border-b last:border-b-0">
                          <span>{item.category}</span>
                          <span className={`flex items-center gap-1 text-sm ${item.status === "Passed" || item.status === "No reported accidents" ? "text-primary" : "text-green-600"}`}>
                            <Check className="w-4 h-4" />
                            {item.status}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* View Complete Inspection */}
                  <Dialog open={showInspectionModal} onOpenChange={setShowInspectionModal}>
                    <DialogTrigger asChild>
                      <Button variant="link" className="p-0 text-primary">
                        View complete 210-point inspection
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <div className="flex items-center gap-2 text-sm text-primary">
                          <Shield className="w-4 h-4" />
                          PM CERTIFIED™
                        </div>
                        <DialogTitle className="text-xl">210-Point Inspection Report</DialogTitle>
                      </DialogHeader>
                      
                      {/* Category Grid */}
                      <div className="grid grid-cols-3 md:grid-cols-5 gap-2 py-4">
                        {vehicleData.inspectionCategories.map((cat, i) => (
                          <div key={i} className="text-center p-2 bg-muted/30 rounded-lg">
                            <CheckCircle className="w-5 h-5 text-primary mx-auto mb-1" />
                            <p className="text-[10px] font-medium leading-tight">{cat.name}</p>
                            <p className="text-[10px] text-primary">{cat.points} points passed</p>
                          </div>
                        ))}
                      </div>

                      {/* VIN & History — Items 1-10 */}
                      <div className="space-y-1">
                        <div className="bg-blue-600 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-medium">VIN & History — Items 1-10</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.vinHistory.map((item, i) => (
                            <div key={i} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
                              <span className="text-muted-foreground">{i + 1}</span>
                              <span>{item}</span>
                              <span className="text-right text-primary flex items-center justify-end gap-1"><Check className="w-3 h-3" />Pass</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Powertrain & Engine — Items 11-32 */}
                      <div className="space-y-1 mt-4">
                        <div className="bg-orange-600 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-medium">Powertrain & Engine — Items 11-32</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.powertrainEngine.map((item, i) => (
                            <div key={i} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
                              <span className="text-muted-foreground">{i + 11}</span>
                              <span>{item}</span>
                              <span className="text-right text-primary flex items-center justify-end gap-1"><Check className="w-3 h-3" />Pass</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Brakes & Suspension — Items 33-45 */}
                      <div className="space-y-1 mt-4">
                        <div className="bg-red-600 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-medium">Brakes, Suspension & Steering — Items 33-45</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.brakesSuspension.map((item, i) => (
                            <div key={i} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
                              <span className="text-muted-foreground">{i + 33}</span>
                              <span>{item}</span>
                              <span className="text-right text-primary flex items-center justify-end gap-1"><Check className="w-3 h-3" />Pass</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tyres & Wheels — Items 46-53 */}
                      <div className="space-y-1 mt-4">
                        <div className="bg-blue-500 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-medium">Tyres & Wheels — Items 46-53</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.tyresWheels.map((item, i) => (
                            <div key={i} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
                              <span className="text-muted-foreground">{i + 46}</span>
                              <span>{item}</span>
                              <span className="text-right text-primary flex items-center justify-end gap-1"><Check className="w-3 h-3" />Pass</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Vehicle Exterior — Items 54-74 */}
                      <div className="space-y-1 mt-4">
                        <div className="bg-green-600 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-medium">Vehicle Exterior — Items 54-74</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.exterior.map((item, i) => (
                            <div key={i} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
                              <span className="text-muted-foreground">{i + 54}</span>
                              <span>{item}</span>
                              <span className="text-right text-primary flex items-center justify-end gap-1"><Check className="w-3 h-3" />Pass</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Vehicle Interior — Items 75-94 */}
                      <div className="space-y-1 mt-4">
                        <div className="bg-purple-600 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-medium">Vehicle Interior — Items 75-94</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.interior.map((item, i) => (
                            <div key={i} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
                              <span className="text-muted-foreground">{i + 75}</span>
                              <span>{item}</span>
                              <span className="text-right text-primary flex items-center justify-end gap-1"><Check className="w-3 h-3" />Pass</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* How it Drives — Items 95-104 */}
                      <div className="space-y-1 mt-4">
                        <div className="bg-amber-600 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-medium">How it Drives — Items 95-104</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.driveTest.map((item, i) => (
                            <div key={i} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
                              <span className="text-muted-foreground">{i + 95}</span>
                              <span>{item}</span>
                              <span className="text-right text-primary flex items-center justify-end gap-1"><Check className="w-3 h-3" />Pass</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* EV & Hybrid Systems — Items 105-116 */}
                      <div className="space-y-1 mt-4">
                        <div className="bg-teal-600 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-medium">EV & Hybrid Systems — Items 105-116</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.evSystems.map((item, i) => (
                            <div key={i} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
                              <span className="text-muted-foreground">{i + 105}</span>
                              <span>{item}</span>
                              <span className="text-right text-primary flex items-center justify-end gap-1"><Check className="w-3 h-3" />Pass</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Detailing, Safety & Advanced — Items 117-210 */}
                      <div className="space-y-1 mt-4">
                        <div className="bg-pink-600 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-medium">Detailing, Safety & Advanced — Items 117-210</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.detailingSafety.map((item, i) => (
                            <div key={i} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
                              <span className="text-muted-foreground">{i + 117}-{i + 117 + 9}</span>
                              <span>{item}</span>
                              <span className="text-right text-primary flex items-center justify-end gap-1"><Check className="w-3 h-3" />Pass</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Footer Summary */}
                      <div className="mt-6 bg-slate-900 text-white p-6 rounded-lg text-center">
                        <Shield className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="text-xl font-bold">210 Points — All Passed</p>
                        <p className="text-sm text-slate-300 mt-1">Planet Motors Inc. · Richmond Hill, ON · OMVIC Reg.</p>
                        <Button className="mt-4" variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download Full PDF Report
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {/* CARFAX */}
                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <Badge variant="outline" className="border-red-500 text-red-600 text-base px-3 py-1">
                        CARFAX
                      </Badge>
                      <Button variant="link" className="text-primary" asChild>
                        <Link href={vehicleData.carfaxUrl} target="_blank">
                          View report <ExternalLink className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* EV Battery Health - Show for EVs/PHEVs */}
                  {(vehicleData.fuelType === "Electric" || vehicleData.fuelType === "PHEV") && (
                    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Battery className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-800 dark:text-green-400">Battery Health</span>
                          </div>
                          <Badge className="bg-green-500">{vehicleData.batteryHealth}% SOH</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estimated Range</span>
                            <span className="font-medium">{vehicleData.range}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Battery Capacity</span>
                            <span className="font-medium">{vehicleData.batteryCapacity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fast Charging</span>
                            <span className="font-medium">{vehicleData.chargingSpeed}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3 border-green-300 text-green-700 hover:bg-green-100" asChild>
                          <Link href="/ev-battery-health">
                            View Full Battery Report <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Condition */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Condition</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {vehicleData.conditionItems.map((item, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Pricing Tab */}
                <TabsContent value="pricing" className="mt-0 space-y-6">
                  <h2 className="text-2xl font-bold text-center">Price Details</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pay Over Time */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">PAY OVER TIME</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">${biweeklyPayment}<span className="text-lg font-normal">/biweekly*</span></p>
                        <p className="text-xs text-muted-foreground mt-2">
                          *Estimated payment based on 8.99% APR for 84 months, includes $0 cash down. OAC — on approved credit. Taxes extra.
                        </p>
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                          <p className="text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                            <span className="font-medium">80% of buyers finance with us</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Get personalized financing terms in 2 minutes — no impact to your credit score.</p>
                        </div>
                        <Button className="w-full mt-4" variant="outline" asChild>
                          <Link href="/financing">Get pre-qualified</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Pay Once */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">PAY ONCE</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">${vehicleData.price.toLocaleString()}</p>
                        <div className="flex items-center gap-2 text-sm text-green-600 mt-2">
                          <Truck className="w-4 h-4" />
                          Free delivery to your door · Richmond Hill
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vehicle price</span>
                            <span>${vehicleData.pricing.vehiclePrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery fee</span>
                            <span>${vehicleData.pricing.deliveryFee}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estimated HST (13%)</span>
                            <span>${vehicleData.pricing.hst.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">OMVIC Fee</span>
                            <span>${vehicleData.pricing.omvicFee}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Licensing & registration</span>
                            <span>ON ~ ${vehicleData.pricing.licensingReg}</span>
                          </div>
                          <div className="flex justify-between font-semibold pt-2 border-t">
                            <span>Total (incl. HST)</span>
                            <span>${vehicleData.pricing.totalWithHst.toLocaleString()}</span>
                          </div>
                        </div>
                        <Button className="w-full mt-4">Start your purchase</Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Out the Door Price */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Real Out-the-Door Price
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        See exactly what you&apos;ll pay — vehicle price, HST, OMVIC fee, licensing, and delivery.
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between py-2 border-b">
                        <span>Vehicle Price</span>
                        <span className="font-medium">${vehicleData.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>HST (13%)</span>
                        <span className="font-medium">${vehicleData.pricing.hst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>OMVIC Fee</span>
                        <span className="font-medium">${vehicleData.pricing.omvicFee}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Certification Fee</span>
                        <span className="font-medium">${vehicleData.pricing.certificationFee}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Licensing & Registration (est.)</span>
                        <span className="font-medium">ON ~ ${vehicleData.pricing.licensingReg}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Delivery</span>
                        <span className="font-medium text-green-600">$0 (Ontario)</span>
                      </div>
                      <div className="flex justify-between py-3 font-semibold text-lg">
                        <span>Estimated Total</span>
                        <span className="text-primary">${(vehicleData.pricing.totalWithHst + vehicleData.pricing.certificationFee).toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Estimate only. Includes OMVIC fee, certification, and Ontario registration. Exact amounts confirmed at signing.
                      </p>
                    </CardContent>
                  </Card>

                  {/* No Cash Surcharge */}
                  <Card className="bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4 flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-purple-600" />
                      <div>
                        <p className="font-semibold">No Cash Surcharge — Ever</p>
                        <p className="text-sm text-muted-foreground">
                          Planet Motors accepts debit and credit cards with zero surcharge. No gimmicks. What you see is what you pay.
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Trade CTA */}
                  <Card>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Sell or Trade your car</p>
                        <p className="text-sm text-muted-foreground">Get a real offer in less than 2 minutes — sell, trade, or track your value.</p>
                      </div>
                      <Button variant="outline" asChild>
                        <Link href="/trade-in">Get your offer →</Link>
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Ratings Tab */}
                <TabsContent value="ratings" className="mt-0 space-y-6">
                  <h2 className="text-xl font-semibold">Our rating</h2>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-6">
                        <div className="text-center">
                          <p className="text-5xl font-bold">{vehicleData.ratings.overall}</p>
                          <p className="text-lg text-muted-foreground">/5</p>
                          <div className="w-16 h-1 bg-primary rounded-full mt-2 mx-auto" />
                        </div>
                        <div className="flex-1">
                          <p className="text-muted-foreground">{vehicleData.ratings.description}</p>
                        </div>
                      </div>
                      
                      <div className="mt-6 space-y-3">
                        {vehicleData.ratings.categories.map((cat, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <span className="w-24 text-sm text-muted-foreground">{cat.name}</span>
                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full" 
                                style={{ width: `${(cat.score / 5) * 100}%` }}
                              />
                            </div>
                            <span className="w-8 text-sm font-medium">{cat.score}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Protection Tab */}
                <TabsContent value="protection" className="mt-0 space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold">Protection packages</h2>
                    <p className="text-muted-foreground mt-1">
                      This vehicle&apos;s manufacturer warranty has expired. But don&apos;t worry, we have options for you to stay covered!
                    </p>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium"></th>
                          {vehicleData.protectionPackages.map((pkg, i) => (
                            <th key={i} className={`text-center py-3 px-4 font-medium ${pkg.recommended ? "bg-primary/5" : ""}`}>
                              {pkg.name}
                              {pkg.recommended && <Badge className="ml-2 bg-primary text-xs">Recommended</Badge>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Payment method</td>
                          {vehicleData.protectionPackages.map((pkg, i) => (
                            <td key={i} className={`text-center py-3 px-4 ${pkg.recommended ? "bg-primary/5" : ""}`}>
                              {pkg.paymentMethod}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Money back guarantee</td>
                          {vehicleData.protectionPackages.map((pkg, i) => (
                            <td key={i} className={`text-center py-3 px-4 ${pkg.recommended ? "bg-primary/5" : ""}`}>
                              {pkg.moneyBack ? <Check className="w-5 h-5 text-primary mx-auto" /> : "—"}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Due at checkout</td>
                          {vehicleData.protectionPackages.map((pkg, i) => (
                            <td key={i} className={`text-center py-3 px-4 ${pkg.recommended ? "bg-primary/5" : ""}`}>
                              {pkg.dueAtCheckout}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Warranty</td>
                          {vehicleData.protectionPackages.map((pkg, i) => (
                            <td key={i} className={`text-center py-3 px-4 ${pkg.recommended ? "bg-primary/5" : ""}`}>
                              {pkg.warranty !== "—" && pkg.warranty !== "Standard" ? (
                                <span className="flex items-center justify-center gap-1 text-primary">
                                  <Check className="w-4 h-4" /><Check className="w-4 h-4" />
                                  {pkg.warranty}
                                </span>
                              ) : pkg.warranty}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Tire & rim protection</td>
                          {vehicleData.protectionPackages.map((pkg, i) => (
                            <td key={i} className={`text-center py-3 px-4 ${pkg.recommended ? "bg-primary/5" : ""}`}>
                              {pkg.tireRim === true ? <Check className="w-5 h-5 text-primary mx-auto" /> : pkg.tireRim}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">GAP coverage</td>
                          {vehicleData.protectionPackages.map((pkg, i) => (
                            <td key={i} className={`text-center py-3 px-4 ${pkg.recommended ? "bg-primary/5" : ""}`}>
                              {pkg.gapCoverage}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Life & disability</td>
                          {vehicleData.protectionPackages.map((pkg, i) => (
                            <td key={i} className={`text-center py-3 px-4 ${pkg.recommended ? "bg-primary/5" : ""}`}>
                              {pkg.lifeDisability}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-medium">Price</td>
                          {vehicleData.protectionPackages.map((pkg, i) => (
                            <td key={i} className={`text-center py-3 px-4 font-medium ${pkg.recommended ? "bg-primary/5" : ""}`}>
                              {pkg.price}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Next Steps */}
              <div className="mt-12 pt-8 border-t">
                <h2 className="text-xl font-semibold mb-6">Next steps</h2>
                <div className="grid grid-cols-5 gap-4">
                  {[
                    { step: 1, title: "Start purchase", active: true },
                    { step: 2, title: "Enter your info", active: false },
                    { step: 3, title: "Add protections", subtitle: "Optional", active: false },
                    { step: 4, title: "Finance application", subtitle: "If applicable", active: false },
                    { step: 5, title: "Get your car!", active: false }
                  ].map((item) => (
                    <div key={item.step} className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold mb-2">{item.step}</p>
                      <p className="font-medium text-sm">{item.title}</p>
                      {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                      {item.active && (
                        <Button size="sm" className="mt-3">Start purchase</Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Testimonial */}
              <Card className="mt-8 bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="md:w-1/3">
                      <p className="text-4xl font-bold">274+</p>
                      <p className="text-muted-foreground">happy customers</p>
                      <div className="mt-4">
                        <p className="text-xs text-muted-foreground mb-2">AS SEEN ON</p>
                        <div className="flex gap-2">
                          <Badge variant="outline">Google</Badge>
                          <Badge variant="outline">CarGurus</Badge>
                          <Badge variant="outline">AutoTrader</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="md:w-2/3">
                      <p className="text-lg italic">
                        &ldquo;Hamza was absolutely amazing — super professional, no pressure, walked me through every step. 
                        The car was exactly as described and delivered right to my door. Planet Motors is the real deal.&rdquo;
                      </p>
                      <div className="mt-4">
                        <p className="font-semibold">Sarah K.</p>
                        <p className="text-sm text-muted-foreground">Richmond Hill, ON • 2025-01-14</p>
                        <div className="flex gap-0.5 mt-1">
                          {[1,2,3,4,5].map(i => (
                            <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sticky Sidebar */}
            <div className="space-y-4">
              <Card className="sticky top-36 shadow-lg border-2">
                <CardContent className="p-5">
                  {/* Views & Track Price */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge className="bg-red-500 text-white">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {viewCount}+ views today
                    </Badge>
                    <Button variant="ghost" size="sm" className="text-muted-foreground">
                      <Bell className="w-4 h-4 mr-1" />
                      Track price
                    </Button>
                  </div>

                  {/* Vehicle Title */}
                  <h2 className="text-xl font-bold">
                    {vehicleData.year} {vehicleData.make} {vehicleData.model}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {vehicleData.trim} · {vehicleData.mileage.toLocaleString()} km
                  </p>

                  {/* Price */}
                  <p className="text-3xl font-bold mt-3">${vehicleData.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span>Estimated <span className="font-semibold">${biweeklyPayment}/biweekly</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">$0 down</span>
                    <Link href="/financing" className="text-primary hover:underline">Get your terms</Link>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">10-Day Money Back Guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <Lock className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium">$250 Refundable Deposit</span>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="mt-4 space-y-2">
                    <ReserveVehicleModal
                      vehicle={{
                        id: vehicleData.id,
                        year: vehicleData.year,
                        make: vehicleData.make,
                        model: vehicleData.model,
                        trim: vehicleData.trim,
                        price: vehicleData.price,
                        image: vehicleData.images[0],
                        stockNumber: vehicleData.stockNumber
                      }}
                      trigger={
                        <Button className="w-full h-11 bg-red-600 hover:bg-red-700 text-white">
                          <Lock className="w-4 h-4 mr-2" />
                          Reserve – $250 Refundable Deposit
                        </Button>
                      }
                    />
                    <Button className="w-full h-11" variant="secondary">
                      Start full purchase
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Excl. HST & Licensing · Incl. OMVIC Fee
                  </p>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4 mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm">
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsFavorite(!isFavorite)}
                      className={isFavorite ? "text-red-500" : ""}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${isFavorite ? "fill-current" : ""}`} />
                      Save
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Bell className="w-4 h-4 mr-1" />
                      Notify
                    </Button>
                  </div>

                  {/* CARFAX */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Badge variant="outline" className="border-red-500 text-red-600">CARFAX</Badge>
                    <Button variant="link" className="text-primary p-0 h-auto" asChild>
                      <Link href={vehicleData.carfaxUrl} target="_blank">
                        View report <ExternalLink className="w-3 h-3 ml-1" />
                      </Link>
                    </Button>
                  </div>

                  {/* Delivery Calculator */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="font-medium text-sm flex items-center gap-2 mb-2">
                      <Truck className="w-4 h-4" />
                      Delivery Calculator
                    </p>
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Enter postal code (e.g. L4C 1G7)" 
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="flex-1"
                      />
                      <Button variant="secondary" size="sm">Check</Button>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      Questions? <Link href="tel:416-985-2277" className="font-semibold text-foreground">416-985-2277</Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Similar Vehicles */}
        <div className="container mx-auto px-4 py-8 border-t">
          <h2 className="text-xl font-semibold mb-4">Other cars you might like</h2>
          <SimilarVehicles 
            currentVehicleId={vehicleData.id}
            make={vehicleData.make}
            priceRange={vehicleData.price}
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}
