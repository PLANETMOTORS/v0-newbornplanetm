"use client"

import Image from "next/image"

interface PlanetMotorsLogoProps {
  className?: string
  showTagline?: boolean
  size?: "sm" | "md" | "lg" | "xl"
}

export function PlanetMotorsLogo({ 
  className = "", 
  showTagline = false,
  size = "md" 
}: PlanetMotorsLogoProps) {
  const sizes = {
    sm: { width: 120, height: 48 },
    md: { width: 160, height: 64 },
    lg: { width: 200, height: 80 },
    xl: { width: 280, height: 112 },
  }

  const { width, height } = sizes[size]

  return (
    <div 
      className={`flex items-center flex-shrink-0 ${className}`}
      style={{ maxWidth: width, maxHeight: height }}
    >
      <Image
        src="/images/planet-motors-logo.png"
        alt="Planet Motors - Fairness Integrity"
        width={width}
        height={height}
        className="object-contain"
        style={{ width: "auto", height: "auto", maxWidth: "100%", maxHeight: "100%" }}
        unoptimized
        priority
      />
    </div>
  )
}
