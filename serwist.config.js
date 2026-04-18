// @ts-check
// Serwist configurator mode — bundler-agnostic, works with Turbopack.
// The service worker is built AFTER Next.js finishes, so all prerendered
// routes are automatically precached (including /~offline).
import { serwist } from "@serwist/next/config";

export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // No additionalPrecacheEntries needed — Serwist auto-discovers all
  // prerendered pages from the Next.js build output, including /~offline.
});
