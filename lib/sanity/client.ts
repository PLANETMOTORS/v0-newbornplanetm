// Planet Motors CMS - Sanity Client
import { createClient } from "@sanity/client"

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

if (!projectId || !dataset) {
  throw new Error(
    "Missing required env vars: NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set."
  )
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2025-04-01",
  useCdn: process.env.NODE_ENV === "production",
})
