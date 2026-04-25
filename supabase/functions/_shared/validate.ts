/**
 * Input validation helpers for Edge Functions.
 */

export interface CaptureLeadInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  annualIncome: number
  requestedAmount: number
  requestedTerm: number
}

export interface PrequalifyInput {
  annualIncome: number
  requestedAmount: number
  requestedTerm?: number
  monthlyRent?: number
  vehicleId?: string
}

export function validateCaptureLeadInput(
  body: Record<string, unknown>
): { data: CaptureLeadInput } | { error: string } {
  const { firstName, lastName, email, phone, annualIncome, requestedAmount, requestedTerm } = body

  if (!firstName || typeof firstName !== "string" || !firstName.trim()) {
    return { error: "firstName is required" }
  }
  if (!lastName || typeof lastName !== "string" || !lastName.trim()) {
    return { error: "lastName is required" }
  }
  if (!email || typeof email !== "string" || !email.trim()) {
    return { error: "email is required" }
  }
  // Safe regex: bounded quantifiers + dot-free domain labels eliminate backtracking (S2631).
  const emailStr = String(email)
  if (emailStr.length > 254 || !/^[^\s@]{1,64}@[^\s@.]{1,63}(?:\.[^\s@.]{1,63})+$/.test(emailStr)) {
    return { error: "Invalid email format" }
  }
  if (!phone || typeof phone !== "string" || !phone.trim()) {
    return { error: "phone is required" }
  }

  const parsedIncome = Number(annualIncome)
  const parsedAmount = Number(requestedAmount)
  const parsedTerm = Number(requestedTerm)

  if (!Number.isFinite(parsedIncome) || parsedIncome <= 0) {
    return { error: "annualIncome must be a positive number" }
  }
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return { error: "requestedAmount must be a positive number" }
  }
  if (!Number.isInteger(parsedTerm) || parsedTerm <= 0) {
    return { error: "requestedTerm must be a positive integer" }
  }

  return {
    data: {
      firstName: String(firstName).trim(),
      lastName: String(lastName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: String(phone).trim(),
      annualIncome: parsedIncome,
      requestedAmount: parsedAmount,
      requestedTerm: parsedTerm,
    },
  }
}

export function validatePrequalifyInput(
  body: Record<string, unknown>
): { data: PrequalifyInput } | { error: string } {
  const { annualIncome, requestedAmount, requestedTerm, monthlyRent, vehicleId } = body

  const parsedIncome = Number(annualIncome)
  const parsedAmount = Number(requestedAmount)

  if (!Number.isFinite(parsedIncome) || parsedIncome <= 0) {
    return { error: "annualIncome must be a positive number" }
  }
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return { error: "requestedAmount must be a positive number" }
  }

  return {
    data: {
      annualIncome: parsedIncome,
      requestedAmount: parsedAmount,
      requestedTerm: requestedTerm ? (() => { const n = Number(requestedTerm); return Number.isInteger(n) && n > 0 ? n : undefined })() : undefined,
      monthlyRent: monthlyRent ? (() => { const n = Number(monthlyRent); return Number.isFinite(n) && n >= 0 ? n : undefined })() : undefined,
      vehicleId: vehicleId ? String(vehicleId) : undefined,
    },
  }
}
