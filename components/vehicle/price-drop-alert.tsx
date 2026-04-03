"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Bell, Check, Mail, Phone } from "lucide-react"

interface PriceDropAlertProps {
  vehicleId: string
  vehicleName: string
  currentPrice: number
}

export function PriceDropAlert({ vehicleId, vehicleName, currentPrice }: PriceDropAlertProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [alertId, setAlertId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    notifyEmail: true,
    notifySms: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          vehicleName,
          currentPrice,
          ...formData,
        }),
      })

      const data = await response.json()
      if (data.success) {
        setIsSuccess(true)
        setAlertId(data.alertId)
      }
    } catch (error) {
      console.error("Failed to set alert:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Bell className="w-4 h-4" />
          Price Alert
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Price Drop Alert
          </DialogTitle>
        </DialogHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="text-sm font-medium">{vehicleName}</p>
                <p className="text-lg font-bold text-primary">
                  ${currentPrice.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Get notified when the price drops
                </p>
              </CardContent>
            </Card>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            <div>
              <Label htmlFor="phone">Phone (for SMS alerts)</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: formatPhoneNumber(e.target.value) })}
                placeholder="416-985-2277"
              />
            </div>

            <div className="space-y-3">
              <Label>Notification Preferences</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifyEmail"
                  checked={formData.notifyEmail}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifyEmail: checked as boolean })}
                />
                <label htmlFor="notifyEmail" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  Email notifications
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifySms"
                  checked={formData.notifySms}
                  onCheckedChange={(checked) => setFormData({ ...formData, notifySms: checked as boolean })}
                  disabled={!formData.phone}
                />
                <label htmlFor="notifySms" className="flex items-center gap-2 text-sm cursor-pointer">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  SMS notifications
                  {!formData.phone && <span className="text-xs text-muted-foreground">(add phone)</span>}
                </label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Setting Alert..." : "Set Price Alert"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              You can unsubscribe at any time. We only notify you about price drops.
            </p>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Alert Set!</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ll notify you when the price drops.
              </p>
            </div>
            <Card className="text-left">
              <CardContent className="pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium">{vehicleName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price</span>
                  <span className="font-medium">${currentPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Alert ID</span>
                  <span className="font-mono text-xs">{alertId}</span>
                </div>
              </CardContent>
            </Card>
            <Button onClick={() => setIsOpen(false)} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
