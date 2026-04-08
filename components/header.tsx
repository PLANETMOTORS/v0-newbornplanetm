"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Menu, X, ChevronDown, Phone, MapPin, Star, CheckCircle, Shield, Truck, Award } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"
import { GoogleReviewsBadge } from "@/components/google-reviews-badge"
import { SignInPanel } from "@/components/sign-in-panel"

// Navigation item type
type NavItem = {
  name: string
  href: string
  submenu?: { name: string; href: string }[]
}

// Desktop Navigation with stable dropdown behavior
function DesktopNav({ 
  navigation, 
  activeSubmenu, 
  setActiveSubmenu 
}: { 
  navigation: NavItem[]
  activeSubmenu: string | null
  setActiveSubmenu: (name: string | null) => void
}) {
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isHoveringRef = useRef(false)

  const handleMouseEnter = (itemName: string, hasSubmenu: boolean) => {
    isHoveringRef.current = true
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
    if (hasSubmenu) {
      setActiveSubmenu(itemName)
    }
  }

  const handleMouseLeave = () => {
    isHoveringRef.current = false
    // Longer delay to prevent accidental closes
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringRef.current) {
        setActiveSubmenu(null)
      }
    }, 800)
  }

  return (
    <div className="hidden lg:flex lg:items-center lg:gap-1">
      {navigation.map((item) => (
        <div
          key={item.name}
          className="relative"
          onMouseEnter={() => handleMouseEnter(item.name, !!item.submenu)}
          onMouseLeave={handleMouseLeave}
        >
          {item.submenu ? (
            <button
              type="button"
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
              onClick={() => setActiveSubmenu(activeSubmenu === item.name ? null : item.name)}
            >
              {item.name}
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${activeSubmenu === item.name ? 'rotate-180' : ''}`} />
            </button>
          ) : (
            <Link
              href={item.href}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
            >
              {item.name}
            </Link>
          )}

          {/* Dropdown menu with stable hover */}
          {item.submenu && activeSubmenu === item.name && (
            <div 
              className="absolute top-full left-0 pt-1 min-w-[220px] z-[99999]"
              onMouseEnter={() => handleMouseEnter(item.name, true)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="bg-white rounded-xl shadow-2xl border border-gray-200 py-2">
              {item.submenu.map((subitem) => (
                <Link
                  key={subitem.name}
                  href={subitem.href}
                  className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  onClick={() => setActiveSubmenu(null)}
                >
                  {subitem.name}
                </Link>
              ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

const navigation = [
  { 
    name: "Shop Inventory",
    href: "/inventory",
    submenu: [
      { name: "All Vehicles", href: "/inventory" },
      { name: "Electric Vehicles", href: "/inventory?fuelType=Electric" },
      { name: "SUVs & Crossovers", href: "/inventory?bodyType=SUV" },
      { name: "Sedans", href: "/inventory?bodyType=Sedan" },
      { name: "Trucks", href: "/inventory?bodyType=Truck" },
    ]
  },
  { 
    name: "Sell or Trade",
    href: "/trade-in",
    submenu: [
      { name: "Get Trade-In Value", href: "/trade-in" },
      { name: "Sell Your Car", href: "/sell-your-car" },
    ]
  },
  { 
    name: "Finance",
    href: "/financing",
    submenu: [
      { name: "Get Pre-Approved", href: "/financing" },
      { name: "Financing Calculator", href: "/financing#calculator" },
      { name: "How It Works", href: "/how-it-works" },
      { name: "Delivery", href: "/delivery" },
    ]
  },
  { 
    name: "More",
    href: "/about",
    submenu: [
      { name: "About", href: "/about" },
      { name: "EV Battery Health", href: "/ev-battery-health" },
      { name: "Car Value Calculator", href: "/trade-in" },
      { name: "Protection Plans", href: "/protection-plans" },
      { name: "FAQ", href: "/faq" },
      { name: "Careers", href: "/careers" },
      { name: "Contact Us", href: "/contact" },
      { name: "Blog", href: "/blog" },
    ]
  },
]

export function Header() {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)
  const [signInPanelOpen, setSignInPanelOpen] = useState(false)

  useEffect(() => {
    let ticking = false
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 40)
          ticking = false
        })
        ticking = true
      }
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>

      {/* Sticky wrapper for all header bars */}
      <div className="sticky top-0 z-[60]">

      {/* Top bar with contact info */}
      <div className={`bg-primary text-primary-foreground text-sm transition-all duration-300 overflow-hidden ${scrolled ? "max-h-0 py-0" : "max-h-12 py-2"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-4 sm:gap-6">
            <a 
              href="tel:1-866-797-3332" 
              className="flex items-center gap-1.5 hover:text-primary-foreground/80 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="font-medium">1-866-797-3332</span>
            </a>
            <span className="hidden sm:flex items-center text-primary-foreground/90">
              Mon-Fri 9AM-7PM | Sat 9AM-6PM
            </span>
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.8 Star Rating</span>
            </div>
            <span className="hidden md:flex items-center gap-1.5 font-medium">
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
              <span>30 Major Mackenzie Dr E, Richmond Hill, ON L4C 1G7</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <header className={`bg-background/95 backdrop-blur-md border-b border-border transition-shadow duration-300 will-change-transform ${scrolled ? "shadow-sm" : ""}`} role="banner">
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 sm:px-6 py-3 lg:px-8" aria-label="Main navigation">
          {/* Left side: Logo + Navigation (like Clutch) */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 min-w-[120px]">
              <div className="transition-transform duration-300 origin-left" style={{ transform: scrolled ? 'scale(0.85)' : 'scale(1)' }}>
                <PlanetMotorsLogo size="md" showTagline={!scrolled} />
              </div>
            </Link>

            {/* Desktop Navigation - Close to logo */}
            <div className="hidden lg:block">
              <DesktopNav 
                navigation={navigation} 
                activeSubmenu={activeSubmenu} 
                setActiveSubmenu={setActiveSubmenu} 
              />
            </div>
          </div>

          {/* Right side: Carvana-style User/Menu pill button */}
          <button
            onClick={() => setSignInPanelOpen(true)}
            className="flex items-center gap-2 px-3 py-2 border border-border rounded-full hover:shadow-md transition-all duration-200 bg-background"
            aria-label="Sign in and menu"
          >
            {/* User icon */}
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center">
              <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            {/* Hamburger icon */}
            <Menu className="w-4 h-4 text-foreground" />
          </button>
        </nav>

      </header>

      {/* Trust Bar - Value Propositions (Light Gray - Professional) */}
      <div className={`bg-gray-100 border-b border-gray-200 text-gray-700 text-sm transition-all duration-300 overflow-hidden ${scrolled ? "max-h-0 py-0" : "max-h-14 py-2.5"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-3 sm:gap-6 md:gap-10 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 whitespace-nowrap">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-xs sm:text-sm">10-Day Money Back Guarantee</span>
            </div>
            <span className="hidden sm:block text-gray-300">|</span>
            <div className="flex items-center gap-2 whitespace-nowrap">
              <Shield className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-xs sm:text-sm">$250 Refundable Deposit</span>
            </div>
            <span className="hidden sm:block text-gray-300">|</span>
            <div className="hidden sm:flex items-center gap-2 whitespace-nowrap">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-medium text-xs sm:text-sm">210-Point Inspection</span>
            </div>
            <span className="hidden md:block text-gray-300">|</span>
            <div className="hidden md:flex items-center gap-2 whitespace-nowrap">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-xs sm:text-sm">Canada-Wide Delivery</span>
            </div>
          </div>
        </div>
      </div>

      </div>{/* end sticky wrapper */}

      {/* Sign In Panel */}
      <SignInPanel isOpen={signInPanelOpen} onClose={() => setSignInPanelOpen(false)} />
    </>
  )
}
