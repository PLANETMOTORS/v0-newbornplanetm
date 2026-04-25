/**
 * Non-cryptographic random helpers for non-security contexts (display jitter,
 * A/B variant selection, simulated delays in scripts/tests). Backed by
 * `crypto.getRandomValues` so SonarCloud does not flag them as `S2245`
 * (insecure `Math.random`) hotspots.
 *
 * NOTE: do NOT use these for tokens, IDs, or anything that needs collision
 * resistance — use `crypto.randomUUID()` or `crypto.randomBytes` directly.
 */

/** Uniform float in [0, 1) using `crypto.getRandomValues`. */
export function randomFloat(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  // 2^32 = 4294967296. Divide by max+1 so the result is strictly < 1.
  return buf[0] / 4_294_967_296
}

/**
 * Integer in [min, max] inclusive using `crypto.getRandomValues`. Falls back
 * to `min` when `max < min` to avoid throwing on programmer error.
 */
export function randomInt(min: number, max: number): number {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return min
  const range = max - min + 1
  return Math.floor(randomFloat() * range) + min
}
