// Server Component — NO "use client" directive.
// Renders the first showcase vehicle image directly in the SSR HTML so it
// paints immediately without waiting for React hydration.  The interactive
// VehicleShowcase client component renders on top once JS loads.
import Image from "next/image"
import type { HomepageProps } from "@/components/homepage-content"

// Derive the shape from HomepageProps so the hero image and the showcase
// carousel share a single source of truth for vehicle fields.
type ShowcaseVehicle = NonNullable<HomepageProps["showcaseVehicles"]>[number]

interface HeroImageServerProps {
  /** First vehicle from server-side data fetch */
  firstVehicle?: Pick<
    ShowcaseVehicle,
    "year" | "make" | "model" | "trim" | "primary_image_url" | "image_urls"
  > | null
}

export function HeroImageServer({ firstVehicle }: HeroImageServerProps) {
  const imageUrl =
    firstVehicle?.primary_image_url ||
    (firstVehicle?.image_urls && firstVehicle.image_urls[0]) ||
    null

  const alt = firstVehicle
    ? `${firstVehicle.year} ${firstVehicle.make} ${firstVehicle.model}${firstVehicle.trim ? ` ${firstVehicle.trim}` : ""}`
    : "Featured vehicle"

  return (
    <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-linear-to-br from-[#f0f4ff] to-[#e8eef5] shadow-2xl">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={alt}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          priority
          fetchPriority="high"
          className="object-cover [clip-path:inset(0_0_8%_0)]"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
            focusable="false"
            className="w-24 h-24 text-[#1e3a8a]/15"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12"
            />
          </svg>
        </div>
      )}
      {/* Gradient overlay — matches VehicleShowcase */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
    </div>
  )
}
