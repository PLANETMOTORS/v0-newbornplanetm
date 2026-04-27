// Planet Motors CMS - Sanity Client v20
import { createClient } from "@sanity/client"

// Always use hardcoded values - ignore NEXT_PUBLIC_SANITY_PROJECT_ID env var
// (Vercel env may have incorrect value 4588vjsz which has no production dataset)
const SANITY_PROJECT_ID = "wlxj8olw"
const SANITY_DATASET = "production"

export const sanityClient = createClient({
  projectId: SANITY_PROJECT_ID, // Always use wlxj8olw - ignore env var
  dataset: SANITY_DATASET, // Always use production - ignore env var
  apiVersion: "2025-04-01",
  useCdn: process.env.NODE_ENV === "production",
})
