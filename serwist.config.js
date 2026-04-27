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
  // Cap individual precache entries at 1 MB (app shell JS/CSS only).
  // Vehicle images and CDN assets are served via runtimeCaching (see app/sw.ts).
  maximumFileSizeToCacheInBytes: 1 * 1024 * 1024, // 1 MB
});
