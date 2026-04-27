/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import type { VehicleDetail } from "@/lib/vehicles/fetch-vehicle"
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
  Key, RotateCw, Pause
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { SocialProof } from "@/components/social-proof"
import { useFavorites } from "@/contexts/favorites-context"
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"
import { RATE_FLOOR, RATE_FLOOR_DISPLAY, DEFAULT_TERM_MONTHS, FINANCE_ADMIN_FEE, calculateBiweeklyPayment } from "@/lib/rates"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { trackProductView, trackPhoneClick } from "@/components/analytics/google-tag-manager"
import { safeNum } from "@/lib/pricing/format"
import { trackViewItem, trackAddToWishlist } from "@/components/analytics/google-analytics"
import { trackMetaViewContent, trackMetaAddToWishlist } from "@/components/analytics/meta-pixel"
import { PHONE_LOCAL, PHONE_LOCAL_TEL, DEALERSHIP_ADDRESS_FULL } from "@/lib/constants/dealership"
import { FALLBACK_VEHICLE_DATA as vehicleData } from "@/lib/vdp/fallback-vehicle-data"

// ── Lazy-load heavy below-fold components ──
const DriveeViewer = dynamic(
  () => import("@/components/drivee-viewer").then(m => ({ default: m.DriveeViewer })),
  { ssr: false, loading: () => <div className="aspect-[4/3] rounded-xl animate-pulse" style={{ background: "#e8e8e8" }} /> }
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

/** Props received from the server component (page.tsx). */
export interface VDPClientProps {
  /** Pre-fetched vehicle data from server-side Supabase query. */
  serverVehicle: VehicleDetail
}

export default function VDPClient({ serverVehicle }: VDPClientProps) {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { addFavorite, removeFavorite, isFavorite: isFavoriteInContext } = useFavorites()

  // ── Build the merged vehicle shape from server data + mock inspection fallbacks ──
  // HomenetIOL: first image often has dealer overlays. Skip when feed has > 1 image.
  const fallbackImages: string[] = serverVehicle.primaryImageUrl
    ? [serverVehicle.primaryImageUrl]
    : vehicleData.images
  const rawImages: string[] = serverVehicle.imageUrls.length > 0
    ? serverVehicle.imageUrls
    : fallbackImages

  const cleanImages = rawImages.length > 1
    && rawImages[0] === serverVehicle.primaryImageUrl
    && rawImages[0]?.includes('homenetiol.com')
    ? rawImages.slice(1)
    : rawImages

  const splitIndex = cleanImages.length > 10 ? Math.ceil(cleanImages.length * 0.6) : cleanImages.length
  const exteriorImgs = cleanImages.slice(0, splitIndex)
  const interiorImgs = cleanImages.length > 10 ? cleanImages.slice(splitIndex) : []

  // Merged vehicle object — SSR data + mock inspection fallback
  const vehicle = {
    ...vehicleData,
    id: serverVehicle.id,
    year: serverVehicle.year,
    make: serverVehicle.make,
    model: serverVehicle.model,
    trim: serverVehicle.trim,
    price: serverVehicle.price,
    mileage: serverVehicle.mileage,
    exteriorColor: serverVehicle.exteriorColor,
    interiorColor: serverVehicle.interiorColor,
    fuelType: serverVehicle.fuelType,
    transmission: serverVehicle.transmission,
    drivetrain: serverVehicle.drivetrain,
    bodyStyle: serverVehicle.bodyStyle,
    vin: serverVehicle.vin,
    stockNumber: serverVehicle.stockNumber,
    driveeMid: serverVehicle.driveeMid,
    images: exteriorImgs,
    interiorImages: interiorImgs,
    pricing: {
      vehiclePrice: serverVehicle.pricing.vehiclePrice,
      deliveryFee: 0,
      hst: serverVehicle.pricing.hst,
      omvicFee: serverVehicle.pricing.omvicFee,
      certificationFee: serverVehicle.pricing.certificationFee,
      licensingReg: serverVehicle.pricing.licensingFee,
      totalWithHst: serverVehicle.pricing.total,
    },
  }

  const vehicleId = vehicle.id
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const isFavorite = isFavoriteInContext(vehicleId)
  const [activeTab, setActiveTab] = useState("photos")
  const [imageType, setImageType] = useState<"exterior" | "interior" | "360">("exterior")
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
  const getFinanceLink = (vId: string) => {
    if (tradeInValue && Number.parseInt(tradeInValue) > 0) {
      const params = new URLSearchParams({
        tradeIn: tradeInValue,
        quoteId: tradeInQuoteId || '',
        tradeInVehicle: tradeInVehicle || ''
      })
      return `/finance/${vId}?${params.toString()}`
    }
    return `/finance/${vId}`
  }

  // Track product view on mount (data is already available from SSR)
  useEffect(() => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Fire once on mount
  }, [])

  // ── 360° via Drivee iframe ──
  const has360 = !!vehicle?.driveeMid

  // ── Auto-spin for 360° fallback (no Drivee) ──
  const [isAutoSpinning, setIsAutoSpinning] = useState(true)
  const autoSpinRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const AUTO_SPIN_INTERVAL = 1500 // ms between frames

  const clearAutoSpin = useCallback(() => {
    if (autoSpinRef.current) {
      clearInterval(autoSpinRef.current)
      autoSpinRef.current = null
    }
  }, [])

  // Start / stop auto-spin when 360 tab is active without Drivee
  useEffect(() => {
    const shouldSpin = imageType === "360" && !has360 && isAutoSpinning && vehicle?.images?.length > 1
    if (shouldSpin) {
      clearAutoSpin()
      autoSpinRef.current = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % vehicle.images.length)
      }, AUTO_SPIN_INTERVAL)
    } else {
      clearAutoSpin()
    }
    return clearAutoSpin
  }, [imageType, has360, isAutoSpinning, vehicle?.images?.length, clearAutoSpin])

  const handleProtectedAction = (action: string, callback?: () => void) => {
    if (!user) {
      setAuthAction(action)
      setShowAuthModal(true)
    } else if (callback) {
      callback()
    }
  }

  const handleShare = async () => {
    const shareUrl = typeof globalThis.window !== "undefined" ? globalThis.window.location.href : ""
    const shareTitle = `${vehicle.year} ${vehicle.make} ${vehicle.model} at Planet Motors`
    const shareText = `Check out this ${vehicle.year} ${vehicle.make} ${vehicle.model} for $${safeNum(vehicle.price).toLocaleString()}.`
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
    const images = imageType === "exterior" ? vehicle.images : vehicle.interiorImages
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    const images = imageType === "exterior" ? vehicle.images : vehicle.interiorImages
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  // No loading state — vehicle data is pre-fetched server-side (SSR)
  const currentImages: string[] = imageType === "exterior" ? vehicle.images : vehicle.interiorImages
  const activeIndex = currentImageIndex

  // Finance calculation — delegates to lib/rates.ts (CI-guarded)
  const safePrice = safeNum(vehicle.price)
  const financeSubtotal = safePrice + FINANCE_ADMIN_FEE
  const financeTax = financeSubtotal * PROVINCE_TAX_RATES.ON.hst
  const financeTotal = financeSubtotal + financeTax
  const biweeklyPayment = calculateBiweeklyPayment(safePrice, RATE_FLOOR, DEFAULT_TERM_MONTHS, PROVINCE_TAX_RATES.ON.hst)

  return (
    <div className="min-h-screen bg-background">
      {/* JSON-LD is server-rendered in page.tsx — no client Script needed */}
      <Header />
      <main id="main-content" tabIndex={-1} className="pb-32 md:pb-20 overflow-x-hidden max-w-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2" role="main" aria-label="Vehicle details" data-vin={vehicle.vin} data-stock={vehicle.stockNumber}>

        {/* Trade-In Banner */}
        {tradeInValue && Number.parseInt(tradeInValue) > 0 && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3">
            <div className="container mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-semibold">
                    Your Trade-In: <span className="font-bold tabular-nums">${Number.parseInt(tradeInValue).toLocaleString()}</span>
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
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-[84px] overflow-x-auto scrollbar-hide">
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

        {/* VDP H1 — SEO & accessibility: one H1 per page */}
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-[84px] pt-4 pb-2">
          <h1 className="text-[28px] md:text-[40px] font-bold tracking-[-0.01em] md:tracking-[-0.02em] leading-tight">
            {vehicle.year} {vehicle.make} {vehicle.model}{vehicle.trim ? ` ${vehicle.trim}` : ''}
          </h1>
          {/* Finance-first callout — price + payment visible immediately */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
            <span className="text-2xl md:text-3xl font-bold tabular-nums">${safeNum(vehicle.price).toLocaleString()}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-base md:text-lg font-semibold tabular-nums">${biweeklyPayment}/bi-weekly</span>
            <span className="text-sm text-muted-foreground tabular-nums">@ {RATE_FLOOR_DISPLAY} APR</span>
          </div>
          {/* Social proof — mobile placement (below price header) */}
          <SocialProof vehicleId={vehicle.id} className="mt-2 md:hidden" />
        </div>

        {/* Single Tabs wrapper so Radix links aria-controls correctly */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-0">
          {/* Main Tabs - Mobile Optimized with Scroll Indicator */}
          <div className="border-b sticky top-16 bg-background z-40 relative">
            <div className="max-w-[1440px] mx-auto overflow-x-auto overflow-y-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
              <TabsList className="h-12 bg-transparent p-0 gap-0 flex w-max px-4 sm:px-6 lg:px-10 xl:px-[84px] pr-10">
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

          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 xl:px-[84px] pb-8 overflow-x-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 lg:gap-10 overflow-x-hidden items-start">
              {/* Left Column - Content */}
              <div className="min-w-0 overflow-hidden">
                {/* Photos Tab */}
                <TabsContent value="photos" className="mt-0 space-y-4">
                  {/* 360° Interactive Viewer — Drivee iframe (if available) */}
                  {(() => {
                    if (imageType === "360" && has360 && vehicle.driveeMid) {
                      return (
                        <DriveeViewer
                          mid={vehicle.driveeMid}
                          vehicleName={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        />
                      )
                    }
                    if (imageType === "360" && !has360) {
                      return (
                  /* ── Auto-Spin 360° Fallback — cycles exterior photos ── */
                  <div
                    data-testid="vdp-auto-spin"
                    className="relative aspect-[4/3] rounded-xl overflow-hidden group"
                    style={{ backgroundColor: "#111" }}
                    onMouseEnter={() => setIsAutoSpinning(false)}
                    onMouseLeave={() => setIsAutoSpinning(true)}
                  >
                    {vehicle.images.length > 0 && vehicle.images[currentImageIndex] ? (
                      <>
                        <Image
                          src={vehicle.images[currentImageIndex]}
                          alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} — 360° view`}
                          fill
                          className="object-contain transition-opacity duration-500"
                          priority
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                        />
                        {/* 360° overlay badge */}
                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5">
                          <RotateCw className="h-3 w-3 animate-spin" style={{ animationDuration: "3s" }} />
                          Auto-Spin 360°
                        </div>
                        {/* Play / Pause toggle */}
                        <button
                          onClick={() => setIsAutoSpinning(!isAutoSpinning)}
                          className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition shadow-lg"
                          aria-label={isAutoSpinning ? "Pause auto-spin" : "Play auto-spin"}
                          type="button"
                        >
                          {isAutoSpinning ? <Pause className="h-4 w-4 text-black" /> : <Play className="h-4 w-4 text-black ml-0.5" />}
                        </button>
                        {/* Image counter */}
                        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur text-white px-2 py-1 rounded text-xs">
                          {currentImageIndex + 1} / {vehicle.images.length}
                        </div>
                        {/* Manual prev/next arrows */}
                        <button
                          onClick={() => { setIsAutoSpinning(false); setCurrentImageIndex((p: number) => (p - 1 + vehicle.images.length) % vehicle.images.length) }}
                          aria-label="Previous image"
                          type="button"
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => { setIsAutoSpinning(false); setCurrentImageIndex((p: number) => (p + 1) % vehicle.images.length) }}
                          aria-label="Next image"
                          type="button"
                          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-white transition opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                        <RotateCw className="w-12 h-12 text-white/20" />
                        <p className="text-sm text-white/50">No exterior photos available</p>
                      </div>
                    )}
                  </div>
                      )
                    }
                    return (
                  <section
                    data-testid="vdp-image-gallery"
                    tabIndex={0}
                    aria-label="Vehicle image gallery"
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
                          className="object-contain [clip-path:inset(0_0_8%_0)]"
                          priority
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none"
                          }}
                        />
                        {/* Expand Button — opens image in new tab */}
                        <button
                          onClick={() => globalThis.open(currentImages[activeIndex], "_blank")}
                          className="absolute top-4 right-4 w-10 h-10 bg-background/80 backdrop-blur rounded-lg flex items-center justify-center hover:bg-background transition"
                          aria-label="View full-size image"
                          type="button"
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
                      type="button"
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-background transition opacity-0 group-hover:opacity-100"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      onClick={nextImage}
                      aria-label="Next image"
                      type="button"
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-background/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-background transition opacity-0 group-hover:opacity-100"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </section>
                    )
                  })()}

                  {/* Image Type Toggle */}
                  <div className="flex gap-2 flex-wrap overflow-x-auto scrollbar-hide pb-1">
                    <Button
                      variant={imageType === "exterior" ? "default" : "outline"}
                      size="sm"
                      onClick={() => { setImageType("exterior"); setCurrentImageIndex(0) }}
                    >
                      Exterior
                    </Button>
                    {vehicle.interiorImages.length > 0 && (
                      <Button
                        variant={imageType === "interior" ? "default" : "outline"}
                        size="sm"
                        onClick={() => { setImageType("interior"); setCurrentImageIndex(0) }}
                      >
                        Interior
                      </Button>
                    )}
                    {/* 360° always visible — uses Drivee if available, auto-spin fallback otherwise */}
                    <Button
                      variant={imageType === "360" ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setImageType("360")
                        setCurrentImageIndex(0)
                        setIsAutoSpinning(true)
                      }}
                      className="gap-1"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                      360°
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
                          key={img}
                          onClick={() => setCurrentImageIndex(i)}
                          aria-label={`View image ${i + 1} of ${currentImages.length}`}
                          type="button"
                          className={`relative w-16 sm:w-20 h-12 sm:h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                            i === activeIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <Image src={img} alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} — photo ${i + 1} of ${currentImages.length}`} fill className="object-cover [clip-path:inset(0_0_8%_0)]" sizes="80px" />
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
                    <h2 className="text-xl font-bold">Overview</h2>
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      <span>VIN <span className="font-mono text-foreground">{vehicle.vin}</span></span>
                      <span>Stock # <span className="font-semibold text-foreground">{vehicle.stockNumber}</span></span>
                    </div>
                  </div>

                  {/* Vehicle Details Icons */}
                  <div className="flex flex-wrap gap-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Settings className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">TRANSMISSION</span>
                      <span className="text-sm font-semibold">{vehicle.transmission}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Fuel className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">FUEL TYPE</span>
                      <span className="text-sm font-semibold">{vehicle.fuelType}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Zap className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">ENGINE</span>
                      <span className="text-sm font-semibold">{vehicle.engine || "N/A"}</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Users className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">SEATS</span>
                      <span className="text-sm font-semibold">{vehicle.seats || 5} seats</span>
                    </div>
                    <div className="flex flex-col items-center text-center">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-1">
                        <Key className="w-5 h-5" />
                      </div>
                      <span className="text-xs text-muted-foreground">KEYS</span>
                      <span className="text-sm font-semibold">{vehicle.keys || 2} keys</span>
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
                            <p className="font-semibold text-sm">No accidents</p>
                            <p className="text-xs text-muted-foreground">Reported by Carfax</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="flex-1 min-w-[140px]">
                        <CardContent className="p-3 flex items-center gap-2">
                          <Gauge className="w-5 h-5 text-muted-foreground" />
                          <p className="font-semibold text-sm tabular-nums">{vehicle.mileage.toLocaleString()} km</p>
                        </CardContent>
                      </Card>
                      <Card className="flex-1 min-w-[140px]">
                        <CardContent className="p-3 flex items-center gap-2">
                          <Shield className="w-5 h-5 text-purple-500" />
                          <div>
                            <p className="font-semibold text-sm">Safety certified</p>
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
                          <p className="text-sm text-green-600 font-semibold">FREE</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {DEALERSHIP_ADDRESS_FULL}. Open Mon–Sat.
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
                            <p className="font-semibold">10 days to try it out</p>
                            <p className="text-sm text-muted-foreground">take your time to know the car</p>
                          </div>
                          <div>
                            <p className="font-semibold">You pick your route</p>
                            <p className="text-sm text-muted-foreground">city, highway, night, rain, etc.</p>
                          </div>
                          <div>
                            <p className="font-semibold">Completely unaccompanied</p>
                            <p className="text-sm text-muted-foreground">no pressure, no rush</p>
                          </div>
                          <div>
                            <p className="font-semibold">Full money-back guarantee</p>
                            <p className="text-sm text-muted-foreground">for any reason</p>
                          </div>
                        </div>
                        <div className="space-y-4 p-4">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-muted-foreground">The old way</p>
                            <span className="text-xs bg-muted px-2 py-0.5 rounded">vs</span>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">Only 15 mins on average</p>
                            <p className="text-sm text-muted-foreground">limited feel for comfort or quirks</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">Seller picks route</p>
                            <p className="text-sm text-muted-foreground">limited speeds/conditions</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">Accompanied by salesperson</p>
                            <p className="text-sm text-muted-foreground">pressure to decide</p>
                          </div>
                          <div>
                            <p className="font-semibold text-muted-foreground">No return option</p>
                            <p className="text-sm text-muted-foreground">sale is final</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="mt-0 space-y-6">
                  <h2 className="text-xl font-bold">Features and specs</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Features */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">FEATURES</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-0">
                        <div className="flex justify-between py-4 border-b">
                          <span className="text-muted-foreground">Comfort & Convenience</span>
                          <span className="font-semibold">Heated Seats</span>
                        </div>
                        <div className="flex justify-between py-4 border-b">
                          <span className="text-muted-foreground">Safety & Security</span>
                          <span className="font-semibold">Autopilot</span>
                        </div>
                        <div className="flex justify-between py-4 border-b">
                          <span className="text-muted-foreground">Entertainment & Tech</span>
                          <span className="font-semibold">15&quot; Touchscreen</span>
                        </div>
                        <div className="flex justify-between py-4">
                          <span className="text-muted-foreground">Braking & Traction</span>
                          <span className="font-semibold">Brake Assist</span>
                        </div>
                        <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setActiveTab("features")}>
                          View all features →
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Specs */}
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">SPECS</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-0">
                        <div className="flex justify-between py-4 border-b">
                          <span className="text-muted-foreground">Range</span>
                          <span className="font-semibold">{vehicle.range || "N/A"}</span>
                        </div>
                        <div className="flex justify-between py-4 border-b">
                          <span className="text-muted-foreground">Exterior</span>
                          <span className="font-semibold">{vehicle.exteriorColor}</span>
                        </div>
                        <div className="flex justify-between py-4 border-b">
                          <span className="text-muted-foreground">Interior</span>
                          <span className="font-semibold">{vehicle.interiorColor}</span>
                        </div>
                        <div className="flex justify-between py-4">
                          <span className="text-muted-foreground">Drive</span>
                          <span className="font-semibold">{vehicle.drivetrain}</span>
                        </div>
                        <Button variant="link" className="p-0 h-auto text-primary" onClick={() => setActiveTab("features")}>
                          View all specs →
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Packages */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">PACKAGES</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {(vehicleData.packages as readonly (string | { name: string })[]).map((pkg) => (
                        <div key={typeof pkg === "string" ? pkg : pkg.name} className="py-4 border-b last:border-b-0">
                          <div className="flex justify-between items-center">
                            <span className="font-semibold">{typeof pkg === "string" ? pkg : pkg.name}</span>
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
                      {vehicleData.inspectionItems.map((item) => (
                        <div key={item.category} className="flex justify-between items-center px-4 py-4 border-b last:border-b-0">
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
                        {vehicleData.inspectionCategories.map((cat) => (
                          <div key={cat.name} className="text-center p-2 bg-muted/30 rounded-lg">
                            <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-primary mx-auto mb-1" />
                            <p className="text-[11px] sm:text-xs font-semibold leading-tight">{cat.name}</p>
                            <p className="text-[11px] sm:text-xs text-primary">{cat.points} pts</p>
                          </div>
                        ))}
                      </div>

                      {/* VIN & History — Items 1-10 */}
                      <div className="space-y-1">
                        <div className="bg-teal-600 text-white p-2 rounded-t-lg flex items-center gap-2">
                          <span className="text-sm font-semibold">VIN & History — Items 1-10</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.vinHistory.map((item, i) => (
                            <div key={item} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
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
                          <span className="text-sm font-semibold">Powertrain & Engine — Items 11-32</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.powertrainEngine.map((item, i) => (
                            <div key={item} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
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
                          <span className="text-sm font-semibold">Brakes, Suspension & Steering — Items 33-45</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.brakesSuspension.map((item, i) => (
                            <div key={item} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
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
                          <span className="text-sm font-semibold">Tyres & Wheels — Items 46-53</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.tyresWheels.map((item, i) => (
                            <div key={item} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
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
                          <span className="text-sm font-semibold">Vehicle Exterior — Items 54-74</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.exterior.map((item, i) => (
                            <div key={item} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
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
                          <span className="text-sm font-semibold">Vehicle Interior — Items 75-94</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.interior.map((item, i) => (
                            <div key={item} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
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
                          <span className="text-sm font-semibold">How it Drives — Items 95-104</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.driveTest.map((item, i) => (
                            <div key={item} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
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
                          <span className="text-sm font-semibold">EV & Hybrid Systems — Items 105-116</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.evSystems.map((item, i) => (
                            <div key={item} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
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
                          <span className="text-sm font-semibold">Detailing, Safety & Advanced — Items 117-210</span>
                        </div>
                        <div className="border rounded-b-lg">
                          <div className="grid grid-cols-[40px_1fr_60px] text-xs font-medium border-b px-3 py-2 bg-muted/30">
                            <span>#</span><span>Inspection Item</span><span className="text-right">Status</span>
                          </div>
                          {vehicleData.fullInspection.detailingSafety.map((item, i) => (
                            <div key={item} className="grid grid-cols-[40px_1fr_60px] text-sm px-3 py-2 border-b last:border-b-0">
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
                        <Button className="mt-4" variant="outline" onClick={() => globalThis.print()}>
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
                            <span className="font-semibold">{vehicle.range || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Battery Capacity</span>
                            <span className="font-semibold">{vehicle.batteryCapacity || "N/A"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fast Charging</span>
                            <span className="font-semibold">{vehicle.chargingSpeed || "N/A"}</span>
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
                      {vehicleData.conditionItems.map((item) => (
                        <div key={item} className="flex items-start gap-2">
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
                    {/* Pay Over Time - Includes $895 Finance Docs Fee */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-muted-foreground">PAY OVER TIME</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-3xl font-bold tabular-nums">${biweeklyPayment}<span className="text-lg font-normal">/biweekly*</span></p>
                        <p className="text-xs text-muted-foreground mt-2">
                          *Estimated payment based on {RATE_FLOOR_DISPLAY} APR for {DEFAULT_TERM_MONTHS} months, includes $0 cash down. OAC — on approved credit.
                        </p>
                        <div className="mt-3 space-y-1 text-xs text-muted-foreground tabular-nums">
                          <div className="flex justify-between">
                            <span>Vehicle Price</span>
                            <span>${safeNum(vehicle.price).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-primary font-semibold">
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
                            <span className="font-semibold">80% of buyers finance with us</span>
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
                        <p className="text-3xl font-bold tabular-nums">${safeNum(vehicle.price).toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">As-is price · No Finance Docs Fee</p>
                        <div className="flex items-center gap-2 text-sm text-primary mt-2">
                          <Truck className="w-4 h-4" />
                          Nationwide delivery available · Richmond Hill
                        </div>
                        <div className="mt-4 space-y-2 text-sm tabular-nums">
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
                          globalThis.location.href = `/checkout/${vehicle.id}`
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
                    <CardContent className="space-y-2 tabular-nums">
                      <div className="flex justify-between py-2 border-b">
                        <span>Vehicle Price</span>
                        <span className="font-semibold">${safeNum(vehicle.price).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>HST ({(PROVINCE_TAX_RATES.ON.hst * 100).toFixed(0)}%)</span>
                        <span className="font-semibold">${vehicle.pricing.hst.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>OMVIC Fee</span>
                        <span className="font-semibold">${vehicle.pricing.omvicFee}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Certification Fee</span>
                        <span className="font-semibold">${vehicle.pricing.certificationFee}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Licensing & Registration (est.)</span>
                        <span className="font-semibold">ON ~ ${vehicle.pricing.licensingReg}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b">
                        <span>Delivery</span>
                        <span className="font-semibold text-green-600">$0 (Ontario)</span>
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

                {/* Protection Tab */}
                <TabsContent value="protection" className="mt-0 space-y-6">
                  <div>
                    <h2 className="text-xl font-bold">Protection packages</h2>
                    <p className="text-muted-foreground mt-1">
                      This vehicle&apos;s manufacturer warranty has expired. But don&apos;t worry, we have options for you to stay covered!
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium"></th>
                          {vehicleData.protectionPackages.map((pkg) => (
                            <th key={pkg.name} className={`text-center py-3 px-4 font-medium ${pkg.recommended ? "bg-primary/5" : ""}`}>
                              {pkg.name}
                              {pkg.recommended && <Badge className="ml-2 bg-primary text-xs">Recommended</Badge>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Payment method</td>
                          {vehicleData.protectionPackages.map((pkg) => (
                            <td key={pkg.name} className="text-center py-3 px-4">
                              {pkg.paymentMethod}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Money back guarantee</td>
                          {vehicleData.protectionPackages.map((pkg) => (
                            <td key={pkg.name} className="text-center py-3 px-4">
                              {pkg.moneyBack ? <Check className="w-5 h-5 text-primary mx-auto" /> : "—"}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Due at checkout</td>
                          {vehicleData.protectionPackages.map((pkg) => (
                            <td key={pkg.name} className="text-center py-3 px-4">
                              {pkg.dueAtCheckout}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Warranty</td>
                          {vehicleData.protectionPackages.map((pkg) => (
                            <td key={pkg.name} className="text-center py-3 px-4">
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
                          {vehicleData.protectionPackages.map((pkg) => (
                            <td key={pkg.name} className="text-center py-3 px-4">
                              {pkg.tireRim === true ? <Check className="w-5 h-5 text-primary mx-auto" /> : pkg.tireRim}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">GAP coverage</td>
                          {vehicleData.protectionPackages.map((pkg) => (
                            <td key={pkg.name} className="text-center py-3 px-4">
                              {pkg.gapCoverage}
                            </td>
                          ))}
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-muted-foreground">Life & disability</td>
                          {vehicleData.protectionPackages.map((pkg) => (
                            <td key={pkg.name} className="text-center py-3 px-4">
                              {pkg.lifeDisability}
                            </td>
                          ))}
                        </tr>
                        <tr>
                          <td className="py-3 px-4 font-semibold">Price</td>
                          {vehicleData.protectionPackages.map((pkg) => (
                            <td key={pkg.name} className="text-center py-3 px-4 font-semibold tabular-nums">
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
                <h2 className="text-xl font-bold mb-6">Next steps</h2>
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
                      <p className="font-semibold text-xs sm:text-sm">{item.title}</p>
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
                <CardContent className="p-6">
                  {/* Vehicle Title */}
                  <p data-testid="vdp-title" className="text-xl font-bold">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {vehicle.trim} · <span className="tabular-nums">{vehicle.mileage.toLocaleString()}</span> km
                  </p>

                  {/* Price + Finance Callout */}
                  <p className="text-3xl font-bold mt-5 tabular-nums">${safeNum(vehicle.price).toLocaleString()}</p>
                  <div className="mt-2 p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-bold tabular-nums text-primary">${biweeklyPayment}</span>
                      <span className="text-sm text-primary">/bi-weekly</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                      {RATE_FLOOR_DISPLAY} APR · {DEFAULT_TERM_MONTHS} mo · $0 down · OAC
                    </p>
                  </div>

                  {/* Social proof — desktop placement (above CTA) */}
                  <SocialProof vehicleId={vehicle.id} className="mt-3 hidden md:block" />

                  {/* Primary CTA — Get Pre-Approved */}
                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90"
                      asChild
                    >
                      <Link href={getFinanceLink(vehicle.id)}>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Get Pre-Approved
                      </Link>
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">No credit impact · Decision in 2 min</p>
                  </div>

                  {/* Secondary CTAs — Reserve & Buy */}
                  <div className="mt-3 pt-3 border-t space-y-2">
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
                            Quick Reserve – $250 Deposit
                          </Button>
                        }
                      />
                    ) : (
                      <Button
                        className="w-full h-11 bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleProtectedAction("reserve this vehicle")}
                      >
                        <LockKeyhole className="w-4 h-4 mr-2" />
                        Quick Reserve – $250 Deposit
                      </Button>
                    )}
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
                    <p className="text-xs text-center text-muted-foreground">48-hr hold · fully refundable</p>
                  </div>

                  {/* Trust Badges */}
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="flex items-center gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm font-semibold">10-Day Money Back Guarantee</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                      <LockKeyhole className="w-5 h-5 text-amber-600" />
                      <span className="text-sm font-semibold">$250 Refundable Deposit</span>
                    </div>
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
                          addFavorite({
                            id: vehicle.id,
                            year: vehicle.year,
                            make: vehicle.make,
                            model: vehicle.model,
                            price: vehicle.price,
                            mileage: vehicle.mileage,
                            image: vehicle.images?.[0] || "/placeholder.jpg",
                          })
                          toast.success("Vehicle saved to favorites!")
                        } else if (isFavorite) {
                          removeFavorite(vehicle.id)
                          toast.success("Removed from favorites")
                        }
                      }}
                      className={isFavorite ? "text-red-500" : ""}
                    >
                      <Heart className={`w-4 h-4 mr-1 ${isFavorite ? "fill-current" : ""}`} />
                      {isFavorite ? "Saved" : "Save"}
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
                    <p className="font-semibold text-sm flex items-center gap-2 mb-2">
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
                    {deliveryQuote && (() => {
                      let deliveryMsg: string
                      if (!deliveryQuote.isDeliveryAvailable) {
                        deliveryMsg = `Delivery is not available for ${deliveryQuote.postalCode} right now.`
                      } else if (deliveryQuote.isFreeDelivery) {
                        deliveryMsg = `Free delivery to ${deliveryQuote.postalCode} (${deliveryQuote.distanceKm} km).`
                      } else {
                        deliveryMsg = `Delivery to ${deliveryQuote.postalCode}: $${deliveryQuote.deliveryCost.toFixed(2)} (${deliveryQuote.distanceKm} km).`
                      }
                      return (
                        <p className="text-xs text-muted-foreground mt-2">{deliveryMsg}</p>
                      )
                    })()}
                  </div>

                  {/* Phone */}
                  <div className="mt-4 pt-4 border-t text-center">
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                      <Phone className="w-4 h-4" />
                      Questions? <Link href={`tel:${PHONE_LOCAL_TEL}`} className="font-semibold text-foreground" onClick={() => trackPhoneClick(PHONE_LOCAL)}>{PHONE_LOCAL}</Link>
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
          <h2 className="text-xl font-bold mb-4">Other cars you might like</h2>
          <SimilarVehicles
            currentVehicleId={vehicle.id}
            make={vehicle.make}
            priceRange={vehicle.price}
          />
        </div>
      </main>

      {/* Sticky Mobile CTA — finance-first */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:hidden z-50">
        <div className="px-4 pt-2 pb-safe">
          {/* Price + payment row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold tabular-nums">${safeNum(vehicle.price).toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-sm font-semibold tabular-nums text-primary">${biweeklyPayment}/bi-wk</span>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">{RATE_FLOOR_DISPLAY} APR</span>
          </div>
          {/* CTA buttons */}
          <div className="flex gap-2">
            <Button
              className="flex-1 h-12 min-h-[48px] text-sm font-semibold bg-primary hover:bg-primary/90"
              asChild
            >
              <Link href={getFinanceLink(vehicle.id)}>
                <CreditCard className="w-4 h-4 mr-1.5 shrink-0" />
                Get Pre-Approved
              </Link>
            </Button>
            <Button
              className="h-12 min-h-[48px] px-4 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shrink-0"
              onClick={() => handleProtectedAction("reserve this vehicle")}
            >
              <LockKeyhole className="w-4 h-4 mr-1.5 shrink-0" />
              Reserve
            </Button>
          </div>
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
