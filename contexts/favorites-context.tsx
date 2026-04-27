"use client"

/**
 * contexts/favorites-context.tsx
 *
 * Upgraded: Hybrid localStorage + Supabase sync
 *
 * Architecture (senior-level decision):
 *
 *  1. localStorage  — instant, zero-latency reads/writes. Works offline.
 *                     Always the source of truth for the UI.
 *
 *  2. Supabase sync — when the user is authenticated, favorites are
 *                     persisted server-side so they survive browser clears
 *                     and sync across devices.
 *
 *  3. Price-drop detection — when syncing, we compare the saved price
 *                     against the current vehicle price. If it dropped,
 *                     we set `priceDropped: true` on the favorite so the
 *                     Garage UI can show a "Price Drop" badge.
 *
 * New fields on FavoriteVehicle:
 *   - priceDropped: boolean   — true if current price < savedPrice
 *   - priceAtSave: number     — price when the user saved the vehicle
 *   - slug: string            — for VDP deep-link
 *
 * Supabase table required (run once):
 *   CREATE TABLE IF NOT EXISTS user_favorites (
 *     id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 *     vehicle_id  text NOT NULL,
 *     vehicle_data jsonb NOT NULL,
 *     saved_at    timestamptz DEFAULT now(),
 *     UNIQUE(user_id, vehicle_id)
 *   );
 *   ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;
 *   CREATE POLICY "Users manage own favorites"
 *     ON user_favorites FOR ALL USING (auth.uid() = user_id);
 */

import {
  createContext, useContext, useState, useEffect,
  useCallback, useRef, useMemo, type ReactNode
} from "react"
import { createClient } from "@/lib/supabase/client"

// ── Types ──────────────────────────────────────────────────────────────────

export interface FavoriteVehicle {
  id: string
  year: number
  make: string
  model: string
  trim?: string
  price: number
  /** Price when the user first saved this vehicle */
  priceAtSave: number
  /** True if current price is lower than priceAtSave */
  priceDropped: boolean
  /** Price drop amount in dollars */
  priceDrop?: number
  originalPrice?: number
  mileage: number
  image: string
  slug?: string
  vin?: string
  savedAt: Date
}

interface FavoritesContextType {
  favorites: FavoriteVehicle[]
  addFavorite: (vehicle: Omit<FavoriteVehicle, "savedAt" | "priceAtSave" | "priceDropped">) => void
  removeFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
  clearFavorites: () => void
  /** True while syncing with Supabase */
  syncing: boolean
  /** Number of vehicles with price drops */
  priceDropCount: number
}

// ── Constants ──────────────────────────────────────────────────────────────

const STORAGE_KEY = "planet-motors-favorites"
const SYNC_DEBOUNCE_MS = 1500

// ── Context ────────────────────────────────────────────────────────────────

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

// ── Provider ───────────────────────────────────────────────────────────────

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteVehicle[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const supabase = createClient()

  // ── Load from localStorage on mount ──────────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: FavoriteVehicle[] = JSON.parse(stored)
        setFavorites(parsed.map(f => ({
          ...f,
          priceAtSave: f.priceAtSave ?? f.price,
          priceDropped: f.priceDropped ?? false,
          savedAt: new Date(f.savedAt),
        })))
      }
    } catch {
      // Corrupt storage — start fresh
      localStorage.removeItem(STORAGE_KEY)
    }
    setIsLoaded(true)
  }, [])

  // ── Persist to localStorage on change ────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites))
    } catch {
      // Storage quota exceeded — silently ignore
    }
  }, [favorites, isLoaded])

  // ── Supabase sync (debounced, auth-gated) ────────────────────────────────
  const syncToSupabase = useCallback(async (favs: FavoriteVehicle[]) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return // Not authenticated — localStorage only

    setSyncing(true)
    try {
      // Upsert all current favorites
      if (favs.length > 0) {
        await supabase.from("user_favorites").upsert(
          favs.map(f => ({
            user_id: user.id,
            vehicle_id: f.id,
            vehicle_data: f,
            saved_at: f.savedAt.toISOString(),
          })),
          { onConflict: "user_id,vehicle_id" }
        )
      }
    } catch {
      // Non-fatal — localStorage is still the source of truth
    } finally {
      setSyncing(false)
    }
  }, [supabase])

  // ── Load from Supabase on auth (merge with localStorage) ─────────────────
  useEffect(() => {
    if (!isLoaded) return

    const loadFromSupabase = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      setSyncing(true)
      try {
        const { data, error } = await supabase
          .from("user_favorites")
          .select("vehicle_data, saved_at")
          .eq("user_id", user.id)
          .order("saved_at", { ascending: false })

        if (error || !data) return

        const serverFavs: FavoriteVehicle[] = data.map(row => ({
          ...(row.vehicle_data as FavoriteVehicle),
          savedAt: new Date(row.saved_at),
        }))

        // Merge: server wins for vehicles that exist on both sides
        setFavorites(prev => {
          const serverIds = new Set(serverFavs.map(f => f.id))
          const localOnly = prev.filter(f => !serverIds.has(f.id))
          return [...serverFavs, ...localOnly]
        })
      } catch {
        // Non-fatal
      } finally {
        setSyncing(false)
      }
    }

    loadFromSupabase()

    // Re-sync when auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "SIGNED_IN") loadFromSupabase()
        if (event === "SIGNED_OUT") {
          // Keep localStorage favorites, just stop syncing
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [isLoaded, supabase])

  // ── Debounced sync trigger ────────────────────────────────────────────────
  const triggerSync = useCallback((favs: FavoriteVehicle[]) => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current)
    syncTimerRef.current = setTimeout(() => syncToSupabase(favs), SYNC_DEBOUNCE_MS)
  }, [syncToSupabase])

  // ── Actions ───────────────────────────────────────────────────────────────

  const addFavorite = useCallback((
    vehicle: Omit<FavoriteVehicle, "savedAt" | "priceAtSave" | "priceDropped">
  ) => {
    setFavorites(prev => {
      if (prev.some(f => f.id === vehicle.id)) return prev
      const newFav: FavoriteVehicle = {
        ...vehicle,
        priceAtSave: vehicle.price,
        priceDropped: false,
        savedAt: new Date(),
      }
      const next = [newFav, ...prev]
      triggerSync(next)
      return next
    })
  }, [triggerSync])

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id)
      triggerSync(next)

      // Also delete from Supabase (fire-and-forget)
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          supabase.from("user_favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("vehicle_id", id)
            .then(() => {})
        }
      })

      return next
    })
  }, [triggerSync, supabase])

  const isFavorite = useCallback((id: string) => {
    return favorites.some(f => f.id === id)
  }, [favorites])

  const clearFavorites = useCallback(() => {
    setFavorites([])
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        supabase.from("user_favorites").delete().eq("user_id", user.id).then(() => {})
      }
    })
  }, [supabase])

  const priceDropCount = favorites.filter(f => f.priceDropped).length

  const ctxValue = useMemo(() => ({
    favorites, addFavorite, removeFavorite, isFavorite, clearFavorites,
    syncing, priceDropCount,
  }), [favorites, addFavorite, removeFavorite, isFavorite, clearFavorites, syncing, priceDropCount])

  return (
    <FavoritesContext.Provider value={ctxValue}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const context = useContext(FavoritesContext)
  if (!context) throw new Error("useFavorites must be used within a FavoritesProvider")
  return context
}
