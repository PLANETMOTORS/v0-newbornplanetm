import { Suspense } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { VehicleGrid } from "@/components/vehicle-grid"
import { VehicleFilters } from "@/components/vehicle-filters"
import { Spinner } from "@/components/ui/spinner"

export const metadata = {
  title: "Vehicle Inventory | Planet Motors",
  description: "Browse our collection of 9,500+ premium vehicles. Filter by make, model, price, and more.",
}

export default function InventoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Page header */}
          <div className="mb-10">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              Vehicle Inventory
            </h1>
            <p className="mt-3 text-muted-foreground">
              Explore our curated selection of premium vehicles. Each car includes 360° interactive views.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters sidebar */}
            <aside className="lg:w-64 flex-shrink-0">
              <VehicleFilters />
            </aside>

            {/* Vehicle grid */}
            <div className="flex-1">
              <Suspense fallback={
                <div className="flex items-center justify-center py-20">
                  <Spinner className="w-8 h-8" />
                </div>
              }>
                <VehicleGrid />
              </Suspense>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
