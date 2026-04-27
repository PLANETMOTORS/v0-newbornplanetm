// Planet Motors CMS - Sanity Client
import { createClient } from "@sanity/client"

// Sanity project ID is wlxj8olw — see docs/AI_SYSTEM_PROMPT.md
const requiredProjectId = 'wlxj8olw'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

if (!projectId) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID must be set')
}

if (projectId !== requiredProjectId) {
  throw new Error(
    `NEXT_PUBLIC_SANITY_PROJECT_ID must be "${requiredProjectId}" (received "${projectId}")`
  )
}

if (!dataset) {
  throw new Error('NEXT_PUBLIC_SANITY_DATASET must be set')
}

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2025-04-01",
  useCdn: process.env.NODE_ENV === "production",
})
