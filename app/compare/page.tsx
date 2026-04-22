"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X, CheckCircle, ArrowRight, Share2, Printer } from "lucide-react"
import { useCompare, type CompareVehicle } from "@/contexts/compare-context"

// Sample vehicles for comparison - will be replaced with API call: GET /api/vehicles/compare
const availableVehicles: CompareVehicle[] = [
  {
    id: "2024-tesla-model-y",
    name: "2024 Tesla Model Y Long Range AWD",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop",
    price: 64990,
    originalPrice: 69990,
    mileage: 12450,
    fuelType: "Electric",
    range: "533 km",
    horsepower: 384,
    acceleration: "4.8s",
    seating: 5,
    cargo: "2,158L",
    warranty: "4 years / 80,000 km",
    transmission: "Automatic",
    drivetrain: "AWD",
    batteryHealth: 98,
    inspectionScore: 210,
    carfaxUrl: "https://www.carfax.ca/vehicle/5YJ3E1EA1PF123456",
    features: ["Autopilot", "Premium Audio", "Glass Roof", "Heated Seats", "Wireless Charging", "Full Self-Driving Capable"]
  },
  {
    id: "2024-bmw-m4",
    name: "2024 BMW M4 Competition xDrive",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&h=300&fit=crop",
    price: 89900,
    originalPrice: 98500,
    mileage: 8200,
    fuelType: "Premium",
    range: "450 km",
    horsepower: 503,
    acceleration: "3.8s",
    seating: 4,
    cargo: "440L",
    warranty: "4 years / 80,000 km",
    transmission: "Automatic",
    drivetrain: "AWD",
    inspectionScore: 208,
    carfaxUrl: "https://www.carfax.ca/vehicle/WBS83AH00NCK12345",
    features: ["M Sport Package", "Carbon Fiber", "Head-Up Display", "Harman Kardon", "Laser Lights"]
  },
  {
    id: "2024-porsche-taycan",
    name: "2024 Porsche Taycan 4S Performance",
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=400&h=300&fit=crop",
    price: 134500,
    originalPrice: 145000,
    mileage: 5100,
    fuelType: "Electric",
    range: "465 km",
    horsepower: 563,
    acceleration: "3.8s",
    seating: 4,
    cargo: "407L",
    warranty: "4 years / 80,000 km",
    transmission: "Automatic",
    drivetrain: "AWD",
    batteryHealth: 99,
    inspectionScore: 210,
    carfaxUrl: "https://www.carfax.ca/vehicle/WP0AD2A98NS123456",
    features: ["Performance Battery Plus", "Sport Chrono", "BOSE Audio", "Air Suspension", "Porsche InnoDrive"]
  },
  {
    id: "2023-mercedes-eqs",
    name: "2023 Mercedes-Benz EQS 580 4MATIC",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop",
    price: 156900,
    originalPrice: 175000,
    mileage: 3800,
    fuelType: "Electric",
    range: "547 km",
    horsepower: 516,
    acceleration: "4.1s",
    seating: 5,
    cargo: "610L",
    warranty: "4 years / 80,000 km",
    transmission: "Automatic",
    drivetrain: "AWD",
    batteryHealth: 100,
    inspectionScore: 210,
    carfaxUrl: "https://www.carfax.ca/vehicle/W1K6M7GB8PA123456",
    features: ["Hyperscreen", "Burmester 3D", "Air Suspension", "Rear-Axle Steering", "MBUX AR Navigation"]
  },
  {
    id: "2024-honda-crv",
    name: "2024 Honda CR-V Touring AWD Hybrid",
    image: "https://images.unsplash.com/photo-1568844293986-8c292f8a7e83?w=400&h=300&fit=crop",
    price: 42990,
    originalPrice: 45990,
    mileage: 15200,
    fuelType: "Hybrid",
    range: "850 km",
    horsepower: 204,
    acceleration: "7.5s",
    seating: 5,
    cargo: "2,166L",
    warranty: "5 years / 100,000 km",
    transmission: "CVT",
    drivetrain: "AWD",
    inspectionScore: 209,
    carfaxUrl: "https://www.carfax.ca/vehicle/2HKRW2H94RH123456",
    features: ["Honda Sensing", "Wireless CarPlay", "Panoramic Roof", "Heated Seats", "Power Tailgate"]
  },
  {
    id: "2024-toyota-rav4",
    name: "2024 Toyota RAV4 Prime XSE",
    image: "https://images.unsplash.com/photo-1581540222194-0def2dda95b8?w=400&h=300&fit=crop",
    price: 54990,
    originalPrice: 58990,
    mileage: 9800,
    fuelType: "Plug-in Hybrid",
    range: "68 km EV / 970 km total",
    horsepower: 302,
    acceleration: "5.7s",
    seating: 5,
    cargo: "1,977L",
    warranty: "5 years / 100,000 km",
    transmission: "CVT",
    drivetrain: "AWD",
    inspectionScore: 210,
    carfaxUrl: "https://www.carfax.ca/vehicle/JTMAB3FV5PD123456",
    features: ["Toyota Safety Sense", "JBL Audio", "Heated Steering", "Wireless Charging", "Digital Rearview Mirror"]
  }
]

export default function ComparePage() {
  const { compareList, vehicles: contextVehicles, addToCompare, removeFromCompare, clearCompare } = useCompare()
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])

  // Sync with context on mount
  useEffect(() => {
    if (compareList.length > 0) {
      setSelectedVehicles(compareList)
    }
  }, [compareList])

  const addVehicle = (vehicleId: string) => {
    if (selectedVehicles.length < 3 && !selectedVehicles.includes(vehicleId)) {
      setSelectedVehicles([...selectedVehicles, vehicleId])
      const vehicle = availableVehicles.find(v => v.id === vehicleId)
      if (vehicle) {
        addToCompare(vehicleId, vehicle)
      }
    }
  }

  const removeVehicle = (vehicleId: string) => {
    setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId))
    removeFromCompare(vehicleId)
  }

  const handleShare = () => {
    const url = `${window.location.origin}/compare?vehicles=${selectedVehicles.join(",")}`
    navigator.clipboard.writeText(url)
    alert("Comparison link copied to clipboard!")
  }

  const handlePrint = () => {
    window.print()
  }

  const getVehicle = (id: string) => {
    // First check context vehicles, then fall back to available vehicles
    const fromContext = contextVehicles.find(v => v.id === id)
    if (fromContext) return fromContext
    return availableVehicles.find(v => v.id === id)
  }
  const selectedVehicleData = selectedVehicles.map(id => getVehicle(id)).filter((v): v is NonNullable<typeof v> => Boolean(v))

  const compareValue = (values: (string | number)[], type: "lower" | "higher" = "higher") => {
    const numericValues = values.map(v => typeof v === "string" ? parseFloat(v) : v)
    const best = type === "higher" ? Math.max(...numericValues) : Math.min(...numericValues)
    return numericValues.map(v => v === best)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="bg-primary py-8 sm:py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-[-0.01em] text-primary-foreground mb-3 sm:mb-4">
              Compare Vehicles
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-4 sm:mb-6">
              Select up to 3 vehicles to compare side-by-side.
            </p>
            {selectedVehicleData.length >= 2 && (
              <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
                <Button variant="secondary" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button variant="secondary" size="sm" onClick={handlePrint}>
                  <Printer className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Print</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setSelectedVehicles([]); clearCompare(); }} className="border-white/30 text-white hover:bg-white/10">
                  Clear
                </Button>
              </div>
            )}
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
          {/* Vehicle Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[0, 1, 2].map((slot) => (
              <Card key={slot} className="overflow-hidden">
                {selectedVehicles[slot] ? (
                  <div className="relative">
                    <button
                      onClick={() => removeVehicle(selectedVehicles[slot])}
                      className="absolute top-2 right-2 z-10 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={getVehicle(selectedVehicles[slot])?.image || "/images/vehicle-placeholder.jpg"}
                        alt={getVehicle(selectedVehicles[slot])?.name || "Vehicle image"}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{getVehicle(selectedVehicles[slot])?.name}</h3>
                      <p className="text-xl font-bold text-primary">
                        ${getVehicle(selectedVehicles[slot])?.price.toLocaleString()}
                      </p>
                    </CardContent>
                  </div>
                ) : (
                  <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px] bg-muted/30">
                    <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Add Vehicle {slot + 1}</p>
                    <Select onValueChange={addVehicle}>
                      <SelectTrigger className="w-full max-w-xs">
                        <SelectValue placeholder="Select a vehicle" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVehicles
                          .filter(v => !selectedVehicles.includes(v.id))
                          .map(vehicle => (
                            <SelectItem key={vehicle.id} value={vehicle.id}>
                              {vehicle.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Comparison Table */}
          {selectedVehicleData.length >= 2 && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Side-by-Side Comparison</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/30">
                        <th className="text-left p-4 font-medium min-w-[200px]">Specification</th>
                        {selectedVehicleData.map(vehicle => (
                          <th key={vehicle.id} className="text-center p-4 font-medium min-w-[200px]">
                            {vehicle.name.split(" ").slice(0, 3).join(" ")}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Price */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">Price</td>
                        {selectedVehicleData.map((vehicle, i) => {
                          const isBest = compareValue(selectedVehicleData.map(v => v.price), "lower")[i]
                          return (
                            <td key={vehicle.id} className="p-4 text-center">
                              <span className={isBest ? "text-green-600 font-bold" : ""}>
                                ${vehicle.price.toLocaleString()}
                              </span>
                              {isBest && <Badge className="ml-2 bg-green-500">Best</Badge>}
                            </td>
                          )
                        })}
                      </tr>

                      {/* Mileage */}
                      <tr className="border-b bg-muted/10">
                        <td className="p-4 font-medium">Mileage</td>
                        {selectedVehicleData.map((vehicle, i) => {
                          const isBest = compareValue(selectedVehicleData.map(v => v.mileage), "lower")[i]
                          return (
                            <td key={vehicle.id} className="p-4 text-center">
                              <span className={isBest ? "text-green-600 font-bold" : ""}>
                                {vehicle.mileage.toLocaleString()} km
                              </span>
                            </td>
                          )
                        })}
                      </tr>

                      {/* Fuel Type */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">Fuel Type</td>
                        {selectedVehicleData.map(vehicle => (
                          <td key={vehicle.id} className="p-4 text-center">
                            <Badge variant="secondary">{vehicle.fuelType}</Badge>
                          </td>
                        ))}
                      </tr>

                      {/* Range */}
                      <tr className="border-b bg-muted/10">
                        <td className="p-4 font-medium">Range</td>
                        {selectedVehicleData.map((vehicle, i) => {
                          const ranges = selectedVehicleData.map(v => parseInt(v.range))
                          const isBest = compareValue(ranges, "higher")[i]
                          return (
                            <td key={vehicle.id} className="p-4 text-center">
                              <span className={isBest ? "text-green-600 font-bold" : ""}>
                                {vehicle.range}
                              </span>
                            </td>
                          )
                        })}
                      </tr>

                      {/* Horsepower */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">Horsepower</td>
                        {selectedVehicleData.map((vehicle, i) => {
                          const isBest = compareValue(selectedVehicleData.map(v => v.horsepower), "higher")[i]
                          return (
                            <td key={vehicle.id} className="p-4 text-center">
                              <span className={isBest ? "text-green-600 font-bold" : ""}>
                                {vehicle.horsepower} hp
                              </span>
                            </td>
                          )
                        })}
                      </tr>

                      {/* Acceleration */}
                      <tr className="border-b bg-muted/10">
                        <td className="p-4 font-medium">0-100 km/h</td>
                        {selectedVehicleData.map((vehicle, i) => {
                          const times = selectedVehicleData.map(v => parseFloat(v.acceleration))
                          const isBest = compareValue(times, "lower")[i]
                          return (
                            <td key={vehicle.id} className="p-4 text-center">
                              <span className={isBest ? "text-green-600 font-bold" : ""}>
                                {vehicle.acceleration}
                              </span>
                            </td>
                          )
                        })}
                      </tr>

                      {/* Cargo */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">Cargo Space</td>
                        {selectedVehicleData.map(vehicle => (
                          <td key={vehicle.id} className="p-4 text-center">{vehicle.cargo}</td>
                        ))}
                      </tr>

                      {/* Transmission */}
                      <tr className="border-b bg-muted/10">
                        <td className="p-4 font-medium">Transmission</td>
                        {selectedVehicleData.map(vehicle => (
                          <td key={vehicle.id} className="p-4 text-center">{vehicle.transmission}</td>
                        ))}
                      </tr>

                      {/* Drivetrain */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">Drivetrain</td>
                        {selectedVehicleData.map(vehicle => (
                          <td key={vehicle.id} className="p-4 text-center">
                            <Badge variant="secondary">{vehicle.drivetrain}</Badge>
                          </td>
                        ))}
                      </tr>

                      {/* Inspection Score */}
                      <tr className="border-b bg-muted/10">
                        <td className="p-4 font-medium">210-Point Inspection</td>
                        {selectedVehicleData.map((vehicle, i) => {
                          const isBest = compareValue(selectedVehicleData.map(v => v.inspectionScore), "higher")[i]
                          return (
                            <td key={vehicle.id} className="p-4 text-center">
                              <span className={isBest ? "text-green-600 font-bold" : ""}>
                                {vehicle.inspectionScore}/210
                              </span>
                            </td>
                          )
                        })}
                      </tr>

                      {/* Battery Health (for EVs) */}
                      {selectedVehicleData.some(v => v.batteryHealth) && (
                        <tr className="border-b">
                          <td className="p-4 font-medium">Battery Health</td>
                          {selectedVehicleData.map((vehicle) => {
                            const evVehicles = selectedVehicleData.filter(v => v.batteryHealth)
                            const isBest = vehicle.batteryHealth && evVehicles.length > 1 
                              ? compareValue(evVehicles.map(v => v.batteryHealth ?? 0), "higher")[evVehicles.indexOf(vehicle)]
                              : false
                            return (
                              <td key={vehicle.id} className="p-4 text-center">
                                {vehicle.batteryHealth ? (
                                  <span className={isBest ? "text-green-600 font-bold" : ""}>
                                    {vehicle.batteryHealth}%
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">N/A</span>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )}

                      {/* Warranty */}
                      <tr className="border-b bg-muted/10">
                        <td className="p-4 font-medium">Warranty</td>
                        {selectedVehicleData.map(vehicle => (
                          <td key={vehicle.id} className="p-4 text-center">{vehicle.warranty}</td>
                        ))}
                      </tr>
                      
                      {/* CARFAX */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">CARFAX Report</td>
                        {selectedVehicleData.map(vehicle => (
                          <td key={vehicle.id} className="p-4 text-center">
                            {vehicle.carfaxUrl ? (
                              <a 
                                href={vehicle.carfaxUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center justify-center gap-1"
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                View Report
                              </a>
                            ) : (
                              <span className="text-muted-foreground">Not Available</span>
                            )}
                          </td>
                        ))}
                      </tr>

                      {/* Features Comparison */}
                      <tr className="border-b">
                        <td className="p-4 font-medium">Key Features</td>
                        {selectedVehicleData.map(vehicle => (
                          <td key={vehicle.id} className="p-4">
                            <ul className="space-y-1">
                              {vehicle.features.map((feature, i) => (
                                <li key={i} className="flex items-center gap-2 text-sm">
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                  {feature}
                                </li>
                              ))}
                            </ul>
                          </td>
                        ))}
                      </tr>

                      {/* Action Row */}
                      <tr>
                        <td className="p-4"></td>
                        {selectedVehicleData.map(vehicle => (
                          <td key={vehicle.id} className="p-4 text-center space-y-2">
                            <Button className="w-full" asChild>
                              <Link href={`/vehicles/${vehicle.id}`}>
                                View Details
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                            {vehicle.originalPrice && vehicle.originalPrice > vehicle.price && (
                              <p className="text-sm text-green-600 font-medium">
                                Save ${(vehicle.originalPrice - vehicle.price).toLocaleString()}
                              </p>
                            )}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {selectedVehicleData.length < 2 && (
            <Card className="p-12 text-center">
              <p className="text-muted-foreground text-lg">
                Select at least 2 vehicles above to start comparing
              </p>
            </Card>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
