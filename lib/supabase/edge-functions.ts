/**
 * Supabase Edge Function client helpers.
 *
 * Constructs the correct Edge Function URL from NEXT_PUBLIC_SUPABASE_URL
 * and attaches the anon key for gateway authentication.
 */

/**
 * Returns the base URL for Supabase Edge Functions.
 * e.g. "https://ldervbcvkoawwknsemuz.supabase.co/functions/v1"
 */
export function getEdgeFunctionBaseUrl(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured")
  }
  // Strip trailing slash if present
  const base = supabaseUrl.replace(/\/$/, "")
  return `${base}/functions/v1`
}

/**
 * Call a Supabase Edge Function.
 *
 * @param fnName  - The function name (e.g. "capture-lead")
 * @param body    - JSON-serialisable payload
 * @param options - Optional: accessToken for authenticated calls
 */
export async function invokeEdgeFunction<T = unknown>(
  fnName: string,
  body: Record<string, unknown>,
  options?: { accessToken?: string }
): Promise<{ data: T; status: number }> {
  const url = `${getEdgeFunctionBaseUrl()}/${fnName}`
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!anonKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured")
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    apikey: anonKey,
  }

  // Use the user's access token if provided (for authenticated functions)
  if (options?.accessToken) {
    headers["Authorization"] = `Bearer ${options.accessToken}`
  } else {
    // For unauthenticated calls, use the anon key as bearer
    headers["Authorization"] = `Bearer ${anonKey}`
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let errorBody: unknown
    try {
      errorBody = await response.json()
    } catch {
      const text = await response.text().catch(() => "")
      throw new Error(`Edge Function ${fnName} returned ${response.status}: ${text.slice(0, 200)}`)
    }
    return { data: errorBody as T, status: response.status }
  }

  const data = await response.json() as T
  return { data, status: response.status }
}
