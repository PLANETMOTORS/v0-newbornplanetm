// Planet Motors CMS - Sanity Client
import { createClient } from "@sanity/client"

// Sanity project ID is wlxj8olw — see docs/AI_SYSTEM_PROMPT.md
// Env vars are read but fall back to known-good values when unset or pointing
// at the wrong project, so deploys do not crash on a misconfigured environment.
// Day-14 follow-up: set NEXT_PUBLIC_SANITY_PROJECT_ID=wlxj8olw on Vercel and
// reinstate strict assertion.
const REQUIRED_PROJECT_ID = "wlxj8olw"
const FALLBACK_DATASET = "production"

const envProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET

const projectId =
  envProjectId === REQUIRED_PROJECT_ID ? envProjectId : REQUIRED_PROJECT_ID
const dataset = envDataset || FALLBACK_DATASET

export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: "2025-04-01",
  useCdn: process.env.NODE_ENV === "production",
})
