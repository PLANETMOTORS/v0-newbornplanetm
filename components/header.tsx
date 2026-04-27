"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { ChevronDown, Phone, MapPin, Star, Award, CheckCircle, Shield, Truck } from "lucide-react"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"
import dynamic from "next/dynamic"
// Lazy-load SignInPanel — it's only shown when user clicks sign-in
const SignInPanel = dynamic(() => import("@/components/sign-in-panel").then(m => ({ default: m.SignInPanel })), { ssr: false })
import NavButton from "@/components/nav-button"
// Lazy-load SearchAutocomplete — heavy component only needed on interaction
const SearchAutocomplete = dynamic(() => import("@/components/search-autocomplete").then(m => ({ default: m.SearchAutocomplete })), { ssr: false })
import { useAuth } from "@/contexts/auth-context"
import { trackPhoneClick } from "@/components/analytics/google-tag-manager"
import { BUSINESS_HOURS_SHORT, PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL, DEALERSHIP_ADDRESS_FULL } from "@/lib/constants/dealership"

type NavItem = {
  name: string
  href: string
  submenu?: { name: string; href: string }[]
}

const SHOP_SUBMENU = [
  { name: "All Vehicles", href: "/inventory" },
  { name: "Electric Vehicles", href: "/inventory?fuelType=Electric" },
  { name: "SUVs & Crossovers", href: "/inventory?bodyType=SUV" },
  { name: "Sedans", href: "/inventory?bodyType=Sedan" },
  { name: "Trucks", href: "/inventory?bodyType=Truck" },
]

const SELL_SUBMENU = [
  { name: "Get Trade-In Value", href: "/trade-in" },
  { name: "Sell Your Car", href: "/sell-your-car" },
]

const FINANCE_SUBMENU = [
  { name: "Get Pre-Approved", href: "/financing" },
  { name: "Financing Calculator", href: "/financing#calculator" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "Delivery", href: "/delivery" },
]

const MORE_SUBMENU = [
  { name: "About", href: "/about" },
  { name: "EV Battery Health", href: "/aviloo" },
  { name: "Car Value Calculator", href: "/trade-in" },
  { name: "Protection Plans", href: "/protection-plans" },
  { name: "FAQ", href: "/faq" },
  { name: "Careers", href: "/careers" },
  { name: "Contact Us", href: "/contact" },
  { name: "Blog", href: "/blog" },
]

const navigation: NavItem[] = [
  { name: "Shop Inventory", href: "/inventory", submenu: SHOP_SUBMENU },
  { name: "Sell or Trade", href: "/trade-in", submenu: SELL_SUBMENU },
  { name: "Finance", href: "/financing", submenu: FINANCE_SUBMENU },
  { name: "More", href: "/about", submenu: MORE_SUBMENU },
]

function DesktopNav({ 
  activeSubmenu, 
  setActiveSubmenu 
}: { 
  activeSubmenu: string | null
  setActiveSubmenu: (name: string | null) => void
}) {
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isHoveringRef = useRef(false)

  const handleMouseEnter = (itemName: string, hasSubmenu: boolean) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
    }
    isHoveringRef.current = true
    if (hasSubmenu) {
      setActiveSubmenu(itemName)
    }
  }

  const handleMouseLeave = () => {
    isHoveringRef.current = false
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setActiveSubmenu(null)
      }
    }, 800)
  }

  return (
    <ul className="hidden lg:flex lg:items-center lg:gap-1">
      {navigation.map((item) => (
        <li
          key={item.name}
          role="none"
          className="relative"
          onMouseEnter={() => handleMouseEnter(item.name, !!item.submenu)}
          onMouseLeave={handleMouseLeave}
        >
          {item.submenu ? (
            <button
              type="button"
              aria-haspopup="true"
              aria-expanded={activeSubmenu === item.name}
              className="flex items-center gap-1 px-4 py-2 text-[15px] font-semibold text-gray-800 hover:text-[#1e3a8a] transition-colors"
              onClick={() => setActiveSubmenu(activeSubmenu === item.name ? null : item.name)}
            >
              {item.name}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeSubmenu === item.name ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <Link
              href={item.href}
              className="flex items-center gap-1 px-4 py-2 text-[15px] font-semibold text-gray-800 hover:text-[#1e3a8a] transition-colors"
            >
              {item.name}
            </Link>
          )}

          {item.submenu && activeSubmenu === item.name && (
            <div
              role="none"
              className="absolute top-full left-0 pt-1 min-w-[220px] z-[99999]"
              onMouseEnter={() => handleMouseEnter(item.name, true)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 py-2">
                {item.submenu.map((subitem) => (
                  <Link
                    key={subitem.name}
                    href={subitem.href}
                    className="block px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                    onClick={() => setActiveSubmenu(null)}
                  >
                    {subitem.name}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export function Header() {
  const { user } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [signInPanelOpen, setSignInPanelOpen] = useState(false)
  
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || ""
  const userInitials = userName ? userName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() : ""

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        globalThis.window?.requestAnimationFrame(() => {
          setScrolled((globalThis.window?.scrollY ?? 0) > 40)
          ticking = false
        })
        ticking = true
      }
    }
    globalThis.addEventListener("scroll", handleScroll, { passive: true })
    return () => globalThis.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      <a
        href="#main-content"
        data-testid="skip-nav-link"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>

      <div className="sticky top-0 z-[100]">

      <div className="bg-primary text-primary-foreground text-sm py-2">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4 sm:gap-6">
              <a
                href={`tel:${PHONE_TOLL_FREE_TEL}`}
                className="flex items-center gap-1.5 min-h-11 py-1 hover:text-primary-foreground/80 transition-colors"
                onClick={() => trackPhoneClick(PHONE_TOLL_FREE)}
              >
                <Phone className="w-3.5 h-3.5" />
                <span className="font-semibold">{PHONE_TOLL_FREE}</span>
              </a>
              <span className="hidden sm:flex items-center text-primary-foreground/90">
                {BUSINESS_HOURS_SHORT}
              </span>
            </div>
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">4.8 Star Rating</span>
              </div>
              <span className="hidden md:flex items-center gap-1.5 font-semibold">
                <Award className="w-3.5 h-3.5" />
                OMVIC Licensed
              </span>
              <a 
                href="https://maps.google.com/?q=30+Major+Mackenzie+E+Richmond+Hill+ON"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 hover:text-primary-foreground/80 transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{DEALERSHIP_ADDRESS_FULL}</span>
              </a>
            </div>
          </div>
        </div>

      <header className={`bg-background/95 backdrop-blur-md border-b border-border ${scrolled ? "shadow-sm" : ""}`} role="banner">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-2 lg:px-8" aria-label="Main navigation">
          <div className="flex items-center gap-6">
            <Link href="/" className="shrink-0 min-w-[100px]">
              <div className="transition-transform duration-300 origin-left" style={{ transform: scrolled ? 'scale(0.75)' : 'scale(0.9)' }}>
                <PlanetMotorsLogo size="sm" showTagline={false} />
              </div>
            </Link>

            <DesktopNav
              activeSubmenu={activeSubmenu}
              setActiveSubmenu={setActiveSubmenu}
            />
          </div>

          <div className="hidden md:flex flex-1 max-w-sm mx-4">
            <SearchAutocomplete />
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <a 
              href="https://x.com/PlanetMotorsCA" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="X"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.165-6.75-5.913 6.75h-3.308l7.73-8.835L.424 2.25h6.7l4.676 6.188 5.368-6.188zM17.55 19.5h1.828L5.88 4.24H4.02L17.55 19.5z"/>
              </svg>
            </a>
            <a 
              href="https://www.facebook.com/PlanetMotors.ca" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Facebook"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            <a 
              href="https://www.instagram.com/planetmotors.ca" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Instagram"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a 
              href="https://www.youtube.com/@PlanetMotors_ca" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="YouTube"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            <a 
              href="https://www.tiktok.com/@planetmotors.ca" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="TikTok"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
              </svg>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <NavButton
              onSignInClick={() => setSignInPanelOpen(true)}
              onMenuClick={() => {
                setMobileMenuOpen(!mobileMenuOpen)
                setActiveSubmenu(null)
              }}
              onSignOut={async () => {
                const { createClient } = await import("@/lib/supabase/client")
                const supabase = createClient()
                await supabase.auth.signOut()
                globalThis.location.href = "/"
              }}
              isLoggedIn={!!user}
              userName={userName}
              userInitials={userInitials}
              isOnline={!!user}
              showMenuButton
            />
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="px-6 py-4 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  {item.submenu ? (
                    <>
                      <button
                        id={`mobile-nav-${item.name}`}
                        aria-expanded={activeSubmenu === item.name}
                        className="w-full text-left flex items-center justify-between px-3 py-3 min-h-11 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                        onClick={() => setActiveSubmenu(activeSubmenu === item.name ? null : item.name)}
                      >
                        {item.name}
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeSubmenu === item.name ? 'rotate-180' : ''}`} />
                      </button>
                      {activeSubmenu === item.name && (
                        <div role="region" aria-labelledby={`mobile-nav-${item.name}`} className="pl-4 space-y-1">
                          {item.submenu.map((subitem) => (
                            <Link
                              key={subitem.name}
                              href={subitem.href}
                              className="block px-3 py-3 min-h-11 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {subitem.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="block px-3 py-3 min-h-11 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted rounded"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </header>
      </div>{/* end sticky */}

      <div className="bg-[#f0f4ff] border-b border-[#e0e7f5] text-gray-700 text-sm py-2.5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-10 overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2 whitespace-nowrap">
                <CheckCircle className="w-4 h-4 text-green-700" />
                <span className="font-semibold text-xs sm:text-sm">10-Day Money Back Guarantee</span>
              </div>
              <span className="hidden sm:block text-gray-300">|</span>
              <div className="flex items-center gap-2 whitespace-nowrap">
                <Shield className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-xs sm:text-sm">$250 Refundable Deposit</span>
              </div>
              <span className="hidden sm:block text-gray-300">|</span>
              <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
                <CheckCircle className="w-4 h-4 text-green-700" />
                <span className="font-semibold text-xs sm:text-sm">210-Point Inspection</span>
              </div>
              <span className="hidden md:block text-gray-300">|</span>
              <div className="hidden md:flex items-center gap-2 whitespace-nowrap">
                <Truck className="w-4 h-4 text-teal-600" />
                <span className="font-semibold text-xs sm:text-sm">Canada-Wide Delivery</span>
              </div>
            </div>
          </div>
        </div>

      <SignInPanel isOpen={signInPanelOpen} onClose={() => setSignInPanelOpen(false)} />
    </>
  )
}
