/**
 * CORS headers for Supabase Edge Functions.
 * Allows requests from Planet Motors domains and Vercel previews.
 */

const ALLOWED_ORIGINS = [
  "https://planetmotors.ca",
  "https://www.planetmotors.ca",
  "https://ev.planetmotors.ca",
]

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false
  if (ALLOWED_ORIGINS.includes(origin)) return true
  // Allow Planet Motors Vercel preview deployments only
  if (/^https:\/\/v0-newbornplanetm[\w-]*\.vercel\.app$/.test(origin)) return true
  // Allow localhost in development
  if (origin.startsWith("http://localhost:")) return true
  if (origin.startsWith("http://127.0.0.1:")) return true
  return false
}

export function corsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get("origin")
  const allowedOrigin = isAllowedOrigin(origin) ? origin! : ALLOWED_ORIGINS[0]

  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  }
}

export function handleCorsPreFlight(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request),
  })
}
