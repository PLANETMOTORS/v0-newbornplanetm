"use client"

import { useState, useEffect, useMemo } from "react"
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
import { Calendar, Clock, MapPin, Car, CheckCircle, Phone } from "lucide-react"

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
    date: "",
    time: "",
    location: "richmond-hill",
    notes: "",
  })

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, this would submit to an API
    setIsSubmitted(true)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
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
                <div className="grid grid-cols-4 gap-2 mt-2">
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
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(416) 555-0123"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                />
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
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone}
                >
                  Confirm Test Drive
                </Button>
              </div>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  )
}
