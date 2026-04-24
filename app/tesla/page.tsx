import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RATE_FLOOR_DISPLAY } from "@/lib/rates"
import {
  Battery,
  Zap,
  ArrowRight,
  CheckCircle,
  Car
} from "lucide-react"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"

export const metadata: Metadata = {
  title: "Used Tesla Canada | Model 3, Model Y, Model S, Model X | Planet Motors",
  description: "Shop certified pre-owned Tesla vehicles in Canada. Model 3, Model Y, Model S & Model X with battery health reports. 210-point inspection, financing available. 4.8 Star Rating.",
  keywords: "used Tesla Canada, Tesla Model Y Canada, Tesla Model 3 used, Tesla Model S used, Tesla Model X used, buy Tesla Canada, Tesla dealership Toronto",
  alternates: {
    canonical: "/tesla",
  },
  openGraph: {
    title: "Used Tesla Canada | Planet Motors",
    description: "Certified pre-owned Tesla with battery health reports. Model 3, Y, S, X available.",
    url: "https://www.planetmotors.ca/tesla",
    type: "website",
  },
}

const teslaModels = [
  {
    name: "Model 3",
    tagline: "Best-Selling Electric Sedan",
    range: "438 km",
    acceleration: "3.1s 0-100",
    startingPrice: "$35,990",
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=500&fit=crop",
    count: 18,
    href: "/inventory?fuelType=Electric&make=Tesla&model=Model+3"
  },
  {
    name: "Model Y",
    tagline: "Versatile Electric SUV",
    range: "455 km",
    acceleration: "3.5s 0-100",
    startingPrice: "$42,990",
    image: "https://images.unsplash.com/photo-1619317429403-2a3d8eb9dfe1?w=800&h=500&fit=crop",
    count: 22,
    href: "/inventory?fuelType=Electric&make=Tesla&model=Model+Y"
  },
  {
    name: "Model S",
    tagline: "Premium Electric Sedan",
    range: "652 km",
    acceleration: "2.1s 0-100",
    startingPrice: "$78,990",
    image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800&h=500&fit=crop",
    count: 5,
    href: "/inventory?fuelType=Electric&make=Tesla&model=Model+S"
  },
  {
    name: "Model X",
    tagline: "Full-Size Electric SUV",
    range: "576 km",
    acceleration: "2.6s 0-100",
    startingPrice: "$89,990",
    image: "https://images.unsplash.com/photo-1566473965997-3de9c817e938?w=800&h=500&fit=crop",
    count: 3,
    href: "/inventory?fuelType=Electric&make=Tesla&model=Model+X"
  },
]

const whyBuyTesla = [
  { title: "Battery Health Certified", description: "Every Tesla comes with a detailed battery analysis showing capacity and degradation" },
  { title: "210-Point Inspection", description: "Comprehensive inspection covering all Tesla-specific components and systems" },
  { title: "Supercharger Ready", description: "All our Teslas are ready to use the Supercharger network across Canada" },
  { title: "Software Updated", description: "We ensure all Teslas have the latest software updates installed" },
  { title: "10-Day Guarantee", description: "Not happy? Return within 10 days for a full refund" },
  { title: "Financing Available", description: `Competitive rates starting at ${RATE_FLOOR_DISPLAY} OAC` },
]

export default function TeslaPage() {
  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Tesla", url: "/tesla" }]} />
      <Header />

      <main id="main-content" role="main" aria-label="Tesla vehicles">
        {/* Hero Section */}
        <section className="relative bg-black text-white py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="bg-red-600 text-white border-red-500 mb-4">
                  <Zap className="w-3 h-3 mr-1" />
                  Tesla Specialist
                </Badge>
                <h1 className="text-4xl lg:text-5xl font-bold tracking-[-0.01em] lg:tracking-[-0.02em] mb-6">
                  Used Tesla Vehicles in Canada
                </h1>
                <p className="text-xl text-pm-text-muted mb-8 leading-relaxed">
                  Shop certified pre-owned Tesla Model 3, Model Y, Model S & Model X. 
                  Every Tesla includes a battery health report and our comprehensive 210-point inspection.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700" asChild>
                    <Link href="/inventory?fuelType=Electric&make=Tesla">
                      Browse All Teslas
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                    <Link href="/aviloo">
                      Battery Health Info
                    </Link>
                  </Button>
                </div>
                

              </div>
              <div className="relative aspect-video lg:aspect-square">
                <Image
                  src="https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&h=600&fit=crop"
                  alt="Used Tesla Model 3"
                  fill
                  className="object-cover rounded-lg"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* Tesla Models */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-2">Shop by Tesla Model</h2>
            <p className="text-muted-foreground mb-8">Certified pre-owned with battery health reports</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              {teslaModels.map((model) => (
                <Link key={model.name} href={model.href} className="group">
                  <Card className="overflow-hidden hover:shadow-xl transition-all">
                    <div className="grid md:grid-cols-2">
                      <div className="relative aspect-video md:aspect-square">
                        <Image
                          src={model.image}
                          alt={`Used Tesla ${model.name}`}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="(max-width: 768px) 100vw, 25vw"
                        />
                        <Badge className="absolute top-3 left-3 bg-red-600">
                          {model.count} Available
                        </Badge>
                      </div>
                      <CardContent className="p-6 flex flex-col justify-center">
                        <h3 className="text-2xl font-bold mb-1">Tesla {model.name}</h3>
                        <p className="text-muted-foreground mb-4">{model.tagline}</p>
                        
                        <div className="space-y-2 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Battery className="w-4 h-4 text-green-600" />
                            <span>{model.range} range</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Zap className="w-4 h-4 text-yellow-600" />
                            <span>{model.acceleration}</span>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-red-600">From {model.startingPrice}</span>
                          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Buy Tesla from Planet Motors */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-2 text-center">Why Buy a Used Tesla from Planet Motors?</h2>
            <p className="text-muted-foreground mb-12 text-center max-w-2xl mx-auto">
              We specialize in certified pre-owned Tesla vehicles with comprehensive inspections and battery health guarantees.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {whyBuyTesla.map((item) => (
                <Card key={item.title} className="p-6">
                  <CheckCircle className="w-8 h-8 text-red-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tesla Financing */}
        <section className="py-16 bg-black text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Tesla Financing Available</h2>
            <p className="text-pm-text-muted mb-8 max-w-2xl mx-auto">
              Get approved for Tesla financing in minutes. Rates starting at {RATE_FLOOR_DISPLAY} OAC.
              We work with all credit situations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" className="bg-red-600 hover:bg-red-700" asChild>
                <Link href="/financing">
                  Get Pre-Approved
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                <Link href="/inventory?fuelType=Electric&make=Tesla">
                  <Car className="mr-2 h-5 w-5" />
                  Browse Teslas
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
