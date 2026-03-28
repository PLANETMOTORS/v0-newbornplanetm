"use client"

import { CheckCircle2, XCircle, Crown, Award, TrendingUp } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ComparisonItem {
  feature: string
  planetMotors: boolean | string
  clutch: boolean | string
  carvana: boolean | string
  highlight?: boolean
}

const comparisonData: ComparisonItem[] = [
  {
    feature: "Comprehensive Inspection",
    planetMotors: "210 Points",
    clutch: "210 Points",
    carvana: "150 Points",
    highlight: false
  },
  {
    feature: "EV Battery Health Certification",
    planetMotors: true,
    clutch: false,
    carvana: false,
    highlight: true
  },
  {
    feature: "Return Policy",
    planetMotors: "10 Days",
    clutch: "10 Days",
    carvana: "7 Days"
  },
  {
    feature: "Financing Partners",
    planetMotors: "6 Lenders",
    clutch: "3 Lenders",
    carvana: "1 (In-House)",
    highlight: true
  },
  {
    feature: "Lowest APR Available",
    planetMotors: "4.79%",
    clutch: "6.99%",
    carvana: "7.99%",
    highlight: true
  },
  {
    feature: "Same-Day Financing Decision",
    planetMotors: true,
    clutch: false,
    carvana: true,
    highlight: true
  },
  {
    feature: "AI-Powered Recommendations",
    planetMotors: true,
    clutch: false,
    carvana: false,
    highlight: true
  },
  {
    feature: "Virtual 3D Showroom",
    planetMotors: true,
    clutch: false,
    carvana: "Vending Machine Only",
    highlight: true
  },
  {
    feature: "360° Interactive Views",
    planetMotors: true,
    clutch: true,
    carvana: true
  },
  {
    feature: "Real-Time Inventory Updates",
    planetMotors: "Live",
    clutch: "Hourly",
    carvana: "Daily",
    highlight: true
  },
  {
    feature: "Price Match Guarantee",
    planetMotors: true,
    clutch: false,
    carvana: false,
    highlight: true
  },
  {
    feature: "Canadian Black Book Valuation",
    planetMotors: true,
    clutch: true,
    carvana: false
  },
  {
    feature: "Free Ontario Delivery",
    planetMotors: true,
    clutch: true,
    carvana: "$599+"
  },
  {
    feature: "Same-Day Vehicle Pickup",
    planetMotors: true,
    clutch: false,
    carvana: false,
    highlight: true
  },
  {
    feature: "OMVIC Licensed Dealer",
    planetMotors: true,
    clutch: true,
    carvana: false,
    highlight: true
  },
  {
    feature: "In-Person Showroom",
    planetMotors: "Richmond Hill",
    clutch: "No Physical Location",
    carvana: "No (US Only)",
    highlight: true
  },
  {
    feature: "24/7 Live Chat Support",
    planetMotors: true,
    clutch: "Business Hours",
    carvana: true
  },
  {
    feature: "Trade-In Instant Offer",
    planetMotors: true,
    clutch: true,
    carvana: true
  }
]

function RenderValue({ value, isBest }: { value: boolean | string; isBest?: boolean }) {
  if (value === true) {
    return (
      <div className="flex justify-center">
        <CheckCircle2 className={`w-5 h-5 ${isBest ? "text-green-600" : "text-green-500"}`} />
      </div>
    )
  }
  if (value === false) {
    return (
      <div className="flex justify-center">
        <XCircle className="w-5 h-5 text-red-400" />
      </div>
    )
  }
  return (
    <span className={`text-sm font-medium ${isBest ? "text-green-600" : "text-muted-foreground"}`}>
      {value}
    </span>
  )
}

export function ComparisonTable() {
  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <Badge variant="outline" className="mb-4 px-4 py-1">
            <TrendingUp className="w-3 h-3 mr-1" />
            Industry Comparison
          </Badge>
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-4">
            Planet Motors vs The Competition
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See exactly how we outperform Clutch.ca and Carvana on the features that matter most to Canadian car buyers.
          </p>
        </div>

        <Card className="max-w-5xl mx-auto overflow-hidden shadow-xl border-2">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-primary/20">
                    <th className="text-left p-5 font-semibold text-muted-foreground bg-muted/30">
                      Feature
                    </th>
                    <th className="p-5 text-center bg-primary/10 border-x-2 border-primary/20 relative">
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <Badge className="bg-primary text-primary-foreground shadow-lg">
                          <Crown className="w-3 h-3 mr-1" />
                          Best Choice
                        </Badge>
                      </div>
                      <div className="text-primary font-bold text-lg mt-2">Planet Motors</div>
                      <div className="text-xs text-primary/70 mt-1">Richmond Hill, ON</div>
                    </th>
                    <th className="p-5 text-center bg-muted/30">
                      <div className="font-semibold text-muted-foreground">Clutch.ca</div>
                      <div className="text-xs text-muted-foreground/70 mt-1">Online Dealer</div>
                    </th>
                    <th className="p-5 text-center bg-muted/30">
                      <div className="font-semibold text-muted-foreground">Carvana</div>
                      <div className="text-xs text-muted-foreground/70 mt-1">US-Based</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr 
                      key={row.feature} 
                      className={`
                        ${index % 2 === 0 ? "bg-background" : "bg-muted/10"}
                        ${row.highlight ? "bg-green-50/50 dark:bg-green-950/20" : ""}
                        hover:bg-muted/20 transition-colors
                      `}
                    >
                      <td className="p-4 font-medium flex items-center gap-2">
                        {row.feature}
                        {row.highlight && (
                          <Award className="w-4 h-4 text-primary" />
                        )}
                      </td>
                      <td className="p-4 text-center bg-primary/5 border-x border-primary/10">
                        <RenderValue value={row.planetMotors} isBest={row.highlight} />
                      </td>
                      <td className="p-4 text-center">
                        <RenderValue value={row.clutch} />
                      </td>
                      <td className="p-4 text-center">
                        <RenderValue value={row.carvana} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Summary Footer */}
            <div className="border-t-2 border-primary/20 bg-primary/5 p-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Crown className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Planet Motors Wins in 12 of 18 Categories</p>
                    <p className="text-sm text-muted-foreground">EV expertise, better rates, AI recommendations, physical showroom</p>
                  </div>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <div className="text-2xl font-bold text-primary">210</div>
                    <div className="text-xs text-muted-foreground">Inspection Points</div>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <div className="text-2xl font-bold text-primary">6</div>
                    <div className="text-xs text-muted-foreground">Lender Partners</div>
                  </div>
                  <div className="w-px bg-border" />
                  <div>
                    <div className="text-2xl font-bold text-primary">4.79%</div>
                    <div className="text-xs text-muted-foreground">Lowest APR</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
