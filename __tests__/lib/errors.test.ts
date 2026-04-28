import { describe, it, expect } from "vitest"
import {
  VehicleNotFoundError,
  BlogPostNotFoundError,
  ResourceNotFoundError,
  ValidationError,
  MissingEnvError,
  SanityFetchError,
  TypesenseFetchError,
  SupabaseFetchError,
  StripeFetchError,
  ExternalApiError,
  UnauthorizedError,
  ForbiddenError,
  RateLimitError,
  InternalError,
  errorResponse,
  isAppError,
  AppError,
} from "@/lib/errors"

describe("AppError subclasses", () => {
  it("VehicleNotFoundError has 404 + identifier context", () => {
    const e = new VehicleNotFoundError("VIN123")
    expect(e.statusCode).toBe(404)
    expect(e.reportable).toBe(false)
    expect(e.context).toEqual({ identifier: "VIN123" })
    expect(e.name).toBe("VehicleNotFoundError")
    expect(e.message).toContain("VIN123")
  })

  it("BlogPostNotFoundError has slug context", () => {
    const e = new BlogPostNotFoundError("how-to")
    expect(e.statusCode).toBe(404)
    expect(e.context).toEqual({ slug: "how-to" })
  })

  it("ResourceNotFoundError takes resource + identifier", () => {
    const e = new ResourceNotFoundError("Order", "abc")
    expect(e.statusCode).toBe(404)
    expect(e.context).toEqual({ resource: "Order", identifier: "abc" })
  })

  it("ValidationError carries field", () => {
    const e = new ValidationError("email", "invalid format")
    expect(e.statusCode).toBe(422)
    expect(e.field).toBe("email")
    expect(e.context).toEqual({ field: "email" })
  })

  it("MissingEnvError reports", () => {
    const e = new MissingEnvError("STRIPE_SECRET_KEY")
    expect(e.statusCode).toBe(500)
    expect(e.reportable).toBe(true)
    expect(e.context).toEqual({ varName: "STRIPE_SECRET_KEY" })
  })

  it.each([
    [SanityFetchError, "blog"],
    [TypesenseFetchError, "search"],
    [SupabaseFetchError, "select"],
    [StripeFetchError, "checkout"],
  ])("%s wraps cause + reports", (Klass, label) => {
    const cause = new Error("boom")
    const e = new (Klass as new (...a: unknown[]) => AppError)(label, cause)
    expect(e.statusCode).toBe(502)
    expect(e.reportable).toBe(true)
    expect(e.cause).toBe(cause)
    expect(e.context.cause).toBe("boom")
  })

  it("ExternalApiError captures http status", () => {
    const e = new ExternalApiError("Imgix", 503, new Error("timeout"))
    expect(e.statusCode).toBe(502)
    expect(e.context.httpStatus).toBe(503)
  })

  it("ExternalApiError handles non-Error cause", () => {
    const e = new ExternalApiError("Imgix", 503, "string cause")
    expect(e.context.cause).toBe("string cause")
  })

  it("Unauthorized + Forbidden default messages", () => {
    expect(new UnauthorizedError().statusCode).toBe(401)
    expect(new ForbiddenError().statusCode).toBe(403)
    expect(new UnauthorizedError().reportable).toBe(false)
  })

  it("RateLimitError uses 429", () => {
    expect(new RateLimitError("login").statusCode).toBe(429)
  })

  it("InternalError defaults to reportable + 500", () => {
    const e = new InternalError("kaboom", new Error("inner"))
    expect(e.statusCode).toBe(500)
    expect(e.reportable).toBe(true)
    expect(e.cause).toBeInstanceOf(Error)
  })

  it("InternalError without a cause works", () => {
    const e = new InternalError("kaboom")
    expect(e.statusCode).toBe(500)
  })
})

describe("errorResponse", () => {
  it("maps AppError to its statusCode + JSON body", async () => {
    const e = new VehicleNotFoundError("VIN")
    const res = errorResponse(e)
    expect(res.status).toBe(404)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.error).toContain("VIN")
    expect(body.type).toBe("VehicleNotFoundError")
  })

  it("includes field for ValidationError", async () => {
    const res = errorResponse(new ValidationError("email", "bad"))
    expect(res.status).toBe(422)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.field).toBe("email")
  })

  it("falls back to 500 InternalError for unknown errors", async () => {
    const res = errorResponse(new Error("kaboom"))
    expect(res.status).toBe(500)
    const body = (await res.json()) as Record<string, unknown>
    expect(body.type).toBe("InternalError")
    expect(body.error).toBe("kaboom")
  })

  it("falls back to a generic message for non-Error throws", async () => {
    const res = errorResponse({ weird: true })
    const body = (await res.json()) as Record<string, unknown>
    expect(body.error).toBe("An unexpected error occurred")
  })
})

describe("isAppError type guard", () => {
  it("returns true for matching subclass", () => {
    expect(isAppError(new RateLimitError("x"), RateLimitError)).toBe(true)
  })

  it("returns false for non-matching errors", () => {
    expect(isAppError(new Error("x"), RateLimitError)).toBe(false)
    expect(
      isAppError(new VehicleNotFoundError("x"), RateLimitError)
    ).toBe(false)
  })
})
