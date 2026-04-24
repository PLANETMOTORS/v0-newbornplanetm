"use client"

import { Star } from "lucide-react"
import { useGoogleReviews } from "@/hooks/use-google-reviews"

interface GoogleReviewsBadgeProps {
  variant?: "default" | "compact" | "inline"
  showStars?: boolean
  className?: string
}

export function GoogleReviewsBadge({ 
  variant = "default", 
  showStars = true,
  className = ""
}: GoogleReviewsBadgeProps) {
  const { rating, reviewCount, isLoading } = useGoogleReviews()

  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold">{rating}</span>
        <span className="text-muted-foreground">({reviewCount})</span>
      </div>
    )
  }

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        <span>{rating}/5 Rating ({reviewCount} reviews)</span>
      </span>
    )
  }

  // Default variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showStars && (
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-4 h-4 ${
                star <= Math.round(rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-pm-border text-pm-border"
              }`}
            />
          ))}
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-lg">{rating}</span>
        <span className="text-muted-foreground">
          ({isLoading ? "..." : reviewCount.toLocaleString()} reviews)
        </span>
      </div>
    </div>
  )
}

// Server component version for static pages
export function GoogleReviewsStatic({ 
  rating = 4.8, 
  reviewCount = 500,
  variant = "default",
  className = ""
}: {
  rating?: number
  reviewCount?: number
  variant?: "default" | "compact" | "inline"
  className?: string
}) {
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        <span className="font-semibold">{rating}</span>
        <span className="text-muted-foreground">({reviewCount}+)</span>
      </div>
    )
  }

  if (variant === "inline") {
    return (
      <span className={`inline-flex items-center gap-1 ${className}`}>
        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
        <span>{rating}/5 Rating ({reviewCount}+ reviews)</span>
      </span>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? "fill-yellow-400 text-yellow-400"
                : "fill-pm-border text-pm-border"
            }`}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="font-bold text-lg">{rating}</span>
        <span className="text-muted-foreground">
          ({reviewCount.toLocaleString()}+ reviews)
        </span>
      </div>
    </div>
  )
}
