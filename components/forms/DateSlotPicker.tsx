"use client"

import { useState, useEffect } from "react"
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
}: Readonly<DateSlotPickerProps>) {
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
        <Label className="text-sm font-semibold">
          Select Date <span className="text-destructive">*</span>
        </Label>
        <select
          value={selectedDate}
          onChange={(e) => handleDateChange(e.target.value)}
          disabled={disabled || loading}
          className="w-full h-12 rounded-md border border-input bg-background px-3 text-base"
        >
          <option value="" disabled>
            {loading ? "Loading..." : "Choose a date"}
          </option>
          {availability.length > 0 ? (
            availability.map(({ date, dayLabel }) => (
              <option key={date} value={date}>
                {dayLabel}
              </option>
            ))
          ) : (
            <option value="" disabled>No dates available right now</option>
          )}
        </select>
        {selectedDate && (
          <p className="text-sm text-green-600 font-semibold mt-1">
            Selected: {availability.find(a => a.date === selectedDate)?.dayLabel}
          </p>
        )}
      </div>

      {/* Time Slot Selection */}
      <div className="space-y-1.5">
        <Label className="text-sm font-semibold">
          Select Time <span className="text-destructive">*</span>
        </Label>
        <select
          value={selectedTime}
          onChange={(e) => onTimeChange(e.target.value)}
          disabled={disabled || !selectedDate}
          className="w-full h-12 rounded-md border border-input bg-background px-3 text-base"
        >
          <option value="" disabled>
            {(() => {
              if (!selectedDate) return "Select date first"
              if (slots.length === 0) return "No slots available"
              return "Choose a time"
            })()}
          </option>
          {slots.map(({ time, label }) => (
            <option key={time} value={time}>
              {label}
            </option>
          ))}
        </select>
        {selectedTime && (
          <p className="text-sm text-green-600 font-semibold mt-1">
            Selected: {slots.find(s => s.time === selectedTime)?.label}
          </p>
        )}
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {BUSINESS_HOURS_DISPLAY}
        </p>
      </div>
    </div>
  )
}
