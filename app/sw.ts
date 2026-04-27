/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Planet Motors Service Worker — powered by Serwist
// Handles precaching, runtime caching, and offline fallback.
//
// Optimization: The 4.16MB chunk (09okea7j~1zn8.js) is excluded from
// precache and handled via StaleWhileRevalidate at runtime instead,
// so it does NOT block the initial app boot / SW install.

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist, NetworkOnly, StaleWhileRevalidate, CacheFirst } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// ─── Precache manifest filtering ─────────────────────────────────────────────
// Exclude any JS chunk matching the 4.16MB offender from the precache manifest.
// These large chunks are served via StaleWhileRevalidate at runtime instead,
// so they don't block the SW install step on first load.
const LARGE_CHUNK_PATTERN = /09okea7j~1zn8/;

const filteredManifest = (self.__SW_MANIFEST ?? []).filter((entry) => {
  const url = typeof entry === "string" ? entry : entry.url;
  return !LARGE_CHUNK_PATTERN.test(url);
});

// ─── Runtime caching strategies ──────────────────────────────────────────────
const serwist = new Serwist({
  precacheEntries: filteredManifest,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1. Never cache API routes or Supabase calls — always network
    {
      matcher({ url }) {
        return (
          url.pathname.startsWith("/api/") ||
          url.hostname.includes("supabase.co")
        );
      },
      handler: new NetworkOnly(),
    },

    // 2. Large JS chunks excluded from precache → StaleWhileRevalidate
    //    Serves from cache instantly, updates in background.
    {
      matcher({ url }) {
        return LARGE_CHUNK_PATTERN.test(url.pathname);
      },
      handler: new StaleWhileRevalidate({
        cacheName: "large-chunks",
        plugins: [],
      }),
    },

    // 3. Sanity CDN images → CacheFirst (content-addressed, safe to cache long-term)
    {
      matcher({ url }) {
        return url.hostname === "cdn.sanity.io";
      },
      handler: new CacheFirst({
        cacheName: "sanity-images",
        plugins: [],
      }),
    },

    // 4. All vehicle / blog image CDNs → CacheFirst (immutable content)
    //    Keeping these out of precache and into runtime cache is what brings
    //    the precache manifest from 23 MB down to ~2 MB app-shell only.
    {
      matcher({ url }) {
        // Must stay in sync with remotePatterns in next.config.mjs
        return (
          url.hostname === "cdn.planetmotors.ca" ||
          url.hostname === "planetmotors.imgix.net" ||
          url.hostname === "media.cpsimg.com" ||
          url.hostname === "photos.homenetiol.com" ||
          url.hostname === "content.homenetiol.com" ||
          url.hostname === "www.carpages.ca" ||
          url.hostname === "images.unsplash.com" ||
          url.hostname === "hebbkx1anhila5yf.public.blob.vercel-storage.com"
        );
      },
      handler: new CacheFirst({
        cacheName: "vehicle-images",
        plugins: [],
      }),
    },

    // 5. Default strategies for everything else (JS, CSS, fonts, pages)
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/~offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();
