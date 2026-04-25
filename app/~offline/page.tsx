/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "You're Offline — Planet Motors",
  description: "You appear to be offline. Please check your internet connection.",
}

/**
 * Offline fallback page — served by the service worker when the user
 * navigates to a page that isn't cached and has no network connection.
 *
 * Requirements:
 *   - Must be lightweight (no client JS, no external fetches)
 *   - Uses a plain <img> tag (next/image requires a running server)
 *   - Branded with Planet Motors logo and colours
 */
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#0f172a] to-[#1e293b] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo — plain img so it works from precache with no server */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/planet-motors-logo.png"
          alt="Planet Motors"
          width={200}
          height={80}
          className="mx-auto"
        />

        {/* Offline indicator icon */}
        <div className="flex justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-16 h-16 text-white/40"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M18.364 5.636a9 9 0 0 1 0 12.728M5.636 18.364a9 9 0 0 1 0-12.728m2.828 9.9a5 5 0 0 0 7.072 0m-7.072 0a5 5 0 0 1 0-7.072m7.072 7.072a5 5 0 0 0 0-7.072M12 12h.01"
            />
            {/* Slash through the signal icon */}
            <line x1="3" y1="3" x2="21" y2="21" strokeLinecap="round" />
          </svg>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-[-0.01em] text-white">You&apos;re Offline</h1>
          <p className="text-white/70 text-base leading-relaxed">
            It looks like you&apos;ve lost your internet connection.
            <br />
            Please check your Wi-Fi or mobile data and try again.
          </p>
        </div>

        {/* Retry button — plain <a> is intentional: <Link> requires Next.js runtime
            which may be unavailable when the service worker serves this offline page. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/"
          className="inline-flex items-center gap-2 bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold px-8 py-3 rounded-full transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 0 0 4.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 0 1-15.357-2m15.357 2H15"
            />
          </svg>
          Try Again
        </a>

        <p className="text-white/40 text-xs">
          Previously viewed vehicles may still be available from cache.
        </p>
      </div>
    </div>
  )
}
