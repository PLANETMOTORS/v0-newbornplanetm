"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { DateSlotPicker } from "./DateSlotPicker"
import { formatPhoneNumber, isValidPhone } from "@/lib/liveVideoTour/schema"
import { isDealershipOpen } from "@/lib/liveVideoTour/availability"
import type { LiveVideoTourResponse } from "@/types/liveVideoTour"

interface LiveVideoTourFormProps {
  vehicleId: string
  vehicleName: string
  onSuccess: (data: LiveVideoTourResponse) => void
}

export function LiveVideoTourForm({ vehicleId, vehicleName, onSuccess }: LiveVideoTourFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    selectedDate: "",
    selectedTime: "",
    notes: "",
  })

  const isOpen = isDealershipOpen()

  const isFormValid =
    formData.customerName.trim() !== "" &&
    formData.customerEmail.includes("@") &&
    isValidPhone(formData.customerPhone) &&
    formData.selectedDate !== "" &&
    formData.selectedTime !== ""

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      // Combine date and time into ISO string
      const preferredTime = new Date(
        `${formData.selectedDate}T${formData.selectedTime}:00`
      ).toISOString()

      const response = await fetch("/api/live-video-tour/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId,
          vehicleName,
          customerName: formData.customerName,
          customerEmail: formData.customerEmail,
          customerPhone: formData.customerPhone,
          preferredTime,
          notes: formData.notes,
        }),
      })

      const data: LiveVideoTourResponse = await response.json()

      if (data.ok) {
        onSuccess(data)
      } else {
        setError(data.error || "Failed to schedule. Please try again.")
      }
    } catch (err) {
      console.error("Failed to schedule video tour:", err)
      setError("Connection error. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Vehicle Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <p className="text-sm font-semibold">{vehicleName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            Join a live Google Meet video tour with our sales team
          </p>
          <div className="flex items-center gap-1.5 mt-2">
            <div className={`w-2 h-2 rounded-full ${isOpen ? "bg-green-500" : "bg-amber-500"}`} />
            <span className="text-xs text-muted-foreground">
              {isOpen ? "We're open now" : "Currently closed"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Form Fields */}
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">
            Your Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            required
            value={formData.customerName}
            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
            placeholder="John Smith"
            className="h-12 text-base"
            autoComplete="name"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-sm font-medium">
            Email <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            required
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            placeholder="john@example.com"
            className="h-12 text-base"
            autoComplete="email"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-sm font-medium">
            Phone <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            required
            value={formData.customerPhone}
            onChange={(e) =>
              setFormData({ ...formData, customerPhone: formatPhoneNumber(e.target.value) })
            }
            placeholder="(416) 985-2277"
            className="h-12 text-base"
            autoComplete="tel"
          />
        </div>

        {/* Date & Time Picker */}
        <DateSlotPicker
          selectedDate={formData.selectedDate}
          selectedTime={formData.selectedTime}
          onDateChange={(date) => setFormData({ ...formData, selectedDate: date })}
          onTimeChange={(time) => setFormData({ ...formData, selectedTime: time })}
        />

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-sm font-medium">
            Questions or Special Requests
          </Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="I'd like to see the trunk space, back seats, any scratches..."
            rows={3}
            className="text-base resize-none"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="pt-2 space-y-3">
        <Button
          type="submit"
          className="w-full h-12 text-base font-semibold"
          disabled={isSubmitting || !isFormValid}
        >
          {isSubmitting ? "Scheduling..." : "Schedule Video Tour"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Free service. You&apos;ll receive a Google Meet link via email.
        </p>
      </div>
    </form>
  )
}
