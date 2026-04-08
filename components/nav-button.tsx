"use client";

import { useState } from "react";

interface NavButtonProps {
  isLoggedIn?: boolean;
  userName?: string;
  userInitials?: string;
  isOnline?: boolean;
  onMenuClick?: () => void;
  onSignInClick?: () => void;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: {
    pill: "gap-3 py-[7px] pr-[7px] pl-4",
    bar: "w-4 h-[1.5px] gap-1",
    barShort: "w-4",
    label: "text-xs",
    avatar: "w-8 h-8",
    icon: 16,
    initials: "text-xs",
    dot: "w-2.5 h-2.5 border-[1.5px]",
  },
  md: {
    pill: "gap-[14px] py-[9px] pr-[9px] pl-5",
    bar: "w-[19px] h-[2px] gap-[5px]",
    barShort: "w-[19px]",
    label: "text-sm",
    avatar: "w-10 h-10",
    icon: 20,
    initials: "text-[13px]",
    dot: "w-[10px] h-[10px] border-2",
  },
  lg: {
    pill: "gap-[18px] py-3 pr-3 pl-[26px]",
    bar: "w-6 h-[2.5px] gap-[6px]",
    barShort: "w-6",
    label: "text-base",
    avatar: "w-[50px] h-[50px]",
    icon: 24,
    initials: "text-sm",
    dot: "w-3 h-3 border-2",
  },
};

export default function NavButton({
  isLoggedIn = false,
  userName = "Sign In",
  userInitials = "TP",
  isOnline = false,
  onMenuClick,
  onSignInClick,
  size = "md",
}: NavButtonProps) {
  const [hovered, setHovered] = useState(false);
  const s = sizes[size];

  return (
    <button
      onClick={isLoggedIn ? onMenuClick : onSignInClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        inline-flex items-center ${s.pill}
        rounded-full border border-white/10
        cursor-pointer select-none
        transition-colors duration-200 ease-in-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40
      `}
      style={{
        background: hovered ? "#2541B2" : "#1E3799",
      }}
      aria-label={isLoggedIn ? "Open menu" : "Sign in"}
    >
      {/* Hamburger */}
      <div className={`flex flex-col ${s.bar} flex-shrink-0`}>
        <span
          className={`block ${s.barShort} rounded-sm bg-white/95`}
          style={{ height: s.bar.includes("2.5") ? "2.5px" : s.bar.includes("1.5") ? "1.5px" : "2px" }}
        />
        <span
          className={`block ${s.barShort} rounded-sm bg-white/95`}
          style={{ height: s.bar.includes("2.5") ? "2.5px" : s.bar.includes("1.5") ? "1.5px" : "2px" }}
        />
        <span
          className={`block ${s.barShort} rounded-sm bg-white/95`}
          style={{ height: s.bar.includes("2.5") ? "2.5px" : s.bar.includes("1.5") ? "1.5px" : "2px" }}
        />
      </div>

      {/* Label */}
      <span className={`${s.label} font-medium text-white/90 tracking-[0.01em] whitespace-nowrap`}>
        {isLoggedIn ? userName : "Sign In"}
      </span>

      {/* Avatar circle */}
      <div className="relative flex-shrink-0">
        <div
          className={`${s.avatar} rounded-full flex items-center justify-content border-2 border-white/15`}
          style={{
            background: "linear-gradient(145deg, #fb923c, #f06a00)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isLoggedIn ? (
            <span className={`${s.initials} font-bold text-white tracking-[0.04em]`}>
              {userInitials}
            </span>
          ) : (
            <PersonIcon size={s.icon} />
          )}
        </div>

        {/* Online dot */}
        {isLoggedIn && isOnline && (
          <span
            className={`absolute bottom-0.5 right-0.5 ${s.dot} rounded-full bg-green-500`}
            style={{ borderColor: "#1E3799" }}
          />
        )}
      </div>
    </button>
  );
}

function PersonIcon({ size }: { size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7" />
    </svg>
  );
}
