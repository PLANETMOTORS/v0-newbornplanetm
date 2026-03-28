import { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Zap, 
  Battery, 
  Leaf, 
  Shield, 
  TrendingDown, 
  MapPin, 
  Car,
  DollarSign,
  CheckCircle,
  ArrowRight,
  Star
} from "lucide-react"

export const metadata: Metadata = {
  title: "Used Electric Vehicles Ontario | Tesla, Hyundai, BMW EVs | Planet Motors",
  description: "Shop certified pre-owned electric vehicles in Ontario. Tesla Model 3, Model Y, Hyundai Ioniq, BMW i4 & more. Battery health reports, 210-point inspection, nationwide delivery. 4.8 stars.",
  keywords: "electric cars Ontario, used Tesla Ontario, EV dealership Toronto, used electric cars Canada, buy EV online Ontario, Tesla Model Y Canada, Tesla Model 3 used, Hyundai Ioniq 5 used",
  openGraph: {
    title: "Used Electric Vehicles Ontario | Planet Motors",
    description: "Certified pre-owned EVs with battery health reports. Tesla, Hyundai, BMW & more.",
    url: "https://www.planetmotors.ca/electric-vehicles",
    type: "website",
  },
}

const evMakes = [
  { name: "Tesla", models: ["Model 3", "Model Y", "Model S", "Model X"], image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400&h=300&fit=crop", count: 45 },
  { name: "Hyundai", models: ["Ioniq 5", "Ioniq 6", "Kona Electric"], image: "https://images.unsplash.com/photo-1619767886558-efdc259b6e09?w=400&h=300&fit=crop", count: 18 },
  { name: "BMW", models: ["i4", "iX", "i7"], image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400&h=300&fit=crop", count: 12 },
  { name: "Kia", models: ["EV6", "Niro EV"], image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=400&h=300&fit=crop", count: 14 },
  { name: "Ford", models: ["Mustang Mach-E", "F-150 Lightning"], image: "https://images.unsplash.com/photo-1551830820-330a71b99659?w=400&h=300&fit=crop", count: 8 },
  { name: "Audi", models: ["e-tron", "Q4 e-tron", "e-tron GT"], image: "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=400&h=300&fit=crop", count: 6 },
]

const priceRanges = [
  { label: "Under $25,000", href: "/inventory?fuelType=Electric&maxPrice=25000", count: 12 },
  { label: "Under $40,000", href: "/inventory?fuelType=Electric&maxPrice=40000", count: 28 },
  { label: "Under $60,000", href: "/inventory?fuelType=Electric&maxPrice=60000", count: 45 },
  { label: "$60,000+", href: "/inventory?fuelType=Electric&minPrice=60000", count: 18 },
]

const features = [
  { icon: Battery, title: "Battery Health Reports", description: "Every EV comes with a detailed battery health analysis showing capacity, range, and charging performance" },
  { icon: Shield, title: "210-Point Inspection", description: "Our comprehensive inspection covers EV-specific components including motors, inverters, and thermal systems" },
  { icon: TrendingDown, title: "Save on Fuel", description: "Average EV owners save $2,000-3,000/year on fuel costs compared to gas vehicles" },
  { icon: Leaf, title: "Zero Emissions", description: "Drive clean with zero tailpipe emissions and reduced environmental impact" },
]

export default function ElectricVehiclesPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" role="main" aria-label="Electric vehicles">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-green-900 via-green-800 to-emerald-900 text-white py-16 lg:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <Badge className="bg-green-500/20 text-green-300 border-green-500/30 mb-4">
                <Zap className="w-3 h-3 mr-1" />
                Electric Vehicle Specialist
              </Badge>
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
                Used Electric Vehicles in Ontario
              </h1>
              <p className="text-xl text-green-100 mb-8 leading-relaxed">
                Shop certified pre-owned Tesla, Hyundai, BMW, and more. Every EV includes a battery health report, 
                210-point inspection, and our 10-day money-back guarantee.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-white text-green-900 hover:bg-green-50" asChild>
                  <Link href="/inventory?fuelType=Electric">
                    Browse All EVs
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" asChild>
                  <Link href="/ev-battery-health">
                    Learn About Battery Health
                  </Link>
                </Button>
              </div>
              
              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-6 mt-10 text-sm">
                <div className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span>4.8/5 (277+ reviews)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>210-Point Inspection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Battery className="w-5 h-5" />
                  <span>Battery Health Certified</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Shop by Make */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-2">Shop Electric Vehicles by Make</h2>
            <p className="text-muted-foreground mb-8">Browse our selection of premium electric vehicles</p>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {evMakes.map((make) => (
                <Link 
                  key={make.name} 
                  href={`/inventory?fuelType=Electric&make=${make.name}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={make.image}
                        alt={`Used ${make.name} electric vehicles`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                        sizes="(max-width: 768px) 50vw, 16vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-2 left-2 right-2">
                        <p className="text-white font-semibold">{make.name}</p>
                        <p className="text-white/80 text-xs">{make.count} available</p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Shop by Price */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-2">Shop EVs by Price</h2>
            <p className="text-muted-foreground mb-8">Find an electric vehicle that fits your budget</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {priceRanges.map((range) => (
                <Link key={range.label} href={range.href}>
                  <Card className="p-6 hover:shadow-lg transition-all hover:-translate-y-1 hover:border-primary">
                    <DollarSign className="w-8 h-8 text-green-600 mb-3" />
                    <h3 className="font-semibold text-lg">{range.label}</h3>
                    <p className="text-muted-foreground text-sm">{range.count} vehicles</p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Why Buy EV from Planet Motors */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Buy an EV from Planet Motors?</h2>
              <p className="text-muted-foreground">
                We specialize in certified pre-owned electric vehicles with comprehensive inspections and battery health guarantees.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature) => (
                <Card key={feature.title} className="p-6">
                  <feature.icon className="w-10 h-10 text-green-600 mb-4" />
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Popular EV Models */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8">Popular Electric Vehicle Models</h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { name: "Tesla Model Y", range: "455 km", price: "$45,990", image: "https://images.unsplash.com/photo-1619317429403-2a3d8eb9dfe1?w=600&h=400&fit=crop" },
                { name: "Tesla Model 3", range: "438 km", price: "$39,990", image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=600&h=400&fit=crop" },
                { name: "Hyundai Ioniq 5", range: "488 km", price: "$42,990", image: "https://images.unsplash.com/photo-1619767886558-efdc259b6e09?w=600&h=400&fit=crop" },
                { name: "BMW i4", range: "435 km", price: "$52,990", image: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=600&h=400&fit=crop" },
                { name: "Kia EV6", range: "499 km", price: "$44,990", image: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=600&h=400&fit=crop" },
                { name: "Ford Mustang Mach-E", range: "402 km", price: "$46,990", image: "https://images.unsplash.com/photo-1551830820-330a71b99659?w=600&h=400&fit=crop" },
              ].map((model) => (
                <Card key={model.name} className="overflow-hidden group hover:shadow-lg transition-all">
                  <div className="relative aspect-video">
                    <Image
                      src={model.image}
                      alt={`Used ${model.name}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg">{model.name}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-muted-foreground text-sm flex items-center gap-1">
                        <Battery className="w-4 h-4" />
                        {model.range} range
                      </span>
                      <span className="font-bold text-green-600">From {model.price}</span>
                    </div>
                    <Button className="w-full mt-4" variant="outline" asChild>
                      <Link href={`/inventory?fuelType=Electric&search=${encodeURIComponent(model.name)}`}>
                        View Available
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* EV Financing */}
        <section className="py-16 bg-green-900 text-white">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-4">EV Financing Made Easy</h2>
                <p className="text-green-100 mb-6">
                  Get approved for EV financing in minutes. We work with all credit situations including first-time buyers, 
                  new immigrants, and those rebuilding credit.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Rates starting at 4.99% OAC",
                    "Terms from 24-84 months",
                    "Bad credit? No problem",
                    "First-time buyers welcome",
                    "$0 down payment options",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button size="lg" className="bg-white text-green-900 hover:bg-green-50" asChild>
                  <Link href="/financing">
                    Get Pre-Approved
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
              <div className="relative">
                <Card className="bg-white/10 backdrop-blur border-white/20 p-8">
                  <h3 className="text-xl font-semibold mb-6">Quick Payment Estimate</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-green-100">Vehicle Price</span>
                      <span className="font-semibold">$45,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-100">Down Payment</span>
                      <span className="font-semibold">$5,000</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-100">Term</span>
                      <span className="font-semibold">72 months</span>
                    </div>
                    <hr className="border-white/20" />
                    <div className="flex justify-between text-xl">
                      <span>Est. Monthly Payment</span>
                      <span className="font-bold">$589/mo</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
            
            <div className="max-w-3xl mx-auto space-y-6">
              {[
                {
                  q: "How do you check battery health on used EVs?",
                  a: "We use advanced diagnostic tools to analyze battery degradation, charging capacity, and overall health. Every EV comes with a detailed battery health report showing remaining capacity percentage."
                },
                {
                  q: "What does your 210-point inspection include for EVs?",
                  a: "Our inspection covers EV-specific components including battery pack, electric motors, inverters, thermal management system, charging ports, regenerative braking, and all standard safety items."
                },
                {
                  q: "Do you offer financing for electric vehicles?",
                  a: "Yes! We offer competitive EV financing rates starting at 4.99% OAC. We work with all credit situations including first-time buyers and those rebuilding credit."
                },
                {
                  q: "Can you deliver an EV to my location?",
                  a: "Absolutely! We offer nationwide delivery across Canada. Your EV will arrive fully charged and ready to drive."
                },
              ].map((faq, i) => (
                <Card key={i} className="p-6">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Go Electric?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Browse our selection of certified pre-owned electric vehicles. Every EV comes with a battery health report, 
              210-point inspection, and our 10-day money-back guarantee.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/inventory?fuelType=Electric">
                  <Car className="mr-2 h-5 w-5" />
                  Browse All EVs
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/contact">
                  <MapPin className="mr-2 h-5 w-5" />
                  Visit Our Showroom
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
