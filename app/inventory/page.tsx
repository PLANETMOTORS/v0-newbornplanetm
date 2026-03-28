"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  Search, SlidersHorizontal, Grid3X3, List, Heart, Share2, 
  Gauge, Fuel, Calendar, MapPin, Shield, Zap, ChevronDown,
  X, RotateCcw, TrendingUp, Eye, Clock, CheckCircle, Star,
  ArrowUpDown, Filter, Sparkles, Battery, Car, ExternalLink
} from "lucide-react"
import { useFavorites } from "@/lib/favorites-context"

// Premium vehicle inventory data
const vehicles = [
  {
    id: "2024-tesla-model-y",
    year: 2024,
    make: "Tesla",
    model: "Model Y",
    trim: "Long Range AWD",
    price: 64990,
    originalPrice: 69990,
    mileage: 12450,
    fuelType: "Electric",
    transmission: "Automatic",
    drivetrain: "AWD",
    exteriorColor: "White",
    range: "533 km",
    batteryHealth: 98,
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80",
    location: "Richmond Hill",
    inspectionScore: 210,
    badge: "Just Arrived",
    badgeColor: "bg-green-500",
    views: 124,
    favorites: 18,
    monthlyPayment: 489,
    carfaxUrl: "https://www.carfax.ca/vehicle/5YJ3E1EA1PF123456",
    features: ["Autopilot", "Premium Audio", "Heated Seats"]
  },
  {
    id: "2024-tesla-model-3",
    year: 2024,
    make: "Tesla",
    model: "Model 3",
    trim: "Performance AWD",
    price: 58990,
    originalPrice: 62990,
    mileage: 8500,
    fuelType: "Electric",
    transmission: "Automatic",
    drivetrain: "AWD",
    exteriorColor: "Red",
    range: "507 km",
    batteryHealth: 99,
    image: "https://images.unsplash.com/photo-1536700503339-1e4b06520771?w=800&auto=format&fit=crop&q=80",
    location: "Richmond Hill",
    inspectionScore: 210,
    badge: "Performance",
    badgeColor: "bg-red-500",
    views: 189,
    favorites: 27,
    monthlyPayment: 459,
    carfaxUrl: "https://www.carfax.ca/vehicle/5YJ3E1EA3PF654321",
    features: ["Track Mode", "Performance Brakes", "Carbon Fiber Spoiler"]
  },
  {
    id: "2024-bmw-m4",
    year: 2024,
    make: "BMW",
    model: "M4",
    trim: "Competition xDrive",
    price: 89900,
    originalPrice: 98500,
    mileage: 8200,
    fuelType: "Premium",
    transmission: "Automatic",
    drivetrain: "AWD",
    exteriorColor: "Black",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=800&auto=format&fit=crop&q=80",
    location: "Richmond Hill",
    inspectionScore: 208,
    badge: "Hot Deal",
    badgeColor: "bg-red-500",
    views: 89,
    favorites: 12,
    monthlyPayment: 699,
    carfaxUrl: "https://www.carfax.ca/vehicle/WBS83AH00NCK12345",
    features: ["M Sport Package", "Carbon Fiber", "Head-Up Display"]
  },
  {
    id: "2024-porsche-taycan",
    year: 2024,
    make: "Porsche",
    model: "Taycan",
    trim: "4S Performance",
    price: 134500,
    originalPrice: 145000,
    mileage: 5100,
    fuelType: "Electric",
    transmission: "Automatic",
    drivetrain: "AWD",
    exteriorColor: "Blue",
    range: "465 km",
    batteryHealth: 99,
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=800&auto=format&fit=crop&q=80",
    location: "Richmond Hill",
    inspectionScore: 210,
    badge: "Premium",
    badgeColor: "bg-primary",
    views: 156,
    favorites: 24,
    monthlyPayment: 1089,
    carfaxUrl: "https://www.carfax.ca/vehicle/WP0AD2A98NS123456",
    features: ["Performance Battery Plus", "Sport Chrono", "BOSE Audio"]
  },
  {
    id: "2023-mercedes-eqs",
    year: 2023,
    make: "Mercedes-Benz",
    model: "EQS",
    trim: "580 4MATIC",
    price: 156900,
    originalPrice: 175000,
    mileage: 3800,
    fuelType: "Electric",
    transmission: "Automatic",
    drivetrain: "AWD",
    exteriorColor: "Silver",
    range: "547 km",
    batteryHealth: 100,
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop&q=80",
    location: "Richmond Hill",
    inspectionScore: 210,
    badge: "Certified",
    badgeColor: "bg-blue-500",
    views: 203,
    favorites: 31,
    monthlyPayment: 1249,
    carfaxUrl: "https://www.carfax.ca/vehicle/W1K6M7GB8PA123456",
    features: ["Hyperscreen", "Burmester 3D", "Air Suspension"]
  },
  {
    id: "2024-honda-crv",
    year: 2024,
    make: "Honda",
    model: "CR-V",
    trim: "Touring AWD",
    price: 42990,
    originalPrice: 45990,
    mileage: 15200,
    fuelType: "Hybrid",
    transmission: "CVT",
    drivetrain: "AWD",
    exteriorColor: "Gray",
    image: "https://images.unsplash.com/photo-1568844293986-8c292f8a7e83?w=800&auto=format&fit=crop&q=80",
    location: "Richmond Hill",
    inspectionScore: 209,
    badge: "Best Seller",
    badgeColor: "bg-amber-500",
    views: 278,
    favorites: 45,
    monthlyPayment: 349,
    carfaxUrl: "https://www.carfax.ca/vehicle/2HKRW2H94RH123456",
    features: ["Honda Sensing", "Wireless CarPlay", "Panoramic Roof"]
  },
  {
    id: "2024-toyota-rav4",
    year: 2024,
    make: "Toyota",
    model: "RAV4",
    trim: "Prime XSE",
    price: 54990,
    originalPrice: 58990,
    mileage: 9800,
    fuelType: "Plug-in Hybrid",
    transmission: "CVT",
    drivetrain: "AWD",
    exteriorColor: "White",
    range: "68 km EV",
    image: "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=800&auto=format&fit=crop&q=80",
    location: "Richmond Hill",
    inspectionScore: 210,
    badge: "Eco Choice",
    badgeColor: "bg-green-600",
    views: 167,
    favorites: 29,
    monthlyPayment: 439,
    carfaxUrl: "https://www.carfax.ca/vehicle/JTMAB3FV5PD123456",
    features: ["Toyota Safety Sense", "JBL Audio", "Heated Steering"]
  },
  {
    id: "2023-audi-etron-gt",
    year: 2023,
    make: "Audi",
    model: "e-tron GT",
    trim: "RS",
    price: 178900,
    originalPrice: 195000,
    mileage: 4200,
    fuelType: "Electric",
    transmission: "Automatic",
    drivetrain: "AWD",
    exteriorColor: "Red",
    range: "395 km",
    batteryHealth: 99,
    image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80",
    location: "Richmond Hill",
    inspectionScore: 210,
    badge: "Rare Find",
    badgeColor: "bg-purple-500",
    views: 312,
    favorites: 52,
    monthlyPayment: 1449,
    carfaxUrl: "https://www.carfax.ca/vehicle/WUAESAF47PA123456",
    features: ["Matrix LED", "Bang & Olufsen", "Air Suspension"]
  },
  {
    id: "2024-ford-f150",
    year: 2024,
    make: "Ford",
    model: "F-150",
    trim: "Lightning Platinum",
    price: 98990,
    originalPrice: 105000,
    mileage: 6500,
    fuelType: "Electric",
    transmission: "Automatic",
    drivetrain: "4WD",
    exteriorColor: "Blue",
    range: "483 km",
    batteryHealth: 98,
    image: "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=800&auto=format&fit=crop&q=80",
    location: "Richmond Hill",
    inspectionScore: 210,
    badge: "Electric Truck",
    badgeColor: "bg-blue-600",
    views: 234,
    favorites: 38,
    carfaxUrl: "https://www.carfax.ca/vehicle/1FTFW1E58PF123456",
    monthlyPayment: 789,
    features: ["Pro Power Onboard", "BlueCruise", "Max Recline Seats"]
  }
]

const makes = ["All Makes", "Audi", "BMW", "Ford", "Honda", "Mercedes-Benz", "Porsche", "Tesla", "Toyota"]
const bodyTypes = ["All Types", "SUV", "Sedan", "Truck", "Coupe", "Hatchback", "Convertible"]
const fuelTypes = ["All Fuel Types", "Electric", "Hybrid", "Plug-in Hybrid", "Gasoline", "Premium"]
const years = ["All Years", "2024", "2023", "2022", "2021", "2020", "2019", "2018"]
const transmissions = ["All Transmissions", "Automatic", "Manual", "CVT", "Dual-Clutch"]
const colors = ["All Colors", "White", "Black", "Silver", "Blue", "Red", "Gray", "Green"]
const drivetrains = ["All Drivetrains", "AWD", "FWD", "RWD", "4WD"]

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMake, setSelectedMake] = useState("All Makes")
  const [selectedBodyType, setSelectedBodyType] = useState("All Types")
  const [selectedFuelType, setSelectedFuelType] = useState("All Fuel Types")
  const [selectedYear, setSelectedYear] = useState("All Years")
  const [selectedTransmission, setSelectedTransmission] = useState("All Transmissions")
  const [selectedColor, setSelectedColor] = useState("All Colors")
  const [selectedDrivetrain, setSelectedDrivetrain] = useState("All Drivetrains")
  const [priceRange, setPriceRange] = useState([0, 200000])
  const [mileageRange, setMileageRange] = useState([0, 100000])
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState("featured")
  const { favorites, addFavorite, removeFavorite, isFavorite } = useFavorites()
  const [evOnly, setEvOnly] = useState(false)

  // Filter vehicles
  const filteredVehicles = useMemo(() => {
    return vehicles.filter(vehicle => {
      const matchesSearch = searchQuery === "" || 
        `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesMake = selectedMake === "All Makes" || vehicle.make === selectedMake
      const matchesFuel = selectedFuelType === "All Fuel Types" || vehicle.fuelType === selectedFuelType
      const matchesYear = selectedYear === "All Years" || vehicle.year.toString() === selectedYear
      const matchesTransmission = selectedTransmission === "All Transmissions" || vehicle.transmission === selectedTransmission
      const matchesColor = selectedColor === "All Colors" || vehicle.exteriorColor === selectedColor
      const matchesDrivetrain = selectedDrivetrain === "All Drivetrains" || vehicle.drivetrain === selectedDrivetrain
      const matchesPrice = vehicle.price >= priceRange[0] && vehicle.price <= priceRange[1]
      const matchesMileage = vehicle.mileage >= mileageRange[0] && vehicle.mileage <= mileageRange[1]
      const matchesEV = !evOnly || vehicle.fuelType === "Electric"
      
      return matchesSearch && matchesMake && matchesFuel && matchesYear && matchesTransmission && matchesColor && matchesDrivetrain && matchesPrice && matchesMileage && matchesEV
    })
  }, [searchQuery, selectedMake, selectedFuelType, selectedYear, selectedTransmission, selectedColor, selectedDrivetrain, priceRange, mileageRange, evOnly])

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
    setPriceRange([0, 200000])
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
    priceRange[0] > 0 || priceRange[1] < 200000,
    mileageRange[0] > 0 || mileageRange[1] < 100000,
    evOnly
  ].filter(Boolean).length

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 pb-20">
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
                    Updated 2 min ago
                  </span>
                </p>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-950/30 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 dark:text-green-400">124 new this week</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-primary">{vehicles.filter(v => v.fuelType === "Electric").length} EVs</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="py-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
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

            {/* Quick Filters */}
            <div className="flex flex-wrap gap-2">
              {makes.filter(m => m !== "All Makes").map(make => (
                <button
                  key={make}
                  onClick={() => setSelectedMake(selectedMake === make ? "All Makes" : make)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedMake === make
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {make}
                </button>
              ))}
              <button
                onClick={() => setEvOnly(!evOnly)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1 ${
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
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Filter className="w-5 h-5" />
                    Advanced Filters
                  </h3>
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Clear All
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Make */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Make</label>
                    <select
                      value={selectedMake}
                      onChange={(e) => setSelectedMake(e.target.value)}
                      className="w-full h-10 px-3 border rounded-lg bg-background"
                    >
                      {makes.map(make => (
                        <option key={make} value={make}>{make}</option>
                      ))}
                    </select>
                  </div>

                  {/* Year */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Year</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="w-full h-10 px-3 border rounded-lg bg-background"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>

                  {/* Fuel Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Fuel Type</label>
                    <select
                      value={selectedFuelType}
                      onChange={(e) => setSelectedFuelType(e.target.value)}
                      className="w-full h-10 px-3 border rounded-lg bg-background"
                    >
                      {fuelTypes.map(fuel => (
                        <option key={fuel} value={fuel}>{fuel}</option>
                      ))}
                    </select>
                  </div>

                  {/* Transmission */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Transmission</label>
                    <select
                      value={selectedTransmission}
                      onChange={(e) => setSelectedTransmission(e.target.value)}
                      className="w-full h-10 px-3 border rounded-lg bg-background"
                    >
                      {transmissions.map(trans => (
                        <option key={trans} value={trans}>{trans}</option>
                      ))}
                    </select>
                  </div>

                  {/* Drivetrain */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Drivetrain</label>
                    <select
                      value={selectedDrivetrain}
                      onChange={(e) => setSelectedDrivetrain(e.target.value)}
                      className="w-full h-10 px-3 border rounded-lg bg-background"
                    >
                      {drivetrains.map(drive => (
                        <option key={drive} value={drive}>{drive}</option>
                      ))}
                    </select>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Exterior Color</label>
                    <select
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-full h-10 px-3 border rounded-lg bg-background"
                    >
                      {colors.map(color => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Price: ${priceRange[0].toLocaleString()} - ${priceRange[1].toLocaleString()}
                    </label>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      min={0}
                      max={200000}
                      step={5000}
                    />
                  </div>

                  {/* Mileage Range */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Mileage: {mileageRange[0].toLocaleString()} - {mileageRange[1].toLocaleString()} km
                    </label>
                    <Slider
                      value={mileageRange}
                      onValueChange={setMileageRange}
                      min={0}
                      max={100000}
                      step={5000}
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
                  viewMode === "list" ? "flex flex-row" : ""
                }`}
              >
                {/* Image */}
                <div className={`relative ${viewMode === "list" ? "w-72 flex-shrink-0" : "aspect-[4/3]"}`}>
                  <Image
                    src={vehicle.image}
                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
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
                    <button className="w-9 h-9 bg-background/90 rounded-full flex items-center justify-center hover:bg-background">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 360 View Badge */}
                  <div className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                    <RotateCcw className="w-3 h-3 text-primary" />
                    360° View
                  </div>

                  {/* Live Stats */}
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                      <Eye className="w-3 h-3" />
                      {vehicle.views}
                    </div>
                    <div className="bg-background/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1 text-xs">
                      <Heart className="w-3 h-3" />
                      {vehicle.favorites}
                    </div>
                  </div>
                </div>

                {/* Content */}
                <CardContent className={`p-4 ${viewMode === "list" ? "flex-1 flex flex-col justify-between" : ""}`}>
                  <div>
                    {/* Title */}
                    <Link href={`/vehicles/${vehicle.id}`} className="block group/link">
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
                        <p className="text-sm text-muted-foreground">
                          Est. ${vehicle.monthlyPayment}/mo
                        </p>
                      </div>
                      <Button size="sm" asChild>
                        <Link href={`/vehicles/${vehicle.id}`}>
                          View Details
                        </Link>
                      </Button>
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
