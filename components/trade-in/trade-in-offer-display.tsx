"use client"
import { useTradeIn, TRADE_IN_DRAFT_KEY } from "./trade-in-context"
import { useAuth } from "@/contexts/auth-context"
import { PHONE_TOLL_FREE } from "@/lib/contact-info"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { AuthRequiredModal } from "@/components/auth-required-modal"
import { CheckCircle, Car, Sparkles, TrendingUp, TrendingDown, ArrowRight, Star } from "lucide-react"

export function TradeInOfferDisplay() {
  const { offer, showOffer, setShowOffer, showAcceptModal, setShowAcceptModal, showApplyModal, setShowApplyModal, showAuthModal, setShowAuthModal, email, setEmail, phone, setPhone, photos, selectedYear, selectedMake, selectedModel, mileage, condition, postalCode } = useTradeIn()
  const { user } = useAuth()

  if (!showOffer || !offer) return null

  return (
    <>
      <section className="py-16 bg-gradient-to-b from-green-50 to-background dark:from-green-950/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-4 py-2 rounded-full text-sm font-semibold mb-4">
                <CheckCircle className="h-4 w-4" /> Offer Ready
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-2">Your Trade-In Offer</h2>
              <p className="text-muted-foreground">Valid until {offer.validUntil} · Quote #{offer.quoteId}</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="shadow-xl border-2 border-primary/20">
                  <CardContent className="p-8">
                    <div className="text-center mb-8">
                      <p className="text-muted-foreground mb-2">Your Instant Offer</p>
                      <p className="text-6xl font-bold text-primary">${offer.offerAmount.toLocaleString()}</p>
                      <p className="text-muted-foreground mt-2">{offer.vehicle}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-muted/30 rounded-xl">
                      <div className="text-center"><p className="text-xs text-muted-foreground mb-1">CBB Low</p><p className="font-bold">${offer.cbbValue.low.toLocaleString()}</p></div>
                      <div className="text-center border-x"><p className="text-xs text-muted-foreground mb-1">CBB Mid</p><p className="font-bold text-primary">${offer.cbbValue.mid.toLocaleString()}</p></div>
                      <div className="text-center"><p className="text-xs text-muted-foreground mb-1">CBB High</p><p className="font-bold">${offer.cbbValue.high.toLocaleString()}</p></div>
                    </div>
                    {offer.adjustments.filter(Boolean).length > 0 && (
                      <div className="mb-6 space-y-2">
                        {offer.adjustments.filter(Boolean).map((adj, i) => adj && (
                          <div key={i} className="flex justify-between text-sm p-2 bg-amber-50 dark:bg-amber-950/20 rounded"><span className="text-amber-700 dark:text-amber-300">{adj.reason}</span><span className="font-semibold text-amber-700 dark:text-amber-300">{adj.amount.toLocaleString()}</span></div>
                        ))}
                      </div>
                    )}
                    {offer.payoff > 0 && (
                      <div className="mb-6 p-4 border rounded-lg space-y-2">
                        <div className="flex justify-between"><span>Offer Amount</span><span className="font-semibold">${offer.offerAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between text-red-600"><span>Loan Payoff</span><span>-${offer.payoff.toLocaleString()}</span></div>
                        <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Your Equity</span><span className={offer.equity >= 0 ? "text-green-600" : "text-red-600"}>${offer.equity.toLocaleString()}</span></div>
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowAcceptModal(true)}><CheckCircle className="mr-2 h-5 w-5" />Accept Offer</Button>
                      <Button variant="outline" className="flex-1 h-12" onClick={() => { if (!user) { setShowAuthModal(true) } else { setShowApplyModal(true) } }}><Car className="mr-2 h-5 w-5" />Apply to Purchase</Button>
                    </div>
                    <Button variant="ghost" className="w-full mt-3 text-muted-foreground" onClick={() => { setShowOffer(false); window.scrollTo({ top: 0, behavior: "smooth" }) }}>Start Over</Button>
                  </CardContent>
                </Card>
              </div>
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">How We Compare</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <span className="font-semibold text-primary">Planet Motors</span>
                      <span className="font-bold text-primary">${offer.offerAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Private Sale</span></div>
                      <span className="text-sm font-semibold">${offer.comparison.privateSale.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-2"><TrendingDown className="h-4 w-4 text-muted-foreground" /><span className="text-sm">Dealer Trade</span></div>
                      <span className="text-sm font-semibold">${offer.comparison.dealerTrade.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Private sale takes 2-8 weeks. We pay in 24 hours.</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 space-y-3">
                    {[{ icon: CheckCircle, text: "Free pickup anywhere in Canada" }, { icon: CheckCircle, text: "Payment within 24 hours" }, { icon: CheckCircle, text: "We handle all paperwork" }, { icon: CheckCircle, text: "No obligation to accept" }].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm"><item.icon className="h-4 w-4 text-green-600 flex-shrink-0" /><span>{item.text}</span></div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Accept Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><CheckCircle className="w-6 h-6 text-green-600" />Accept Your Offer</DialogTitle>
            <DialogDescription>{offer ? `Your ${offer.vehicle} offer of $${offer.offerAmount.toLocaleString()}` : "Confirm your trade-in offer"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">What happens next:</h4>
              <ol className="text-sm text-green-700 space-y-2">
                {["We'll contact you within 2 hours to schedule a pickup","Free pickup anywhere in Canada at your convenience","Get paid within 24 hours via e-Transfer or cheque"].map((s, i) => (
                  <li key={i} className="flex items-start gap-2"><span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i+1}</span><span>{s}</span></li>
                ))}
              </ol>
            </div>
            <div className="space-y-3">
              <div><Label htmlFor="accept-email">Confirm Email <span className="text-destructive">*</span></Label><Input id="accept-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label htmlFor="accept-phone">Confirm Phone <span className="text-destructive">*</span></Label><Input id="accept-phone" type="tel" placeholder="(416) 555-1234" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div className="flex items-start gap-2"><Checkbox id="accept-terms" /><Label htmlFor="accept-terms" className="text-sm text-muted-foreground leading-tight">I confirm the vehicle condition is as described and agree to Planet Motors&apos; terms of service</Label></div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>Cancel</Button>
            <Button className="bg-green-600 hover:bg-green-700" disabled={!email || !phone} onClick={async () => {
              if (!email || !phone) { alert("Please enter your email and phone number."); return }
              try {
                const photoData: Record<string, string> = {}
                for (const [angle, photo] of Object.entries(photos)) { if (photo?.preview) photoData[angle] = photo.preview }
                const res = await fetch("/api/v1/trade-in/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId: offer?.quoteId, vehicleYear: selectedYear, vehicleMake: selectedMake, vehicleModel: selectedModel, mileage, condition, postalCode, photos: Object.keys(photoData).length > 0 ? photoData : undefined, offerAmount: offer?.offerAmount, customerEmail: email, customerPhone: phone }) })
                const data = await res.json()
                if (data.success) { try { window.localStorage.removeItem(TRADE_IN_DRAFT_KEY) } catch { /* noop */ }; setShowAcceptModal(false); alert(`Offer Accepted!\n\nYou will receive a confirmation email and SMS shortly.\n\nOur team will contact you within 2 hours to schedule your free pickup.\n\nQuote ID: ${offer?.quoteId}`) }
                else { alert(`There was an issue processing your acceptance. Please try again or call us at ${PHONE_TOLL_FREE}.`) }
              } catch { try { window.localStorage.removeItem(TRADE_IN_DRAFT_KEY) } catch { /* noop */ }; setShowAcceptModal(false); alert(`Offer Accepted!\n\nOur team will contact you within 2 hours to schedule your free pickup.\n\nQuote ID: ${offer?.quoteId}`) }
            }}>
              <CheckCircle className="mr-2 h-4 w-4" />Confirm & Accept Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply to Purchase Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Car className="w-6 h-6 text-primary" />Apply Trade-In to a Purchase</DialogTitle>
            <DialogDescription>Use your trade-in value towards a vehicle from our inventory</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {user && (<div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /><div><p className="text-sm font-semibold text-green-800">Signed in as {user.email}</p><p className="text-xs text-green-700">Your trade-in will be saved to your account</p></div></div>)}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2"><span className="text-sm text-muted-foreground">Your Trade-In Value</span><span className="text-2xl font-bold text-primary">${offer?.offerAmount.toLocaleString() || "0"}</span></div>
              <p className="text-sm text-muted-foreground">This amount will be applied as a down payment on your new vehicle</p>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold">What are you looking for?</h4>
              <div className="grid grid-cols-2 gap-2">
                {["SUV","Sedan","Truck","Electric","Luxury","Under $30k"].map((type) => (
                  <Button key={type} variant="outline" size="sm" className="justify-start" onClick={async () => {
                    try { if (user) { await fetch("/api/v1/trade-in/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId: offer?.quoteId, vehicleYear: selectedYear, vehicleMake: selectedMake, vehicleModel: selectedModel, mileage, condition, postalCode, offerAmount: offer?.offerAmount, customerEmail: email || user.email, customerPhone: phone }) }) } } catch (err) { console.error("[trade-in] Save failed:", err) }
                    try { window.localStorage.removeItem(TRADE_IN_DRAFT_KEY) } catch { /* noop */ }
                    setShowApplyModal(false)
                    const params = new URLSearchParams({ tradeIn: String(offer?.offerAmount || 0), quoteId: offer?.quoteId || "", tradeInVehicle: encodeURIComponent(offer?.vehicle || "") })
                    if (type === "Electric") params.set("fuelType", "Electric"); else if (type === "Under $30k") params.set("maxPrice", "30000"); else if (type === "Luxury") params.set("category", "Luxury"); else params.set("bodyType", type)
                    window.location.href = `/inventory?${params.toString()}`
                  }}>{type}</Button>
                ))}
              </div>
            </div>
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg"><Sparkles className="w-4 h-4 mt-0.5 text-primary" /><span>Your trade-in quote will be saved to your account. Browse inventory and apply it to any vehicle purchase.</span></div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>Cancel</Button>
            <Button onClick={async () => {
              try { if (user) { await fetch("/api/v1/trade-in/save", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ quoteId: offer?.quoteId, vehicleYear: selectedYear, vehicleMake: selectedMake, vehicleModel: selectedModel, mileage, condition, postalCode, offerAmount: offer?.offerAmount, customerEmail: email || user.email, customerPhone: phone }) }) } } catch (err) { console.error("Error saving trade-in:", err) }
              try { window.localStorage.removeItem(TRADE_IN_DRAFT_KEY) } catch { /* noop */ }
              setShowApplyModal(false)
              const params = new URLSearchParams({ tradeIn: String(offer?.offerAmount || 0), quoteId: offer?.quoteId || "", tradeInVehicle: encodeURIComponent(offer?.vehicle || "") })
              window.location.href = `/inventory?${params.toString()}`
            }}><ArrowRight className="mr-2 h-4 w-4" />Browse Inventory</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthRequiredModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} action="apply your trade-in to a vehicle purchase" redirectTo={`/trade-in?quote=${offer?.quoteId || ""}&vehicle=${encodeURIComponent(offer?.vehicle || "")}&value=${offer?.offerAmount || 0}&action=apply`} />
    </>
  )
}
