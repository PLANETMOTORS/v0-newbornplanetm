"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, CheckCircle, TrendingDown } from "lucide-react"

interface PriceAlertModalProps {
  vehicle?: {
    id: string
    year: number
    make: string
    model: string
    price: number
  }
  searchCriteria?: {
    make?: string
    model?: string
    maxPrice?: number
  }
  trigger?: React.ReactNode
}

export function PriceAlertModal({ vehicle, searchCriteria, trigger }: Readonly<PriceAlertModalProps>) {
  const [email, setEmail] = useState("")
  const [preferences, setPreferences] = useState({
    priceDrops: true,
    newListings: true,
    backInStock: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const [error, setError] = useState("")

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    
    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          vehicleId: vehicle?.id,
          make: vehicle?.make || searchCriteria?.make,
          model: vehicle?.model || searchCriteria?.model,
          maxPrice: vehicle?.price || searchCriteria?.maxPrice,
          preferences,
        }),
      })
      
      if (!response.ok) throw new Error("Failed to create alert")
      
      setIsSuccess(true)
    } catch {
      setError("Failed to create alert. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  let title: string
  if (vehicle) {
    title = `Get alerts for ${vehicle.year} ${vehicle.make} ${vehicle.model}`
  } else if (searchCriteria?.make) {
    title = `Get alerts for ${searchCriteria.make} ${searchCriteria.model || ""} vehicles`
  } else {
    title = "Set Up Price Alerts"
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Price Alert
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {/* S7735: positive condition first. */}
        {isSuccess ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="mb-2">Alert Created!</DialogTitle>
            <DialogDescription className="mb-4">
              We&apos;ll notify you at {email} when there are updates.
            </DialogDescription>
            <Button variant="outline" onClick={() => { setIsSuccess(false); setEmail(""); }}>
              Set Up Another Alert
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-green-600" />
                {title}
              </DialogTitle>
              <DialogDescription>
                Be the first to know when prices drop or new matching vehicles arrive.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-3">
                <Label>Alert me about:</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="priceDrops"
                      checked={preferences.priceDrops}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, priceDrops: checked as boolean })}
                    />
                    <Label htmlFor="priceDrops" className="font-normal">
                      Price drops on this vehicle or similar
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="newListings"
                      checked={preferences.newListings}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, newListings: checked as boolean })}
                    />
                    <Label htmlFor="newListings" className="font-normal">
                      New similar vehicles added to inventory
                    </Label>
                  </div>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="backInStock"
                      checked={preferences.backInStock}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, backInStock: checked as boolean })}
                    />
                    <Label htmlFor="backInStock" className="font-normal">
                      If this vehicle becomes available again
                    </Label>
                  </div>
                </div>
              </div>

              {error && <p className="text-sm text-destructive text-center">{error}</p>}
              <Button type="submit" className="w-full" disabled={!email || isSubmitting}>
                {isSubmitting ? "Setting up alerts..." : "Create Alert"}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                You can unsubscribe at any time. We respect your inbox.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
