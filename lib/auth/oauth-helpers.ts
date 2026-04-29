import { createClient } from "@/lib/supabase/client"

export async function initiateOAuthLogin(
  provider: "google" | "facebook",
  redirectTo: string,
) {
  const supabase = createClient()
  const callbackUrl = `${globalThis.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: callbackUrl,
    },
  })

  if (error) throw error
  if (data?.url) {
    globalThis.location.assign(data.url)
  }
}
