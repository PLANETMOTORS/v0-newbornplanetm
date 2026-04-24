/**
 * lib/errors.ts
 *
 * Structured error taxonomy for Planet Motors.
 *
 * Every error thrown in the application should be one of these typed classes.
 * This enables:
 *   - Sentry fingerprinting by error type (not just message)
 *   - Structured logging with consistent context fields
 *   - Typed catch blocks that can distinguish recoverable vs fatal errors
 *   - Automatic HTTP status code mapping in API routes
 *
 * Usage:
 *   throw new VehicleNotFoundError(vin)
 *   throw new SanityFetchError("blog posts", cause)
 *   throw new ValidationError("email", "Invalid format")
 *
 * In API routes:
 *   catch (err) {
 *     return errorResponse(err)  // maps to correct HTTP status
 *   }
 */

// ── Base ───────────────────────────────────────────────────────────────────

/**
 * Base class for all Planet Motors application errors.
 * Sets `name` to the class name for Sentry fingerprinting.
 */
export abstract class AppError extends Error {
  /** HTTP status code to use when this error reaches an API route handler */
  abstract readonly statusCode: number
  /** Whether this error should be reported to Sentry (false = expected/user error) */
  readonly reportable: boolean = true
  /** Structured context for Sentry extra data */
  readonly context: Record<string, unknown>

  constructor(message: string, context: Record<string, unknown> = {}) {
    super(message)
    this.name = this.constructor.name
    this.context = context
    // Maintains proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

// ── Not Found ──────────────────────────────────────────────────────────────

export class VehicleNotFoundError extends AppError {
  readonly statusCode = 404
  readonly reportable = false

  constructor(identifier: string) {
    super(`Vehicle not found: ${identifier}`, { identifier })
  }
}

export class BlogPostNotFoundError extends AppError {
  readonly statusCode = 404
  readonly reportable = false

  constructor(slug: string) {
    super(`Blog post not found: ${slug}`, { slug })
  }
}

export class ResourceNotFoundError extends AppError {
  readonly statusCode = 404
  readonly reportable = false

  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, { resource, identifier })
  }
}

// ── Validation ─────────────────────────────────────────────────────────────

export class ValidationError extends AppError {
  readonly statusCode = 422
  readonly reportable = false
  readonly field: string

  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`, { field })
    this.field = field
  }
}

export class MissingEnvError extends AppError {
  readonly statusCode = 500
  readonly reportable = true

  constructor(varName: string) {
    super(`Required environment variable is not set: ${varName}`, { varName })
  }
}

// ── External Services ──────────────────────────────────────────────────────

export class SanityFetchError extends AppError {
  readonly statusCode = 502
  readonly reportable = true

  constructor(resource: string, cause?: unknown) {
    super(
      `Failed to fetch ${resource} from Sanity CMS`,
      { resource, cause: cause instanceof Error ? cause.message : String(cause) }
    )
    if (cause instanceof Error) this.cause = cause
  }
}

export class TypesenseFetchError extends AppError {
  readonly statusCode = 502
  readonly reportable = true

  constructor(query: string, cause?: unknown) {
    super(
      `Typesense search failed for query: ${query}`,
      { query, cause: cause instanceof Error ? cause.message : String(cause) }
    )
    if (cause instanceof Error) this.cause = cause
  }
}

export class SupabaseFetchError extends AppError {
  readonly statusCode = 502
  readonly reportable = true

  constructor(operation: string, cause?: unknown) {
    super(
      `Supabase operation failed: ${operation}`,
      { operation, cause: cause instanceof Error ? cause.message : String(cause) }
    )
    if (cause instanceof Error) this.cause = cause
  }
}

export class StripeFetchError extends AppError {
  readonly statusCode = 502
  readonly reportable = true

  constructor(operation: string, cause?: unknown) {
    super(
      `Stripe operation failed: ${operation}`,
      { operation, cause: cause instanceof Error ? cause.message : String(cause) }
    )
    if (cause instanceof Error) this.cause = cause
  }
}

export class ExternalApiError extends AppError {
  readonly statusCode = 502
  readonly reportable = true

  constructor(service: string, statusCode: number, cause?: unknown) {
    super(
      `External API error from ${service}: HTTP ${statusCode}`,
      { service, httpStatus: statusCode, cause: cause instanceof Error ? cause.message : String(cause) }
    )
    if (cause instanceof Error) this.cause = cause
  }
}

// ── Auth ───────────────────────────────────────────────────────────────────

export class UnauthorizedError extends AppError {
  readonly statusCode = 401
  readonly reportable = false

  constructor(message = "Authentication required") {
    super(message)
  }
}

export class ForbiddenError extends AppError {
  readonly statusCode = 403
  readonly reportable = false

  constructor(message = "Access denied") {
    super(message)
  }
}

// ── Rate Limiting ──────────────────────────────────────────────────────────

export class RateLimitError extends AppError {
  readonly statusCode = 429
  readonly reportable = false

  constructor(resource: string) {
    super(`Rate limit exceeded for: ${resource}`, { resource })
  }
}

// ── Internal ───────────────────────────────────────────────────────────────

export class InternalError extends AppError {
  readonly statusCode = 500
  readonly reportable = true

  constructor(message: string, cause?: unknown) {
    super(message, { cause: cause instanceof Error ? cause.message : String(cause) })
    if (cause instanceof Error) this.cause = cause
  }
}

// ── API Route Helper ───────────────────────────────────────────────────────

/**
 * Maps an AppError (or unknown error) to a Next.js API Response object.
 *
 * Usage in API routes:
 *   import { errorResponse } from "@/lib/errors"
 *   catch (err) { return errorResponse(err) }
 */
export function errorResponse(err: unknown): Response {
  if (err instanceof AppError) {
    return Response.json(
      { error: err.message, type: err.name, ...(err.field ? { field: (err as ValidationError).field } : {}) },
      { status: err.statusCode }
    )
  }

  // Unknown error — treat as 500
  const message = err instanceof Error ? err.message : "An unexpected error occurred"
  return Response.json({ error: message, type: "InternalError" }, { status: 500 })
}

/**
 * Type guard — checks if an error is an AppError of a specific type.
 */
export function isAppError<T extends AppError>(
  err: unknown,
  ErrorClass: new (...args: never[]) => T
): err is T {
  return err instanceof ErrorClass
}
