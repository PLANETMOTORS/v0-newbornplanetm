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
  NEXT_PUBLIC_SANITY_PROJECT_ID: z.string().min(1, "NEXT_PUBLIC_SANITY_PROJECT_ID is required"),
  NEXT_PUBLIC_SANITY_DATASET: z.string().min(1, "NEXT_PUBLIC_SANITY_DATASET is required"),
})

/** OPTIONAL server-side: graceful degradation when missing */
const optionalServerSchema = z.object({
  // Supabase
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_READ_REPLICA_URL: z.string().url().optional(),
  SUPABASE_READ_REPLICA_ANON_KEY: z.string().optional(),

  // Database (Neon / Postgres direct) — connection strings are URL-shaped
  DATABASE_URL: z.string().url().optional(),
  NEON_DATABASE_URL: z.string().url().optional(),
  NEON_POSTGRES_URL: z.string().url().optional(),
  POSTGRES_URL: z.string().url().optional(),

  // Stripe
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_ENABLE_ACSS_DEBIT: z.string().optional(),

  // Email (Resend) — both names are checked at runtime in lib/email.ts
  RESEND_API_KEY: z.string().optional(),
  API_KEY_RESEND: z.string().optional(),

  // Notifications / Admin
  ADMIN_EMAIL: z.string().email().optional(),
  ADMIN_EMAILS: z.string().optional(),
  FROM_EMAIL: z.string().optional(),

  // Upstash Redis (KV)
  KV_REST_API_URL: z.string().url().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Sanity CMS (server secrets)
  SANITY_WEBHOOK_SECRET: z.string().optional(),
  SANITY_API_TOKEN: z.string().optional(),
  SANITY_PROJECT_ID: z.string().optional(),

  // AutoRaptor CRM (ADF XML integration)
  AUTORAPTOR_ADF_ENDPOINT: z.string().url().optional(),
  AUTORAPTOR_DEALER_ID: z.string().optional(),
  AUTORAPTOR_DEALER_NAME: z.string().optional(),
  AUTORAPTOR_ELEAD_EMAIL: z.string().optional(),
  AUTORAPTOR_ELEAD_URL: z.string().url().optional(),
  AUTORAPTOR_LEAD_EMAIL: z.string().optional(),

  // ADF (Automotive Data Format) lead delivery
  ADF_DEALER_NAME: z.string().optional(),
  ADF_FROM_EMAIL: z.string().optional(),

  // Google
  GOOGLE_PLACE_ID: z.string().optional(),
  GOOGLE_PLACES_API_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),

  // Typesense Cloud
  TYPESENSE_API_KEY: z.string().optional(),
  TYPESENSE_HOST: z.string().optional(),
  TYPESENSE_NODES: z.string().optional(),
  TYPESENSE_SYNC_SECRET: z.string().optional(),

  // IndexNow — Bing/Yandex/etc. instant search-engine notifications.
  INDEXNOW_KEY: z
    .string()
    .min(8, "INDEXNOW_KEY must be at least 8 characters")
    .max(128, "INDEXNOW_KEY must be at most 128 characters")
    .regex(/^[a-zA-Z0-9]+$/, "INDEXNOW_KEY must only contain alphanumeric characters")
    .optional(),

  // HomeNet inventory sync
  HOMENET_INVENTORY_FLOOR_PCT: z
    .string()
    .regex(/^\d+(\.\d+)?$/, "HOMENET_INVENTORY_FLOOR_PCT must be a non-negative number")
    .optional(),
  HOMENET_API_KEY: z.string().optional(),
  HOMENET_SFTP_HOST: z.string().optional(),
  HOMENET_SFTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  HOMENET_SFTP_USERNAME: z.string().optional(),
  HOMENET_SFTP_PASSWORD: z.string().optional(),
  HOMENET_SFTP_USER: z.string().optional(),
  HOMENET_SFTP_PASS: z.string().optional(),
  HOMENET_EXPORT_FTP_HOST: z.string().optional(),
  HOMENET_EXPORT_FTP_PORT: z.coerce.number().int().min(1).max(65535).optional(),
  HOMENET_EXPORT_FTP_USER: z.string().optional(),
  HOMENET_EXPORT_FTP_PASS: z.string().optional(),

  // Finance application encryption
  APPLICATION_SIN_ENCRYPTION_KEY: z.string().optional(),
  APPLICATION_SIN_HASH_PEPPER: z.string().optional(),

  // Internal API / Cron / CRM
  INTERNAL_API_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
  CRM_WEBHOOK_SECRET: z.string().min(32, "CRM_WEBHOOK_SECRET must be at least 32 characters").optional(),

  // Meta Conversions API (server-side)
  META_CAPI_ACCESS_TOKEN: z.string().optional(),

  // Sentry (server-side DSN)
  SENTRY_DSN: z.string().optional(),

  // Live Video Tour
  LIVE_VIDEO_TOUR_PROVIDER: z.string().optional(),

  // Zoom integration
  ZOOM_CLIENT_ID: z.string().optional(),
  ZOOM_CLIENT_SECRET: z.string().optional(),

  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
})

/** CLIENT-side NEXT_PUBLIC_* variables */
const clientSchema = z.object({
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_BASE_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().optional(),
  NEXT_PUBLIC_SITE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_GA_MEASUREMENT_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
  NEXT_PUBLIC_META_PIXEL_ID: z.string().optional(),
  // Social/marketing pixels — all gated by marketing/analytics consent.
  NEXT_PUBLIC_TIKTOK_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_CLARITY_PROJECT_ID: z.string().optional(),
  NEXT_PUBLIC_BING_UET_ID: z.string().optional(),
  NEXT_PUBLIC_SNAPCHAT_PIXEL_ID: z.string().optional(),
  NEXT_PUBLIC_GOOGLE_MAPS_KEY: z.string().optional(),
  NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: z.string().optional(),
  NEXT_PUBLIC_TYPESENSE_HOST: z.string().optional(),
  // Sentry (client DSN)
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  // Server-side GTM / analytics
  NEXT_PUBLIC_SGTM_URL: z.string().url().optional(),
  // Image delivery
  NEXT_PUBLIC_IMAGE_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_IMGIX_DOMAIN: z.string().optional(),
  // Dev-only Supabase redirect
  NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: z.string().optional(),
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
    // Optional server — Supabase / Database
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_READ_REPLICA_URL: process.env.SUPABASE_READ_REPLICA_URL,
    SUPABASE_READ_REPLICA_ANON_KEY: process.env.SUPABASE_READ_REPLICA_ANON_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
    NEON_POSTGRES_URL: process.env.NEON_POSTGRES_URL,
    POSTGRES_URL: process.env.POSTGRES_URL,
    // Stripe
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_ENABLE_ACSS_DEBIT: process.env.STRIPE_ENABLE_ACSS_DEBIT,
    // Email
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    API_KEY_RESEND: process.env.API_KEY_RESEND,
    // Admin / Notifications
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_EMAILS: process.env.ADMIN_EMAILS,
    FROM_EMAIL: process.env.FROM_EMAIL,
    // Upstash Redis (KV)
    KV_REST_API_URL: process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    // Sanity CMS
    SANITY_WEBHOOK_SECRET: process.env.SANITY_WEBHOOK_SECRET,
    SANITY_API_TOKEN: process.env.SANITY_API_TOKEN,
    SANITY_PROJECT_ID: process.env.SANITY_PROJECT_ID,
    // AutoRaptor CRM / ADF
    AUTORAPTOR_ADF_ENDPOINT: process.env.AUTORAPTOR_ADF_ENDPOINT,
    AUTORAPTOR_DEALER_ID: process.env.AUTORAPTOR_DEALER_ID,
    AUTORAPTOR_DEALER_NAME: process.env.AUTORAPTOR_DEALER_NAME,
    AUTORAPTOR_ELEAD_EMAIL: process.env.AUTORAPTOR_ELEAD_EMAIL,
    AUTORAPTOR_ELEAD_URL: process.env.AUTORAPTOR_ELEAD_URL,
    AUTORAPTOR_LEAD_EMAIL: process.env.AUTORAPTOR_LEAD_EMAIL,
    ADF_DEALER_NAME: process.env.ADF_DEALER_NAME,
    ADF_FROM_EMAIL: process.env.ADF_FROM_EMAIL,
    // Google
    GOOGLE_PLACE_ID: process.env.GOOGLE_PLACE_ID,
    GOOGLE_PLACES_API_KEY: process.env.GOOGLE_PLACES_API_KEY,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    // Typesense
    TYPESENSE_API_KEY: process.env.TYPESENSE_API_KEY,
    TYPESENSE_HOST: process.env.TYPESENSE_HOST,
    TYPESENSE_NODES: process.env.TYPESENSE_NODES,
    TYPESENSE_SYNC_SECRET: process.env.TYPESENSE_SYNC_SECRET,
    // IndexNow / HomeNet
    INDEXNOW_KEY: process.env.INDEXNOW_KEY,
    HOMENET_INVENTORY_FLOOR_PCT: process.env.HOMENET_INVENTORY_FLOOR_PCT,
    HOMENET_API_KEY: process.env.HOMENET_API_KEY,
    HOMENET_SFTP_HOST: process.env.HOMENET_SFTP_HOST,
    HOMENET_SFTP_PORT: process.env.HOMENET_SFTP_PORT,
    HOMENET_SFTP_USERNAME: process.env.HOMENET_SFTP_USERNAME,
    HOMENET_SFTP_PASSWORD: process.env.HOMENET_SFTP_PASSWORD,
    HOMENET_SFTP_USER: process.env.HOMENET_SFTP_USER,
    HOMENET_SFTP_PASS: process.env.HOMENET_SFTP_PASS,
    HOMENET_EXPORT_FTP_HOST: process.env.HOMENET_EXPORT_FTP_HOST,
    HOMENET_EXPORT_FTP_PORT: process.env.HOMENET_EXPORT_FTP_PORT,
    HOMENET_EXPORT_FTP_USER: process.env.HOMENET_EXPORT_FTP_USER,
    HOMENET_EXPORT_FTP_PASS: process.env.HOMENET_EXPORT_FTP_PASS,
    // Encryption / Security
    APPLICATION_SIN_ENCRYPTION_KEY: process.env.APPLICATION_SIN_ENCRYPTION_KEY,
    APPLICATION_SIN_HASH_PEPPER: process.env.APPLICATION_SIN_HASH_PEPPER,
    INTERNAL_API_SECRET: process.env.INTERNAL_API_SECRET,
    CRON_SECRET: process.env.CRON_SECRET,
    CRM_WEBHOOK_SECRET: process.env.CRM_WEBHOOK_SECRET,
    // Meta / Sentry / Misc
    META_CAPI_ACCESS_TOKEN: process.env.META_CAPI_ACCESS_TOKEN,
    SENTRY_DSN: process.env.SENTRY_DSN,
    LIVE_VIDEO_TOUR_PROVIDER: process.env.LIVE_VIDEO_TOUR_PROVIDER,
    ZOOM_CLIENT_ID: process.env.ZOOM_CLIENT_ID,
    ZOOM_CLIENT_SECRET: process.env.ZOOM_CLIENT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
    // Client
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SANITY_PROJECT_ID: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
    NEXT_PUBLIC_SANITY_DATASET: process.env.NEXT_PUBLIC_SANITY_DATASET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SITE_DOMAIN: process.env.NEXT_PUBLIC_SITE_DOMAIN,
    NEXT_PUBLIC_GA_MEASUREMENT_ID: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
    NEXT_PUBLIC_META_PIXEL_ID: process.env.NEXT_PUBLIC_META_PIXEL_ID,
    NEXT_PUBLIC_TIKTOK_PIXEL_ID: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID,
    NEXT_PUBLIC_CLARITY_PROJECT_ID: process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID,
    NEXT_PUBLIC_BING_UET_ID: process.env.NEXT_PUBLIC_BING_UET_ID,
    NEXT_PUBLIC_SNAPCHAT_PIXEL_ID: process.env.NEXT_PUBLIC_SNAPCHAT_PIXEL_ID,
    NEXT_PUBLIC_GOOGLE_MAPS_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY,
    NEXT_PUBLIC_TYPESENSE_SEARCH_KEY: process.env.NEXT_PUBLIC_TYPESENSE_SEARCH_KEY,
    NEXT_PUBLIC_TYPESENSE_HOST: process.env.NEXT_PUBLIC_TYPESENSE_HOST,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
    NEXT_PUBLIC_SGTM_URL: process.env.NEXT_PUBLIC_SGTM_URL,
    NEXT_PUBLIC_IMAGE_BASE_URL: process.env.NEXT_PUBLIC_IMAGE_BASE_URL,
    NEXT_PUBLIC_IMGIX_DOMAIN: process.env.NEXT_PUBLIC_IMGIX_DOMAIN,
    NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
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
    _env ??= validateEnv()
    return _env[prop as keyof Env]
  },
})
