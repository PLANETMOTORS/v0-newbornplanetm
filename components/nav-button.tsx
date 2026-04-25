import React, { useRef, useState, useEffect } from "react";
import { Menu, UserRound, LogOut, User } from "lucide-react";
import Link from "next/link";

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
  onSignOut?: () => void;
  isLoggedIn?: boolean;
  userName?: string;
  userInitials?: string;
  isOnline?: boolean;
  showMenuButton?: boolean;
}

export function NavButton({
  onSignInClick,
  onMenuClick,
  onSignOut,
  isLoggedIn = false,
  userName = "",
  userInitials = "",
  isOnline = false,
  showMenuButton = true,
}: NavButtonProps) {
  const safeName = userName.trim() || "Client";
  const safeInitials = (userInitials.trim() || getInitials(safeName) || "CL").slice(0, 2);
  const label = isLoggedIn ? safeName : "Sign In";

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const handleAvatarClick = () => {
    if (isLoggedIn) {
      setDropdownOpen((v) => !v);
    } else {
      onSignInClick();
    }
  };

  return (
    <div className="relative inline-flex h-[44px] items-center" ref={dropdownRef}>
      <div className="inline-flex h-[44px] items-center rounded-full bg-[#1E3799] pr-[4px] shadow-sm transition-colors duration-200 hover:bg-[#2541B2]">
        {showMenuButton ? (
          <button
            type="button"
            onClick={onMenuClick}
            aria-label="Open menu"
            className="inline-flex h-[44px] w-[44px] items-center justify-center rounded-full text-white focus:outline-none lg:hidden"
          >
            <Menu className="h-[20px] w-[20px]" strokeWidth={2.5} />
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleAvatarClick}
          aria-haspopup={isLoggedIn ? "menu" : undefined}
          aria-expanded={isLoggedIn ? dropdownOpen : undefined}
          className="inline-flex h-[44px] items-center gap-[8px] rounded-full pl-4 pr-[2px] text-white focus:outline-none"
        >
          <span className="text-left text-[14px] font-semibold leading-none tracking-[-0.02em] text-white">
            {label}
          </span>

          <span className="relative inline-flex h-[36px] w-[36px] items-center justify-center rounded-full bg-[#FB923C] text-white">
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

      {isLoggedIn && dropdownOpen && (
        <div
          role="menu"
          className="absolute right-0 top-[52px] z-50 min-w-45 rounded-xl border border-border bg-background py-1 shadow-lg"
        >
          <div className="px-4 py-2 border-b border-border">
            <p className="text-sm font-semibold truncate">{safeName}</p>
          </div>
          <Link
            href="/account"
            role="menuitem"
            className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted transition-colors"
            onClick={() => setDropdownOpen(false)}
          >
            <User className="h-4 w-4" />
            My Account
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={() => { setDropdownOpen(false); onSignOut?.(); }}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

export default NavButton;
