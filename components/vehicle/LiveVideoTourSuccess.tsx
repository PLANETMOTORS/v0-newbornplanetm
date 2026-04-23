"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Check, Calendar, Video, MapPin, MessageCircle } from "lucide-react"
import { DEALERSHIP_TIMEZONE } from "@/lib/liveVideoTour/constants"
import type { LiveVideoTourProvider } from "@/types/liveVideoTour"

interface LiveVideoTourSuccessProps {
  vehicleName: string
  bookingId: string
  scheduledTime: string
  joinUrl?: string
  provider?: LiveVideoTourProvider
  onClose: () => void
}

export function LiveVideoTourSuccess({
  vehicleName,
  bookingId,
  scheduledTime,
  joinUrl,
  provider = "google_meet",
  onClose,
}: LiveVideoTourSuccessProps) {
  const scheduledDate = new Date(scheduledTime)

  // Provider-specific display info
  const providerInfo = {
    google_meet: {
      name: "Google Meet",
      emailText: "Check your email for the Google Meet join link.",
      showroomText: "Live from our showroom via Google Meet",
      buttonText: "Save Meet Link",
    },
    zoom: {
      name: "Zoom",
      emailText: "Check your email for the Zoom meeting link.",
      showroomText: "Live from our showroom via Zoom",
      buttonText: "Save Zoom Link",
    },
    whatsapp: {
      name: "WhatsApp",
      emailText: "We'll video call your WhatsApp at the scheduled time.",
      showroomText: "Live from our showroom via WhatsApp Video",
      buttonText: "Open WhatsApp",
    },
  }

  const info = providerInfo[provider]

  const formattedDate = scheduledDate.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: DEALERSHIP_TIMEZONE,
  })

  const formattedTime = scheduledDate.toLocaleTimeString("en-CA", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: DEALERSHIP_TIMEZONE,
  })

  return (
    <div className="text-center py-6 space-y-5">
      {/* Success Icon */}
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <Check className="w-10 h-10 text-green-600 dark:text-green-400" />
      </div>

      {/* Success Message */}
      <div className="space-y-2">
        <h3 className="font-bold text-xl">Video Tour Scheduled!</h3>
        <p className="text-sm text-muted-foreground">
          {info.emailText}
        </p>
      </div>

      {/* Booking Details Card */}
      <Card className="text-left bg-muted/50">
        <CardContent className="pt-4 pb-4 space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">{formattedDate}</p>
              <p className="text-sm text-muted-foreground">{formattedTime} EST</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Video className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">{vehicleName}</p>
              <p className="text-xs text-muted-foreground font-mono">Booking ID: {bookingId}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">Planet Motors</p>
              <p className="text-sm text-muted-foreground">{info.showroomText}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="space-y-2">
        {joinUrl && provider !== "whatsapp" && (
          <Button
            variant="outline"
            className="w-full h-12 text-base"
            onClick={() => window.open(joinUrl, "_blank")}
          >
            <Video className="w-4 h-4 mr-2" />
            {info.buttonText}
          </Button>
        )}
        {provider === "whatsapp" && (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-300">
              Keep your phone handy - we&apos;ll call you on WhatsApp!
            </p>
          </div>
        )}
        <Button onClick={onClose} className="w-full h-12 text-base">
          Done
        </Button>
      </div>
    </div>
  )
}
