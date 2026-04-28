/**
 * Anna's inventory search — queries real Supabase vehicles for live answers.
 *
 * Anna calls these helpers so she can say "We have 3 Tesla Model 3s starting
 * at $29,900" instead of just linking to the inventory page.
 */

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""

function getAdminClient() {
  return createClient(supabaseUrl, supabaseServiceKey)
}

export interface VehicleSummary {
  id: string
  stock_number: string
  year: number
  make: string
  model: string
  trim: string | null
  price: number
  mileage: number
  exterior_color: string | null
  fuel_type: string | null
  drivetrain: string | null
  status: string
  is_ev: boolean
  primary_image_url: string | null
}

/**
 * Search inventory by make, model, body style, price range, or EV status.
 * Returns up to 5 matching vehicles for Anna to reference in conversation.
 */
export async function searchInventory(params: {
  make?: string
  model?: string
  bodyStyle?: string
  maxPrice?: number
  minPrice?: number
  isEv?: boolean
  fuelType?: string
  year?: number
  limit?: number
}): Promise<{ vehicles: VehicleSummary[]; totalCount: number }> {
  const client = getAdminClient()
  const limit = params.limit || 5

  let query = client
    .from("vehicles")
    .select("id, stock_number, year, make, model, trim, price, mileage, exterior_color, fuel_type, drivetrain, status, is_ev, primary_image_url", { count: "exact" })
    .in("status", ["available", "active"])
    .order("price", { ascending: true })
    .limit(limit)

  if (params.make) query = query.ilike("make", `%${params.make}%`)
  if (params.model) query = query.ilike("model", `%${params.model}%`)
  if (params.bodyStyle) query = query.ilike("body_style", `%${params.bodyStyle}%`)
  if (params.maxPrice) query = query.lte("price", params.maxPrice)
  if (params.minPrice) query = query.gte("price", params.minPrice)
  if (params.isEv !== undefined) query = query.eq("is_ev", params.isEv)
  if (params.fuelType) query = query.ilike("fuel_type", `%${params.fuelType}%`)
  if (params.year) query = query.eq("year", params.year)

  const { data, count } = await query

  return {
    vehicles: (data as VehicleSummary[]) || [],
    totalCount: count || 0,
  }
}

/**
 * Get inventory summary stats for Anna's general knowledge.
 */
export async function getInventoryStats(): Promise<{
  total: number
  available: number
  evCount: number
  priceRange: { min: number; max: number }
  topMakes: { make: string; count: number }[]
}> {
  const client = getAdminClient()

  const [totalResult, availableResult, evResult, vehiclesResult] = await Promise.all([
    client.from("vehicles").select("id", { count: "exact", head: true }),
    client.from("vehicles").select("id", { count: "exact", head: true }).in("status", ["available", "active"]),
    client.from("vehicles").select("id", { count: "exact", head: true }).eq("is_ev", true).in("status", ["available", "active"]),
    client.from("vehicles").select("make, price").in("status", ["available", "active"]),
  ])

  const vehicles = vehiclesResult.data || []
  const prices = vehicles.map(v => v.price).filter(Boolean).sort((a, b) => a - b)

  // Count by make
  const makeCounts: Record<string, number> = {}
  for (const v of vehicles) {
    makeCounts[v.make] = (makeCounts[v.make] || 0) + 1
  }
  const topMakes = Object.entries(makeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([make, count]) => ({ make, count }))

  return {
    total: totalResult.count || 0,
    available: availableResult.count || 0,
    evCount: evResult.count || 0,
    priceRange: {
      min: prices[0] || 0,
      max: prices[prices.length - 1] || 0,
    },
    topMakes,
  }
}

export function makeAndCount(m: { make: string; count: number }): string {
  return `${m.make} (${m.count})`
}

/**
 * Build a natural language inventory snippet for Anna's system prompt.
 */
export async function buildInventoryContext(): Promise<string> {
  try {
    const stats = await getInventoryStats()
    const lines = [
      `LIVE INVENTORY (real-time from database):`,
      `- ${stats.available} vehicles available out of ${stats.total} total`,
      `- ${stats.evCount} electric vehicles`,
      `- Price range: $${stats.priceRange.min.toLocaleString()} — $${stats.priceRange.max.toLocaleString()}`,
      `- Top makes: ${stats.topMakes.map(m => makeAndCount(m)).join(", ")}`,
      ``,
      `You can search inventory for customers. When they ask about specific vehicles,`,
      `use the search results to give real answers with actual stock numbers and prices.`,
      `Always link to: planetmotors.ca/inventory for the full browsing experience.`,
    ]
    return lines.join("\n")
  } catch {
    return "Inventory data temporarily unavailable. Direct customers to planetmotors.ca/inventory."
  }
}

/**
 * Format search results as a natural language snippet for Anna.
 */
export function formatVehiclesForAnna(vehicles: VehicleSummary[], totalCount: number): string {
  if (vehicles.length === 0) {
    return "No matching vehicles found in current inventory."
  }

  const lines = [`Found ${totalCount} matching vehicle${totalCount === 1 ? "" : "s"}:`]
  for (const v of vehicles) {
    const price = `$${v.price.toLocaleString()}`
    const km = `${v.mileage.toLocaleString()} km`
    const color = v.exterior_color ? ` — ${v.exterior_color}` : ""
    const ev = v.is_ev ? " (Electric)" : ""
    const trimSuffix = v.trim ? ` ${v.trim}` : ""
    lines.push(`• ${v.year} ${v.make} ${v.model}${trimSuffix}${color}${ev} — ${price}, ${km} (Stock #${v.stock_number})`)
  }
  if (totalCount > vehicles.length) {
    lines.push(`...and ${totalCount - vehicles.length} more. See all at planetmotors.ca/inventory`)
  }
  return lines.join("\n")
}
