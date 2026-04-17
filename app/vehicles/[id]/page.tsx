"use client"

import { useState, useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

import { Input } from "@/components/ui/input"
import {
  ChevronLeft, ChevronRight, Heart, Share2, Fuel, Gauge,
  Settings, Shield, CheckCircle, Car,
  FileText, Zap, DollarSign, CreditCard,
  Phone, Star, TrendingUp, Users,
  Battery, LockKeyhole, Truck, ArrowRight, Play,
  Download, ExternalLink, Check, Expand,
  Key, RotateCw
} from "lucide-react"

import { VehicleJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { useAuth } from "@/contexts/auth-context"
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { trackProductView, trackPhoneClick } from "@/components/analytics/google-tag-manager"
import { calculateAllInPrice } from "@/lib/pricing/format"
import { trackViewItem, trackAddToWishlist } from "@/components/analytics/google-analytics"
import { trackMetaViewContent, trackMetaAddToWishlist } from "@/components/analytics/meta-pixel"

// ── Lazy-load heavy below-fold components ──
const VehicleSpinViewer = dynamic(
  () => import("@/components/vehicle-spin-viewer").then(m => ({ default: m.VehicleSpinViewer })),
  { ssr: false, loading: () => <div className="aspect-[4/3] bg-gray-100 animate-pulse rounded-xl" /> }
)
const DriveeViewer = dynamic(
  () => import("@/components/drivee-viewer").then(m => ({ default: m.DriveeViewer })),
  { ssr: false, loading: () => <div className="aspect-[4/3] bg-gray-100 animate-pulse rounded-xl" /> }
)
const SimilarVehicles = dynamic(
  () => import("@/components/similar-vehicles").then(m => ({ default: m.SimilarVehicles })),
  { ssr: false }
)
const ReserveVehicleModal = dynamic(
  () => import("@/components/reserve-vehicle-modal").then(m => ({ default: m.ReserveVehicleModal })),
  { ssr: false }
)
const AuthRequiredModal = dynamic(
  () => import("@/components/auth-required-modal").then(m => ({ default: m.AuthRequiredModal })),
  { ssr: false }
)
const PriceNegotiator = dynamic(
  () => import("@/components/vehicle/price-negotiator").then(m => ({ default: m.PriceNegotiator })),
  { ssr: false }
)
const LiveVideoCall = dynamic(
  () => import("@/components/vehicle/live-video-call").then(m => ({ default: m.LiveVideoCall })),
  { ssr: false }
)
const PriceDropAlert = dynamic(
  () => import("@/components/vehicle/price-drop-alert").then(m => ({ default: m.PriceDropAlert })),
  { ssr: false }
)
const AddToCompare = dynamic(
  () => import("@/components/vehicle/add-to-compare").then(m => ({ default: m.AddToCompare })),
  { ssr: false }
)

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
  driveeMid: null as string | null,
  images: [] as string[],
  interiorImages: [] as string[],
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
      "USB ports, horn, key fob &amp; owner&apos;s manual",
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
  pricing: (() => {
    const breakdown = calculateAllInPrice(52990)
    return {
      vehiclePrice: breakdown.vehiclePrice,
      deliveryFee: 0,
      hst: breakdown.hst,
      omvicFee: breakdown.omvicFee,
      certificationFee: breakdown.certificationFee,
      licensingReg: breakdown.licensingFee,
      totalWithHst: breakdown.total,
    }
  })(),
  history: {
    owners: 1,
    accidents: 0,
    serviceRecords: 8,
    lastServiced: "2024-02-15"
  }
}

export default function VehicleDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const vehicleId = params.id as string
  const { user } = useAuth()
  // deno-lint-ignore no-explicit-any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Complex merged mock+DB vehicle shape
  const [vehicle, setVehicle] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isFavorite, setIsFavorite] = useState(false)
  const [activeTab, setActiveTab] = useState("photos")
  const [imageType, setImageType] = useState<"exterior" | "interior" | "360">("exterior")
  const [isSpinning, setIsSpinning] = useState(false)
  const [spinFrame, setSpinFrame] = useState(0)
  const [postalCode, setPostalCode] = useState("")
  const [isCheckingDelivery, setIsCheckingDelivery] = useState(false)
  const [deliveryError, setDeliveryError] = useState("")
  const [deliveryQuote, setDeliveryQuote] = useState<{
    postalCode: string
    province: string
    distanceKm: number
    deliveryCost: number
    isFreeDelivery: boolean
    isDeliveryAvailable: boolean
    isDistanceEstimate?: boolean
  } | null>(null)

  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authAction, setAuthAction] = useState("")


  // Trade-in from AI Quote
  const tradeInValue = searchParams.get("tradeIn")
  const tradeInQuoteId = searchParams.get("quoteId")
  const tradeInVehicle = searchParams.get("tradeInVehicle")

  // Helper to build finance link with trade-in info
  const getFinanceLink = (vehicleId: string) => {
    if (tradeInValue && parseInt(tradeInValue) > 0) {
      const params = new URLSearchParams({
        tradeIn: tradeInValue,
        quoteId: tradeInQuoteId || '',
        tradeInVehicle: tradeInVehicle || ''
      })
      return `/finance/${vehicleId}?${params.toString()}`
    }
    return `/finance/${vehicleId}`
  }

  // Fetch vehicle from API — benefits from CDN s-maxage=300 caching
  useEffect(() => {
    if (!vehicleId) return
    let cancelled = false
    setIsLoading(true)
    fetch(`/api/v1/vehicles/${encodeURIComponent(vehicleId)}`)
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (cancelled) return
        const data = json?.data?.vehicle
        if (data) {
          // API already returns price in dollars (divided by 100 server-side)
          const price = typeof data.price === 'number' ? data.price : 0
          const breakdown = calculateAllInPrice(price)
          // Build image list: prefer image_urls array, fall back to primary_image_url, then mocks
          const rawImages: string[] = Array.isArray(data.image_urls) && data.image_urls.length > 0
            ? data.image_urls
            : data.primary_image_url
              ? [data.primary_image_url]
              : vehicleData.images
          // Split images: HomeNet convention — exterior photos first, interior photos last
          // Roughly 60% exterior, 40% interior for typical 30-40 image sets
          const splitIndex = rawImages.length > 10 ? Math.ceil(rawImages.length * 0.6) : rawImages.length
          const exteriorImgs = rawImages.slice(0, splitIndex)
          const interiorImgs = rawImages.length > 10 ? rawImages.slice(splitIndex) : []

          setVehicle({
            ...vehicleData, // Keep mock inspection data as fallback
            id: data.id,
            year: data.year,
            make: data.make,
            model: data.model,
            trim: data.trim || '',
            price,
            mileage: data.mileage,
            exteriorColor: data.exterior_color,
            interiorColor: data.interior_color,
            fuelType: data.fuel_type,
            transmission: data.transmission,
            drivetrain: data.drivetrain,
            bodyStyle: data.body_style,
            vin: data.vin,
            stockNumber: data.stock_number,
            driveeMid: data.drivee_mid || null,
            images: exteriorImgs,
            interiorImages: interiorImgs,
            pricing: {
              vehiclePrice: breakdown.vehiclePrice,
              deliveryFee: 0,
              hst: breakdown.hst,
              omvicFee: breakdown.omvicFee,
              certificationFee: breakdown.certificationFee,
              licensingReg: breakdown.licensingFee,
              totalWithHst: breakdown.total,
            }
          })
        } else {
          setLoadError("Unable to load vehicle details. Please try again later.")
        }
        setIsLoading(false)
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError("Unable to load vehicle details. Please try again later.")
          setIsLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [vehicleId])

  // Track product view when vehicle data loads
  useEffect(() => {
    if (!vehicle || isLoading) return
    const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`
    trackProductView({
      id: vehicle.id,
      name,
      price: vehicle.price,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      fuelType: vehicle.fuelType || "Unknown",
    })
    trackViewItem({
      id: vehicle.id,
      name,
      price: vehicle.price,
      make: vehicle.make,
      model: vehicle.model,
    })
    trackMetaViewContent({
      id: vehicle.id,
      name,
      price: vehicle.price,
      make: vehicle.make,
    })
  }, [vehicle, isLoading])


  // 360 spin: use ALL images (exterior + interior combined)
  const allImages = [...(vehicle?.images || []), ...(vehicle?.interiorImages || [])]
  // Drivee 360° viewer requires a MID (media ID) from the DRIVEE_VIN_MAP.
  // Drivee's iframe does NOT support VIN-based lookups — only ?mid= works.
  const hasDrivee = !!vehicle?.driveeMid
  const has360 = hasDrivee || allImages.length >= 15
  useEffect(() => {
    if (!isSpinning || imageType !== "360") return
    const interval = setInterval(() => {
      setSpinFrame((prev) => (prev + 1) % allImages.length)
    }, 150)
    return () => clearInterval(interval)
  }, [isSpinning, imageType, allImages.length])

  const handleProtectedAction = (action: string, callback?: () => void) => {
    if (!user) {
      setAuthAction(action)
      setShowAuthModal(true)
    } else if (callback) {
      callback()
    }
  }

  const handleShare = async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : ""
    const shareTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model} at Planet Motors`
    const shareText = `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for $${vehicle.price.toLocaleString()}.`

    try {
      if (navigator.share) {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        })
        return
      }

      await navigator.clipboard.writeText(shareUrl)
      toast.success("Vehicle link copied to clipboard")
    } catch (error) {
      console.error("Share failed:", error)
      toast.error("Unable to share right now. Please try again.")
    }
  }

  const normalizePostalCode = (value: string) =>
    value.toUpperCase().replace(/\s/g, "").slice(0, 6)

  const handleDeliveryCheck = async () => {
    const cleaned = normalizePostalCode(postalCode)
    const postalRegex = /^[A-Z]\d[A-Z]\d[A-Z]\d$/

    setDeliveryError("")
    setDeliveryQuote(null)

    if (!postalRegex.test(cleaned)) {
      setDeliveryError("Enter a valid Canadian postal code (example: L4C1G7).")
      return
    }

    setIsCheckingDelivery(true)
    try {
      const response = await fetch(`/api/v1/deliveries/quote?postalCode=${encodeURIComponent(cleaned)}`)
      const data = await response.json()

      if (!response.ok) {
        setDeliveryError(data?.error || "Unable to calculate delivery right now.")
        return
      }

      setDeliveryQuote(data)
    } catch (error) {
      console.error("Delivery quote failed:", error)
      setDeliveryError("Unable to calculate delivery right now.")
    } finally {
      setIsCheckingDelivery(false)
    }
  }



  const nextImage = () => {
    if (imageType === "360") {
      setIsSpinning(false)
      setSpinFrame((prev) => (prev + 1) % allImages.length)
    } else {
      const images = imageType === "exterior" ? vehicle.images : vehicle.interiorImages
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (imageType === "360") {
      setIsSpinning(false)
      setSpinFrame((prev) => (prev - 1 + allImages.length) % allImages.length)
    } else {
      const images = imageType === "exterior" ? vehicle.images : vehicle.interiorImages
      setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  // Show loading state
  if (isLoading || !vehicle) {
    if (!isLoading && loadError) {
      return (
        <div className="min-h-screen bg-background">
          <Header />
          <div className="container mx-auto px-4 py-24">
            <Card className="max-w-xl mx-auto">
              <CardHeader>
                <CardTitle>Vehicle unavailable</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{loadError}</p>
                <Button className="mt-6" asChild>
                  <Link href="/inventory">Return to inventory</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
          <Footer />
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading vehicle details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const currentImages: string[] = imageType === "360" ? allImages : imageType === "exterior" ? vehicle.images : vehicle.interiorImages
  const activeIndex = imageType === "360" ? spinFrame : currentImageIndex


  // Finance calculation: Vehicle Price + $895 Admin Fee (Finance Docs Set-up)
  const FINANCE_ADMIN_FEE = 895
  const financeSubtotal = vehicle.price + FINANCE_ADMIN_FEE
  const financeTax = financeSubtotal * PROVINCE_TAX_RATES.ON.hst
  const financeTotal = financeSubtotal + financeTax
  const biweeklyPayment = Math.round(financeTotal / 208) // 8 years bi-weekly (26 payments x 8)

  return (
    <div className="min-h-screen bg-background">
      <VehicleJsonLd
        vehicle={{
          id: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          price: vehicle.price,
          mileage: vehicle.mileage,
          vin: vehicle.vin,
          color: vehicle.exteriorColor,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          engine: vehicle.engine,
          drivetrain: vehicle.drivetrain,
          bodyStyle: vehicle.bodyStyle,
          stockNumber: vehicle.stockNumber,
          image: vehicle.images?.[0] || "",
          description: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ""} for sale at Planet Motors`.trim(),
          condition: "used",
        }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: "/" },
          { name: "Inventory", url: "/inventory" },
          { name: `${vehicle.make}`, url: `/inventory?make=${vehicle.make}` },
          { name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`, url: `/vehicles/${vehicle.id}` },
        ]}
      />
      <Header />

<main className="pb-32 md:pb-20 overflow-x-hidden max-w-full" role="main" aria-label="Vehicle details">
  {/* Trade-In Banner */}
  {tradeInValue && parseInt(tradeInValue) > 0 && (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              Your Trade-In: <span className="font-bold">${parseInt(tradeInValue).toLocaleString()}</span>
              {tradeInVehicle && <span className="text-white/80 ml-2">({decodeURIComponent(tradeInVehicle)})</span>}
            </span>
          </div>
          <Button size="sm" variant="secondary" asChild>
            <Link href={getFinanceLink(vehicle?.id || '')}>Apply to This Vehicle</Link>
          </Button>
        </div>
      </div>
    </div>
  )}

  {/* Breadcrumb */}
        <nav className="bg-muted/30 py-3 border-b" aria-label="Breadcrumb">
          <div className="container mx-auto px-4 overflow-x-auto scrollbar-hide">
            <ol className="flex items-center gap-2 text-sm whitespace-nowrap" role="list">
              <li>
                <Link href="/inventory" className="text-muted-foreground hover:text-foreground">
                  All cars
                </Link>
              </li>
              <li aria-hidden="true" className="text-muted-foreground">›</li>
              <li>
                <Link href={`/inventory?make=${vehicle.make}`} className="text-muted-foreground hover:text-foreground">
                  {vehicle.make}
                </Link>
              </li>
              <li aria-hidden="true" className="text-muted-foreground">›</li>
              <li aria-current="page">{vehicle.model}</li>
            </ol>
          </div>
        </nav>

        {/* Vehicle Title Bar */}
        <div className="border-b py-4">
          <div className="container mx-auto px-4">
            <h1 data-testid="vdp-title" className="font-serif text-xl sm:text-2xl font-bold truncate">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              {vehicle.trim} · {vehicle.mileage.toLocaleString()} km
            </p>
          </div>
        </div>

        {/* Single Tabs wrapper so Radix links aria-controls correctly */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-0">
          {/* Main Tabs - Mobile Optimized with Scroll Indicator */}
          <div className="border-b sticky top-16 bg-background z-40 relative">
            <div className="overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
              <TabsList className="h-12 bg-transparent p-0 gap-0 flex w-max px-4 pr-10">
                {["Photos", "Overview", "Features", "Inspect", "Pricing", "Protection"].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab === "Inspect" ? "inspection" : tab.toLowerCase()}
                    className="h-12 px-3 text-xs sm:text-sm rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap min-h-[44px] flex-shrink-0"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            {/* Scroll indicator gradient - shows there are more tabs on mobile */}
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent pointer-events-none md:hidden" />
          </div>

          <div className="container mx-auto px-4 py-8 overflow-x-hidden max-w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-x-hidden">
              {/* Left Column - Content */}
              <div className="lg:col-span-2">
                {/* Photos Tab */}
                <TabsContent value="photos" className="mt-0 space-y-4">
                  {/* 360° Interactive Viewer — Drivee.ai (requires MID from DRIVEE_VIN_MAP) */}
                  {imageType === "360" && hasDrivee ? (
                    <DriveeViewer
                      mid={vehicle.driveeMid!}
                      vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    />
                  ) : imageType === "360" ? (
                    <VehicleSpinViewer
                      images={allImages}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    />
                  ) : (
                  <div
                    data-testid="vdp-image-gallery"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight") { nextImage(); e.preventDefault() }
                      if (e.key === "ArrowLeft") { prevImage(); e.preventDefault() }
                    }}
                    className="relative aspect-[4/3] rounded-xl overflow-hidden group focus:outline-none focus:ring-2 focus:ring-primary"
                    style={{ backgroundColor: "#e8e8e8" }}
                  >
                    {/* Hidden native img for vdp-active-image testid (Playwright getAttribute('src')) */}
                    {currentImages.length > 0 && currentImages[activeIndex] && (
                      // eslint-disable-next-line @next/next/no-img-element -- intentional: Playwright tests read src via getAttribute
                      <img data-testid="vdp-active-image" src={currentImages[activeIndex]} alt="" className="hidden" />
                    )}
                    {currentImages.length > 0 && currentImages[activeIndex] ? (
                      <>
                        <Image
                          data-testid="vdp-hero-image"
                          src={currentImages[activeIndex]}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                          fill
                          className="object-contain"
                          priority
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                        {/* Expand Button — opens image in new tab */}
                        <button
                          onClick={() => window.open(currentImages[activeIndex], "_blank")}
                          className="absolute top-4 right-4 w-10 h-10 bg-background/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-background transition"
                          aria-label="View full-size image"
                        >
                          <Expand className="w-5 h-5" />
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <Car className="w-20 h-20 text-[#1e3a8a]/15" />
                        <p className="text-sm text-muted-foreground">Photos coming soon</p>
                      </div>
                    )}

                    {/* Navigation Arrows */}
                    <button
                      onClick={prevImage}
                      aria-label="Previous image"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-background transition opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      aria-label="Next image"
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-background transition opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  )}

                  {/* Image Type Toggle */}
                  <div className="flex gap-2 flex-wrap overflow-x-auto scrollbar-hide pb-1">
                    <Button
                      variant={imageType === "exterior" ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setImageType("exterior"); setCurrentImageIndex(0); setIsSpinning(false) }}
                    >
                      Exterior
                    </Button>
                    {vehicle.interiorImages.length > 0 && (
                      <Button
                        variant={imageType === "interior" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setImageType("interior"); setCurrentImageIndex(0); setIsSpinning(false) }}
                      >
                        Interior
                      </Button>
                    )}
                    {has360 && (
                      <Button
                        variant={imageType === "360" ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setImageType("360")
                          setSpinFrame(0)
                          setCurrentImageIndex(0)
                          setIsSpinning(true)
                        }}
                        className="gap-1"
                      >
                        <RotateCw className="h-3.5 w-3.5" />
                        360°
                      </Button>
                    )}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2">
                          <Play className="w-4 h-4" />
                          Video Walkaround
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl">
                        <DialogHeader>
                          <DialogTitle>Video Walkaround - {vehicle.year} {vehicle.make} {vehicle.model}</DialogTitle>
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
                          <Button variant="outline" size="sm" className="justify-start min-h-[44px]">
                            <Car className="w-4 h-4 mr-2" /> Exterior Tour
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start min-h-[44px]">
                            <Users className="w-4 h-4 mr-2" /> Interior Tour
                          </Button>
                          <Button variant="outline" size="sm" className="justify-start min-h-[44px]">
                            <Zap className="w-4 h-4 mr-2" /> Engine Bay
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Thumbnails (hidden in 360 mode — too many frames) */}
                  {imageType !== "360" && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                      {currentImages.map((img: string, i: number) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImageIndex(i)}
                          aria-label={`View image ${i + 1} of ${currentImages.length}`}
                          className={`relative w-16 sm:w-20 h-12 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                            i === activeIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <Image src={img} alt="" fill className="object-cover" sizes="80px" />
                        </button>
                      ))}
                    </div>
                  )}


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
                      <span>VIN <span className="font-mono text-foreground">{vehicle.vin}</span></span>
                      <span>Stock # <span className="font-medium text-foreground">{vehicle.stockNumber}</span></span>
                    </div>
                  </div>

                  <Link href={`https://www.planetmotors.ca/inventory/${vehicle.stockNumber || vehicle.id}`} target="_blank" className="text-primary text-sm flex items-center gap-1 hover:underline">
                    <ExternalLink className="w-4 h-4" />
                    View Full Listing on planetmotors.ca →
                  </Link>

                  {/* Vehicle Details Icons */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Settings className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">TRANSMISSION</span>
                      <span className="text-sm font-medium">{vehicle.transmission}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Fuel className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">FUEL TYPE</span>
                      <span className="text-sm font-medium">{vehicle.fuelType}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">ENGINE</span>
                      <span className="text-sm font-medium">{vehicle.engine || "N/A"}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">SEATS</span>
                      <span className="text-sm font-medium">{vehicle.seats || 5} seats</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Key className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">KEYS</span>
                      <span className="text-sm font-medium">{vehicle.keys || 2} keys</span>
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
                          <p className="font-medium text-sm">{vehicle.mileage.toLocaleString()} km</p>
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
                          <Button className="mt-3" size="sm" asChild>
                            <Link href={getFinanceLink(vehicle.id)}>Start purchase</Link>
                          </Button>
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
                          <Button variant="outline" className="mt-3" size="sm" asChild>
                            <Link href={getFinanceLink(vehicle.id)}>Start purchase</Link>
                          </Button>
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
                        <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setActiveTab("features")}>
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
                          <span className="font-medium">{vehicle.range || "N/A"}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Exterior</span>
                          <span className="font-medium">{vehicle.exteriorColor}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-muted-foreground">Interior</span>
                          <span className="font-medium">{vehicle.interiorColor}</span>
                        </div>
                        <div className="flex justify-between py-2">
                          <span className="text-muted-foreground">Drive</span>
                          <span className="font-medium">{vehicle.drivetrain}</span>
                        </div>
                        <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setActiveTab("features")}>
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
                            <Button variant="link" className="p-0 h-auto text-primary text-sm" onClick={() => setActiveTab("features")}>
                              View details →
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
                    <h2 className="font-serif text-2xl font-bold">210-Point Inspection</h2>
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
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1" />
                            <p className="text-[11px] sm:text-xs font-medium leading-tight">{cat.name}</p>
                            <p className="text-[11px] sm:text-xs text-primary">{cat.points} pts</p>
                          </div>
                        ))}
                      </div>

                      {/* VIN & History — Items 1-10 */}
                      <div className="space-y-1">
                        <div className="bg-teal-600 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-medium">VIN & History ��� Items 1-10</span>
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
                        <div className="bg-teal-500 text-white p-2 rounded-t-lg flex items-center gap-2">
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
                        <Button className="mt-4" variant="outline" onClick={() => window.print()}>
                          <Download className="w-4 h-4 mr-2" />
                          Print Inspection Report
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
                        <Link href={`https://www.carfax.ca/vehicle/${vehicle.vin}`} target="_blank">
                          View report <ExternalLink className="w-4 h-4 ml-1" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* EV Battery Health - Show for EVs/PHEVs */}
                  {(vehicle.fuelType === "Electric" || vehicle.fuelType === "PHEV") && (
                    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Battery className="w-5 h-5 text-green-600" />
                            <span className="font-semibold text-green-800 dark:text-green-400">Battery Health</span>
                          </div>
                          <Badge className="bg-green-500">{vehicle.batteryHealth || 95}% SOH</Badge>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estimated Range</span>
                            <span className="font-medium">{vehicle.range || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Battery Capacity</span>
                            <span className="font-medium">{vehicle.batteryCapacity || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fast Charging</span>
                            <span className="font-medium">{vehicle.chargingSpeed || "N/A"}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="w-full mt-3 border-green-300 text-green-700 hover:bg-green-100" onClick={() => setActiveTab("inspection")}>
                          View Full Battery Report <ArrowRight className="w-4 h-4 ml-1" />
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
                  <h2 className="font-serif text-2xl font-bold text-center">Price Details</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pay Over Time - Includes $895 Finance Docs Fee */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">PAY OVER TIME</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">${biweeklyPayment}<span className="text-lg font-normal">/biweekly*</span></p>
                        <p className="text-xs text-muted-foreground mt-2">
                          *Estimated payment based on 8.99% APR for 84 months, includes $0 cash down. OAC — on approved credit.
                        </p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Vehicle Price</span>
                            <span>${vehicle.price.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-primary font-medium">
                            <span>Finance Docs Fee</span>
                            <span>+${FINANCE_ADMIN_FEE}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>HST ({(PROVINCE_TAX_RATES.ON.hst * 100).toFixed(0)}%)</span>
                            <span>+${Math.round(financeTax).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-foreground pt-1 border-t">
                            <span>Total Financed</span>
                            <span>${Math.round(financeTotal).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg">
                          <p className="text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-amber-600" />
                            <span className="font-medium">80% of buyers finance with us</span>
                          </p>
                          <p className="text-xs text-muted-foreground">Get personalized financing terms in 2 minutes — no impact to your credit score.</p>
                        </div>
                        <Button className="w-full mt-4" variant="outline" asChild>
                          <Link href={getFinanceLink(vehicle.id)}>Get pre-qualified</Link>
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Pay Once - Cash price (no Finance Docs Fee) */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">PAY ONCE (CASH)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold">${vehicle.price.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">As-is price · No Finance Docs Fee</p>
                        <div className="flex items-center gap-2 text-sm text-primary mt-2">
                          <Truck className="w-4 h-4" />
                          Nationwide delivery available · Richmond Hill
                        </div>
                        <div className="mt-4 space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Vehicle price</span>
                            <span>${vehicle.pricing.vehiclePrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Delivery fee</span>
                            <span>${vehicle.pricing.deliveryFee}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Estimated HST ({(PROVINCE_TAX_RATES.ON.hst * 100).toFixed(0)}%)</span>
                            <span>${vehicle.pricing.hst.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">OMVIC Fee</span>
                            <span>${vehicle.pricing.omvicFee}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Licensing & registration</span>
                            <span>ON ~ ${vehicle.pricing.licensingReg}</span>
                          </div>
                          <div className="flex justify-between font-semibold pt-2 border-t">
                            <span>Total (incl. HST)</span>
                            <span>${vehicle.pricing.totalWithHst.toLocaleString()}</span>
                          </div>
                        </div>
                        <Button className="w-full mt-4" onClick={() => handleProtectedAction("start your purchase", () => {
                          window.location.href = `/checkout/${vehicle.id}`
                        })}>Start your purchase</Button>
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
                        <span className="font-medium">${vehicle.price.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>HST ({(PROVINCE_TAX_RATES.ON.hst * 100).toFixed(0)}%)</span>
                        <span className="font-medium">${vehicle.pricing.hst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>OMVIC Fee</span>
                        <span className="font-medium">${vehicle.pricing.omvicFee}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Certification Fee</span>
                        <span className="font-medium">${vehicle.pricing.certificationFee}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Licensing & Registration (est.)</span>
                        <span className="font-medium">ON ~ ${vehicle.pricing.licensingReg}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Delivery</span>
                        <span className="font-medium text-green-600">$0 (Ontario)</span>
                      </div>
                      <div className="flex justify-between py-3 font-semibold text-lg">
                        <span>Estimated Total</span>
                        <span className="text-primary">${(vehicle.pricing.totalWithHst + vehicle.pricing.certificationFee).toLocaleString()}</span>
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

                {/* ARCHIVED: Ratings Tab - Commented out per request
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
                */}

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
              {/* Next Steps */}
              <div className="mt-12 pt-8 border-t">
                <h2 className="text-xl font-semibold mb-6">Next steps</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {[
                    { step: 1, title: "Start", subtitle: "Purchase", active: true },
                    { step: 2, title: "Your", subtitle: "Info", active: false },
                    { step: 3, title: "Add", subtitle: "Protection", active: false },
                    { step: 4, title: "Finance", subtitle: "If needed", active: false },
                    { step: 5, title: "Get your", subtitle: "Car!", active: false }
                  ].map((item) => (
                    <div key={item.step} className="text-center p-3 border rounded-lg">
                      <p className="text-xl sm:text-2xl font-bold mb-1">{item.step}</p>
                      <p className="font-medium text-xs sm:text-sm">{item.title}</p>
                      {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                      {item.active && (
                        <Button size="sm" className="mt-3" asChild>
                          <Link href={getFinanceLink(vehicle.id)}>Start purchase</Link>
                        </Button>
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
<p className="text-4xl font-bold">500+</p>
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
              <Card className="sticky top-20 shadow-lg border-2">
                <CardContent className="p-5">
                  {/* Vehicle Title */}
                  <h2 className="text-xl font-bold">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    {vehicle.trim} · {vehicle.mileage.toLocaleString()} km
                  </p>

                  {/* Price */}
                  <p className="text-3xl font-bold mt-3">${vehicle.price.toLocaleString()}</p>
                  <div className="flex items-center gap-2 text-sm mt-1">
                    <span>Estimated <span className="font-semibold">${biweeklyPayment}/biweekly</span></span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">$0 down</span>
                    <Link href={getFinanceLink(vehicle.id)} className="text-primary hover:underline">Get your terms</Link>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-medium">10-Day Money Back Guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <LockKeyhole className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-medium">$250 Refundable Deposit</span>
                    </div>
                  </div>

                  {/* CTA Buttons */}
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {user ? (
                      <ReserveVehicleModal
                        vehicle={{
                          id: vehicle.id,
                          year: vehicle.year,
                          make: vehicle.make,
                          model: vehicle.model,
                          trim: vehicle.trim,
                          price: vehicle.price,
                          image: vehicle.images?.[0] || "/placeholder.jpg",
                          stockNumber: vehicle.stockNumber
                        }}
                        trigger={
                          <Button className="w-full h-11 bg-red-600 hover:bg-red-700 text-white">
                            <LockKeyhole className="w-4 h-4 mr-2" />
                            Quick Reserve – $250 Refundable Deposit
                          </Button>
                        }
                      />
                    ) : (
                      <Button
                        className="w-full h-11 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleProtectedAction("reserve this vehicle")}
                      >
                        <LockKeyhole className="w-4 h-4 mr-2" />
                        Quick Reserve – $250 Refundable Deposit
                      </Button>
                    )}
                    <p className="text-xs text-center text-muted-foreground">Hold this vehicle for 48 hours while you decide</p>
                    <Button
                      data-testid="btn-start-purchase"
                      className="w-full h-11"
                      variant="secondary"
                      asChild
                    >
                      <a href={`/checkout/${vehicle.id}`}>
                        Buy Now – Full Purchase Process
                      </a>
                    </Button>
                  </div>

                  <p className="text-xs text-center text-muted-foreground mt-2">
                    Excl. HST & Licensing · Incl. OMVIC Fee
                  </p>

                  {/* AI Features Section */}
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <h4 className="text-sm font-medium text-muted-foreground">AI-POWERED FEATURES</h4>

                    {/* AI Price Negotiator */}
                    <PriceNegotiator
                      vehicleId={vehicle.id}
                      vehiclePrice={vehicle.price}
                      vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    />

                    {/* Live Video Call */}
                    <LiveVideoCall
                      vehicleId={vehicle.id}
                      vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    />

                    {/* Price Drop Alert */}
                    <PriceDropAlert
                      vehicleId={vehicle.id}
                      vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      currentPrice={vehicle.price}
                    />

                    {/* Add to Compare */}
                    <AddToCompare
                      vehicle={{
                        id: vehicle.id,
                        name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                        price: vehicle.price,
                        image: vehicle.images?.[0] || "/placeholder.jpg",
                        mileage: vehicle.mileage,
                        year: vehicle.year
                      }}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center gap-4 mt-4 pt-4 border-t">
                    <Button variant="ghost" size="sm" onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-1" />
                      Share
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (!isFavorite && vehicle) {
                          const name = `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                          trackAddToWishlist({ id: vehicle.id, name, price: vehicle.price })
                          trackMetaAddToWishlist({ id: vehicle.id, name, price: vehicle.price })
                        }
                        setIsFavorite(!isFavorite)
                      }}
                      className={isFavorite ? "text-red-500" : ""}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${isFavorite ? "fill-current" : ""}`} />
                      Save
                    </Button>
                    <PriceDropAlert
                      vehicleId={vehicle.id}
                      vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                      currentPrice={vehicle.price}
                      triggerLabel="Notify"
                      triggerVariant="ghost"
                      triggerClassName="gap-1"
                    />
                  </div>

                  {/* CARFAX */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <Badge variant="outline" className="border-red-500 text-red-600">CARFAX</Badge>
                    <Button variant="link" className="text-primary p-0 h-auto" asChild>
                      <Link href={`https://www.carfax.ca/vehicle/${vehicle.vin}`} target="_blank">
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
                        onChange={(e) => setPostalCode(normalizePostalCode(e.target.value))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault()
                            handleDeliveryCheck()
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={handleDeliveryCheck}
                        disabled={isCheckingDelivery}
                      >
                        {isCheckingDelivery ? "Checking..." : "Check"}
                      </Button>
                    </div>
                    {deliveryError && (
                      <p className="text-xs text-red-600 mt-2">{deliveryError}</p>
                    )}
                    {deliveryQuote && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {deliveryQuote.isDeliveryAvailable
                          ? deliveryQuote.isFreeDelivery
                            ? `Free delivery to ${deliveryQuote.postalCode} (${deliveryQuote.distanceKm} km).`
                            : `Delivery to ${deliveryQuote.postalCode}: $${deliveryQuote.deliveryCost.toFixed(2)} (${deliveryQuote.distanceKm} km).`
                          : `Delivery is not available for ${deliveryQuote.postalCode} right now.`}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      Questions? <Link href="tel:416-985-2277" className="font-semibold text-foreground" onClick={() => trackPhoneClick("416-985-2277")}>416-985-2277</Link>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            </div>
          </div>
        </Tabs>

        {/* Similar Vehicles */}
        <div className="container mx-auto px-4 py-8 border-t">
          <h2 className="text-xl font-semibold mb-4">Other cars you might like</h2>
          <SimilarVehicles
            currentVehicleId={vehicle.id}
            make={vehicle.make}
            priceRange={vehicle.price}
          />
        </div>
</main>

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-3 pb-safe md:hidden z-50">
        <div className="flex items-center gap-3 max-w-lg mx-auto">
          <div className="shrink-0">
            <p className="text-xs text-muted-foreground">Price</p>
            <p className="text-lg font-bold">${vehicle.price.toLocaleString()}</p>
          </div>
          <Button
            className="flex-1 h-12 min-h-[48px] bg-red-600 hover:bg-red-700 text-white text-sm font-medium"
            onClick={() => handleProtectedAction("reserve this vehicle")}
          >
            <LockKeyhole className="w-4 h-4 mr-1.5 shrink-0" />
            <span>Reserve Now</span>
          </Button>
        </div>
      </div>

      <Footer />

      {/* Auth Required Modal */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action={authAction}
        redirectTo={`/vehicles/${vehicle.id}`}
      />
    </div>
  )
}
