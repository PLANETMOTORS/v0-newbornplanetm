import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { assist } from '@sanity/assist'
import { schemaTypes } from './studio/schemas'
import { structure } from './studio/structure'

export default defineConfig({
  name: 'planet-motors-cms',
  title: 'Planet Motors CMS',
  
  // Always use hardcoded values - ignore NEXT_PUBLIC_SANITY_PROJECT_ID env var
  projectId: 'wlxj8olw',
  dataset: 'production',
  
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
