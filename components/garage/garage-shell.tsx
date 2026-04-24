"use client"
/**
 * components/garage/garage-shell.tsx — Week 6
 *
 * Client shell for the Garage page.
 * Handles Realtime subscriptions for live deal state updates.
 * Renders: DealTracker, DossierVault, SavedVehicles, EmptyState
 */
import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Star, Car, FileText, Heart, TrendingDown, ChevronRight, Shield, Battery, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import Image from "next/image"

// ── Types ──────────────────────────────────────────────────────────────────

interface User { id: string; email?: string }
interface Customer {
  id: string; first_name?: string; preferred_name?: string; lifecycle: string
  assigned_sales?: { display_name: string; title: string; avatar_url?: string } | null
  assigned_finance?: { display_name: string; title: string; avatar_url?: string } | null
}
interface Deal {
  id: string; stage: string; vin?: string; stage_changed_at: string
  finance_applications?: Array<{ state: string; lender?: string; apr_bps?: number; term_months?: number }>
  deliveries?: Array<{ state: string; scheduled_for?: string; method?: string }>
  deposits?: Array<{ state: string; amount_cents: number }>
}
interface Dossier {
  id: string; vin: string; year?: number; make?: string; model?: string; trim?: string
  current_aviloo_soh_pct?: number; current_aviloo_tested_at?: string; next_aviloo_due_at?: string
  warranty_expires_at?: string
  aviloo_soh_history?: Array<{ tested_at: string; soh_pct: number }>
  dossier_documents?: Array<{ id: string; kind: string; title: string; issued_at: string; customer_acknowledged_at?: string }>
}
interface SavedVehicle {
  id: string; vehicle_id: string; notify_on_price_drop: boolean; last_known_price_cents?: number
  vehicle?: { id: string; title?: string; year?: number; make?: string; model?: string; trim?: string; price_cents?: number; mileage_km?: number; primary_image_url?: string; slug?: string; vin?: string; status?: string }
}

interface GarageShellProps {
  user: User; customer: Customer | null
  activeDeals: Deal[]; ownedDossiers: Dossier[]; savedVehicles: SavedVehicle[]
}

// ── Stage labels ───────────────────────────────────────────────────────────
const STAGE_LABELS: Record<string, { label: string; color: string; description: string }> = {
  inquiry:      { label: "Inquiry Received",    color: "bg-blue-100 text-blue-800",    description: "Our team will reach out within 2 hours." },
  application:  { label: "Application Review",  color: "bg-yellow-100 text-yellow-800", description: "Toni is reviewing your application." },
  approved:     { label: "Approved! 🎉",         color: "bg-green-100 text-green-800",  description: "Financing approved. Deposit to lock your vehicle." },
  deposit_paid: { label: "Deposit Confirmed",   color: "bg-green-100 text-green-800",  description: "Your vehicle is reserved. Contracts coming soon." },
  contracted:   { label: "Contracts Signed",    color: "bg-purple-100 text-purple-800", description: "Awaiting funding from the lender." },
  funded:       { label: "Funded",              color: "bg-purple-100 text-purple-800", description: "Delivery is being scheduled." },
  delivered:    { label: "Delivered 🚗",         color: "bg-emerald-100 text-emerald-800", description: "Enjoy your new vehicle!" },
  closed:       { label: "Complete",            color: "bg-pm-surface-light text-pm-text-primary",    description: "Deal complete. Check your Dossier for documents." },
}

// ── Main Component ─────────────────────────────────────────────────────────
export function GarageShell({ user, customer, activeDeals, ownedDossiers, savedVehicles }: GarageShellProps) {
  const router = useRouter()
  const sb = createClient()
  const [deals, setDeals] = useState<Deal[]>(activeDeals)
  const [liveIndicator, setLiveIndicator] = useState(false)

  const name = customer?.preferred_name ?? customer?.first_name ?? user.email?.split("@")[0] ?? "there"

  // Realtime: subscribe to deal_events for all active deals
  useEffect(() => {
    if (deals.length === 0) return

    const channels = deals.map(deal =>
      sb.channel(`deal-events:${deal.id}`)
        .on("postgres_changes", {
          event: "INSERT",
          schema: "public",
          table: "deal_events",
          filter: `deal_id=eq.${deal.id}`,
        }, () => {
          setLiveIndicator(true)
          setTimeout(() => setLiveIndicator(false), 3000)
          router.refresh()
        })
        .subscribe()
    )

    return () => { channels.forEach(ch => sb.removeChannel(ch)) }
  }, [deals.length, sb, router])

  const priceDropCount = savedVehicles.filter(sv =>
    sv.last_known_price_cents && sv.vehicle?.price_cents &&
    sv.vehicle.price_cents < sv.last_known_price_cents
  ).length

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
                <h1 className="text-2xl font-bold text-foreground">
                  Hey {name} 👋
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  Your Garage
                  {liveIndicator && (
                    <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Live update
                    </span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {customer?.assigned_sales && (
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">{customer.assigned_sales.display_name}</p>
                  <p>{customer.assigned_sales.title}</p>
                </div>
              )}
              <Button asChild variant="outline" size="sm">
                <Link href="/inventory">Browse Inventory <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* Price drop banner */}
        {priceDropCount > 0 && (
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl px-4 py-3">
            <TrendingDown className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              🎉 {priceDropCount} saved vehicle{priceDropCount !== 1 ? "s" : ""} dropped in price!
            </p>
          </div>
        )}

        {/* Active Deals */}
        {deals.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Car className="h-5 w-5" /> Active Deals
            </h2>
            <div className="grid gap-4">
              {deals.map(deal => {
                const stageInfo = STAGE_LABELS[deal.stage] ?? { label: deal.stage, color: "bg-pm-surface-light text-pm-text-primary", description: "" }
                const finance = deal.finance_applications?.[0]
                const delivery = deal.deliveries?.[0]
                const deposit = deal.deposits?.[0]
                return (
                  <Card key={deal.id} className="border-border/60">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{deal.vin ?? "Vehicle TBD"}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${stageInfo.color}`}>
                            {stageInfo.label}
                          </span>
                          <p className="text-sm text-muted-foreground mt-2">{stageInfo.description}</p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground space-y-1">
                          {deposit && <p>Deposit: {deposit.state === "succeeded" ? "✅ Paid" : deposit.state}</p>}
                          {finance && <p>Finance: {finance.state.replace(/_/g, " ")}</p>}
                          {delivery?.scheduled_for && (
                            <p>Delivery: {new Date(delivery.scheduled_for).toLocaleDateString("en-CA")}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Vehicle Dossiers */}
        {ownedDossiers.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" /> My Vehicle Dossiers
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {ownedDossiers.map(dossier => {
                const sohTrend = dossier.aviloo_soh_history?.sort((a, b) =>
                  new Date(b.tested_at).getTime() - new Date(a.tested_at).getTime()
                )
                const latestSoh = sohTrend?.[0]
                const prevSoh = sohTrend?.[1]
                const sohDelta = latestSoh && prevSoh ? latestSoh.soh_pct - prevSoh.soh_pct : null
                const unacknowledgedDocs = dossier.dossier_documents?.filter(d => !d.customer_acknowledged_at).length ?? 0
                const nextDue = dossier.next_aviloo_due_at ? new Date(dossier.next_aviloo_due_at) : null
                const dueOverdue = nextDue && nextDue < new Date()

                return (
                  <Card key={dossier.id} className="border-border/60">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">
                        {dossier.year} {dossier.make} {dossier.model}
                        {dossier.trim && <span className="font-normal text-muted-foreground"> {dossier.trim}</span>}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">{dossier.vin}</p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {/* SOH */}
                      {latestSoh && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Battery className="h-4 w-4 text-emerald-500" />
                            <span>Battery Health</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{latestSoh.soh_pct}%</span>
                            {sohDelta !== null && (
                              <span className={`text-xs ${sohDelta >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                                {sohDelta >= 0 ? "+" : ""}{sohDelta.toFixed(1)}%
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Next Aviloo due */}
                      {nextDue && (
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Next SOH test</span>
                          </div>
                          <span className={dueOverdue ? "text-red-500 font-medium" : "text-muted-foreground"}>
                            {dueOverdue ? "Overdue — " : ""}{nextDue.toLocaleDateString("en-CA")}
                          </span>
                        </div>
                      )}

                      {/* Documents */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Shield className="h-3.5 w-3.5" />
                          <span>{dossier.dossier_documents?.length ?? 0} documents</span>
                        </div>
                        {unacknowledgedDocs > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {unacknowledgedDocs} new
                          </Badge>
                        )}
                      </div>

                      <Button variant="outline" size="sm" className="w-full mt-2" asChild>
                        <Link href={`/garage/dossier/${dossier.vin}`}>View Dossier</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Saved Vehicles */}
        {savedVehicles.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
              <Heart className="h-5 w-5" /> Saved Vehicles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {savedVehicles.map(sv => {
                const v = sv.vehicle
                if (!v) return null
                const priceDrop = sv.last_known_price_cents && v.price_cents && v.price_cents < sv.last_known_price_cents
                const dropAmount = priceDrop ? sv.last_known_price_cents! - v.price_cents! : 0
                const isSold = v.status === "sold"
                return (
                  <Card key={sv.id} className={`overflow-hidden border-border/60 ${isSold ? "opacity-60" : ""}`}>
                    <div className="relative aspect-[16/9] bg-muted">
                      {v.primary_image_url ? (
                        <Image src={v.primary_image_url} alt={v.title ?? ""} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Car className="h-10 w-10 text-muted-foreground/30" />
                        </div>
                      )}
                      {priceDrop && (
                        <div className="absolute top-2 left-2">
                          <span className="flex items-center gap-1 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            <TrendingDown className="h-3 w-3" />
                            ${(dropAmount / 100).toLocaleString("en-CA")} off
                          </span>
                        </div>
                      )}
                      {isSold && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <span className="text-white font-bold text-sm bg-red-600 px-3 py-1 rounded-full">SOLD</span>
                        </div>
                      )}
                    </div>
                    <CardContent className="p-3">
                      <p className="font-semibold text-sm text-foreground leading-tight">
                        {v.year} {v.make} {v.model}
                      </p>
                      {v.price_cents && (
                        <p className="text-base font-bold mt-1">
                          ${(v.price_cents / 100).toLocaleString("en-CA")}
                        </p>
                      )}
                      {!isSold && v.slug && (
                        <Button asChild size="sm" variant="outline" className="w-full mt-2 text-xs">
                          <Link href={`/vehicles/${v.slug}`}>View Details</Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {deals.length === 0 && ownedDossiers.length === 0 && savedVehicles.length === 0 && (
          <div className="text-center py-24">
            <div className="inline-flex p-6 bg-muted rounded-full mb-6">
              <Star className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Your Garage is empty</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              Browse our inventory to save vehicles, or contact us to start a deal.
            </p>
            <Button asChild size="lg" className="bg-slate-900 hover:bg-slate-800 text-white">
              <Link href="/inventory"><Car className="h-5 w-5 mr-2" />Browse Inventory</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
