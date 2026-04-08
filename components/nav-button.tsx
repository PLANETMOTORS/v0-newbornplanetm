import React from "react";
import { Menu, UserRound } from "lucide-react";

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
}

export function NavButton({
  onSignInClick,
  onMenuClick,
  isLoggedIn = false,
  userName = "",
  userInitials = "",
  isOnline = false,
}: NavButtonProps) {
  const safeName = userName.trim() || "Client";
  const safeInitials = (userInitials.trim() || getInitials(safeName) || "CL").slice(0, 2);
  const label = isLoggedIn ? safeName : "Sign In";

  return (
    <div className="inline-flex h-[56px] items-center rounded-full bg-[#1E3799] pr-[6px] shadow-sm transition-colors duration-200 hover:bg-[#2541B2]">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="inline-flex h-[56px] w-[56px] items-center justify-center rounded-full text-white focus:outline-none"
      >
        <Menu className="h-[22px] w-[22px]" strokeWidth={2.5} />
      </button>

      <button
        type="button"
        onClick={onSignInClick}
        className="inline-flex h-[56px] items-center gap-[10px] rounded-full pr-[2px] text-white focus:outline-none"
      >
        <span className="min-w-[92px] text-left text-[16px] font-semibold leading-none tracking-[-0.02em] text-white">
          {label}
        </span>

        <span className="relative inline-flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#FB923C] text-white">
          {isLoggedIn ? (
            <span className="text-[13px] font-semibold tracking-wide text-white">
              {safeInitials}
            </span>
          ) : (
            <UserRound className="h-[17px] w-[17px] text-white" strokeWidth={2.4} />
          )}

          {isLoggedIn && isOnline && (
            <span className="absolute bottom-0 right-0 h-[10px] w-[10px] rounded-full border-2 border-[#1E3799] bg-emerald-400" />
          )}
        </span>
      </button>
    </div>
  );
}

export default NavButton;
