"use client"

interface PlanetMotorsLogoProps {
  className?: string
  showTagline?: boolean
  size?: "sm" | "md" | "lg"
}

export function PlanetMotorsLogo({ 
  className = "", 
  showTagline = false,
  size = "md" 
}: PlanetMotorsLogoProps) {
  const sizes = {
    sm: { icon: 32, text: "text-lg" },
    md: { icon: 40, text: "text-xl" },
    lg: { icon: 56, text: "text-2xl" },
  }

  const { icon, text } = sizes[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Shield Icon with Planet */}
      <svg 
        width={icon} 
        height={icon} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Shield background */}
        <path 
          d="M24 4L6 12V22C6 33.05 13.68 43.22 24 46C34.32 43.22 42 33.05 42 22V12L24 4Z" 
          fill="oklch(0.42 0.18 250)"
          stroke="oklch(0.35 0.15 250)"
          strokeWidth="1.5"
        />
        {/* Planet/Globe circle */}
        <circle 
          cx="24" 
          cy="24" 
          r="10" 
          fill="oklch(0.98 0 0)"
          stroke="oklch(0.55 0.22 25)"
          strokeWidth="2"
        />
        {/* Orbit ring */}
        <ellipse 
          cx="24" 
          cy="24" 
          rx="14" 
          ry="5" 
          stroke="oklch(0.55 0.22 25)"
          strokeWidth="1.5"
          fill="none"
          transform="rotate(-20 24 24)"
        />
        {/* Wings left */}
        <path 
          d="M8 20C8 20 12 22 16 22" 
          stroke="oklch(0.98 0 0)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Wings right */}
        <path 
          d="M40 20C40 20 36 22 32 22" 
          stroke="oklch(0.98 0 0)"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Text */}
      <div className="flex flex-col">
        <div className={`font-bold tracking-tight leading-none ${text}`}>
          <span style={{ color: "oklch(0.55 0.22 25)" }}>PLANET</span>
          {" "}
          <span style={{ color: "oklch(0.42 0.18 250)" }}>MOTORS</span>
        </div>
        {showTagline && (
          <span 
            className="text-[10px] uppercase tracking-[0.2em] mt-0.5"
            style={{ color: "oklch(0.42 0.18 250)" }}
          >
            Fairness Integrity
          </span>
        )}
      </div>
    </div>
  )
}
