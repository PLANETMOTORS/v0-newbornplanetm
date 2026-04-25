// CJS wrapper — delegates to the canonical ESM implementation.
// Run with: node scripts/test-emails.mjs
// Or:       node --experimental-vm-modules scripts/test-emails.js
//
// The canonical source of truth is test-emails.mjs (ESM).
// This file exists only for tooling that requires a .js entry point.

const { pathToFileURL } = require('url')

// Dynamically import the ESM module and run it
import(pathToFileURL(require.resolve('./test-emails.mjs')).href).catch(err => {
  console.error('Failed to load test-emails.mjs:', err.message)
  process.exit(1)
})
