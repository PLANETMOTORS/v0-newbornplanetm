"use client"

/**
 * app/garage/page.tsx
 *
 * Customer Garage — "My Saved Vehicles"
 *
 * Features:
 *  - Saved vehicles grid with price-drop badges
 *  - Price drop alert banner when any saved vehicle dropped in price
 *  - "Get Notified" CTA that fires a lead to AutoRaptor via /api/webhooks/crm
 *  - Remove from garage
 *  - Empty state with CTA to browse inventory
 *  - Syncs with Supabase when authenticated (via upgraded FavoritesProvider)
 */

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Heart, TrendingDown, Car, ArrowRight, Trash2,
  Bell, CheckCircle, ExternalLink, Loader2, Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useFavorites, type FavoriteVehicle } from "@/contexts/favorites-context"

// ── Helpers ────────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-CA", {
    style: "currency", currency: "CAD", maximumFractionDigits: 0,
  }).format(price)
}

function formatMileage(km: number): string {
  return new Intl.NumberFormat("en-CA").format(km) + " km"
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 86400) return "today"
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`
  return `${Math.floor(seconds / 2592000)}mo ago`
}

// ── Vehicle Card ───────────────────────────────────────────────────────────

function GarageVehicleCard({
  vehicle,
  onRemove,
  onAlert,
}: {
  vehicle: FavoriteVehicle
  onRemove: (id: string) => void
  onAlert: (vehicle: FavoriteVehicle) => void
}) {
  const vdpUrl = vehicle.slug
    ? `/vehicles/${vehicle.slug}`
    : `/inventory?search=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)}`

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/60">
      {/* Vehicle image */}
      <div className="relative aspect-[16/9] bg-muted overflow-hidden">
        {vehicle.image ? (
          <Image
            src={vehicle.image}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Car className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Price drop badge */}
        {vehicle.priceDropped && vehicle.priceDrop && (
          <div className="absolute top-2 left-2">
            <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
              <TrendingDown className="h-3 w-3" />
              Price Drop! {formatPrice(vehicle.priceDrop)} off
            </span>
          </div>
        )}

        {/* Remove button */}
        <button
          onClick={() => onRemove(vehicle.id)}
          className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200"
          aria-label="Remove from garage"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>

        {/* Saved date */}
        <div className="absolute bottom-2 right-2">
          <span className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full">
            Saved {timeAgo(vehicle.savedAt)}
          </span>
        </div>
      </div>

      <CardContent className="p-4">
        {/* Title */}
        <h3 className="font-bold text-foreground text-base leading-tight mb-1">
          {vehicle.year} {vehicle.make} {vehicle.model}
          {vehicle.trim && <span className="font-normal text-muted-foreground"> {vehicle.trim}</span>}
        </h3>

        {/* Mileage */}
        <p className="text-xs text-muted-foreground mb-3">{formatMileage(vehicle.mileage)}</p>

        {/* Price */}
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-xl font-bold text-foreground">{formatPrice(vehicle.price)}</span>
          {vehicle.priceDropped && vehicle.priceAtSave > vehicle.price && (
            <span className="text-sm text-muted-foreground line-through">{formatPrice(vehicle.priceAtSave)}</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button asChild size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
            <Link href={vdpUrl}>
              View Details <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
            onClick={() => onAlert(vehicle)}
          >
            <Bell className="h-3.5 w-3.5 mr-1.5" />
            Alert Me
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Alert Modal ────────────────────────────────────────────────────────────

function AlertModal({
  vehicle,
  onClose,
}: {
  vehicle: FavoriteVehicle
  onClose: () => void
}) {
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) { setError("Email is required"); return }
    setSending(true)
    setError("")

    try {
      const res = await fetch("/api/webhooks/crm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "garage_price_alert",
          firstName: email.split("@")[0] ?? "Customer",
          lastName: "",
          email,
          phone: phone || undefined,
          message: `Price alert request for ${vehicle.year} ${vehicle.make} ${vehicle.model}. Current price: ${formatPrice(vehicle.price)}. Saved at: ${formatPrice(vehicle.priceAtSave)}.`,
          vehicle: {
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            trim: vehicle.trim,
            price: vehicle.price,
            vin: vehicle.vin,
          },
        }),
      })

      if (res.ok) {
        setSent(true)
      } else {
        setError("Something went wrong. Please try again.")
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        {sent ? (
          <div className="text-center py-4">
            <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-foreground mb-2">Alert Set!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              We'll contact you if the price on the {vehicle.year} {vehicle.make} {vehicle.model} changes.
            </p>
            <Button onClick={onClose} className="w-full">Done</Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <Bell className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Price Alert</h3>
                <p className="text-xs text-muted-foreground">{vehicle.year} {vehicle.make} {vehicle.model}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              We'll notify you if the price drops below <strong>{formatPrice(vehicle.price)}</strong>.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="Your email address *"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <input
                type="tel"
                placeholder="Phone (optional)"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <div className="flex gap-2 pt-1">
                <Button type="button" variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
                <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={sending}>
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Set Alert"}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function GaragePage() {
  const { favorites, removeFavorite, priceDropCount, syncing } = useFavorites()
  const [alertVehicle, setAlertVehicle] = useState<FavoriteVehicle | null>(null)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 dark:bg-slate-800 rounded-xl">
                <Star className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">My Garage</h1>
                <p className="text-sm text-muted-foreground">
                  {favorites.length} saved vehicle{favorites.length !== 1 ? "s" : ""}
                  {syncing && <span className="ml-2 text-xs text-blue-500">· syncing…</span>}
                </p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href="/inventory">
                Browse Inventory <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Price drop alert banner */}
        {priceDropCount > 0 && (
          <div className="mb-6 flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
            <TrendingDown className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              🎉 {priceDropCount} vehicle{priceDropCount !== 1 ? "s" : ""} in your garage dropped in price!
            </p>
          </div>
        )}

        {/* Empty state */}
        {favorites.length === 0 ? (
          <div className="text-center py-24">
            <div className="inline-flex p-6 bg-muted rounded-full mb-6">
              <Heart className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Your garage is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Save vehicles you're interested in and we'll track price drops for you.
            </p>
            <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 text-white">
              <Link href="/inventory">
                <Car className="h-5 w-5 mr-2" />
                Browse Inventory
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {favorites.map(vehicle => (
              <GarageVehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                onRemove={removeFavorite}
                onAlert={setAlertVehicle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Alert modal */}
      {alertVehicle && (
        <AlertModal vehicle={alertVehicle} onClose={() => setAlertVehicle(null)} />
      )}
    </div>
  )
}
