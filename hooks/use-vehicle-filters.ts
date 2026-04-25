"use client"

import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { useCallback, useMemo } from "react"

export interface VehicleFilters {
  search: string
  make: string
  model: string
  year: string
  minPrice: string
  maxPrice: string
  minMileage: string
  maxMileage: string
  fuelType: string
  transmission: string
  drivetrain: string
  bodyStyle: string
  color: string
  evOnly: string
  sort: string
  view: string
  page: string
}

const defaultFilters: VehicleFilters = {
  search: "",
  make: "",
  model: "",
  year: "",
  minPrice: "",
  maxPrice: "",
  minMileage: "",
  maxMileage: "",
  fuelType: "",
  transmission: "",
  drivetrain: "",
  bodyStyle: "",
  color: "",
  evOnly: "",
  sort: "featured",
  view: "grid",
  page: "1"
}

export function useVehicleFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters = useMemo<VehicleFilters>(() => {
    return {
      search: searchParams.get("search") || defaultFilters.search,
      make: searchParams.get("make") || defaultFilters.make,
      model: searchParams.get("model") || defaultFilters.model,
      year: searchParams.get("year") || defaultFilters.year,
      minPrice: searchParams.get("minPrice") || defaultFilters.minPrice,
      maxPrice: searchParams.get("maxPrice") || defaultFilters.maxPrice,
      minMileage: searchParams.get("minMileage") || defaultFilters.minMileage,
      maxMileage: searchParams.get("maxMileage") || defaultFilters.maxMileage,
      fuelType: searchParams.get("fuelType") || defaultFilters.fuelType,
      transmission: searchParams.get("transmission") || defaultFilters.transmission,
      drivetrain: searchParams.get("drivetrain") || defaultFilters.drivetrain,
      bodyStyle: searchParams.get("bodyStyle") || defaultFilters.bodyStyle,
      color: searchParams.get("color") || defaultFilters.color,
      evOnly: searchParams.get("evOnly") || defaultFilters.evOnly,
      sort: searchParams.get("sort") || defaultFilters.sort,
      view: searchParams.get("view") || defaultFilters.view,
      page: searchParams.get("page") || defaultFilters.page,
    }
  }, [searchParams])

  const setFilter = useCallback((key: keyof VehicleFilters, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (value && value !== defaultFilters[key]) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    
    // Reset page when filters change (except for page itself)
    if (key !== "page" && key !== "view" && key !== "sort") {
      params.delete("page")
    }
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const setFilters = useCallback((newFilters: Partial<VehicleFilters>) => {
    const params = new URLSearchParams(searchParams.toString())
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== defaultFilters[key as keyof VehicleFilters]) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })
    
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  const clearFilter = useCallback((key: keyof VehicleFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const activeFilterCount = useMemo(() => {
    let count = 0
    const excludeFromCount = new Set(["sort", "view", "page"])
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value && !excludeFromCount.has(key) && value !== defaultFilters[key as keyof VehicleFilters]) {
        count++
      }
    })
    
    return count
  }, [filters])

  const getShareableUrl = useCallback(() => {
    return `${globalThis.window?.location.origin ?? ""}${pathname}?${searchParams.toString()}`
  }, [pathname, searchParams])

  return {
    filters,
    setFilter,
    setFilters,
    clearFilters,
    clearFilter,
    activeFilterCount,
    getShareableUrl
  }
}
