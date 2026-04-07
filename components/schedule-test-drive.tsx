"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Clock, MapPin, Car, CheckCircle, Phone, AlertCircle } from "lucide-react"
import { isValidEmail, isValidCanadianPhone, formatCanadianPhone, isValidCanadianPostalCode, formatCanadianPostalCode } from "@/lib/form-validation"

interface ScheduleTestDriveProps {
  vehicleTitle: string
  vehicleId: string
  trigger?: React.ReactNode
}

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"
]

const locations = [
  { id: "richmond-hill", name: "Richmond Hill Showroom", address: "30 Major Mackenzie E, Richmond Hill, ON" },
  { id: "home", name: "At Your Home/Office", address: "We come to you (GTA only)" },
]

export function ScheduleTestDrive({ vehicleTitle, vehicleId, trigger }: ScheduleTestDriveProps) {
  const [step, setStep] = useState(1)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [availableDates, setAvailableDates] = useState<string[]>([])
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    postalCode: "",
    date: "",
    time: "",
    location: "richmond-hill",
    notes: "",
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateField = (field: string, value: string) => {
    const errors = { ...validationErrors }
    if (field === "email") {
      errors.email = value && !isValidEmail(value) ? "Enter valid email" : ""
    } else if (field === "phone") {
      errors.phone = value && !isValidCanadianPhone(value) ? "Enter valid 10-digit phone" : ""
    } else if (field === "postalCode") {
      errors.postalCode = value && !isValidCanadianPostalCode(value) ? "Enter valid postal code" : ""
    }
    setValidationErrors(errors)
  }

  const isFormComplete = () => {
    return formData.firstName && formData.lastName &&
      formData.email && isValidEmail(formData.email) &&
      formData.phone && isValidCanadianPhone(formData.phone) &&
      formData.postalCode && isValidCanadianPostalCode(formData.postalCode) &&
      formData.date && formData.time
  }

  // Generate dates on client only to avoid hydration mismatch
  useEffect(() => {
    const dates = []
    for (let i = 1; i <= 14; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      if (date.getDay() !== 0) {
        dates.push(date.toISOString().split("T")[0])
      }
    }
    setAvailableDates(dates)
  }, [])

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError("")
    
    try {
      const response = await fetch("/api/video-call/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: `${formData.firstName} ${formData.lastName}`,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          vehicleId: vehicleId,
          vehicleName: vehicleTitle,
          preferredTime: `${formData.date} at ${formData.time}`,
          notes: `Location: ${locations.find(l => l.id === formData.location)?.name}. ${formData.notes}`,
          type: "test_drive",
        }),
      })
      
      if (!response.ok) throw new Error("Failed to schedule test drive")
      
      setIsSubmitted(true)
    } catch {
      setError("Failed to schedule. Please call us at 1-866-797-3332 or visit our Contact page.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    let formatted = value
    if (field === "phone") formatted = formatCanadianPhone(value)
    else if (field === "postalCode") formatted = formatCanadianPostalCode(value)
    setFormData(prev => ({ ...prev, [field]: formatted }))
    validateField(field, formatted)
  }

  

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })
  }

  if (isSubmitted) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {trigger || (
            <Button size="lg" className="gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Test Drive
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <DialogTitle className="text-xl mb-2">Test Drive Confirmed!</DialogTitle>
            <DialogDescription className="mb-4">
              Your test drive for the {vehicleTitle} has been scheduled.
            </DialogDescription>
            <div className="bg-muted p-4 rounded-lg text-left space-y-2 text-sm">
              <p><strong>Date:</strong> {formatDate(formData.date)}</p>
              <p><strong>Time:</strong> {formData.time}</p>
              <p><strong>Location:</strong> {locations.find(l => l.id === formData.location)?.name}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              A confirmation email has been sent to {formData.email}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="lg" className="gap-2">
            <Calendar className="w-5 h-5" />
            Schedule Test Drive
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5" />
            Schedule a Test Drive
          </DialogTitle>
          <DialogDescription>
            {vehicleTitle}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Select Date & Time
              </h3>
              
              {/* Date Selection */}
              <div>
                <Label>Preferred Date</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {availableDates.slice(0, 6).map(date => (
                    <button
                      key={date}
                      type="button"
                      onClick={() => handleInputChange("date", date)}
                      className={`p-3 text-sm border rounded-lg transition-colors ${
                        formData.date === date
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:border-primary"
                      }`}
                    >
                      {formatDate(date)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <Label>Preferred Time</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleInputChange("time", time)}
                      className={`p-2 text-sm border rounded-lg transition-colors ${
                        formData.time === time
                          ? "bg-primary text-primary-foreground border-primary"
                          : "hover:border-primary"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location Selection */}
              <div>
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Location
                </Label>
                <div className="space-y-2 mt-2">
                  {locations.map(loc => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleInputChange("location", loc.id)}
                      className={`w-full p-3 text-left border rounded-lg transition-colors ${
                        formData.location === loc.id
                          ? "bg-primary/10 border-primary"
                          : "hover:border-primary"
                      }`}
                    >
                      <p className="font-medium">{loc.name}</p>
                      <p className="text-sm text-muted-foreground">{loc.address}</p>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                className="w-full"
                onClick={() => setStep(2)}
                disabled={!formData.date || !formData.time}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Your Contact Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone Number <span className="text-destructive">*</span></Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(416) 985-2277"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className={validationErrors.phone ? "border-destructive" : ""}
                  required
                />
                {validationErrors.phone && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="postalCode">Postal Code <span className="text-destructive">*</span></Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="M5V 3L9"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange("postalCode", e.target.value)}
                  className={validationErrors.postalCode ? "border-destructive" : ""}
                  maxLength={7}
                  required
                />
                {validationErrors.postalCode && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {validationErrors.postalCode}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <textarea
                  id="notes"
                  className="w-full min-h-[80px] px-3 py-2 border rounded-lg bg-background resize-none"
                  placeholder="Any special requests or questions?"
                  value={formData.notes}
                  onChange={(e) => handleInputChange("notes", e.target.value)}
                />
              </div>

              {/* Summary */}
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Test Drive Summary</p>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>{vehicleTitle}</p>
                  <p>{formatDate(formData.date)} at {formData.time}</p>
                  <p>{locations.find(l => l.id === formData.location)?.name}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!isFormComplete() || isSubmitting}
                >
                  {isSubmitting ? "Scheduling..." : "Confirm Test Drive"}
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
