"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Video, Calendar, Check, Phone } from "lucide-react"

interface LiveVideoCallProps {
  vehicleId: string
  vehicleName: string
}

export function LiveVideoCall({ vehicleId, vehicleName }: LiveVideoCallProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [callData, setCallData] = useState<{ callId: string; joinLink: string } | null>(null)

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    preferredTime: "",
    notes: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/video-call/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          vehicleName,
          ...formData,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsSuccess(true)
        setCallData(data.data)
      }
    } catch (error) {
      console.error("Failed to schedule video call:", error)
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
        <Button variant="outline" className="w-full gap-2">
          <Video className="w-4 h-4" />
          Schedule Live Video Tour
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Live Video Tour
          </DialogTitle>
        </DialogHeader>

        {!isSuccess ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <p className="text-sm font-medium">{vehicleName}</p>
                <p className="text-xs text-muted-foreground">
                  A sales rep will walk you around the vehicle live
                </p>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <div>
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="John Smith"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  required
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: formatPhoneNumber(e.target.value) })}
                  placeholder="(416) 555-0123"
                />
              </div>

              <div>
                <Label htmlFor="time">Preferred Time</Label>
                <Input
                  id="time"
                  type="datetime-local"
                  required
                  value={formData.preferredTime}
                  onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>

              <div>
                <Label htmlFor="notes">Questions or Special Requests</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="I'd like to see the trunk space and back seats..."
                  rows={2}
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Scheduling..." : "Schedule Video Tour"}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Free service. A sales rep will call you at the scheduled time.
            </p>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Video Tour Scheduled!</h3>
              <p className="text-sm text-muted-foreground">
                We&apos;ll send you a confirmation email with the join link.
              </p>
            </div>
            <Card className="text-left">
              <CardContent className="pt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{new Date(formData.preferredTime).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-xs">{callData?.callId}</span>
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
