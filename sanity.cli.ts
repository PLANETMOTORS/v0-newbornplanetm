import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '4588vjsz',
    dataset: 'production',
  },
  deployment: {
    appId: 'p5cadm5k9z4gbp44gholwl61',
    autoUpdates: true,
  },
})
