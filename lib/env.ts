import { z } from "zod"

// =============================================================================
// Environment Variable Validation — Planet Motors
// =============================================================================
// Import `env` from "@/lib/env" to get typed, validated environment variables.
// Variables are validated once on first access (lazy singleton).
// =============================================================================

// --- Schemas ----------------------------------------------------------------

/** REQUIRED: App will not function without these */
const requiredServerSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
})

/** OPTIONAL server-side: graceful degradation when missing */
const optionalServerSchema = z.object({
  // Supabase admin
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_ENABLE_ACSS_DEBIT: z.string().optional(),

  // Email (Resend) — both names are checked at runtime in lib/email.ts
  RESEND_API_KEY: z.string().optional(),
  API_KEY_RESEND: z.string().optional(),

  // Notifications
  ADMIN_EMAIL: z.string().email().optional(),
  FROM_EMAIL: z.string().optional(),

  // Upstash Redis (KV)
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Sanity CMS (server secrets)
  SANITY_WEBHOOK_SECRET: z.string().optional(),
  SANITY_API_TOKEN: z.string().optional(),

  // AutoRaptor CRM
  AUTORAPTOR_API_KEY: z.string().optional(),
  AUTORAPTOR_DEALER_ID: z.string().optional(),

  // Google
  GOOGLE_PLACE_ID: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),

  // Typesense Cloud
  TYPESENSE_API_KEY: z.string().optional(),
  TYPESENSE_HOST: z.string().optional(),

  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
})

/** CLIENT-side NEXT_PUBLIC_* variables */
const clientSchema = z.object({
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_SANITY_DATASET: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: z.string().optional(),
  NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: z.string().optional(),
  NEXT_PUBLIC_TYPESENSE_HOST: z.string().optional(),
})

// Merged schema
const envSchema = requiredServerSchema
  .merge(optionalServerSchema)
  .merge(clientSchema)

// --- Types ------------------------------------------------------------------

export type Env = z.infer<typeof envSchema>

// --- Validation -------------------------------------------------------------

function validateEnv(): Env {
  // During build, required client vars are replaced by Next.js at compile time.
  // We skip strict validation when env vars are genuinely absent (e.g. CI with
  // no .env file) by checking if the required vars exist.
  const raw = {
    // Required
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    // Optional server
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_ENABLE_ACSS_DEBIT: process.env.STRIPE_ENABLE_ACSS_DEBIT,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    API_KEY_RESEND: process.env.API_KEY_RESEND,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    FROM_EMAIL: process.env.FROM_EMAIL,
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    SANITY_WEBHOOK_SECRET: process.env.SANITY_WEBHOOK_SECRET,
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
    AUTORAPTOR_API_KEY: process.env.AUTORAPTOR_API_KEY,
    AUTORAPTOR_DEALER_ID: process.env.AUTORAPTOR_DEALER_ID,
    GOOGLE_PLACE_ID: process.env.GOOGLE_PLACE_ID,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY,
    TYPESENSE_HOST: process.env.TYPESENSE_HOST,
    NODE_ENV: process.env.NODE_ENV,
    // Client
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
    NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
    NEXT_PUBLIC_TYPESENSE_HOST: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
  }

  const result = envSchema.safeParse(raw)

  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  ✗ ${i.path.join(".")}: ${i.message}`)
      .join("\n")
    console.error("❌ Environment variable validation failed:\n" + formatted)
    throw new Error(
      "Missing or invalid environment variables. See console output above."
    )
  }

  return result.data
}

// Lazy singleton — validated on first access
let _env: Env | undefined

/** Typed, validated environment variables. Throws on first access if required vars are missing. */
export const env: Env = new Proxy({} as Env, {
  get(_target, prop: string) {
    if (!_env) {
      _env = validateEnv()
    }
    return _env[prop as keyof Env]
  },
})
