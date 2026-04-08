import React from "react";
import { Menu, UserRound } from "lucide-react";

function cx(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

function getInitials(name = "") {
  return name
    .trim()
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

interface NavButtonProps {
  onSignInClick: () => void;
  onMenuClick: () => void;
  isLoggedIn?: boolean;
  userName?: string;
  userInitials?: string;
  isOnline?: boolean;
  className?: string;
}

export function NavButton({
  onSignInClick,
  onMenuClick,
  isLoggedIn = false,
  userName = "",
  userInitials = "",
  isOnline = false,
  className = "",
}: NavButtonProps) {
  const safeName = userName.trim() || "Client";
  const safeInitials = (userInitials.trim() || getInitials(safeName) || "CL").slice(0, 2);
  const label = isLoggedIn ? safeName : "Sign In";

  return (
    <div className={cx("inline-flex items-center rounded-full bg-[#1E3799] p-2 shadow-lg transition-all duration-200 hover:bg-[#2541B2]", className)}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onMenuClick()
        }}
        aria-label="Open menu"
        className="inline-flex h-14 w-14 items-center justify-center rounded-full text-white transition-colors duration-200 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
      >
        <Menu className="h-8 w-8" strokeWidth={2.4} />
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onSignInClick()
        }}
        className="inline-flex items-center gap-2 rounded-full pl-1 pr-2 text-white focus:outline-none focus:ring-2 focus:ring-white/40"
      >
        <span
          className={cx(
            "text-left font-semibold tracking-[-0.02em] text-white",
            isLoggedIn ? "text-base sm:text-lg" : "text-lg sm:text-xl"
          )}
        >
          {label}
        </span>

        <span className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#FB923C] text-white shadow-md ring-1 ring-white/10">
          {isLoggedIn ? (
            <span className="text-base font-semibold tracking-wide text-white">
              {safeInitials}
            </span>
          ) : (
            <UserRound className="h-[22px] w-[22px] text-white" strokeWidth={2.5} />
          )}

          {isLoggedIn && isOnline && (
            <span className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#1E3799] bg-emerald-400" />
          )}
        </span>
      </button>
    </div>
  );
}

export default NavButton;
