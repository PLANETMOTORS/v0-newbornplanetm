import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './studio/schemas'
import { structure } from './studio/structure'

export default defineConfig({
  name: 'planet-motors-cms',
  title: 'Planet Motors CMS',
  
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'cgb59sfd',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  
  basePath: '/studio',
  
  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],
  
  schema: {
    types: schemaTypes,
  },
})
