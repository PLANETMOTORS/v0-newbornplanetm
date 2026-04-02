import { createClient } from "next-sanity"

// Sanity dataset name - must be lowercase with only letters, numbers, and dashes
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production"

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
