"use client"
import { useTradeIn } from "./trade-in-context"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function TradeInFinalCta() {
  const { showOffer } = useTradeIn()
  if (showOffer) return null
  return (
    <section className="py-20 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Your Offer?</h2>
        <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">Join thousands of Canadians who have already traded in their vehicles with Planet Motors.</p>
        <Button size="lg" variant="secondary" className="h-14 px-8 text-lg" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Get My Instant Offer <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        <p className="mt-4 text-sm opacity-70">No phone calls. No spam. See your offer in 60 seconds.</p>
      </div>
    </section>
  )
}
