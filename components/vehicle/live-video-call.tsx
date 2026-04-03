"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Video, Calendar, Check, Clock, MapPin } from "lucide-react"

interface LiveVideoCallProps {
  vehicleId: string
  vehicleName: string
  variant?: "default" | "prominent"
}

export function LiveVideoCall({ vehicleId, vehicleName, variant = "default" }: LiveVideoCallProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [callData, setCallData] = useState<{ callId: string; joinLink: string } | null>(null)

  const [formData, setFormData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    preferredTime: "",
    notes: "",
  })

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

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

  const resetForm = () => {
    setIsSuccess(false)
    setFormData({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      preferredTime: "",
      notes: "",
    })
    setCallData(null)
  }

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Reset after closing
      setTimeout(resetForm, 300)
    }
  }

  // Trigger button styles
  const triggerButton = (
    <Button 
      variant={variant === "prominent" ? "default" : "outline"} 
      className={`w-full gap-2 min-h-[44px] ${variant === "prominent" ? "bg-primary hover:bg-primary/90" : ""}`}
    >
      <Video className="w-5 h-5" />
      Schedule Live Video Tour
    </Button>
  )

  // Form content (shared between mobile drawer and desktop dialog)
  const formContent = !isSuccess ? (
    <form onSubmit={handleSubmit} className="space-y-4 px-1">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-3">
          <p className="text-sm font-semibold">{vehicleName}</p>
          <p className="text-xs text-muted-foreground mt-1">
            A sales rep will walk you around this vehicle live via video call
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-medium">Your Name <span className="text-destructive">*</span></Label>
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
          <Label htmlFor="email" className="text-sm font-medium">Email <span className="text-destructive">*</span></Label>
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
          <Label htmlFor="phone" className="text-sm font-medium">Phone <span className="text-destructive">*</span></Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            required
            value={formData.customerPhone}
            onChange={(e) => setFormData({ ...formData, customerPhone: formatPhoneNumber(e.target.value) })}
            placeholder="(416) 985-2277"
            className="h-12 text-base"
            autoComplete="tel"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="time" className="text-sm font-medium">Preferred Date & Time <span className="text-destructive">*</span></Label>
          <Input
            id="time"
            type="datetime-local"
            required
            value={formData.preferredTime}
            onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
            min={new Date().toISOString().slice(0, 16)}
            className="h-12 text-base"
          />
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Available Mon-Sat, 9am - 7pm EST
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes" className="text-sm font-medium">Questions or Special Requests</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="I'd like to see the trunk space, back seats, and any scratches..."
            rows={3}
            className="text-base resize-none"
          />
        </div>
      </div>

      <div className="pt-2 space-y-3">
        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isSubmitting}>
          {isSubmitting ? "Scheduling..." : "Schedule Video Tour"}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Free service. A sales rep will video call you at the scheduled time.
        </p>
      </div>
    </form>
  ) : (
    <div className="text-center py-6 space-y-5 px-1">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-xl">Video Tour Scheduled!</h3>
        <p className="text-sm text-muted-foreground">
          We&apos;ll send you a confirmation email with the video call join link.
        </p>
      </div>
      <Card className="text-left bg-muted/50">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">{new Date(formData.preferredTime).toLocaleDateString("en-CA", { weekday: "long", month: "long", day: "numeric" })}</p>
              <p className="text-sm text-muted-foreground">{new Date(formData.preferredTime).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" })}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">{vehicleName}</p>
              <p className="text-xs text-muted-foreground font-mono">Booking ID: {callData?.callId}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">Planet Motors</p>
              <p className="text-sm text-muted-foreground">Virtual tour from our showroom</p>
            </div>
          </div>
        </CardContent>
      </Card>
      <Button onClick={() => handleOpenChange(false)} className="w-full h-12 text-base">
        Done
      </Button>
    </div>
  )

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={handleOpenChange}>
        <DrawerTrigger asChild>
          {triggerButton}
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="flex items-center gap-2 text-lg">
              <Video className="w-5 h-5 text-primary" />
              Live Video Tour
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-4 pb-8">
            {formContent}
          </div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Use Dialog (centered modal)
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {triggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Live Video Tour
          </DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  )
}
