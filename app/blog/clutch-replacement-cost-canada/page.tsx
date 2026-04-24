"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

import { Calendar, Clock, User, ChevronRight, DollarSign, MapPin, Car, Wrench } from "lucide-react"

export default function ClutchReplacementCostCanadaPage() {
  const costBreakdown = [
    { item: "Clutch Kit (disc, pressure plate, bearing)", cost: "$250 - $600" },
    { item: "Flywheel Resurfacing or Replacement", cost: "$50 - $400" },
    { item: "Labor (4-8 hours)", cost: "$500 - $1,200" },
    { item: "Fluids and Miscellaneous", cost: "$30 - $100" },
  ]

  const costByVehicle = [
    { vehicle: "Honda Civic", cost: "$800 - $1,200" },
    { vehicle: "Toyota Corolla", cost: "$900 - $1,300" },
    { vehicle: "Mazda MX-5 Miata", cost: "$1,000 - $1,500" },
    { vehicle: "Subaru WRX", cost: "$1,200 - $1,800" },
    { vehicle: "Ford Mustang GT", cost: "$1,300 - $2,000" },
    { vehicle: "BMW 3 Series", cost: "$1,800 - $2,800" },
    { vehicle: "Porsche 911", cost: "$3,000 - $5,000" },
  ]

  const costByProvince = [
    { province: "Ontario", range: "$1,200 - $1,800" },
    { province: "British Columbia", range: "$1,300 - $2,000" },
    { province: "Alberta", range: "$1,100 - $1,700" },
    { province: "Quebec", range: "$1,000 - $1,600" },
    { province: "Manitoba", range: "$900 - $1,400" },
    { province: "Saskatchewan", range: "$900 - $1,400" },
    { province: "Nova Scotia", range: "$1,000 - $1,500" },
    { province: "New Brunswick", range: "$950 - $1,450" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" tabIndex={-1}>
        {/* Article Header */}
        <article className="max-w-4xl mx-auto px-4 py-12">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="bg-blue-600">Maintenance Guide</Badge>
              <Badge variant="outline">Clutch</Badge>
              <Badge variant="outline">Canada</Badge>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.01em] md:tracking-[-0.02em] mb-4">
              Clutch Replacement Cost in Canada (2026 Complete Guide)
            </h1>
            
            <p className="text-xl text-muted-foreground mb-6">
              How much does it cost to replace a clutch in Canada? We break down clutch replacement 
              costs by province, vehicle type, and what&apos;s included in the service.
            </p>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y py-4">
              <span className="flex items-center gap-1">
                <User className="w-4 h-4" />
                Planet Motors Team
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                March 28, 2026
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                8 min read
              </span>
            </div>
          </div>

          {/* Quick Answer Box */}
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 mb-8">
            <CardContent className="p-6">
              <h2 className="font-bold text-lg mb-2 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-600" />
                Quick Answer: Clutch Replacement Cost in Canada
              </h2>
              <p className="text-lg">
                <strong>Average cost: $1,000 - $2,000</strong> for most vehicles in Canada. 
                This includes parts ($300-$700) and labor ($700-$1,300). Luxury and performance 
                vehicles can cost $2,500 - $5,000+.
              </p>
            </CardContent>
          </Card>

          {/* Table of Contents */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <h2 className="font-bold mb-4">In This Article:</h2>
              <ul className="space-y-2">
                <li><a href="#cost-breakdown" className="text-blue-600 hover:underline">1. Clutch Replacement Cost Breakdown</a></li>
                <li><a href="#by-province" className="text-blue-600 hover:underline">2. Costs by Province</a></li>
                <li><a href="#by-vehicle" className="text-blue-600 hover:underline">3. Costs by Vehicle Type</a></li>
                <li><a href="#signs" className="text-blue-600 hover:underline">4. Signs You Need a Clutch Replacement</a></li>
                <li><a href="#save-money" className="text-blue-600 hover:underline">5. How to Save Money on Clutch Replacement</a></li>
                <li><a href="#faq" className="text-blue-600 hover:underline">6. Frequently Asked Questions</a></li>
              </ul>
            </CardContent>
          </Card>

          {/* Main Content */}
          <div className="prose prose-lg max-w-none">
            <h2 id="cost-breakdown" className="flex items-center gap-2 font-bold">
              <Wrench className="w-6 h-6 text-blue-600" />
              Clutch Replacement Cost Breakdown
            </h2>
            
            <p>
              When you get a <strong>clutch replacement in Canada</strong>, here&apos;s what you&apos;re paying for:
            </p>

            <div className="not-prose my-6">
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4">Component</th>
                        <th className="text-right p-4">Cost Range</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costBreakdown.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-4">{item.item}</td>
                          <td className="p-4 text-right font-semibold text-green-600">{item.cost}</td>
                        </tr>
                      ))}
                      <tr className="border-t bg-blue-50 dark:bg-blue-950/30 font-bold">
                        <td className="p-4">Total Clutch Replacement Cost</td>
                        <td className="p-4 text-right text-green-600">$1,000 - $2,000</td>
                      </tr>
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            <h2 id="by-province" className="flex items-center gap-2 font-bold">
              <MapPin className="w-6 h-6 text-blue-600" />
              Clutch Replacement Cost by Province
            </h2>
            
            <p>
              <strong>Clutch replacement costs vary across Canada</strong> due to differences in labor rates 
              and cost of living. Here&apos;s what you can expect to pay in each province:
            </p>

            <div className="not-prose my-6 grid md:grid-cols-2 gap-4">
              {costByProvince.map((item, index) => (
                <Card key={index}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <span className="font-semibold">{item.province}</span>
                    <span className="font-bold text-green-600">{item.range}</span>
                  </CardContent>
                </Card>
              ))}
            </div>

            <h2 id="by-vehicle" className="flex items-center gap-2 font-bold">
              <Car className="w-6 h-6 text-blue-600" />
              Clutch Replacement Cost by Vehicle
            </h2>
            
            <p>
              The type of <strong>clutch car</strong> you drive significantly impacts replacement costs. 
              Performance and luxury vehicles require more expensive parts and specialized labor:
            </p>

            <div className="not-prose my-6">
              <Card>
                <CardContent className="p-0">
                  <table className="w-full">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-4">Vehicle</th>
                        <th className="text-right p-4">Clutch Replacement Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {costByVehicle.map((item, index) => (
                        <tr key={index} className="border-t">
                          <td className="p-4">{item.vehicle}</td>
                          <td className="p-4 text-right font-semibold text-green-600">{item.cost}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </div>

            <h2 id="signs" className="font-bold">Signs You Need a Clutch Replacement</h2>
            
            <p>Watch for these warning signs that indicate your <strong>clutch</strong> needs attention:</p>
            
            <ul>
              <li><strong>Clutch slipping</strong> - Engine revs but car doesn&apos;t accelerate</li>
              <li><strong>Difficulty shifting gears</strong> - Grinding or hard to engage</li>
              <li><strong>Soft or spongy clutch pedal</strong> - Hydraulic issues</li>
              <li><strong>Burning smell</strong> - Clutch overheating</li>
              <li><strong>Vibration when engaging</strong> - Worn clutch disc or flywheel</li>
              <li><strong>Clutch pedal sticking</strong> - Cable or hydraulic problems</li>
            </ul>

            <h2 id="save-money" className="font-bold">How to Save Money on Clutch Replacement</h2>
            
            <ol>
              <li><strong>Get multiple quotes</strong> - Compare prices from 3-4 shops</li>
              <li><strong>Consider independent shops</strong> - Often 20-40% cheaper than dealers</li>
              <li><strong>Ask about aftermarket parts</strong> - Quality alternatives to OEM</li>
              <li><strong>Replace related components</strong> - Flywheel, bearings at same time</li>
              <li><strong>Learn proper clutch technique</strong> - Extends clutch life significantly</li>
            </ol>

            <h2 id="faq" className="font-bold">Frequently Asked Questions</h2>

            <h3>How long does a clutch last in Canada?</h3>
            <p>
              A typical <strong>clutch in Canada</strong> lasts 100,000-150,000 km with proper driving habits. 
              Heavy city driving and harsh winters can reduce this to 60,000-80,000 km.
            </p>

            <h3>Can I drive with a bad clutch?</h3>
            <p>
              Driving with a failing <strong>clutch</strong> is dangerous and can cause further damage. 
              A slipping clutch can leave you stranded, and a stuck clutch can cause accidents.
            </p>

            <h3>Is it worth replacing a clutch on an old car?</h3>
            <p>
              If your <strong>clutch car</strong> is otherwise in good condition and worth more than 
              $3,000-$4,000, clutch replacement is usually worthwhile. The repair cost is typically 
              less than buying a replacement vehicle.
            </p>

            <h3>How long does clutch replacement take?</h3>
            <p>
              <strong>Clutch replacement</strong> typically takes 4-8 hours depending on the vehicle. 
              Front-wheel-drive cars are usually faster than rear-wheel-drive or AWD vehicles.
            </p>
          </div>

          {/* CTA Section */}
          <Card className="mt-12 bg-linear-to-r from-blue-600 to-blue-800 text-white">
            <CardContent className="p-8 text-center">
              <h2 className="text-2xl font-bold mb-4">Looking for a Quality Manual Transmission Car?</h2>
              <p className="text-blue-100 mb-6">
                Every clutch car at Planet Motors passes our 210-point inspection, 
                including thorough clutch system testing.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/inventory?transmission=Manual">
                  <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                    Browse Clutch Cars
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/clutch-guide-canada">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    Complete Clutch Guide
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </article>
      </main>

      <Footer />
    </div>
  )
}
