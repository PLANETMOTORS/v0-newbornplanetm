import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '4588vjsz',
    dataset: 'production',
  },
  // @ts-expect-error deployment is a valid Sanity CLI option not yet typed
  deployment: {
    appId: 'hp7mz4vdgz2z1g7hocckhpwp',
    autoUpdates: true,
  },
})
