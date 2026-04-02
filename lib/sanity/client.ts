import { createClient } from "@sanity/client"

// Planet Motors CMS - Sanity client (using @sanity/client package)
function getValidDataset(): string {
  const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  if (!envDataset || !/^[a-z0-9_-]+$/.test(envDataset) || envDataset.length > 64) {
    return "planetmotors_cms"
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

export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "4588vjsz",
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: false,
  token: process.env.SANITY_API_READ_TOKEN,
})
