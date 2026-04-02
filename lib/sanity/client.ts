// Planet Motors CMS - Sanity Client
import { createClient } from "@sanity/client"

// Get dataset name, sanitize it to be valid (lowercase, alphanumeric, dashes only)
function getValidDataset(): string {
  const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  if (envDataset) {
    // Sanitize: replace underscores with dashes, remove invalid chars
    return envDataset.toLowerCase().replace(/_/g, "-").replace(/[^a-z0-9-]/g, "")
  }
  return "production" // Safe default
}

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "4588vjsz",
  dataset: getValidDataset(),
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
})
