// Planet Motors CMS - Sanity Client v19
import { createClient } from "@sanity/client"

// Always use hardcoded values — the NEXT_PUBLIC_SANITY_PROJECT_ID env var in the
// Vercel build is set to a different project ID (4588vjsz) that does not have a
// "production" dataset, causing 404s during static generation. The correct project
// is wlxj8olw. Do NOT use the env var here.
const SANITY_PROJECT_ID = "wlxj8olw"
const SANITY_DATASET = "production"

export const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID,
  dataset: SANITY_DATASET,
  apiVersion: "2025-04-01",
  useCdn: process.env.NODE_ENV === "production",
})
