"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Calendar, Clock, MapPin, Video, Home, CheckCircle2 } from "lucide-react"

const timeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
]

const appointmentTypes = [
  {
    id: "dealership",
    icon: MapPin,
    title: "At Dealership",
    description: "Visit our Richmond Hill showroom"
  },
  {
    id: "home",
    icon: Home,
    title: "Home Test Drive",
    description: "We bring the car to you"
  },
  {
    id: "virtual",
    icon: Video,
    title: "Virtual Tour",
    description: "Live video walkthrough"
  }
]

export default function SchedulePage() {
  const [step, setStep] = useState(1)
  const [appointmentType, setAppointmentType] = useState("dealership")
  const [selectedDate, setSelectedDate] = useState("")
  const [selectedTime, setSelectedTime] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main id="main-content" tabIndex={-1} className="pt-32 pb-16">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-[-0.01em] mb-4">Appointment Confirmed!</h1>
            <p className="text-muted-foreground mb-8">
              We&apos;ve sent a confirmation email with all the details. Our team will contact you shortly 
              to confirm your appointment.
            </p>
            <Card className="text-left mb-8">
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <span>{selectedDate || "March 30, 2026"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <span>{selectedTime || "2:00 PM"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <span>30 Major Mackenzie Dr E, Richmond Hill, ON L4C 1G7</span>
                </div>
              </CardContent>
            </Card>
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => setSubmitted(false)}>
                Schedule Another
              </Button>
              <Button asChild>
                <a href="/inventory">Continue Browsing</a>
              </Button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" tabIndex={-1} className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold tracking-[-0.01em] text-foreground mb-2">
                Schedule a Test Drive
              </h1>
              <p className="text-muted-foreground">
                Choose how you&apos;d like to experience your next vehicle
              </p>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center justify-center gap-4 mb-12">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {s}
                  </div>
                  {s < 3 && <div className={`w-16 h-1 mx-2 ${step > s ? "bg-primary" : "bg-muted"}`} />}
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              {/* Step 1: Appointment Type */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-center mb-6">
                    How would you like to test drive?
                  </h2>
                  <RadioGroup 
                    value={appointmentType} 
                    onValueChange={setAppointmentType}
                    className="grid md:grid-cols-3 gap-4"
                  >
                    {appointmentTypes.map((type) => (
                      <Card 
                        key={type.id}
                        className={`cursor-pointer transition-all ${
                          appointmentType === type.id ? "border-primary ring-2 ring-primary/20" : ""
                        }`}
                        onClick={() => setAppointmentType(type.id)}
                      >
                        <CardContent className="p-6 text-center">
                          <RadioGroupItem value={type.id} id={type.id} className="sr-only" />
                          <type.icon className={`w-10 h-10 mx-auto mb-4 ${
                            appointmentType === type.id ? "text-primary" : "text-muted-foreground"
                          }`} />
                          <h3 className="font-semibold mb-1">{type.title}</h3>
                          <p className="text-sm text-muted-foreground">{type.description}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </RadioGroup>
                  <div className="flex justify-end">
                    <Button type="button" onClick={() => setStep(2)}>
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Date & Time */}
              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-center mb-6">
                    Select Date & Time
                    {appointmentType === "virtual" && (
                      <span className="block text-sm font-normal text-muted-foreground mt-1">
                        Virtual Tour via Google Meet
                      </span>
                    )}
                  </h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <Label className="mb-3 block">Select Date</Label>
                      <Input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="cursor-pointer"
                      />
                      {!selectedDate && (
                        <p className="text-xs text-muted-foreground mt-2">Click to choose a date</p>
                      )}
                    </div>
                    <div>
                      <Label className="mb-3 block">Select Time</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {timeSlots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            className="min-h-[44px] cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              setSelectedTime(time)
                            }}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); setStep(1); }}>
                      Back
                    </Button>
                    <Button 
                      type="button" 
                      onClick={(e) => { e.preventDefault(); setStep(3); }}
                      disabled={!selectedDate || !selectedTime}
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Contact Info */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold text-center mb-6">
                    Your Information
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" required />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" type="tel" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehicle">Vehicle of Interest (Optional)</Label>
                    <Input id="vehicle" placeholder="e.g., 2023 BMW X5" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes">Additional Notes (Optional)</Label>
                    <Textarea id="notes" placeholder="Any specific questions or requests?" />
                  </div>
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setStep(2)}>
                      Back
                    </Button>
                    <Button type="submit">
                      Confirm Appointment
                    </Button>
                  </div>
                </div>
              )}
            </form>

            {/* Info Card */}
            <Card className="mt-12 bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Nationwide Delivery Across Canada</CardTitle>
                <CardDescription>
                  Can&apos;t visit us in person? We deliver anywhere in Canada!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    FREE delivery within 300km of Richmond Hill
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    Coast-to-coast delivery from BC to Newfoundland
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    10-day money-back guarantee on all deliveries
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
