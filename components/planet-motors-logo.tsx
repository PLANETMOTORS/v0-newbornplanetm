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
    <div className={`flex items-center ${className}`}>
      <Image
        src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Planet-Motors---Logo-Final%20Transp%20Back-ACl8Kr3pqlFeUI0w4UbtxQB8tQCt9R.jpeg"
        alt="Planet Motors - Fairness Integrity"
        width={width}
        height={height}
        className="object-contain"
        style={{ width: 'auto', height: 'auto' }}
        unoptimized
        priority
      />
    </div>
  )
}
