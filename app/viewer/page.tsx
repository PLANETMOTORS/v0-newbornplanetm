import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Vehicle360ViewerDemo } from "@/components/vehicle-360-viewer-demo"

export const metadata = {
  title: "360° Vehicle Viewer | Planet Motors",
  description: "Experience our interactive 360-degree vehicle viewer. Explore every angle of premium vehicles with AVIF-optimized images.",
}

export default function ViewerPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Page header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="font-serif text-3xl md:text-4xl font-semibold">
              360° Vehicle Viewer
            </h1>
            <p className="mt-4 text-muted-foreground">
              Experience our interactive vehicle viewer. Drag to rotate, zoom for details, and explore every angle before visiting the showroom.
            </p>
          </div>

          {/* Demo viewer */}
          <div className="max-w-4xl mx-auto">
            <Vehicle360ViewerDemo />
          </div>

          {/* Features */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">AVIF Optimized</h3>
              <p className="text-sm text-muted-foreground">
                Lightning-fast loading with next-gen AVIF image format. 50% smaller files, same quality.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">Interactive Controls</h3>
              <p className="text-sm text-muted-foreground">
                Drag to rotate, pinch to zoom, and tap for fullscreen. Works on any device.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="font-semibold mb-2">36 Frame Coverage</h3>
              <p className="text-sm text-muted-foreground">
                Each vehicle captured from 36 angles for a complete 360-degree view experience.
              </p>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-16 text-center">
            <Button size="lg" asChild>
              <Link href="/inventory">
                Browse All Vehicles
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
