"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export interface FavoriteVehicle {
  id: string
  year: number
  make: string
  model: string
  price: number
  originalPrice?: number
  mileage: number
  image: string
  savedAt: Date
}

interface FavoritesContextType {
  favorites: FavoriteVehicle[]
  addFavorite: (vehicle: Omit<FavoriteVehicle, "savedAt">) => void
  removeFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  clearFavorites: () => void
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

const STORAGE_KEY = "planet-motors-favorites"

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteVehicle[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setFavorites(parsed.map((f: FavoriteVehicle) => ({
          ...f,
          savedAt: new Date(f.savedAt)
        })))
      }
    } catch (e) {
      console.error("Failed to load favorites:", e)
    }
    setIsLoaded(true)
  }, [])

  // Save to localStorage whenever favorites change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
      } catch (e) {
        console.error("Failed to save favorites:", e)
      }
    }
  }, [favorites, isLoaded])

  const addFavorite = (vehicle: Omit<FavoriteVehicle, "savedAt">) => {
    setFavorites(prev => {
      if (prev.some(f => f.id === vehicle.id)) return prev
      return [...prev, { ...vehicle, savedAt: new Date() }]
    })
  }

  const removeFavorite = (id: string) => {
    setFavorites(prev => prev.filter(f => f.id !== id))
  }

  const isFavorite = (id: string) => {
    return favorites.some(f => f.id === id)
  }

  const clearFavorites = () => {
    setFavorites([])
  }

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider")
  }
  return context
}
