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
        {/* Shield background - Navy Blue */}
        <path 
          d="M24 4L6 12V22C6 33.05 13.68 43.22 24 46C34.32 43.22 42 33.05 42 22V12L24 4Z" 
          fill="#1e3a5f"
          stroke="#152d4a"
          strokeWidth="1.5"
        />
        {/* Planet/Globe circle */}
        <circle 
          cx="24" 
          cy="24" 
          r="10" 
          fill="#ffffff"
          stroke="#c9302c"
          strokeWidth="2"
        />
        {/* Orbit ring - Red accent */}
        <ellipse 
          cx="24" 
          cy="24" 
          rx="14" 
          ry="5" 
          stroke="#c9302c"
          strokeWidth="1.5"
          fill="none"
          transform="rotate(-20 24 24)"
        />
        {/* Wings left */}
        <path 
          d="M8 20C8 20 12 22 16 22" 
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* Wings right */}
        <path 
          d="M40 20C40 20 36 22 32 22" 
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Text */}
      <div className="flex flex-col">
        <div className={`font-bold tracking-tight leading-none ${text}`}>
          <span className="text-[#c9302c]">PLANET</span>
          {" "}
          <span className="text-[#1e3a5f]">MOTORS</span>
        </div>
        {showTagline && (
          <span className="text-[10px] uppercase tracking-[0.2em] mt-0.5 text-[#1e3a5f]">
            Fairness Integrity
          </span>
        )}
      </div>
    </div>
  )
}
