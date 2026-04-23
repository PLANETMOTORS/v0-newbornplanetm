import { NextResponse } from "next/server"

/**
 * Standard error codes for API responses.
 */
export const ErrorCode = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  CONFIG_ERROR: "CONFIG_ERROR",
} as const

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode]

/**
 * Return a standardized success response.
 *
 * Shape: `{ success: true, data: T }`
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

/**
 * Return a standardized error response.
 *
 * Shape: `{ success: false, error: { code, message, details? } }`
 */
export function apiError(
  code: string,
  message: string,
  status = 500,
  details?: unknown,
) {
  return NextResponse.json(
    {
      success: false,
      error: { code, message, ...(details !== undefined && { details }) },
    },
    { status },
  )
}
