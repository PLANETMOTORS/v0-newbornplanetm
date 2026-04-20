"use client"

// Client-only wrapper for the footer.
// `ssr: false` with `next/dynamic` is only allowed inside Client Components,
// so `app/page.tsx` imports this wrapper instead of using `dynamic` directly.
// Keeping the footer's JS out of the initial hydration payload lets the
// browser paint the LCP hero image sooner on throttled mobile CPUs.
import dynamic from "next/dynamic"

export const FooterClient = dynamic(
  () => import("@/components/footer").then(m => ({ default: m.Footer })),
  {
    ssr: false,
    loading: () => (
      <footer
        aria-hidden="true"
        style={{ minHeight: "160px" }}
      />
    ),
  }
)
