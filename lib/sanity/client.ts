import { createClient } from "@sanity/client"

const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "planetmotors_cms"

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "4588vjsz",
  dataset: SANITY_DATASET,
  apiVersion: "2024-01-01",
  useCdn: process.env.NODE_ENV === "production",
})
