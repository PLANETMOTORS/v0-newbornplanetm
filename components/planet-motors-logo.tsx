"use client"

import Image from "next/image"

interface PlanetMotorsLogoProps {
  className?: string
  showTagline?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

export function PlanetMotorsLogo({ 
  className = "", 
  showTagline: _showTagline = false,
  size = "md" 
}: Readonly<PlanetMotorsLogoProps>) {
  const sizes = {
    sm: { width: 120, height: 48 },
    md: { width: 160, height: 64 },
    lg: { width: 200, height: 80 },
    xl: { width: 280, height: 112 },
  }

  const { width, height } = sizes[size]

  return (
    <div 
      className={`flex items-center shrink-0 ${className}`}
      style={{ width, height, position: "relative" }}
    >
      <Image
        src="/images/planet-motors-logo.png"
        alt="Planet Motors — Fairness Integrity, OMVIC Licensed Used Car Dealership Richmond Hill Ontario"
        fill
        className="object-contain"
        sizes={`${width}px`}
        priority
      />
    </div>
  )
}
