"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  Car, Shield, Truck, Star, CheckCircle,
  ArrowRight, Phone, Battery
} from "lucide-react"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"

// City data for SEO
const cityData: Record<string, {
  name: string
  region: string
  distance: number
  population: string
  description: string
}> = {
  "toronto": {
    name: "Toronto",
    region: "Ontario",
    distance: 25,
    population: "2.9M",
    description: "the largest city in Canada"
  },
  "richmond-hill": {
    name: "Richmond Hill",
    region: "Ontario",
    distance: 0,
    population: "202K",
    description: "our home city in the GTA"
  },
  "markham": {
    name: "Markham",
    region: "Ontario",
    distance: 10,
    population: "338K",
    description: "one of the most diverse cities in Canada"
  },
  "vaughan": {
    name: "Vaughan",
    region: "Ontario",
    distance: 15,
    population: "323K",
    description: "a rapidly growing city in York Region"
  },
  "mississauga": {
    name: "Mississauga",
    region: "Ontario",
    distance: 40,
    population: "717K",
    description: "the sixth-largest city in Canada"
  },
  "brampton": {
    name: "Brampton",
    region: "Ontario",
    distance: 35,
    population: "656K",
    description: "known as the Flower City"
  },
  "scarborough": {
    name: "Scarborough",
    region: "Ontario",
    distance: 30,
    population: "632K",
    description: "a bustling, diverse hub in the heart of Toronto"
  },
  "north-york": {
    name: "North York",
    region: "Ontario",
    distance: 20,
    population: "672K",
    description: "a major business and residential area"
  },
  "oakville": {
    name: "Oakville",
    region: "Ontario",
    distance: 55,
    population: "213K",
    description: "an affluent town on Lake Ontario"
  },
  "hamilton": {
    name: "Hamilton",
    region: "Ontario",
    distance: 75,
    population: "569K",
    description: "a port city on Hamilton Harbour"
  },
  "ottawa": {
    name: "Ottawa",
    region: "Ontario",
    distance: 450,
    population: "1M",
    description: "Canada&apos;s capital city"
  },
  "montreal": {
    name: "Montreal",
    region: "Quebec",
    distance: 540,
    population: "1.8M",
    description: "the cultural capital of Canada"
  },
  "vancouver": {
    name: "Vancouver",
    region: "British Columbia",
    distance: 4400,
    population: "2.5M",
    description: "a coastal seaport city"
  },
  "calgary": {
    name: "Calgary",
    region: "Alberta",
    distance: 3400,
    population: "1.3M",
    description: "Alberta&apos;s largest city"
  },
  "edmonton": {
    name: "Edmonton",
    region: "Alberta",
    distance: 3500,
    population: "1M",
    description: "the capital of Alberta"
  },
}

// Featured vehicles (would come from CMS/database)
const featuredVehicles = [
  {
    id: "2024-tesla-model-y",
    year: 2024,
    make: "Tesla",
    model: "Model Y",
    price: 64990,
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400",
    badge: "Popular",
  },
  {
    id: "2024-bmw-m4",
    year: 2024,
    make: "BMW",
    model: "M4",
    price: 89900,
    image: "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?w=400",
    badge: "Luxury",
  },
  {
    id: "2024-honda-crv",
    year: 2024,
    make: "Honda",
    model: "CR-V",
    price: 42990,
    image: "https://images.unsplash.com/photo-1568844293986-8c8e6f1a5f04?w=400",
    badge: "Best Value",
  },
]

export default function CityLandingPage() {
  const params = useParams()
  const citySlug = params.city as string
  const city = cityData[citySlug] || {
    name: citySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    region: "Ontario",
    distance: 50,
    population: "100K+",
    description: "a city in Canada"
  }

  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Used Cars", url: "/used-cars" }, { name: city.name, url: `/used-cars/${citySlug}` }]} />
      <Header />

      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="relative bg-linear-to-br from-primary/10 via-background to-background py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl">
              <Badge className="mb-4 bg-green-100 text-green-800">
                <Truck className="w-3 h-3 mr-1" />
                {city.distance === 0 ? "Visit Our Showroom" : `Free Delivery to ${city.name}`}
              </Badge>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-[-0.01em] md:tracking-[-0.02em] mb-6">
                Used Cars for Sale in{" "}
                <span className="text-primary">{city.name}</span>
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
                Browse our certified pre-owned vehicles available for delivery to {city.name}, {city.region}. 
                Planet Motors offers {city.distance === 0 ? "in-person viewing at our showroom" : `free delivery within 300km and affordable shipping to ${city.name}`}.
              </p>
              
              <div className="flex flex-wrap gap-4">
                <Link href="/inventory">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Browse All Vehicles
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/financing">
                  <Button size="lg" variant="outline">
                    Get Pre-Approved
                  </Button>
                </Link>
              </div>
              
              {/* Trust badges */}
              <div className="flex flex-wrap gap-6 mt-8 pt-8 border-t border-border">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  <span className="text-sm">210-Point Inspection</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">10-Day Money Back</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  <span className="text-sm">4.8 Star Rating</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Vehicles */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-2">
              Popular Vehicles in {city.name}
            </h2>
            <p className="text-muted-foreground mb-8">
              These are the most viewed vehicles by buyers in {city.name} and {city.region}
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              {featuredVehicles.map(vehicle => (
                <Link key={vehicle.id} href={`/vehicles/${vehicle.id}`}>
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-4/3">
                      <Image
                        src={vehicle.image}
                        alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <Badge className="absolute top-3 left-3 bg-primary">
                        {vehicle.badge}
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg">
                        {vehicle.year} {vehicle.make} {vehicle.model}
                      </h3>
                      <p className="text-2xl font-bold text-primary">
                        ${vehicle.price.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Free delivery to {city.name}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            
            <div className="text-center mt-8">
              <Link href="/inventory">
                <Button size="lg">
                  View All Vehicles
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Why Choose Planet Motors */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-2 text-center">
              Why {city.name} Residents Choose Planet Motors
            </h2>
            <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
              Join thousands of satisfied customers from {city.name} and {city.region} who trust Planet Motors for their vehicle purchase
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">PM Certified</h3>
                <p className="text-sm text-muted-foreground">
                  Every vehicle passes our rigorous 210-point inspection
                </p>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Truck className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-semibold mb-2">
                  {city.distance <= 300 ? "Free Delivery" : "Affordable Shipping"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {city.distance <= 300 
                    ? `Free delivery to ${city.name} (${city.distance}km away)`
                    : `Competitive shipping rates to ${city.name}`
                  }
                </p>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Battery className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold mb-2">EV Battery Reports</h3>
                <p className="text-sm text-muted-foreground">
                  Transparent battery health reports for all electric vehicles
                </p>
              </Card>
              
              <Card className="p-6 text-center">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <h3 className="font-semibold mb-2">5-Star Service</h3>
                <p className="text-sm text-muted-foreground">
                  4.8 Star Rating from 500+ verified customer reviews
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Local SEO Content */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">
                Buying a Used Car in {city.name}
              </h2>
              
              <div className="prose prose-lg max-w-none">
                <p>
                  {city.name} is {city.description} with a population of {city.population}. 
                  Finding a reliable used car in {city.name} has never been easier thanks to Planet Motors&apos; 
                  online car buying experience and {city.distance <= 300 ? "free home delivery" : "nationwide delivery"}.
                </p>
                
                <h3>Why Buy Online from Planet Motors?</h3>
                <ul>
                  <li>Browse our certified pre-owned vehicles from your home in {city.name}</li>
                  <li>Every vehicle includes a free CARFAX report and 210-point inspection</li>
                  <li>10-day money-back guarantee - no questions asked</li>
                  <li>Competitive financing from multiple lenders, all credit types welcome</li>
                  <li>{city.distance <= 300 ? `Free delivery to ${city.name}` : `Affordable shipping to ${city.name}, ${city.region}`}</li>
                </ul>
                
                <h3>Electric Vehicles in {city.name}</h3>
                <p>
                  With rising fuel costs and environmental awareness, more {city.name} residents are switching 
                  to electric vehicles. Planet Motors offers a wide selection of certified pre-owned EVs
                  in Canada, including Tesla, Porsche Taycan, BMW i4, and more. Every EV includes a detailed 
                  battery health report so you know exactly what you&apos;re buying.
                </p>
                
                <h3>Financing Options for {city.name} Buyers</h3>
                <p>
                  Planet Motors works with multiple lenders to offer competitive financing rates for {city.name} 
                  residents. Whether you have excellent credit, are rebuilding your credit, or are a first-time 
                  buyer, we can help you get approved. Get pre-approved in minutes with no impact on your credit score.
                </p>
              </div>
              
              <div className="mt-8 p-6 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="shrink-0">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">Questions about buying in {city.name}?</p>
                    <p className="text-muted-foreground">
                      Call us toll-free at <a href={`tel:${PHONE_TOLL_FREE_TEL}`} className="text-primary font-semibold">{PHONE_TOLL_FREE}</a> or{" "}
                      <Link href="/contact" className="text-primary font-semibold">chat with us online</Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Browse Used EVs Available in {city.name}
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Every EV is Aviloo battery-health certified and 210-point inspected. Delivered to {city.name} with a 10-day money-back guarantee.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/inventory">
                <Button size="lg" variant="secondary">
                  <Car className="w-4 h-4 mr-2" />
                  Browse Inventory
                </Button>
              </Link>
              <Link href="/financing">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary">
                  Get Pre-Approved
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  )
}
