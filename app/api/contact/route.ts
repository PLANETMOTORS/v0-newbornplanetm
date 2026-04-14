import { sendNotificationEmail } from "@/lib/email"
import { rateLimit } from "@/lib/redis"
import { isValidEmail, isValidCanadianPhoneNumber, isValidCanadianPostalCode } from "@/lib/validation"
import { validateOrigin } from "@/lib/csrf"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"

export async function POST(request: Request) {
  try {
    if (!validateOrigin(request)) {
      return apiError(ErrorCode.FORBIDDEN, "Forbidden", 403)
    }
    const forwarded = request.headers.get("x-forwarded-for") || ""
    const ip = forwarded.split(",")[0]?.trim() || "unknown"
    const limiter = await rateLimit(`contact:${ip}`, 5, 3600)
    if (!limiter.success) {
      return apiError(ErrorCode.RATE_LIMITED, "Too many requests. Please try again later.", 429)
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, postalCode, subject, message } = body

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !postalCode || !message) {
      return apiError(ErrorCode.VALIDATION_ERROR, "All fields are required", 400)
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Invalid email format", 400)
    }

    // Validate phone
    if (!isValidCanadianPhoneNumber(phone)) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Invalid phone number", 400)
    }

    // Validate Canadian postal code
    if (!isValidCanadianPostalCode(postalCode)) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Invalid Canadian postal code", 400)
    }

    // Send email notification
    await sendNotificationEmail({
      type: "vehicle_inquiry",
      customerName: `${firstName} ${lastName}`,
      customerEmail: email,
      customerPhone: phone,
      additionalData: {
        subject: subject || "General Inquiry",
        message,
        postalCode,
        source: "Contact Form",
      },
    })

    return apiSuccess({
      message: "Your message has been sent. We'll respond within 2 hours.",
    })
  } catch (error) {
    console.error("Contact form error:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to send message")
  }
}
