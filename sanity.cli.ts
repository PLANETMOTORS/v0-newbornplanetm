import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'wlxj8olw',
    dataset: 'production',
  },
  deployment: {
    appId: 'hp7mz4vdgz2z1g7hocckhpwp',
    autoUpdates: true,
  },
})
