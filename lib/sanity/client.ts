import { createClient } from "next-sanity"

// Planet Motors CMS - Sanity client v12
// Validate dataset name - must be lowercase, numbers, dashes only (max 64 chars)
function getValidDataset(): string {
  const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  
  // If no env var or invalid format, use production
  if (!envDataset || !/^[a-z0-9-]+$/.test(envDataset) || envDataset.length > 64) {
    return "production"
  }
  
  return envDataset
}

const SANITY_DATASET = getValidDataset()

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "4588vjsz",
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
})

// For server-side with token (drafts, mutations)
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "4588vjsz",
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
})
