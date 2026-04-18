// @ts-check
// Serwist configurator mode — bundler-agnostic, works with Turbopack.
// The service worker is built AFTER Next.js finishes, so all prerendered
// routes are automatically precached.
import { spawnSync } from "node:child_process";
import { serwist } from "@serwist/next/config";

// Use git HEAD as the revision to version the offline fallback page.
// Falls back to a random UUID if git is not available (e.g., Docker builds).
const revision =
  spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf-8" }).stdout?.trim() ||
  crypto.randomUUID();

export default serwist({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  // Precache the offline fallback page so it's available without network.
  additionalPrecacheEntries: [{ url: "/~offline", revision }],
});
