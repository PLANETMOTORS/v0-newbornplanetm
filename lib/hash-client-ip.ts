import { createHmac } from "crypto"

// HMAC-SHA256 hex for audit correlation; requires CLIENT_IP_HMAC_SECRET in production.
export function hashClientIp(ip: string | null | undefined): string | null {
  const trimmed = ip?.split(",")[0]?.trim()
  if (!trimmed || trimmed === "unknown") return null

  const secret =
    process.env.CLIENT_IP_HMAC_SECRET ||
    (process.env.NODE_ENV !== "production" ? "development-client-ip-hmac-not-for-production" : null)

  if (!secret) {
    console.error("[audit] CLIENT_IP_HMAC_SECRET is unset; omitting client_ip_hash")
    return null
  }

  return createHmac("sha256", secret).update(trimmed, "utf8").digest("hex")
}
