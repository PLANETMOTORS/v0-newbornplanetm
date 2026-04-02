// Planet Motors CMS - Sanity Client v6 - 2026-04-02
import { createClient } from "@sanity/client"

// Hardcode safe default values - env vars may have invalid characters
const SANITY_PROJECT_ID = "4588vjsz"
const SANITY_DATASET = "production"

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || SANITY_PROJECT_ID,
  dataset: SANITY_DATASET, // Always use "production" - env var may be invalid
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
})
