"use client"

import { useState, useEffect, useCallback } from "react"

export interface AdminVehicle {
  id: string
  vin?: string
  stock_number: string
  year: number
  make: string
  model: string
  trim: string | null
  body_style?: string | null
  exterior_color?: string | null
  interior_color?: string | null
  engine?: string | null
  transmission?: string | null
  drivetrain?: string | null
  fuel_type?: string | null
  mileage?: number
  price?: number
  is_ev: boolean
  battery_capacity_kwh?: number | null
  range_miles?: number | null
  ev_battery_health_percent?: number | null
  primary_image_url: string | null
  image_urls?: string[] | null
  status: string
}

/**
 * Shared hook for fetching and filtering admin vehicles.
 * Used by AI Writer, SEO, Enhance, and Video pages.
 */
export function useAdminVehicles() {
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const fetchVehicles = useCallback(async () => {
    setError(null)
    try {
      const res = await fetch("/api/v1/admin/vehicles?limit=200")
      if (!res.ok) throw new Error(`Failed to load vehicles (${res.status})`)
      const data = await res.json()
      setVehicles(data.vehicles || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load vehicles")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchVehicles()
  }, [fetchVehicles])

  const filtered = vehicles.filter((v) => {
    if (!search) return true
    const q = search.toLowerCase()
    return `${v.year} ${v.make} ${v.model} ${v.trim || ""} ${v.vin || ""} ${v.stock_number}`
      .toLowerCase()
      .includes(q)
  })

  return { vehicles, loading, error, search, setSearch, filtered }
}

/** Get photos array for a vehicle */
export function getVehiclePhotos(v: AdminVehicle | null): string[] {
  if (!v) return []
  if (v.image_urls?.length) return v.image_urls
  if (v.primary_image_url) return [v.primary_image_url]
  return []
}
