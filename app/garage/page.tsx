// Server Component (Next.js App Router — no directive needed)
/**
 * app/garage/page.tsx — Week 6 upgrade
 * Server Component: fetches customer, active deals, dossiers, saved vehicles
 * Client shell handles Realtime subscriptions for live deal state updates
 */
import { redirect } from "next/navigation"
import { getAuthUser, getCustomer, getActiveDeals, getOwnedVehicleDossiers, createClient } from "@/lib/supabase/server"
import { GarageShell } from "@/components/garage/garage-shell"

export const dynamic = "force-dynamic"

export default async function GaragePage() {
  const user = await getAuthUser()
  if (!user) redirect("/sign-in?return_to=/garage")

  const [customer, activeDeals, ownedDossiers] = await Promise.all([
    getCustomer(),
    getActiveDeals(),
    getOwnedVehicleDossiers(),
  ])

  // Saved vehicles (from saved_vehicles table — server-side, auth-gated)
  const sb = await createClient()
  const { data: savedVehicles } = await sb
    .from("saved_vehicles")
    .select("*, vehicle:vehicles(id, title, year, make, model, trim, price_cents, mileage_km, primary_image_url, slug, vin, status)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <GarageShell
      user={user}
      customer={customer}
      activeDeals={activeDeals ?? []}
      ownedDossiers={ownedDossiers ?? []}
      savedVehicles={savedVehicles ?? []}
    />
  )
}
