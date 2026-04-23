/**
 * Structured logger utility for Planet Motors.
 *
 * - In production (NODE_ENV === 'production'), only `warn` and `error` levels
 *   are emitted so debug/info noise never reaches production logs.
 * - In development / test, all levels are emitted.
 * - Each message is prefixed with a timestamp and level tag so log aggregators
 *   (Vercel, Datadog, etc.) can filter and alert on structured output.
 *
 * Usage (drop-in replacement for console.*):
 *   import { logger } from '@/lib/logger'
 *   logger.info('[stripe]', 'Payment confirmed', { reservationId })
 *   logger.warn('[redis]', 'Rate limit check failed, allowing request')
 *   logger.error('[webhook]', 'Handler error', error)
 */

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

function timestamp(): string {
  return new Date().toISOString()
}

export const logger = {
  /** Debug-level: suppressed in production. Use for verbose tracing. */
  debug(...args: unknown[]): void {
    if (IS_PRODUCTION) return
    console.log(`[${timestamp()}] DEBUG`, ...args)
  },

  /** Info-level: suppressed in production. Use for operational milestones. */
  info(...args: unknown[]): void {
    if (IS_PRODUCTION) return
    console.info(`[${timestamp()}] INFO `, ...args)
  },

  /** Warn-level: always emitted. Use for recoverable anomalies. */
  warn(...args: unknown[]): void {
    console.warn(`[${timestamp()}] WARN `, ...args)
  },

  /** Error-level: always emitted. Use for failures that need investigation. */
  error(...args: unknown[]): void {
    console.error(`[${timestamp()}] ERROR`, ...args)
  },
}
