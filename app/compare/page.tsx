"use client"

import { useState } from "react"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, X, CheckCircle, XCircle, Minus, ArrowRight } from "lucide-react"

// Sample vehicles for comparison
const availableVehicles = [
  {
    id: "tesla-model-3",
    name: "2024 Tesla Model 3 Long Range",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop",
    price: 52990,
    mileage: 12500,
    fuelType: "Electric",
    range: "576 km",
    horsepower: 366,
    acceleration: "4.2s 0-100",
    seating: 5,
    cargo: "649L",
    warranty: "4 years / 80,000 km",
    features: ["Autopilot", "Premium Audio", "Glass Roof", "Heated Seats", "Wireless Charging"]
  },
  {
    id: "bmw-i4",
    name: "2024 BMW i4 eDrive40",
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400&h=300&fit=crop",
    price: 58990,
    mileage: 8200,
    fuelType: "Electric",
    range: "493 km",
    horsepower: 335,
    acceleration: "5.7s 0-100",
    seating: 5,
    cargo: "470L",
    warranty: "4 years / 80,000 km",
    features: ["BMW Digital Key", "Harman Kardon Audio", "Panoramic Roof", "Heated Seats", "Gesture Control"]
  },
  {
    id: "mercedes-eqe",
    name: "2024 Mercedes-Benz EQE 350",
    image: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&h=300&fit=crop",
    price: 74990,
    mileage: 5400,
    fuelType: "Electric",
    range: "547 km",
    horsepower: 288,
    acceleration: "6.2s 0-100",
    seating: 5,
    cargo: "430L",
    warranty: "4 years / 80,000 km",
    features: ["MBUX Hyperscreen", "Burmester Audio", "Air Suspension", "Heated Seats", "360 Camera"]
  },
  {
    id: "honda-accord",
    name: "2024 Honda Accord Hybrid Touring",
    image: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=400&h=300&fit=crop",
    price: 42990,
    mileage: 15600,
    fuelType: "Hybrid",
    range: "850 km",
    horsepower: 204,
    acceleration: "7.5s 0-100",
    seating: 5,
    cargo: "473L",
    warranty: "5 years / 100,000 km",
    features: ["Honda Sensing", "Bose Audio", "Wireless CarPlay", "Heated Seats", "Head-Up Display"]
  },
  {
    id: "toyota-camry",
    name: "2024 Toyota Camry XSE Hybrid",
    image: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400&h=300&fit=crop",
    price: 39990,
    mileage: 18900,
    fuelType: "Hybrid",
    range: "900 km",
    horsepower: 225,
    acceleration: "7.2s 0-100",
    seating: 5,
    cargo: "428L",
    warranty: "5 years / 100,000 km",
    features: ["Toyota Safety Sense", "JBL Audio", "Panoramic Roof", "Heated Seats", "Dynamic Radar Cruise"]
  }
]

export default function ComparePage() {
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([])

  const addVehicle = (vehicleId: string) => {
    if (selectedVehicles.length < 3 && !selectedVehicles.includes(vehicleId)) {
      setSelectedVehicles([...selectedVehicles, vehicleId])
    }
  }

  const removeVehicle = (vehicleId: string) => {
    setSelectedVehicles(selectedVehicles.filter(id => id !== vehicleId))
  }

  const getVehicle = (id: string) => availableVehicles.find(v => v.id === id)
  const selectedVehicleData = selectedVehicles.map(id => getVehicle(id)!).filter(Boolean)

  const compareValue = (values: (string | number)[], type: "lower" | "higher" = "higher") => {
    const numericValues = values.map(v => typeof v === "string" ? parseFloat(v) : v)
    const best = type === "higher" ? Math.max(...numericValues) : Math.min(...numericValues)
    return numericValues.map(v => v === best)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-primary py-12">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl font-bold text-primary-foreground mb-4">
              Compare Vehicles
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-2xl mx-auto">
              Select up to 3 vehicles to compare side-by-side and find your perfect match.
            </p>
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
                        src={getVehicle(selectedVehicles[slot])?.image || ""}
                        alt={getVehicle(selectedVehicles[slot])?.name || ""}
                        fill
                        className="object-cover"
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

                      {/* Warranty */}
                      <tr className="border-b bg-muted/10">
                        <td className="p-4 font-medium">Warranty</td>
                        {selectedVehicleData.map(vehicle => (
                          <td key={vehicle.id} className="p-4 text-center">{vehicle.warranty}</td>
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
                          <td key={vehicle.id} className="p-4 text-center">
                            <Button className="w-full">
                              View Details
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
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
