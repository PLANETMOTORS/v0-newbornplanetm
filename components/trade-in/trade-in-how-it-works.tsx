"use client"
import { useTradeIn } from "./trade-in-context"
import { ClipboardList, DollarSign, Truck } from "lucide-react"

export function TradeInHowItWorks() {
  const { showOffer } = useTradeIn()
  if (showOffer) return null
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">How It Works</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Three simple steps to turn your car into cash</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { icon: ClipboardList, step: "01", title: "Tell Us About Your Car", desc: "Enter your VIN, plate number, or manually select your vehicle details. Takes less than 2 minutes." },
            { icon: DollarSign, step: "02", title: "Get Your Instant Offer", desc: "Receive a real offer powered by Canadian Black Book data. No waiting, no back-and-forth." },
            { icon: Truck, step: "03", title: "Get Paid Fast", desc: "Accept your offer and we'll pick up your vehicle for free anywhere in Canada. Payment within 24 hours." },
          ].map((item) => (
            <div key={item.step} className="text-center">
              <div className="relative inline-flex mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <item.icon className="h-8 w-8 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-primary text-primary-foreground rounded-full text-xs font-bold flex items-center justify-center">{item.step.replace("0","")}</span>
              </div>
              <h3 className="text-xl font-bold mb-3">{item.title}</h3>
              <p className="text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
