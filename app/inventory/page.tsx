"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
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
import { PriceAlertModal } from "@/components/price-alert-modal"
import { createClient } from "@/lib/supabase/client"

// Vehicle type from database
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
}

// Fetcher for SWR
const fetcher = async () => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('status', 'available')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data as Vehicle[]
}

// Transform database vehicle to display format
function transformVehicle(v: Vehicle) {
  const priceInDollars = v.price / 100
  const msrpInDollars = v.msrp ? v.msrp / 100 : priceInDollars * 1.1
  
  // Determine badge based on vehicle attributes
  let badge = ""
  let badgeColor = "bg-primary"
  
  if (v.is_new_arrival) {
    badge = "Just Arrived"
    badgeColor = "bg-green-500"
  } else if (v.fuel_type === "Electric") {
    badge = "Electric"
    badgeColor = "bg-blue-500"
  } else if (v.is_certified) {
    badge = "PM Certified"
    badgeColor = "bg-primary"
  } else if (priceInDollars > 100000) {
    badge = "Premium"
    badgeColor = "bg-purple-500"
  }
  
  // Map fuel types for filtering
  let displayFuelType = v.fuel_type || "Gasoline"
  if (displayFuelType === "Electric") displayFuelType = "Electric"
  else if (displayFuelType === "Hybrid") displayFuelType = "Hybrid"
  else displayFuelType = "Gasoline"
  
  // Check if primary_image_url is a valid image URL (not a VDP page URL)
  // Valid sources: cpsimg.com (carpages CDN), unsplash, direct image files
  const isValidImageUrl = v.primary_image_url && 
    !v.primary_image_url.includes('planetmotors.ca') &&
    (v.primary_image_url.includes('.jpg') || 
     v.primary_image_url.includes('.png') || 
     v.primary_image_url.includes('.webp') ||
     v.primary_image_url.includes('unsplash.com') ||
     v.primary_image_url.includes('carpages.ca') ||
     v.primary_image_url.includes('cpsimg.com'))
  
  // Make-specific placeholder images
  const makePlaceholders: Record<string, string> = {
    'Tesla': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80',
    'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
    'Audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
    'Toyota': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80',
    'Hyundai': 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&auto=format&fit=crop&q=80',
    'Kia': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&auto=format&fit=crop&q=80',
    'Chevrolet': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'Volkswagen': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
    'Jeep': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
    'Honda': 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&auto=format&fit=crop&q=80',
    'default': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=80'
  }
  
  // Use valid image URL or fall back to make-specific placeholder
  const imageUrl = isValidImageUrl
    ? (v.primary_image_url ?? makePlaceholders['default'])
    : (makePlaceholders[v.make] || makePlaceholders['default'])
  
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
    monthlyPayment: Math.round(priceInDollars / 84),
    carfaxUrl: `https://www.carfax.ca/vehicle/${v.vin}`,
    features: ["PM Certified", "Full Inspection", "Warranty Included"]
  }
}

const fuelTypes = ["All Fuel Types", "Electric", "Hybrid", "Plug-in Hybrid", "Gasoline", "Premium"]
const transmissions = ["All Transmissions", "Automatic", "Manual", "CVT", "Dual-Clutch"]
const colors = ["All Colors", "White", "Black", "Silver", "Blue", "Red", "Gray", "Green"]
const drivetrains = ["All Drivetrains", "AWD", "FWD", "RWD", "4WD"]

function InventoryContent() {
  const searchParams = useSearchParams()
  const [searchQuery, setSearchQuery] = useState("")
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
  
  // Trade-in from AI Quote
  const [tradeInInfo, setTradeInInfo] = useState<{
    value: number
    quoteId: string
    vehicle: string
  } | null>(null)

  // Fetch vehicles from Supabase
  const { data: dbVehicles, error, isLoading } = useSWR('vehicles', fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
    revalidateOnFocus: true
  })

  // Transform database vehicles to display format
  const vehicles = useMemo(() => {
    if (!dbVehicles) return []
    return dbVehicles.map(transformVehicle)
  }, [dbVehicles])

  // Get unique makes from actual data for filters
  const dynamicMakes = useMemo(() => {
    const uniqueMakes = [...new Set(vehicles.map(v => v.make))].sort()
    return ["All Makes", ...uniqueMakes]
  }, [vehicles])

  // Get unique years from actual data for filters
  const dynamicYears = useMemo(() => {
    const uniqueYears = [...new Set(vehicles.map(v => v.year.toString()))].sort((a, b) => Number(b) - Number(a))
    return ["All Years", ...uniqueYears]
  }, [vehicles])



  // Read URL parameters and set filters
  useEffect(() => {
    const fuelType = searchParams.get("fuelType")
    const bodyType = searchParams.get("bodyType")
    const make = searchParams.get("make")
    
    // Check for trade-in from AI Quote
    const tradeIn = searchParams.get("tradeIn")
    const quoteId = searchParams.get("quoteId")
    const tradeInVehicle = searchParams.get("tradeInVehicle")
    
    if (tradeIn && parseInt(tradeIn) > 0) {
      setTradeInInfo({
        value: parseInt(tradeIn),
        quoteId: quoteId || '',
        vehicle: tradeInVehicle ? decodeURIComponent(tradeInVehicle) : ''
      })
    }
    
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
  }, [searchParams])

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesSearch = searchQuery === "" || 
        `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMake = selectedMake === "All Makes" || vehicle.make === selectedMake
      const matchesBodyType = selectedBodyType === "All Types" || vehicle.bodyType === selectedBodyType
      const matchesFuel = selectedFuelType === "All Fuel Types" || vehicle.fuelType === selectedFuelType
      const matchesYear = selectedYear === "All Years" || vehicle.year.toString() === selectedYear
      const matchesTransmission = selectedTransmission === "All Transmissions" || vehicle.transmission === selectedTransmission
      const matchesColor = selectedColor === "All Colors" || vehicle.exteriorColor === selectedColor
      const matchesDrivetrain = selectedDrivetrain === "All Drivetrains" || vehicle.drivetrain === selectedDrivetrain
      const matchesPrice = vehicle.price >= priceRange[0] && vehicle.price <= priceRange[1]
      const matchesMileage = vehicle.mileage >= mileageRange[0] && vehicle.mileage <= mileageRange[1]
      const matchesEV = !evOnly || vehicle.fuelType === "Electric"
      
      return matchesSearch && matchesMake && matchesBodyType && matchesFuel && matchesYear && matchesTransmission && matchesColor && matchesDrivetrain && matchesPrice && matchesMileage && matchesEV
    })
  }, [vehicles, searchQuery, selectedMake, selectedBodyType, selectedFuelType, selectedYear, selectedTransmission, selectedColor, selectedDrivetrain, priceRange, mileageRange, evOnly])

  // Sort vehicles
  const sortedVehicles = useMemo(() => {
    const sorted = [...filteredVehicles]
    switch (sortBy) {
      case "price-low":
        return sorted.sort((a, b) => a.price - b.price)
      case "price-high":
        return sorted.sort((a, b) => b.price - a.price)
      case "mileage-low":
        return sorted.sort((a, b) => a.mileage - b.mileage)
      case "newest":
        return sorted.sort((a, b) => b.year - a.year)
      case "popular":
        return sorted.sort((a, b) => b.views - a.views)
      default:
        return sorted
    }
  }, [filteredVehicles, sortBy])

const toggleFavorite = (vehicleData: typeof vehicles[0]) => {
    if (isFavorite(vehicleData.id)) {
      removeFavorite(vehicleData.id)
    } else {
      addFavorite({
        id: vehicleData.id,
        year: vehicleData.year,
        make: vehicleData.make,
        model: vehicleData.model,
        price: vehicleData.price,
        originalPrice: vehicleData.originalPrice,
        mileage: vehicleData.mileage,
        image: vehicleData.image
      })
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedMake("All Makes")
    setSelectedBodyType("All Types")
    setSelectedFuelType("All Fuel Types")
    setSelectedYear("All Years")
    setSelectedTransmission("All Transmissions")
    setSelectedColor("All Colors")
    setSelectedDrivetrain("All Drivetrains")
    setPriceRange([0, 400000])
    setMileageRange([0, 100000])
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
    mileageRange[0] > 0 || mileageRange[1] < 100000,
    evOnly
  ].filter(Boolean).length

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Loading inventory...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-20">
              <p className="text-red-500 mb-4">Error loading inventory</p>
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

<main className="pt-20 pb-20 overflow-x-hidden max-w-full">
  {/* Trade-In Banner */}
  {tradeInInfo && tradeInInfo.value > 0 && (
    <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
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
                <h1 className="font-serif text-3xl md:text-4xl font-bold">
                  Vehicle Inventory
                </h1>
                <p className="mt-2 text-muted-foreground flex items-center gap-2">
                  <span className="flex items-center gap-1">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    {vehicles.length.toLocaleString()} vehicles available
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
                  <span className="text-primary text-xs sm:text-sm">{vehicles.filter(v => v.fuelType === "Electric").length} EVs</span>
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
                  placeholder="Search vehicles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11 text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
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
                className="flex-1 h-11 px-3 border rounded-lg bg-background text-sm"
              >
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low</option>
                <option value="price-high">Price: High</option>
                <option value="mileage-low">Low Mileage</option>
                <option value="newest">Newest</option>
              </select>
              <div className="flex border rounded-lg overflow-hidden shrink-0">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`px-3 h-11 flex items-center min-w-[44px] justify-center transition-colors ${
                    viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`px-3 h-11 flex items-center min-w-[44px] justify-center transition-colors ${
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
                  placeholder="Search by make, model, or keyword..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 text-lg"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
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
                  className={`px-4 h-12 flex items-center gap-2 transition-colors ${
                    viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
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
                className="h-12 px-4 border rounded-lg bg-background min-w-[180px]"
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
                    // Reset EV filter when selecting a brand (tabs are independent)
                    setEvOnly(false)
                    setSelectedMake(selectedMake === make ? "All Makes" : make)
                  }}
                  className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap shrink-0 min-h-[44px] ${
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
                className={`px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 min-h-[44px] ${
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
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="min-h-[44px]">
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  {/* Make */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Make</label>
                    <select
                      value={selectedMake}
                      onChange={(e) => setSelectedMake(e.target.value)}
                      className="w-full h-11 px-3 border rounded-lg bg-background text-sm"
                    >
                      {dynamicMakes.map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Year</label>
                    <select
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
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Fuel</label>
                    <select
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
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Trans</label>
                    <select
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
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Drive</label>
                    <select
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
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Color</label>
                    <select
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
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                      Price: ${(priceRange[0]/1000).toFixed(0)}k - ${(priceRange[1]/1000).toFixed(0)}k
                    </label>
                    <Slider
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
                    <label className="block text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">
                      Mileage: {(mileageRange[0]/1000).toFixed(0)}k - {(mileageRange[1]/1000).toFixed(0)}k km
                    </label>
                    <Slider
                      value={mileageRange}
                      onValueChange={setMileageRange}
                      min={0}
                      max={100000}
                      step={5000}
                      className="py-2"
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between py-4 border-b border-border">
            <p className="text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{sortedVehicles.length}</span> vehicles
            </p>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary">
                Clear {activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""}
              </Button>
            )}
          </div>

          {/* Vehicle Grid */}
          <div className={`py-8 ${viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}`}>
            {sortedVehicles.map((vehicle) => (
              <Card 
                key={vehicle.id} 
                className={`group overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                  viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                }`}
              >
                {/* Image */}
                <div className={`relative ${viewMode === "list" ? "w-full sm:w-48 md:w-72 flex-shrink-0 aspect-[4/3] sm:aspect-auto" : "aspect-[4/3]"}`}>
                  <Image
                    src={vehicle.image}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized={vehicle.image.includes('cpsimg.com') || vehicle.image.includes('carpages.ca')}
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      const target = e.target as HTMLImageElement
                      target.src = 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=80'
                    }}
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                    <Badge className={`${vehicle.badgeColor} text-white shadow-lg`}>
                      {vehicle.badge}
                    </Badge>
                    {vehicle.fuelType === "Electric" && (
                      <Badge className="bg-green-500 text-white shadow-lg">
                        <Battery className="w-3 h-3 mr-1" />
                        {vehicle.batteryHealth}% Battery
                      </Badge>
                    )}
                    {/* PM Certified Badge */}
                    <Badge className="bg-blue-600 text-white shadow-lg">
                      <Shield className="w-3 h-3 mr-1" />
                      PM Certified
                    </Badge>
                  </div>

                  {/* Actions */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => toggleFavorite(vehicle)}
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
                        <button className="w-9 h-9 bg-background/90 rounded-full flex items-center justify-center hover:bg-background">
                          <Bell className="w-4 h-4" />
                        </button>
                      }
                    />
                  </div>

                  {/* 360 View Badge */}
                  <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                    <RotateCcw className="w-3 h-3 text-primary" />
                    360° View
                  </div>


                </div>

                {/* Content */}
                <CardContent className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-between" : ""}`}>
                  <div>
                    {/* Title */}
                    <Link href={tradeInInfo ? `/vehicles/${vehicle.id}?tradeIn=${tradeInInfo.value}&quoteId=${tradeInInfo.quoteId}&tradeInVehicle=${encodeURIComponent(tradeInInfo.vehicle)}` : `/vehicles/${vehicle.id}`} className="block group/link">
                      <h3 className="font-semibold text-lg group-hover/link:text-primary transition-colors">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-sm text-muted-foreground">{vehicle.trim}</p>
                    </Link>

                    {/* Specs */}
                    <div className="flex flex-wrap gap-3 mt-3 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
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
                        {vehicle.features.map((feature, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Inspection Score */}
                    <div className="flex items-center gap-2 mt-3">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-green-600 font-medium">
                        {vehicle.inspectionScore}/210 Inspection Score
                      </span>
                    </div>
                  </div>

                  {/* Price & CTA */}
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-end justify-between">
                      <div>
                        {vehicle.originalPrice > vehicle.price && (
                          <p className="text-sm text-muted-foreground line-through">
                            ${vehicle.originalPrice.toLocaleString()}
                          </p>
                        )}
<p className="text-2xl font-bold">${vehicle.price.toLocaleString()}</p>
                      <Link href={`/finance/${vehicle.id}`} className="text-sm text-primary hover:underline">
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
                      <div className="mt-2 flex items-center gap-1 text-sm text-green-600">
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
            ))}
          </div>

          {/* No Results */}
          {sortedVehicles.length === 0 && (
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

          {/* Load More */}
          {sortedVehicles.length > 0 && (
            <div className="text-center py-8">
              <Button variant="outline" size="lg">
                Load More Vehicles
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function InventoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <InventoryContent />
    </Suspense>
  )
}
