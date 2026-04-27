import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { assist } from '@sanity/assist'
import { schemaTypes } from './studio/schemas'
import { structure } from './studio/structure'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

if (!projectId || !dataset) {
  throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID and NEXT_PUBLIC_SANITY_DATASET must be set')
}
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
