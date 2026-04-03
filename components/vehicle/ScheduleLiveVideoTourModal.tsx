"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer"
import { Video } from "lucide-react"
import { LiveVideoTourForm } from "@/components/forms/LiveVideoTourForm"
import { LiveVideoTourSuccess } from "./LiveVideoTourSuccess"
import type { LiveVideoTourResponse } from "@/types/liveVideoTour"

interface ScheduleLiveVideoTourModalProps {
  vehicleId: string
  vehicleName: string
  variant?: "default" | "prominent"
}

export function ScheduleLiveVideoTourModal({
  vehicleId,
  vehicleName,
  variant = "default",
}: ScheduleLiveVideoTourModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [successData, setSuccessData] = useState<LiveVideoTourResponse | null>(null)

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleSuccess = (data: LiveVideoTourResponse) => {
    setSuccessData(data)
  }

  const handleClose = () => {
    setIsOpen(false)
    // Reset after animation completes
    setTimeout(() => setSuccessData(null), 300)
  }

  // Trigger button
  const triggerButton = (
    <Button
      variant={variant === "prominent" ? "default" : "outline"}
      className={`w-full gap-2 min-h-[44px] ${
        variant === "prominent" ? "bg-primary hover:bg-primary/90" : ""
      }`}
    >
      <Video className="w-5 h-5" />
      Schedule Live Video Tour
    </Button>
  )

  // Content (form or success state)
  const content = successData ? (
    <LiveVideoTourSuccess
      vehicleName={vehicleName}
      bookingId={successData.bookingId || ""}
      scheduledTime={successData.scheduledTime || ""}
      joinUrl={successData.joinUrl}
      onClose={handleClose}
    />
  ) : (
    <LiveVideoTourForm vehicleId={vehicleId} vehicleName={vehicleName} onSuccess={handleSuccess} />
  )

  // Mobile: Bottom sheet (Drawer)
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerTrigger asChild>{triggerButton}</DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="border-b pb-4">
            <DrawerTitle className="flex items-center gap-2 text-lg">
              <Video className="w-5 h-5 text-primary" />
              Schedule Live Video Tour
            </DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 py-4 pb-8">{content}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  // Desktop: Centered modal (Dialog)
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Schedule Live Video Tour
          </DialogTitle>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  )
}
