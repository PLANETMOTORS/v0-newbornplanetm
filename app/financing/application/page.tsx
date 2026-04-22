import { Metadata } from "next"
import Link from "next/link"
import { Shield, Clock, CheckCircle, ArrowLeft, Home } from "lucide-react"
import { FinanceApplicationFullForm } from "@/components/finance-application-full-form"
import { createClient } from "@/lib/supabase/server"
import { safeNum } from "@/lib/pricing/format"

export const metadata: Metadata = {
  title: "Finance Application | Planet Motors",
  description: "Complete your finance application for vehicle financing at Planet Motors. Get approved in minutes.",
}

async function getVehicleData(vehicleId: string | undefined) {
  if (!vehicleId) {
    return null
  }
  
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("vehicles")
      .select("id, year, make, model, trim, price, vin, mileage, exterior_color")
      .eq("id", vehicleId)
      .single()
    
    if (data) {
      return {
        id: data.id,
        year: data.year,
        make: data.make,
        model: data.model,
        trim: data.trim || "",
        price: safeNum(data.price) / 100, // Convert from cents
        vin: data.vin || "",
        mileage: data.mileage || 0,
        color: data.exterior_color || "",
      }
    }
  } catch (error) {
    console.error("Error fetching vehicle:", error)
  }
  return null
}

export default async function FinanceApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicleId?: string; tradeIn?: string; tradeInVehicle?: string; quoteId?: string }>
}) {
  const params = await searchParams
  const vehicleData = await getVehicleData(params.vehicleId)
  
  // Parse trade-in data from URL params
  const tradeInData = params.tradeIn ? {
    value: parseInt(params.tradeIn) || 0,
    vehicle: params.tradeInVehicle ? decodeURIComponent(params.tradeInVehicle) : undefined,
    quoteId: params.quoteId
  } : undefined
  
  return (
    <div className="min-h-screen bg-muted/30">
      {/* Navigation bar */}
      <div className="bg-background border-b sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Home className="w-4 h-4" />
            <span className="hidden sm:inline">Planet Motors</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/financing" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Financing
            </Link>
            <Link href="/inventory" className="text-sm text-primary hover:underline">
              Browse Inventory
            </Link>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Home className="w-4 h-4" />
              Home
            </Link>
            <span className="text-muted-foreground">/</span>
            <Link href="/financing" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Financing
            </Link>
          </div>
          <h1 className="text-3xl font-bold tracking-[-0.01em]">Finance Application</h1>
          <p className="text-muted-foreground mt-2">
            Complete your application below. All fields marked with * are required.
          </p>
          
          {/* Trust Badges */}
          <div className="flex flex-wrap gap-6 mt-6">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-5 h-5 text-primary" />
              <span>Secure & Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-5 h-5 text-primary" />
              <span>Decisions in 24 Hours</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle className="w-5 h-5 text-primary" />
              <span>No Credit Impact for Pre-Approval</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Form Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FinanceApplicationFullForm vehicleId={params.vehicleId} vehicleData={vehicleData || undefined} tradeInData={tradeInData} />
      </div>
    </div>
  )
}
