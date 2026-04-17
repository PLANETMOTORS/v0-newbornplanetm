import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

import { 
  Star, Shield, Fuel, Users, Package,
  ChevronRight, Check, Calculator, Car, MapPin,
  Phone, Clock, Award, Zap, Snowflake
} from "lucide-react"

// Dynamic metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ make: string; model: string }> }): Promise<Metadata> {
  const { make, model } = await params
  const makeFormatted = make.charAt(0).toUpperCase() + make.slice(1)
  const modelFormatted = model.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const currentYear = 2026
  
  return {
    title: `${currentYear} ${makeFormatted} ${modelFormatted} for Sale in Richmond Hill, ON | Planet Motors`,
    description: `Browse our selection of certified pre-owned ${makeFormatted} ${modelFormatted} vehicles in Richmond Hill, Ontario. 210-point inspection, 10-day money-back guarantee, and financing available. Visit Planet Motors today!`,
    keywords: [
      `${makeFormatted} ${modelFormatted} for sale`,
      `used ${makeFormatted} ${modelFormatted} Ontario`,
      `${makeFormatted} ${modelFormatted} Richmond Hill`,
      `certified pre-owned ${makeFormatted}`,
      `${makeFormatted} dealer Toronto`,
      `${modelFormatted} financing Ontario`
    ],
    openGraph: {
      title: `${currentYear} ${makeFormatted} ${modelFormatted} for Sale | Planet Motors Richmond Hill`,
      description: `Find your perfect ${makeFormatted} ${modelFormatted} at Planet Motors. PM Certified with 210-point inspection. Serving Richmond Hill, Toronto & the GTA.`,
      type: 'website',
    }
  }
}

// Model-specific data (would come from database in production)
const modelData: Record<string, Record<string, {
  tagline: string
  description: string
  startingPrice: number
  mpg: { city: number; highway: number }
  seating: number
  cargo: number
  safetyRating: number
  features: string[]
  competitors: { name: string; price: number; mpg: number; safety: number }[]
  faqs: { question: string; answer: string }[]
  winterReady: boolean
  hybrid: boolean
}>> = {
  toyota: {
    'rav4': {
      tagline: "Canada&apos;s Best-Selling SUV - Now Available at Planet Motors",
      description: "Experience the perfect blend of versatility and efficiency with the Toyota RAV4. Built for Canadian winters and Ontario roads, the RAV4 delivers exceptional fuel economy, spacious interior, and Toyota&apos;s legendary reliability.",
      startingPrice: 32990,
      mpg: { city: 8.4, highway: 6.8 },
      seating: 5,
      cargo: 1059,
      safetyRating: 5,
      features: ["All-Wheel Drive", "Toyota Safety Sense 3.0", "Apple CarPlay & Android Auto", "Heated Seats", "Adaptive Cruise Control"],
      competitors: [
        { name: "Honda CR-V", price: 34990, mpg: 7.8, safety: 5 },
        { name: "Mazda CX-5", price: 33490, mpg: 8.1, safety: 5 }
      ],
      faqs: [
        { question: "What is the towing capacity of a Toyota RAV4?", answer: "The Toyota RAV4 has a towing capacity of up to 1,500 kg (3,500 lbs) when properly equipped, making it suitable for small trailers, boats, and recreational equipment for Ontario cottage trips." },
        { question: "Is the Toyota RAV4 good for Ontario winters?", answer: "Yes! The RAV4&apos;s available All-Wheel Drive system, combined with excellent ground clearance and Toyota&apos;s stability control, makes it an excellent choice for navigating snowy Ontario roads and harsh Canadian winters." },
        { question: "What is the fuel economy of the RAV4?", answer: "The Toyota RAV4 achieves approximately 8.4 L/100km in city driving and 6.8 L/100km on the highway. The RAV4 Hybrid model offers even better efficiency at 5.8 L/100km combined." }
      ],
      winterReady: true,
      hybrid: true
    },
    'camry': {
      tagline: "The Benchmark Sedan - Reliability Meets Refinement",
      description: "The Toyota Camry sets the standard for mid-size sedans with its perfect balance of comfort, efficiency, and reliability. Available in hybrid configuration for maximum fuel savings on your Ontario commute.",
      startingPrice: 29990,
      mpg: { city: 8.1, highway: 5.6 },
      seating: 5,
      cargo: 428,
      safetyRating: 5,
      features: ["Toyota Safety Sense 3.0", "10.5-inch Display", "Wireless Charging", "JBL Premium Audio", "Dynamic Radar Cruise"],
      competitors: [
        { name: "Honda Accord", price: 31990, mpg: 7.5, safety: 5 },
        { name: "Hyundai Sonata", price: 28990, mpg: 7.8, safety: 5 }
      ],
      faqs: [
        { question: "Is the Toyota Camry available in hybrid?", answer: "Yes! The Camry Hybrid offers exceptional fuel economy of just 4.8 L/100km combined, making it one of the most fuel-efficient sedans available in Ontario." },
        { question: "What safety features come standard on the Camry?", answer: "Every Camry includes Toyota Safety Sense 3.0 with Pre-Collision System, Lane Departure Alert, Dynamic Radar Cruise Control, and Automatic High Beams as standard equipment." },
        { question: "How reliable is the Toyota Camry?", answer: "The Camry consistently ranks as one of the most reliable vehicles in its class, with many examples exceeding 300,000 km with proper maintenance. Toyota&apos;s reputation for longevity makes the Camry an excellent value." }
      ],
      winterReady: true,
      hybrid: true
    }
  },
  honda: {
    'civic': {
      tagline: "Canada&apos;s #1 Car - More Powerful and Efficient Than Ever",
      description: "The Honda Civic has been Canada&apos;s best-selling car for over two decades. Built right here in Ontario, the Civic delivers unmatched value, efficiency, and driving enjoyment for GTA commuters and families alike.",
      startingPrice: 26990,
      mpg: { city: 7.7, highway: 5.9 },
      seating: 5,
      cargo: 428,
      safetyRating: 5,
      features: ["Honda Sensing Suite", "9-inch Touchscreen", "Wireless Apple CarPlay", "LED Headlights", "Remote Start"],
      competitors: [
        { name: "Toyota Corolla", price: 24990, mpg: 7.5, safety: 5 },
        { name: "Mazda3", price: 27490, mpg: 7.9, safety: 5 }
      ],
      faqs: [
        { question: "Is the Honda Civic built in Canada?", answer: "Yes! The Honda Civic is proudly manufactured at Honda&apos;s Alliston, Ontario plant, supporting Canadian jobs and ensuring parts availability across the country." },
        { question: "What is the Honda Civic&apos;s fuel economy?", answer: "The Civic achieves excellent fuel economy of 7.7 L/100km in the city and 5.9 L/100km on the highway. The available 1.5L turbocharged engine provides a perfect balance of power and efficiency." },
        { question: "Does the Civic come with Honda Sensing?", answer: "Yes, Honda Sensing safety suite is standard on all Civic trims, including Collision Mitigation Braking, Road Departure Mitigation, Adaptive Cruise Control, and Lane Keeping Assist." }
      ],
      winterReady: true,
      hybrid: false
    },
    'cr-v': {
      tagline: "The Family-Friendly SUV Built for Canadian Adventures",
      description: "The Honda CR-V combines spacious versatility with Honda&apos;s legendary reliability. Perfect for Ontario families, the CR-V offers excellent cargo space, available hybrid powertrain, and a comfortable ride for long cottage trips.",
      startingPrice: 34990,
      mpg: { city: 8.4, highway: 6.9 },
      seating: 5,
      cargo: 1110,
      safetyRating: 5,
      features: ["Real Time AWD", "Honda Sensing", "Hands-Free Tailgate", "Wireless Charging", "Panoramic Moonroof"],
      competitors: [
        { name: "Toyota RAV4", price: 32990, mpg: 8.4, safety: 5 },
        { name: "Mazda CX-5", price: 33490, mpg: 8.1, safety: 5 }
      ],
      faqs: [
        { question: "How much cargo space does the CR-V have?", answer: "The CR-V offers 1,110 litres of cargo space behind the rear seats, expanding to 2,166 litres with the rear seats folded. This makes it one of the most spacious compact SUVs available." },
        { question: "Is the Honda CR-V good in snow?", answer: "Absolutely! The CR-V&apos;s Real Time AWD system automatically distributes power to the wheels with the most traction, making it excellent for Ontario&apos;s snowy winters and icy conditions." },
        { question: "Is there a hybrid CR-V available?", answer: "Yes, the CR-V Hybrid combines a 2.0L engine with dual electric motors for a combined 204 hp while achieving approximately 6.5 L/100km combined fuel economy." }
      ],
      winterReady: true,
      hybrid: true
    }
  }
}

// Default data for unknown models
const defaultModelData = {
  tagline: "Quality Pre-Owned Vehicles at Planet Motors",
  description: "Discover our selection of PM Certified vehicles with 210-point inspection, 10-day money-back guarantee, and comprehensive warranty options.",
  startingPrice: 29990,
  mpg: { city: 9.0, highway: 7.0 },
  seating: 5,
  cargo: 500,
  safetyRating: 5,
  features: ["PM Certified", "210-Point Inspection", "10-Day Money-Back", "Comprehensive Warranty", "Financing Available"],
  competitors: [],
  faqs: [
    { question: "What is the PM Certification process?", answer: "Every PM Certified vehicle undergoes a rigorous 210-point inspection covering mechanical, safety, and cosmetic elements. Only vehicles that pass our strict standards earn the PM Certified badge." },
    { question: "Can I return my vehicle if I&apos;m not satisfied?", answer: "Yes! Planet Motors offers a 10-day, 1,000km money-back guarantee on all purchases. If you&apos;re not completely satisfied, simply return the vehicle for a full refund." },
    { question: "Do you offer financing for all credit types?", answer: "Yes, we work with multiple lenders to provide financing options for all credit situations, including first-time buyers, newcomers to Canada, and those rebuilding credit." }
  ],
  winterReady: true,
  hybrid: false
}

export default async function ModelLandingPage({ params }: { params: Promise<{ make: string; model: string }> }) {
  const { make, model } = await params
  const makeFormatted = make.charAt(0).toUpperCase() + make.slice(1)
  const modelFormatted = model.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  const currentYear = 2026
  
  // Get model-specific data or use defaults
  const data = modelData[make.toLowerCase()]?.[model.toLowerCase()] || defaultModelData

  // FAQ Schema for Google
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  // Product Schema for Vehicle
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": `${currentYear} ${makeFormatted} ${modelFormatted}`,
    "description": data.description,
    "brand": {
      "@type": "Brand",
      "name": makeFormatted
    },
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": data.startingPrice,
      "highPrice": data.startingPrice + 15000,
      "priceCurrency": "CAD",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "AutoDealer",
        "name": "Planet Motors",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "30 Major Mackenzie Dr E",
          "addressLocality": "Richmond Hill",
          "addressRegion": "ON",
          "postalCode": "L4C 1G7",
          "addressCountry": "CA"
        }
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "500"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Schema Markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />

      <main id="main-content" role="main" tabIndex={-1}>
        {/* Breadcrumb */}
        <nav className="bg-muted/30 py-3 border-b" aria-label="Breadcrumb">
          <div className="container mx-auto px-4">
            <ol className="flex items-center gap-2 text-sm">
              <li><Link href="/" className="text-muted-foreground hover:text-foreground">Home</Link></li>
              <li className="text-muted-foreground">/</li>
              <li><Link href="/inventory" className="text-muted-foreground hover:text-foreground">Inventory</Link></li>
              <li className="text-muted-foreground">/</li>
              <li><Link href={`/inventory?make=${make}`} className="text-muted-foreground hover:text-foreground">{makeFormatted}</Link></li>
              <li className="text-muted-foreground">/</li>
              <li aria-current="page" className="font-medium">{modelFormatted}</li>
            </ol>
          </div>
        </nav>

        {/* 1. Hero Section with H1 */}
        <section className="relative py-12 lg:py-20 bg-gradient-to-br from-primary/5 via-background to-accent/5">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <Badge className="mb-4 bg-green-100 text-green-800">
                  {data.winterReady && "Winter-Ready"} {data.hybrid && "| Hybrid Available"}
                </Badge>
                
                {/* H1 with local intent - Critical for SEO */}
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-balance">
                  {currentYear} {makeFormatted} {modelFormatted} for Sale in Richmond Hill, ON
                </h1>
                
                <p className="text-xl text-muted-foreground mb-6">
                  {data.tagline}
                </p>
                
                {/* First paragraph with local intent keywords */}
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  {data.description} Browse our live inventory below to find the perfect {modelFormatted} for your lifestyle. 
                  Serving Richmond Hill, Toronto, Markham, Vaughan, and the entire GTA with PM Certified quality and our exclusive 10-day money-back guarantee.
                </p>

                <div className="flex flex-wrap gap-4">
                  <Button size="lg" asChild>
                    <Link href={`/inventory?make=${make}&model=${model}`}>
                      <Car className="mr-2 h-5 w-5" />
                      Check Real-Time Availability
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/financing">
                      <Calculator className="mr-2 h-5 w-5" />
                      Calculate Monthly Payment
                    </Link>
                  </Button>
                </div>

                {/* Trust badges */}
                <div className="flex flex-wrap items-center gap-4 mt-8 pt-8 border-t">
                  <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <span className="text-sm">210-Point Inspection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    <span className="text-sm">CarGurus Top Rated 2024</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm">4.8 Star Rating</span>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                  <Image
                    src={`https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=800&h=600&fit=crop`}
                    alt={`${currentYear} ${makeFormatted} ${modelFormatted} for sale at Planet Motors Richmond Hill`}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="absolute -bottom-4 -right-4 bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg">
                  <p className="text-sm">Starting from</p>
                  <p className="text-2xl font-bold">${data.startingPrice.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Key Specs Grid */}
        <section className="py-12 border-b">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Card>
                <CardContent className="p-4 text-center">
                  <Fuel className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{data.mpg.highway}</p>
                  <p className="text-sm text-muted-foreground">L/100km Hwy</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{data.seating}</p>
                  <p className="text-sm text-muted-foreground">Passengers</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Package className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{data.cargo}</p>
                  <p className="text-sm text-muted-foreground">L Cargo</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Shield className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{data.safetyRating}</p>
                  <p className="text-sm text-muted-foreground">Star Safety</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Snowflake className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">AWD</p>
                  <p className="text-sm text-muted-foreground">Available</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <p className="text-2xl font-bold">{data.hybrid ? "Yes" : "Gas"}</p>
                  <p className="text-sm text-muted-foreground">Hybrid Option</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* 3. Live Inventory Feed */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold">{makeFormatted} {modelFormatted} Inventory in Stock</h2>
                <p className="text-muted-foreground">Browse our current selection - updated in real-time</p>
              </div>
              <Button variant="outline" asChild>
                <Link href={`/inventory?make=${make}&model=${model}`}>
                  View All <ChevronRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
            
            {/* Dynamic inventory would be loaded here */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-[4/3] relative bg-muted">
                    <Image
                      src={`https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=400&h=300&fit=crop`}
                      alt={`${makeFormatted} ${modelFormatted} for sale`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 25vw"
                    />
                    <Badge className="absolute top-3 left-3 bg-primary">PM Certified</Badge>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg">{2024 - i} {makeFormatted} {modelFormatted}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{(25000 + i * 10000).toLocaleString()} km | AWD | Premium</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-primary">${(data.startingPrice - i * 2000).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">${Math.round((data.startingPrice - i * 2000) / 60)}/mo*</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 4. AI-Ready FAQ Section - Critical for GEO */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions About the {makeFormatted} {modelFormatted}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {data.faqs.map((faq, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Competitor Comparison Table */}
        {data.competitors.length > 0 && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-bold mb-8">How the {makeFormatted} {modelFormatted} Compares</h2>
              <div className="overflow-x-auto">
                <table className="w-full bg-background rounded-lg overflow-hidden">
                  <thead className="bg-primary text-primary-foreground">
                    <tr>
                      <th className="p-4 text-left">Feature</th>
                      <th className="p-4 text-center">{makeFormatted} {modelFormatted}</th>
                      {data.competitors.map((comp, i) => (
                        <th key={i} className="p-4 text-center">{comp.name}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Starting Price</td>
                      <td className="p-4 text-center font-bold text-primary">${data.startingPrice.toLocaleString()}</td>
                      {data.competitors.map((comp, i) => (
                        <td key={i} className="p-4 text-center">${comp.price.toLocaleString()}</td>
                      ))}
                    </tr>
                    <tr className="border-b">
                      <td className="p-4 font-medium">Fuel Economy (Hwy)</td>
                      <td className="p-4 text-center font-bold text-primary">{data.mpg.highway} L/100km</td>
                      {data.competitors.map((comp, i) => (
                        <td key={i} className="p-4 text-center">{comp.mpg} L/100km</td>
                      ))}
                    </tr>
                    <tr>
                      <td className="p-4 font-medium">Safety Rating</td>
                      <td className="p-4 text-center font-bold text-primary">{data.safetyRating} Stars</td>
                      {data.competitors.map((comp, i) => (
                        <td key={i} className="p-4 text-center">{comp.safety} Stars</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* 6. Standard Features */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold mb-8">Key Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.features.map((feature, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Soft Conversion CTAs */}
        <section className="py-12 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <Calculator className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Calculate Your Payment</h3>
                <p className="mb-4 opacity-90">See what your monthly payment could be</p>
                <Button variant="secondary" asChild>
                  <Link href="/financing">Get Started</Link>
                </Button>
              </div>
              <div>
                <Car className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Value Your Trade-In</h3>
                <p className="mb-4 opacity-90">Get an instant estimate for your current vehicle</p>
                <Button variant="secondary" asChild>
                  <Link href="/trade-in">Get Value</Link>
                </Button>
              </div>
              <div>
                <Shield className="h-12 w-12 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Get Pre-Approved</h3>
                <p className="mb-4 opacity-90">Check your rate in 60 seconds - no impact to credit</p>
                <Button variant="secondary" asChild>
                  <Link href="/financing/application">Apply Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* 8. Local Trust Section */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold mb-4">Why Buy Your {makeFormatted} {modelFormatted} from Planet Motors?</h2>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">210-Point PM Certification</p>
                      <p className="text-muted-foreground">More comprehensive than any competitor&apos;s inspection</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">10-Day Money-Back Guarantee</p>
                      <p className="text-muted-foreground">Drive it for 10 days - return it if you&apos;re not 100% satisfied</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Serving Ontario Since 2015</p>
                      <p className="text-muted-foreground">10+ years of trusted service in Richmond Hill</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold">Financing for All Credit Types</p>
                      <p className="text-muted-foreground">Bad credit, newcomers, and first-time buyers welcome</p>
                    </div>
                  </li>
                </ul>
              </div>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-semibold">Visit Us Today</span>
                  </div>
                  <p className="mb-2">30 Major Mackenzie Dr E</p>
                  <p className="mb-4">Richmond Hill, ON L4C 1G7</p>
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-4 w-4" />
                    <a href="tel:1-866-797-3332" className="text-primary hover:underline">1-866-797-3332</a>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="h-4 w-4" />
                    <span>Mon-Fri 9-7 | Sat 9-6</span>
                  </div>
                  <Button className="w-full" asChild>
                    <Link href="/contact">Schedule a Test Drive</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
