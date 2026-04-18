/// <reference no-default-lib="true" />
/// <reference lib="esnext" />
/// <reference lib="webworker" />

// Planet Motors Service Worker — powered by Serwist
// Handles precaching, runtime caching, and offline fallback.

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// Filter out API and Supabase routes from runtime caching to prevent
// stale inventory/auth data. The defaultCache already includes sensible
// strategies; we only need to exclude backend routes.
const filteredCache = defaultCache.filter((entry) => {
  // Keep all entries that aren't URL-pattern based
  if (typeof entry.matcher === "function") return true;
  return true;
});

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Exclude /api/ routes and Supabase calls from caching entirely
    {
      matcher({ url }) {
        return url.pathname.startsWith("/api/") || url.hostname.includes("supabase.co");
      },
      handler: "NetworkOnly" as const,
    },
    // Use default caching strategies for everything else
    ...filteredCache,
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
