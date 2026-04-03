import { z } from "zod"

// Shared validation schema - used on both client and server
export const liveVideoTourRequestSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle ID is required"),
  vehicleName: z.string().min(1, "Vehicle name is required"),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email address"),
  customerPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  preferredTime: z.string().min(1, "Please select a time slot"),
  timezone: z.string().default("America/Toronto"),
  notes: z.string().optional(),
})

export type LiveVideoTourRequestSchema = z.infer<typeof liveVideoTourRequestSchema>

// Phone number formatting helper
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "")
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`
}

// Phone validation for display
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "")
  return digits.length >= 10
}
