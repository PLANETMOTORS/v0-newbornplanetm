"use client"

interface VirtualizedVehicleGridProps {
  /** Total number of items */
  itemCount: number
  /** Render a single item by index */
  renderItem: (index: number) => React.ReactNode
  /** "grid" or "list" view mode */
  viewMode: "grid" | "list"
}

/**
 * Virtualized vehicle grid using CSS content-visibility for browser-native
 * rendering optimization. Off-screen cards are skipped by the browser's
 * rendering pipeline, reducing paint time and main-thread work.
 *
 * Preserves natural page scrolling, responsive grid layout, and all
 * filter/search state — no scroll container takeover.
 */
export function VirtualizedVehicleGrid({
  itemCount,
  renderItem,
  viewMode,
}: VirtualizedVehicleGridProps) {
  return (
    <div
      className={
        viewMode === "grid"
          ? "py-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "py-8 space-y-4"
      }
    >
      {Array.from({ length: itemCount }, (_, i) => (
        <div
          key={i}
          style={{
            contentVisibility: "auto",
            containIntrinsicSize: viewMode === "list" ? "auto 200px" : "auto 420px",
          }}
        >
          {renderItem(i)}
        </div>
      ))}
    </div>
  )
}
