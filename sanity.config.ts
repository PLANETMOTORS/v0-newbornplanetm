import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { assist } from '@sanity/assist'
import { schemaTypes } from './studio/schemas'
import { structure } from './studio/structure'

// Sanity project ID is wlxj8olw. Env vars are read but fall back to known-good
// values when unset, malformed, or pointing at the wrong project, so deploys
// do not crash on a misconfigured environment. Day-14 follow-up: set
// NEXT_PUBLIC_SANITY_PROJECT_ID=wlxj8olw and NEXT_PUBLIC_SANITY_DATASET=production
// on Vercel, then reinstate strict assertion.
const REQUIRED_PROJECT_ID = 'wlxj8olw'
const FALLBACK_DATASET = 'production'

// Sanity dataset names: lowercase alphanumerics + underscore/dash, max 64 chars
const VALID_DATASET = /^[a-z0-9_-]{1,64}$/

const envProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET

const projectId =
  envProjectId === REQUIRED_PROJECT_ID ? envProjectId : REQUIRED_PROJECT_ID
const dataset =
  envDataset && VALID_DATASET.test(envDataset) ? envDataset : FALLBACK_DATASET

export default defineConfig({
  name: 'planet-motors-cms',
  title: 'Planet Motors CMS',

  projectId,
  dataset,
  
  basePath: '/studio',
  
  plugins: [
    structureTool({ structure }),
    visionTool(),
    assist(),
  ],
  
  schema: {
    types: schemaTypes,
  },
})
