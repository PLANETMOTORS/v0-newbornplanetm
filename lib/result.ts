/**
 * Result<T, E> — discriminated-union return type for fallible operations.
 *
 * Why a Result type instead of throw/catch?
 *   - Errors are part of the function signature, not an out-of-band channel.
 *   - Callers cannot forget to handle the failure case (TS exhaustiveness).
 *   - No stack-unwinding overhead in the hot path; cheaper than try/catch.
 *   - Zero runtime allocation surprises — the shape is a plain object literal.
 *
 * Usage:
 *
 *     function parsePort(raw: string): Result<number, "not-a-number" | "out-of-range"> {
 *       const n = Number(raw)
 *       if (Number.isNaN(n)) return err("not-a-number")
 *       if (n < 1 || n > 65535) return err("out-of-range")
 *       return ok(n)
 *     }
 *
 *     const r = parsePort(input)
 *     if (!r.ok) return respond400(r.error)
 *     const port = r.value
 */

export type Ok<T> = { readonly ok: true; readonly value: T }
export type Err<E> = { readonly ok: false; readonly error: E }
export type Result<T, E> = Ok<T> | Err<E>

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value }
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error }
}

/** Map the success value through a pure function; pass errors through unchanged. */
export function mapResult<T, U, E>(r: Result<T, E>, f: (value: T) => U): Result<U, E> {
  return r.ok ? ok(f(r.value)) : r
}

/** Chain a Result-returning function onto another Result. Short-circuits on error. */
export function andThen<T, U, E, F>(
  r: Result<T, E>,
  f: (value: T) => Result<U, F>,
): Result<U, E | F> {
  return r.ok ? f(r.value) : r
}

/** Map the error channel through a pure function; pass successes through unchanged. */
export function mapErr<T, E, F>(r: Result<T, E>, f: (error: E) => F): Result<T, F> {
  return r.ok ? r : err(f(r.error))
}

/**
 * Convert a Promise that may reject into a Promise<Result<T, Error>>.
 * Re-throws nothing — every settled outcome lands in the Result channel.
 */
export async function fromPromise<T>(p: Promise<T>): Promise<Result<T, Error>> {
  try {
    return ok(await p)
  } catch (caught) {
    return err(caught instanceof Error ? caught : new Error(String(caught)))
  }
}

/**
 * Run a synchronous function inside a try/catch and lift it into a Result.
 * Useful for code at IO boundaries where a single throw would otherwise crash.
 */
export function fromTry<T>(fn: () => T): Result<T, Error> {
  try {
    return ok(fn())
  } catch (caught) {
    return err(caught instanceof Error ? caught : new Error(String(caught)))
  }
}

/** Type-narrowing helper for unknown values that may be a Result. */
export function isResult(value: unknown): value is Result<unknown, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "ok" in value &&
    typeof (value as { ok: unknown }).ok === "boolean"
  )
}
