"use client"
import { useTradeIn } from "./trade-in-context"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Zap, TrendingUp, Truck, CreditCard } from "lucide-react"

export function TradeInHowItWorks() {
  const { showOffer } = useTradeIn()
  if (showOffer) return null
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4">Why Planet Motors</Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            The Smarter Way to Trade-In
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Skip the dealership games. Get a fair price in 60 seconds, not 6 hours.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: Zap, title: "60-Second Offers", desc: "Get an instant offer powered by Canadian Black Book. No waiting, no haggling.", highlight: "Instant Offer" },
            { icon: TrendingUp, title: "Best Price Guarantee", desc: "We beat any competitor offer by $500 or we will give you $100.", highlight: "Guaranteed" },
            { icon: Truck, title: "Free Canada-Wide Pickup", desc: "We come to your home or office. No need to drive anywhere.", highlight: "100% Free" },
            { icon: CreditCard, title: "24-Hour Payment", desc: "Get paid within 24 hours via e-Transfer or certified cheque.", highlight: "Fast Cash" },
          ].map((item, i) => (
            <Card key={i} className="relative overflow-hidden border-2 hover:border-primary transition-all group">
              <CardContent className="p-6">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-sm mb-3">{item.desc}</p>
                <Badge variant="secondary" className="text-xs">{item.highlight}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
