"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

// API-ready interface for comparison vehicles
export interface CompareVehicle {
  id: string
  name: string
  image: string
  price: number
  originalPrice?: number
  mileage: number
  fuelType: string
  range: string
  horsepower: number
  acceleration: string
  seating: number
  cargo: string
  warranty: string
  transmission: string
  drivetrain: string
  batteryHealth?: number
  inspectionScore: number
  carfaxUrl?: string
  features: string[]
}

interface CompareContextType {
  compareList: string[]
  vehicles: CompareVehicle[]
  addToCompare: (vehicleId: string, vehicle?: CompareVehicle) => void
  removeFromCompare: (vehicleId: string) => void
  clearCompare: () => void
  isInCompare: (vehicleId: string) => boolean
  maxItems: number
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

export function CompareProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [compareList, setCompareList] = useState<string[]>([])
  const [vehicles, setVehicles] = useState<CompareVehicle[]>([])
  const maxItems = 3

  const addToCompare = useCallback((vehicleId: string, vehicle?: CompareVehicle) => {
    setCompareList(prev => {
      if (prev.length >= maxItems || prev.includes(vehicleId)) {
        return prev
      }
      return [...prev, vehicleId]
    })
    
    if (vehicle) {
      setVehicles(prev => {
        if (prev.find(v => v.id === vehicleId)) {
          return prev
        }
        return [...prev, vehicle]
      })
    }
  }, [])

  const removeFromCompare = useCallback((vehicleId: string) => {
    setCompareList(prev => prev.filter(id => id !== vehicleId))
    setVehicles(prev => prev.filter(v => v.id !== vehicleId))
  }, [])

  const clearCompare = useCallback(() => {
    setCompareList([])
    setVehicles([])
  }, [])

  const isInCompare = useCallback((vehicleId: string) => {
    return compareList.includes(vehicleId)
  }, [compareList])

  return (
    <CompareContext.Provider
      value={{
        compareList,
        vehicles,
        addToCompare,
        removeFromCompare,
        clearCompare,
        isInCompare,
        maxItems
      }}
    >
      {children}
    </CompareContext.Provider>
  )
}

export function useCompare() {
  const context = useContext(CompareContext)
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider")
  }
  return context
}
