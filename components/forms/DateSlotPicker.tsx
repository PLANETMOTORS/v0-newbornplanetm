"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Clock } from "lucide-react"
import type { LiveVideoTourAvailability, LiveVideoTourSlot } from "@/types/liveVideoTour"
import { BUSINESS_HOURS_DISPLAY } from "@/lib/liveVideoTour/constants"

interface DateSlotPickerProps {
  selectedDate: string
  selectedTime: string
  onDateChange: (date: string) => void
  onTimeChange: (time: string) => void
  disabled?: boolean
}

export function DateSlotPicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  disabled = false,
}: DateSlotPickerProps) {
  const [availability, setAvailability] = useState<LiveVideoTourAvailability[]>([])
  const [slots, setSlots] = useState<LiveVideoTourSlot[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch available dates on mount
  useEffect(() => {
    async function fetchAvailability() {
      try {
        const response = await fetch("/api/live-video-tour/availability")
        const data = await response.json()
        if (data.ok) {
          setAvailability(data.availability)
        }
      } catch (error) {
        console.error("Failed to fetch availability:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAvailability()
  }, [])

  // Update slots when date changes
  useEffect(() => {
    if (selectedDate) {
      const dateData = availability.find(a => a.date === selectedDate)
      setSlots(dateData?.slots.filter(s => s.available) || [])
    } else {
      setSlots([])
    }
  }, [selectedDate, availability])

  // Handle date change (reset time)
  const handleDateChange = (date: string) => {
    onDateChange(date)
    onTimeChange("") // Reset time when date changes
  }

  return (
    <div className="space-y-4">
      {/* Date Selection */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Select Date <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedDate}
          onValueChange={handleDateChange}
          disabled={disabled || loading}
        >
          <SelectTrigger className="h-12 text-base">
            <SelectValue placeholder={loading ? "Loading..." : "Choose a date"} />
          </SelectTrigger>
          <SelectContent>
            {availability.map(({ date, dayLabel }) => (
              <SelectItem key={date} value={date}>
                {dayLabel}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time Slot Selection */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">
          Select Time <span className="text-destructive">*</span>
        </Label>
        <Select
          value={selectedTime}
          onValueChange={onTimeChange}
          disabled={disabled || !selectedDate}
        >
          <SelectTrigger className="h-12 text-base">
            <SelectValue 
              placeholder={
                !selectedDate 
                  ? "Select date first" 
                  : slots.length === 0 
                    ? "No slots available" 
                    : "Choose a time"
              } 
            />
          </SelectTrigger>
          <SelectContent>
            {slots.map(({ time, label }) => (
              <SelectItem key={time} value={time}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {BUSINESS_HOURS_DISPLAY}
        </p>
      </div>
    </div>
  )
}
