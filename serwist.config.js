// @ts-check
// Serwist configurator mode — bundler-agnostic, works with Turbopack.
// The service worker is built AFTER Next.js finishes, so all prerendered
// routes are automatically precached (including /~offline).
// Note: Node.js will reparse this as ESM (harmless warning) because the
// serwist CLI hardcodes "serwist.config.js" as the config filename.
import { serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Allow precaching of large JS chunks (Next.js app shell can exceed 4MB)
  maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
  // No additionalPrecacheEntries needed — Serwist auto-discovers all
  // prerendered pages from the Next.js build output, including /~offline.
});
