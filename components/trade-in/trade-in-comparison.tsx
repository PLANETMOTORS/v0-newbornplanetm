"use client"
import { useTradeIn } from "./trade-in-context"
import { Card } from "@/components/ui/card"
import { Award, Star } from "lucide-react"

export function TradeInComparison() {
  const { showOffer } = useTradeIn()
  if (showOffer) return null
  return (
    <>
      {/* Comparison Table */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">How We Compare</h2>
            <p className="text-muted-foreground">See why Canadians choose Planet Motors</p>
          </div>
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left p-4">Feature</th>
                  <th className="p-4 bg-primary text-primary-foreground rounded-t-lg">
                    <div className="flex items-center justify-center gap-2">
                      <Award className="h-5 w-5" />
                      Planet Motors
                    </div>
                  </th>
                  <th className="p-4 text-muted-foreground">Traditional Dealer</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["Offer Speed", "60 seconds", "2+ hours"],
                  ["Price Guarantee", "Beat by $500", "No"],
                  ["Pickup Service", "Free, Canada-wide", "N/A"],
                  ["Payment Time", "24 hours", "Same day (cheque)"],
                  ["Valuation Source", "Canadian Black Book", "Trade-in guides"],
                  ["Phone Calls Required", "None", "Many"],
                  ["Haggling", "No games", "Expected"],
                ].map(([feature, pm, dealer], i) => (
                  <tr key={i} className="border-b">
                    <td className="p-4 font-semibold">{feature}</td>
                    <td className="p-4 bg-primary/5 text-center font-semibold text-primary">{pm}</td>
                    <td className="p-4 text-center text-muted-foreground">{dealer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What Canadians Are Saying</h2>
            <div className="flex items-center justify-center gap-2 text-amber-500">
              {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
              <span className="ml-2 text-foreground font-semibold">4.8 Star Rating</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { name: "Sarah M.", location: "Toronto, ON", text: "Got $3,000 more than what the dealer offered. The whole process took 30 minutes and they picked up my car from work!", rating: 5 },
              { name: "Mike R.", location: "Vancouver, BC", text: "No games, no haggling. Just a fair price and quick payment. Exactly what I was looking for. Way better than dealing with Craigslist.", rating: 5 },
              { name: "Jennifer L.", location: "Calgary, AB", text: "They paid off my loan directly and e-Transferred my equity the next day. So easy compared to trading in at a dealership.", rating: 5 },
            ].map((review, i) => (
              <Card key={i} className="p-6">
                <div className="flex items-center gap-1 mb-3 text-amber-500">
                  {Array(review.rating).fill(0).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="text-muted-foreground mb-4">&quot;{review.text}&quot;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                    {review.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{review.name}</p>
                    <p className="text-sm text-muted-foreground">{review.location}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
