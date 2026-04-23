import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'wlxj8olw',
    dataset: 'production',
  },
  deployment: {
    appId: 'hp7mz4vdgz2z1g7hocckhpwp',
    autoUpdates: true,
  },
})
