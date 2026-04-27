import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { assist } from '@sanity/assist'
import { schemaTypes } from './studio/schemas'
import { structure } from './studio/structure'

// Sanity project ID is wlxj8olw. Env vars are read but fall back to known-good
// values when unset or pointing at the wrong project, so deploys do not crash
// on a misconfigured environment. Day-14 follow-up: set
// NEXT_PUBLIC_SANITY_PROJECT_ID=wlxj8olw on Vercel and reinstate strict
// assertion.
const REQUIRED_PROJECT_ID = 'wlxj8olw'
const FALLBACK_DATASET = 'production'

const envProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const envDataset = process.env.NEXT_PUBLIC_SANITY_DATASET

const projectId =
  envProjectId === REQUIRED_PROJECT_ID ? envProjectId : REQUIRED_PROJECT_ID
const dataset = envDataset || FALLBACK_DATASET

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
