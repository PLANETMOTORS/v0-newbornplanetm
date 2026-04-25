"use client"

import { useState, useMemo, useEffect, useRef, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import useSWR from "swr"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"

import { 
  Search, SlidersHorizontal, Grid3X3, List, Heart,
  Gauge, Fuel, Shield, Zap, ChevronDown,
  X, RotateCcw, TrendingUp, CheckCircle,
  Filter, Battery, Car, ExternalLink, Bell, Loader2, Clock
} from "lucide-react"
import { useFavorites } from "@/contexts/favorites-context"
import { InventoryPageJsonLd, BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { PriceAlertModal } from "@/components/price-alert-modal"
import { trackAddToWishlist } from "@/components/analytics/google-analytics"
import { trackMetaAddToWishlist } from "@/components/analytics/meta-pixel"
import { safeNum } from "@/lib/pricing/format"

// Vehicle type from inventory API
interface Vehicle {
  id: string
  stock_number: string
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  body_style: string | null
  exterior_color: string | null
  interior_color: string | null
  price: number
  msrp: number | null
  mileage: number
  drivetrain: string | null
  transmission: string | null
  engine: string | null
  fuel_type: string | null
  status: string
  location: string | null
  primary_image_url: string | null
  is_certified: boolean
  is_new_arrival: boolean
  featured: boolean
  inspection_score: number | null
  is_ev: boolean
  battery_capacity_kwh: number | null
  range_miles: number | null
  ev_battery_health_percent: number | null
  created_at: string
  drivee_mid: string | null
}

// API page size — matches Clutch/Carvana 48-per-page pattern
const API_PAGE_SIZE = 48

// API response shape
interface VehiclesApiResponse {
  success: boolean
  data: {
    vehicles: Vehicle[]
    pagination: { page: number; limit: number; total: number; totalPages: number; hasMore: boolean }
    filters?: {
      makes: string[]
      bodyStyles: string[]
      fuelTypes: string[]
      priceRange: { min: number; max: number }
      yearRange: { min: number; max: number }
    }
  }
}

// API fetcher — server handles filtering, sorting, pagination
const fetcher = async (url: string): Promise<VehiclesApiResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch inventory')
  return res.json()
}

// Transform API vehicle to display format
// NOTE: API already returns price in dollars (route.ts divides by 100)
function transformVehicle(v: Vehicle) {
  const priceInDollars = safeNum(v.price)
  const msrpInDollars = safeNum(v.msrp, priceInDollars * 1.1)
  
  // Determine badge based on vehicle attributes
  let badge = ""
  let badgeColor = "bg-primary"
  
  if (v.is_new_arrival) {
    badge = "Just Arrived"
    badgeColor = "bg-green-700"
  } else if (v.fuel_type === "Electric") {
    badge = "Electric"
    badgeColor = "bg-teal-700"
  } else if (v.is_certified) {
    badge = "PM Certified"
    // badgeColor stays "bg-primary" (the default)
  } else if (priceInDollars > 100000) {
    badge = "Premium"
    badgeColor = "bg-purple-700"
  }
  
  // Map fuel types for filtering
  let displayFuelType = v.fuel_type || "Gasoline"
  if (displayFuelType === "Electric") displayFuelType = "Electric"
  else if (displayFuelType === "Hybrid") displayFuelType = "Hybrid"
  else displayFuelType = "Gasoline"
  
  // Check if primary_image_url is a real hosted image (not an Unsplash placeholder or VDP page URL)
  // Valid sources: cdn.planetmotors.ca, planetmotors.imgix.net, HomeNet IOL, direct image files
  const hasRealImage = v.primary_image_url &&
    !v.primary_image_url.includes('planetmotors.ca/inventory') &&
    !v.primary_image_url.includes('unsplash.com') &&
    (v.primary_image_url.includes('.jpg') ||
     v.primary_image_url.includes('.png') ||
     v.primary_image_url.includes('.webp') ||
     v.primary_image_url.includes('cdn.planetmotors.ca') ||
     v.primary_image_url.includes('imgix.net') ||
     v.primary_image_url.includes('homenetiol.com') ||
     v.primary_image_url.includes('cpsimg.com'))

  // Use real image URL or null (gradient fallback will show in the card)
  const imageUrl = hasRealImage ? v.primary_image_url : null
  
  return {
    id: v.id,
    stockNumber: v.stock_number,
    vin: v.vin,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim || "",
    bodyType: v.body_style || "Sedan",
    price: priceInDollars,
    originalPrice: msrpInDollars,
    mileage: v.mileage,
    fuelType: displayFuelType,
    transmission: v.transmission || "Automatic",
    drivetrain: v.drivetrain || "FWD",
    exteriorColor: v.exterior_color || "Black",
    range: v.range_miles ? `${Math.round(v.range_miles * 1.6)} km` : undefined,
    batteryHealth: v.ev_battery_health_percent,
    image: imageUrl,
    location: v.location || "Richmond Hill",
    inspectionScore: v.inspection_score || 210,
    badge,
    badgeColor,
    views: Math.floor(Math.random() * 200) + 50,
    favorites: Math.floor(Math.random() * 50) + 5,
    monthlyPayment: priceInDollars > 0 ? Math.round(priceInDollars / 84) : 0,
    carfaxUrl: `https://www.carfax.ca/vehicle/${v.vin}`,
    features: ["PM Certified", "Full Inspection", "Warranty Included"],
    hasDrivee: !!v.drivee_mid
  }
}

const fuelTypes = ["All Fuel Types", "Electric", "Hybrid", "Plug-in Hybrid", "Gasoline", "Premium"]
const transmissions = ["All Transmissions", "Automatic", "Manual", "CVT", "Dual-Clutch"]
const colors = ["All Colors", "White", "Black", "Silver", "Blue", "Red", "Gray", "Green"]
const drivetrains = ["All Drivetrains", "AWD", "FWD", "RWD", "4WD"]

/**
 * Render the interactive vehicle inventory page with search, filters, sorting, pagination, favorites, and optional trade-in integration.
 *
 * This component maintains UI state (search input/debounced query, filters, sort, view mode, ranges, EV-only toggle), builds the server API URL from those filters, fetches paginated vehicles via SWR, transforms and accumulates pages for a "Load More" pattern, synchronizes initial filter state from URL query parameters (resetting filters first when URL-provided filters exist), and exposes actions for favoriting, clearing filters, and applying trade-in values. It also handles loading and error UI states and renders the vehicle grid/list, filter controls, quick stats, and compliance footer.
 *
 * @returns The inventory page JSX element ready for rendering.
 */
function InventoryContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)

  // Debounce search input — only update the actual search query after 400ms of no typing
  // Search and make/body filters now work together (AND logic on the API).
  // Only clear EV filter when searching, since text search + EV is rarely intended.
  const handleSearchInput = useCallback((value: string) => {
    setSearchInput(value)
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    searchDebounceRef.current = setTimeout(() => {
      setSearchQuery(value)
      if (value.trim()) {
        setEvOnly(false)
      }
    }, 400)
  }, [])

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => { if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current) }
  }, [])
  const [selectedMake, setSelectedMake] = useState("All Makes")
  const [selectedBodyType, setSelectedBodyType] = useState("All Types")
  const [selectedFuelType, setSelectedFuelType] = useState("All Fuel Types")
  const [selectedYear, setSelectedYear] = useState("All Years")
  const [selectedTransmission, setSelectedTransmission] = useState("All Transmissions")
  const [selectedColor, setSelectedColor] = useState("All Colors")
  const [selectedDrivetrain, setSelectedDrivetrain] = useState("All Drivetrains")
  const [priceRange, setPriceRange] = useState([0, 400000])
  const [mileageRange, setMileageRange] = useState([0, 200000])
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")
  const { addFavorite, removeFavorite, isFavorite } = useFavorites()
  const [evOnly, setEvOnly] = useState(false)

  // Load More pagination state (Clutch/Carvana pattern)
  // Pair page with filterKey so effectivePage can be derived without ref mutation.
  const [pagination, setPagination] = useState({ filterKey: '', page: 1 })
  const [accumulatedVehicles, setAccumulatedVehicles] = useState<ReturnType<typeof transformVehicle>[]>([])
  
  // Trade-in from AI Quote
  const [tradeInInfo, setTradeInInfo] = useState<{
    value: number
    quoteId: string
    vehicle: string
  } | null>(null)

  // Derive filterKey for page-reset detection (all filter/sort state, excluding page)
  const filterKey = `${sortBy}|${evOnly}|${selectedFuelType}|${selectedMake}|${selectedBodyType}|${selectedYear}|${selectedTransmission}|${selectedColor}|${selectedDrivetrain}|${priceRange[0]}|${priceRange[1]}|${mileageRange[0]}|${mileageRange[1]}|${searchQuery}`

  // When filterKey matches what's stored in pagination state, use the stored page;
  // otherwise fall back to 1. This is concurrent-mode safe — no ref mutation during render.
  const effectivePage = pagination.filterKey === filterKey ? pagination.page : 1

  // Build server-side query URL from all filter states
  const vehiclesApiUrl = useMemo(() => {
    const params = new URLSearchParams()
    params.set('limit', String(API_PAGE_SIZE))
    params.set('page', String(effectivePage))

    // Sort mapping
    if (sortBy === 'price-low') { params.set('sort', 'price'); params.set('order', 'asc') }
    else if (sortBy === 'price-high') { params.set('sort', 'price'); params.set('order', 'desc') }
    else if (sortBy === 'mileage-low') { params.set('sort', 'mileage'); params.set('order', 'asc') }
    else if (sortBy === 'newest') { params.set('sort', 'year'); params.set('order', 'desc') }
    else { params.set('sort', 'created_at'); params.set('order', 'desc') }

    // Filters
    if (evOnly) { params.set('fuelType', 'Electric') }
    else if (selectedFuelType !== 'All Fuel Types') { params.set('fuelType', selectedFuelType) }
    if (selectedMake !== 'All Makes') params.set('make', selectedMake)
    if (selectedBodyType !== 'All Types') params.set('bodyStyle', selectedBodyType)
    if (selectedYear !== 'All Years') { params.set('minYear', selectedYear); params.set('maxYear', selectedYear) }
    if (selectedTransmission !== 'All Transmissions') params.set('transmission', selectedTransmission)
    if (selectedColor !== 'All Colors') params.set('exteriorColor', selectedColor)
    if (selectedDrivetrain !== 'All Drivetrains') params.set('drivetrain', selectedDrivetrain)
    if (priceRange[0] > 0) params.set('minPrice', String(priceRange[0]))
    if (priceRange[1] < 400000) params.set('maxPrice', String(priceRange[1]))
    if (mileageRange[0] > 0) params.set('minMileage', String(mileageRange[0]))
    if (mileageRange[1] < 200000) params.set('maxMileage', String(mileageRange[1]))
    if (searchQuery.trim()) params.set('q', searchQuery.trim())
    params.set('includeFilters', 'true')

    return `/api/v1/vehicles?${params.toString()}`
  }, [effectivePage, sortBy, evOnly, selectedFuelType, selectedMake, selectedBodyType, selectedYear,
      selectedTransmission, selectedColor, selectedDrivetrain, priceRange, mileageRange, searchQuery])

  // Fetch vehicles from API — SWR key is the full URL
  const { data: apiResponse, error, isLoading, isValidating } = useSWR(vehiclesApiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnMount: true,
    dedupingInterval: 60000,
    keepPreviousData: true,
  })

  // Accumulate pages — page 1 replaces, page 2+ appends (Load More pattern).
  // Use pagination.page from the response (not currentPage state) so we always
  // get the correct replace-vs-append decision even during the render cycle where
  // effectivePage and currentPage haven't converged yet.
  useEffect(() => {
    if (!apiResponse?.data?.vehicles) return
    const transformed = apiResponse.data.vehicles.map(transformVehicle)
    if ((apiResponse.data.pagination?.page ?? 1) === 1) {
      setAccumulatedVehicles(transformed)
    } else {
      setAccumulatedVehicles(prev => [...prev, ...transformed])
    }
  }, [apiResponse])

  const totalVehicles = apiResponse?.data?.pagination?.total ?? 0
  const hasMore = accumulatedVehicles.length < totalVehicles

  // Derive dropdown values from API response filters, falling back to sensible defaults
  const apiFilters = apiResponse?.data?.filters
  const dynamicMakes = apiFilters?.makes?.length
    ? ['All Makes', ...apiFilters.makes]
    : ['All Makes']
  const dynamicYears = apiFilters?.yearRange
    ? ['All Years', ...Array.from({ length: apiFilters.yearRange.max - apiFilters.yearRange.min + 1 }, (_, i) => String(apiFilters.yearRange.max - i))]
    : ['All Years']
  const _dynamicBodyTypes = apiFilters?.bodyStyles?.length
    ? ['All Body Types', ...apiFilters.bodyStyles]
    : ['All Body Types']

  // Read URL parameters and set filters
  // IMPORTANT: Reset ALL filters first, then apply only what the URL specifies.
  // This prevents stale filters from persisting when navigating between
  // homepage category links (e.g. Electric → SUV → Sedan).
  useEffect(() => {
    const fuelType = searchParams.get("fuelType")
    const bodyType = searchParams.get("bodyType")
    const make = searchParams.get("make")
    const maxPrice = searchParams.get("maxPrice")
    const minPrice = searchParams.get("minPrice")
    const category = searchParams.get("category")
    const transmission = searchParams.get("transmission")
    const urlQuery = searchParams.get("q")
    // Check for trade-in from AI Quote
    const tradeIn = searchParams.get("tradeIn")
    const quoteId = searchParams.get("quoteId")
    const tradeInVehicle = searchParams.get("tradeInVehicle")

    if (tradeIn && Number.parseInt(tradeIn) > 0) {
      setTradeInInfo({
        value: Number.parseInt(tradeIn),
        quoteId: quoteId || '',
        vehicle: tradeInVehicle ? decodeURIComponent(tradeInVehicle) : ''
      })
    }

    // Only reset filters when URL has filter-related params (not on bare /inventory)
    const hasFilterParams = fuelType || bodyType || make || maxPrice || minPrice || category || transmission || urlQuery
    if (hasFilterParams) {
      // Reset all filters to defaults before applying URL params
      setSelectedFuelType("All Fuel Types")
      setSelectedBodyType("All Types")
      setSelectedMake("All Makes")
      setSelectedYear("All Years")
      setSelectedTransmission("All Transmissions")
      setSelectedColor("All Colors")
      setSelectedDrivetrain("All Drivetrains")
      setPriceRange([0, 400000])
      setMileageRange([0, 200000])
      setEvOnly(false)
      setSearchQuery("")
      setSearchInput("")
    }

    // Apply URL-specified filters
    if (fuelType === "Electric") {
      setSelectedFuelType("Electric")
      setEvOnly(true)
    } else if (fuelType) {
      setSelectedFuelType(fuelType)
    }

    if (bodyType) {
      setSelectedBodyType(bodyType)
    }

    if (make) {
      setSelectedMake(make)
    }

    if (minPrice || maxPrice) {
      const min = minPrice ? Number.parseInt(minPrice) : 0
      const max = maxPrice ? Number.parseInt(maxPrice) : 400000
      setPriceRange([Number.isNaN(min) ? 0 : min, Number.isNaN(max) ? 400000 : max])
    }

    if (transmission) {
      setSelectedTransmission(transmission)
    }

    // Map category shortcuts to concrete filters
    if (category === "Luxury") {
      setSearchQuery("luxury")
      setSearchInput("luxury")
    } else if (category === "Family") {
      setSelectedBodyType("SUV")
    }

    // Read search query from URL (e.g. /inventory?q=Tesla)
    if (urlQuery) {
      setSearchQuery(urlQuery)
      setSearchInput(urlQuery)
    }
  }, [searchParams])

  // Final display list comes from the accumulator
  const sortedVehicles = accumulatedVehicles

const toggleFavorite = (vehicleData: typeof accumulatedVehicles[0]) => {
    if (isFavorite(vehicleData.id)) {
      removeFavorite(vehicleData.id)
    } else {
      const name = `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`
      trackAddToWishlist({ id: vehicleData.id, name, price: vehicleData.price })
      trackMetaAddToWishlist({ id: vehicleData.id, name, price: vehicleData.price })
      addFavorite({
        id: vehicleData.id,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        price: vehicleData.price,
        originalPrice: vehicleData.originalPrice,
        mileage: vehicleData.mileage,
        image: vehicleData.image || ""
      })
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSearchInput("")
    setSelectedMake("All Makes")
    setSelectedBodyType("All Types")
    setSelectedFuelType("All Fuel Types")
    setSelectedYear("All Years")
    setSelectedTransmission("All Transmissions")
    setSelectedColor("All Colors")
    setSelectedDrivetrain("All Drivetrains")
    setPriceRange([0, 400000])
    setMileageRange([0, 200000])
    setEvOnly(false)
  }

  const activeFilterCount = [
    selectedMake !== "All Makes",
    selectedFuelType !== "All Fuel Types",
    selectedYear !== "All Years",
    selectedTransmission !== "All Transmissions",
    selectedColor !== "All Colors",
    selectedDrivetrain !== "All Drivetrains",
    priceRange[0] > 0 || priceRange[1] < 400000,
    mileageRange[0] > 0 || mileageRange[1] < 200000,
    evOnly
  ].filter(Boolean).length

  // Inline loading/error — never unmount the search controls
  const showSkeleton = isLoading && sortedVehicles.length === 0
  const showError = !!error && sortedVehicles.length === 0

  return (
    <div className="min-h-screen bg-background">
      <Header />

<main id="main-content" tabIndex={-1} className="pt-20 pb-20 overflow-x-hidden max-w-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
  {/* Trade-In Banner */}
  {tradeInInfo && tradeInInfo.value > 0 && (
    <div className="bg-linear-to-r from-green-600 to-emerald-600 text-white py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">
              Your Trade-In: <span className="font-bold">${tradeInInfo.value.toLocaleString()}</span>
              {tradeInInfo.vehicle && <span className="text-white/80 ml-2">({tradeInInfo.vehicle})</span>}
            </span>
          </div>
          <span className="text-sm text-white/80">Select a vehicle to apply your trade-in value</span>
        </div>
      </div>
    </div>
  )}

  <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
  {/* Page Header */}
  <div className="py-8 border-b border-border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-[-0.01em]">
                  Vehicle Inventory
                </h1>
                <p className="mt-2 text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    {totalVehicles.toLocaleString()} vehicles available
                  </span>
                  <span className="text-muted-foreground/50">|</span>
                  <span className="flex items-center gap-1 text-sm">
                    <Clock className="w-3 h-3" />
                    Live inventory
                  </span>
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-sm">
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-primary/10 rounded-lg">
                  <Zap className="w-3 sm:w-4 h-3 sm:h-4 text-primary" />
                  <span className="text-primary text-xs sm:text-sm">{accumulatedVehicles.filter(v => v.fuelType === "Electric").length} EVs</span>
                </div>
                <div className="flex items-center gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-muted rounded-lg">
                  <Car className="w-3 sm:w-4 h-3 sm:h-4 text-muted-foreground" />
                  <span className="text-muted-foreground text-xs sm:text-sm">{dynamicMakes.length - 1} brands</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="py-4 sm:py-6 space-y-4">
            {/* Mobile: Search + Filter row */}
            <div className="flex gap-2 sm:hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by make, model, VIN, stock #..."
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="pl-10 h-11 text-base"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchQuery(""); setSearchInput("") }}
                    aria-label="Clear search"
                    className="absolute right-3 top-1/2 -translate-y-1/2 min-w-11 min-h-11 flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                aria-label={showFilters ? "Hide filters" : "Show filters"}
                className="h-11 px-3 gap-1.5 shrink-0"
              >
                <SlidersHorizontal className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <Badge className="h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFilterCount}</Badge>
                )}
              </Button>
            </div>

            {/* Mobile: Sort + View row */}
            <div className="flex gap-2 sm:hidden">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort vehicles"
                className="flex-1 h-11 px-3 border rounded-lg bg-background text-sm"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low</option>
                <option value="price-high">Price: High</option>
                <option value="mileage-low">Low Mileage</option>
                <option value="newest">Newest</option>
              </select>
              <div className="flex border rounded-lg overflow-hidden shrink-0" role="group" aria-label="View mode">
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  className={`px-3 h-11 flex items-center min-w-11 justify-center transition-colors ${
                    viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  aria-pressed={viewMode === "list"}
                  className={`px-3 h-11 flex items-center min-w-11 justify-center transition-colors ${
                    viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Desktop: Original layout */}
            <div className="hidden sm:flex flex-col md:flex-row gap-4">
              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Search by make, model, VIN, stock #..."
                  value={searchInput}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
                {searchInput && (
                  <button
                    onClick={() => { setSearchQuery(""); setSearchInput("") }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>

              {/* Filter Toggle */}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setShowFilters(!showFilters)}
                className="h-12 gap-2"
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1">{activeFilterCount}</Badge>
                )}
              </Button>

              {/* View Toggle */}
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode("grid")}
                  aria-label="Grid view"
                  className={`px-4 h-12 flex items-center gap-2 transition-colors ${
                    viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  aria-label="List view"
                  className={`px-4 h-12 flex items-center gap-2 transition-colors ${
                    viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Sort vehicles"
                className="h-12 px-4 border rounded-lg bg-background min-w-45"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="mileage-low">Mileage: Low to High</option>
                <option value="newest">Newest First</option>
                <option value="popular">Most Popular</option>
              </select>
            </div>

            {/* Quick Filters - Scrollable on mobile */}
            <div className="flex gap-2 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {dynamicMakes.filter(m => m !== "All Makes").map(make => (
                <button
                  key={make}
                  onClick={() => {
                    // Reset EV filter when selecting a brand; keep search to allow combined filtering
                    setEvOnly(false)
                    setSelectedMake(selectedMake === make ? "All Makes" : make)
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-colors whitespace-nowrap shrink-0 min-h-11 ${
                    selectedMake === make
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {make}
                </button>
              ))}
              <button
                onClick={() => {
                  const newEvOnly = !evOnly
                  setEvOnly(newEvOnly)
                  // When enabling EV filter, reset make to show all EVs
                  if (newEvOnly) {
                    setSelectedMake("All Makes")
                  }
                }}
                className={`px-3 sm:px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 min-h-11 ${
                  evOnly
                    ? "bg-green-500 text-white"
                    : "bg-muted hover:bg-muted/80"
                }`}
              >
                <Zap className="w-3 h-3" />
                Electric Only
              </button>
            </div>

            {/* Expanded Filters Panel */}
            {showFilters && (
              <Card className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="font-semibold text-base sm:text-lg flex items-center gap-2">
                    <Filter className="w-4 sm:w-5 h-4 sm:h-5" />
                    Filters
                  </h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="min-h-11">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {/* Make */}
                  <div>
                    <label htmlFor="filter-make" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Make</label>
                    <select
                      id="filter-make"
                      value={selectedMake}
                      onChange={(e) => { setSelectedMake(e.target.value) }}
                      className="w-full h-11 px-3 border rounded-lg bg-background text-sm"
                    >
                      {dynamicMakes.map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label htmlFor="filter-year" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Year</label>
                    <select
                      id="filter-year"
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full h-11 px-3 border rounded-lg bg-background text-sm"
                    >
                      {dynamicYears.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label htmlFor="filter-fuel" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Fuel</label>
                    <select
                      id="filter-fuel"
                      value={selectedFuelType}
                      onChange={(e) => setSelectedFuelType(e.target.value)}
                      className="w-full h-11 px-3 border rounded-lg bg-background text-sm"
                    >
                      {fuelTypes.map(fuel => (
                        <option key={fuel} value={fuel}>{fuel}</option>
                      ))}
                    </select>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label htmlFor="filter-trans" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Trans</label>
                    <select
                      id="filter-trans"
                      value={selectedTransmission}
                      onChange={(e) => setSelectedTransmission(e.target.value)}
                      className="w-full h-11 px-3 border rounded-lg bg-background text-sm"
                    >
                      {transmissions.map(trans => (
                        <option key={trans} value={trans}>{trans}</option>
                      ))}
                    </select>
                  </div>

                  {/* Drivetrain */}
                  <div>
                    <label htmlFor="filter-drive" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Drive</label>
                    <select
                      id="filter-drive"
                      value={selectedDrivetrain}
                      onChange={(e) => setSelectedDrivetrain(e.target.value)}
                      className="w-full h-11 px-3 border rounded-lg bg-background text-sm"
                    >
                      {drivetrains.map(drive => (
                        <option key={drive} value={drive}>{drive}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label htmlFor="filter-color" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Color</label>
                    <select
                      id="filter-color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full h-11 px-3 border rounded-lg bg-background text-sm"
                    >
                      {colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div className="col-span-2 lg:col-span-1">
                    <label htmlFor="filter-price" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 tabular-nums">
                      Price: ${(priceRange[0]/1000).toFixed(0)}k - ${(priceRange[1]/1000).toFixed(0)}k
                    </label>
                    <Slider
                      id="filter-price"
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={400000}
                      step={5000}
                      className="py-2"
                    />
                  </div>

                  {/* Mileage Range */}
                  <div className="col-span-2 lg:col-span-1">
                    <label htmlFor="filter-mileage" className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 tabular-nums">
                      Mileage: {(mileageRange[0]/1000).toFixed(0)}k - {(mileageRange[1]/1000).toFixed(0)}k km
                    </label>
                    <Slider
                      id="filter-mileage"
                      value={mileageRange}
                      onValueChange={setMileageRange}
                      min={0}
                      max={200000}
                      step={5000}
                      className="py-2"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Results Summary — Clutch/Carvana style counter */}
          <div className="flex items-center justify-between py-4 border-b border-border">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{sortedVehicles.length.toLocaleString()}</span>{totalVehicles > sortedVehicles.length ? <> of <span className="font-semibold text-foreground">{totalVehicles.toLocaleString()}</span></> : ""} vehicles
              {isValidating && <Loader2 className="inline w-3 h-3 ml-2 animate-spin" />}
            </p>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary">
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </Button>
            )}
          </div>

          {/* Inline error state */}
          {showError && (
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-red-500 mb-4">Error loading inventory</p>
              <Button onClick={() => globalThis.location.reload()}>Try Again</Button>
            </div>
          )}

          {/* Inline skeleton loading state */}
          {showSkeleton && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 py-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-xl border overflow-hidden animate-pulse">
                  <div className="aspect-4/3 bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-6 bg-muted rounded w-1/3 mt-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Vehicle Grid — content-visibility virtualizes off-screen cards */}
          {!showSkeleton && !showError && (<>
          <div aria-live="polite" className={`py-8 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}`}>
            {sortedVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                style={{
                  contentVisibility: "auto",
                  containIntrinsicSize: viewMode === "list" ? "auto 200px" : "auto 420px",
                }}
              >
              <Card
                data-testid="inventory-card"
                className={`group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                }`}
              >
                {/* Image with gradient fallback — entire image area is clickable */}
                <div className={`relative bg-linear-to-br from-[#f0f4ff] to-[#e8eef5] ${viewMode === "list" ? "w-full sm:w-48 md:w-72 shrink-0 aspect-4/3 sm:aspect-auto" : "aspect-4/3"}`}>
                  {/* Clickable image link to VDP */}
                  <Link
                    href={tradeInInfo ? `/vehicles/${vehicle.id}?tradeIn=${tradeInInfo.value}&quoteId=${tradeInInfo.quoteId}&tradeInVehicle=${encodeURIComponent(tradeInInfo.vehicle)}` : `/vehicles/${vehicle.id}`}
                    className="absolute inset-0 z-1"
                    aria-label={`View ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  />
                  {vehicle.image ? (
                    <Image
                      src={vehicle.image}
                      alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} for sale, ${vehicle.mileage.toLocaleString()} km, Planet Motors`}
                      fill
                      loading="lazy"
                      className="object-cover group-hover:scale-105 transition-transform duration-500 will-change-transform [clip-path:inset(0_0_8%_0)]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      onError={(e) => {
                        // Hide broken image — gradient + icon shows through
                        (e.target as HTMLImageElement).style.display = "none"
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Car className="w-16 h-16 text-[#1e3a8a]/15" />
                    </div>
                  )}
                  
                  {/* Badges — z-2 to sit above the image link */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2 z-2 pointer-events-none">
                    <Badge className={`${vehicle.badgeColor} text-white shadow-lg`}>
                      {vehicle.badge}
                    </Badge>
                    {vehicle.fuelType === "Electric" && (
                      <Badge className="bg-green-700 text-white shadow-lg">
                        <Battery className="w-3 h-3 mr-1" />
                        {vehicle.batteryHealth}% Battery
                      </Badge>
                    )}
                    {/* PM Certified Badge */}
                    <Badge className="bg-teal-700 text-white shadow-lg">
                      <Shield className="w-3 h-3 mr-1" />
                      PM Certified
                    </Badge>
                  </div>

                  {/* Actions — z-2 to sit above the image link */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-2">
                    <button
                      onClick={() => toggleFavorite(vehicle)}
                      aria-label={isFavorite(vehicle.id) ? "Remove from favorites" : "Add to favorites"}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                        isFavorite(vehicle.id)
                          ? "bg-red-500 text-white"
                          : "bg-background/90 hover:bg-background"
                      }`}
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(vehicle.id) ? "fill-current" : ""}`} />
                    </button>
                    <PriceAlertModal
                      vehicle={{
                        id: vehicle.id,
                        year: vehicle.year,
                        make: vehicle.make,
                        model: vehicle.model,
                        price: vehicle.price
                      }}
                      trigger={
                        <button aria-label="Set price alert" className="w-9 h-9 bg-background/90 rounded-full flex items-center justify-center hover:bg-background">
                          <Bell className="w-4 h-4" />
                        </button>
                      }
                    />
                  </div>

                  {/* 360 View Badge — only for vehicles with Drivee 360° photos */}
                  {vehicle.hasDrivee && (
                  <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                    <RotateCcw className="w-3 h-3 text-primary" />
                    360° View
                  </div>
                  )}


                </div>

                {/* Content */}
                <CardContent className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-between" : ""}`}>
                  <div>
                    {/* Title */}
                    <Link href={tradeInInfo ? `/vehicles/${vehicle.id}?tradeIn=${tradeInInfo.value}&quoteId=${tradeInInfo.quoteId}&tradeInVehicle=${encodeURIComponent(tradeInInfo.vehicle)}` : `/vehicles/${vehicle.id}`} className="block group/link">
                      <h3 data-testid="card-title" className="font-semibold text-lg group-hover/link:text-primary transition-colors">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
                    </Link>

                    {/* Specs */}
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1 tabular-nums">
                        <Gauge className="w-3.5 h-3.5" />
                        {vehicle.mileage.toLocaleString()} km
                      </span>
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3.5 h-3.5" />
                        {vehicle.fuelType}
                      </span>
                      {vehicle.range && (
                        <span className="flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 text-green-500" />
                          {vehicle.range}
                        </span>
                      )}
                    </div>

                    {/* Features Preview */}
                    {viewMode === "list" && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {vehicle.features.map((feature) => (
                          <Badge key={feature} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Inspection Score */}
                    <div className="flex items-center gap-2 mt-3">
                      <Shield className="w-4 h-4 text-green-700" />
                      <span className="text-sm text-green-700 font-semibold">
                        {vehicle.inspectionScore}/210 Inspection Score
                      </span>
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-end justify-between">
                      <div>
                        {vehicle.originalPrice > vehicle.price && (
                          <p className="text-sm text-muted-foreground line-through tabular-nums">
                            ${vehicle.originalPrice.toLocaleString()}
                          </p>
                        )}
<p className="text-2xl font-bold tabular-nums">${vehicle.price.toLocaleString()}</p>
                      <Link href={`/finance/${vehicle.id}`} className="text-sm text-primary hover:underline tabular-nums">
                        Est. ${vehicle.monthlyPayment}/mo
                      </Link>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link href={tradeInInfo ? `/financing/application?vehicleId=${vehicle.id}&tradeIn=${tradeInInfo.value}&quoteId=${tradeInInfo.quoteId}&tradeInVehicle=${encodeURIComponent(tradeInInfo.vehicle)}` : `/financing/application?vehicleId=${vehicle.id}`}>
                            Finance
                          </Link>
                        </Button>
<Button size="sm" asChild>
  <Link href={tradeInInfo ? `/vehicles/${vehicle.id}?tradeIn=${tradeInInfo.value}&quoteId=${tradeInInfo.quoteId}&tradeInVehicle=${encodeURIComponent(tradeInInfo.vehicle)}` : `/vehicles/${vehicle.id}`}>
  View
  </Link>
                        </Button>
                      </div>
                    </div>
                    
                    {vehicle.originalPrice > vehicle.price && (
                      <div className="mt-2 flex items-center gap-1 text-sm text-green-700">
                        <TrendingUp className="w-3 h-3" />
                        Save ${(vehicle.originalPrice - vehicle.price).toLocaleString()}
                      </div>
                    )}
                    
                    {/* CARFAX Badge */}
                    {vehicle.carfaxUrl && (
                      <a 
                        href={vehicle.carfaxUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <span className="font-bold text-[#e01f26]">CARFAX</span>
                        <span>Report Available</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
              </div>
            ))}
          </div>

          {/* No Results */}
          {!isLoading && !isValidating && sortedVehicles.length === 0 && !showError && (
            <div className="py-20 text-center">
              <Car className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No vehicles found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your filters or search terms
              </p>
              <Button onClick={clearFilters}>
                Clear All Filters
              </Button>
            </div>
          )}

          {/* Load More — Clutch/Carvana style */}
          {hasMore && (
            <div className="text-center py-10">
              <p className="text-sm text-muted-foreground mb-4">
                Showing {sortedVehicles.length.toLocaleString()} of {totalVehicles.toLocaleString()} vehicles
              </p>
              <Button
                variant="outline"
                size="lg"
                onClick={() => setPagination({ filterKey, page: effectivePage + 1 })}
                disabled={isValidating}
                className="min-w-50"
              >
                {isValidating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Loading...</>
                ) : (
                  <>Load More Vehicles<ChevronDown className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </div>
          )}
          </>)}
          {/* OMVIC Compliance Disclaimer */}
          <div className="mt-8 border-t border-border pt-6 pb-4 text-center">
            <p className="text-sm text-muted-foreground">
              Planet Motors is an{" "}
              <a
                href="https://www.omvic.on.ca"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                OMVIC Registered Dealer
              </a>
              . All prices exclude applicable taxes and licensing fees.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function InventoryPage() {
  return (
    <>
      <InventoryPageJsonLd />
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Inventory", url: "/inventory" }]} />
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
        <InventoryContent />
      </Suspense>
    </>
  )
}
