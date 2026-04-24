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

// Filter out API and Supabase routes from runtime caching to prevent
// stale inventory/auth data. The defaultCache already includes sensible
// strategies; we only need to exclude backend routes.
// Keep all cache entries — the NetworkOnly handler above already intercepts
// /api/ and Supabase routes before they reach these strategies.
const filteredCache = defaultCache;

// ─── Runtime caching strategies ──────────────────────────────────────────────
const serwist = new Serwist({
  precacheEntries: filteredManifest,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // 1. Never cache API routes or Supabase calls — always network
    {
      matcher({ url }) { // NOSONAR - intentional: always returns boolean for route matching
        return url.pathname.startsWith("/api/") || url.hostname.includes("supabase.co");
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

    // 4. Planet Motors image CDN → CacheFirst
    {
      matcher({ url }) {
        return url.hostname === "images.planetmotors.com";
      },
      handler: new CacheFirst({
        cacheName: "pm-images",
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
