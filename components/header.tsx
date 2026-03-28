"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X, ChevronDown, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"

const navigation = [
  { name: "Inventory", href: "/inventory" },
  { 
    name: "Buy",
    href: "/how-it-works",
    submenu: [
      { name: "How It Works", href: "/how-it-works" },
      { name: "360 Viewer", href: "/viewer" },
      { name: "Compare Vehicles", href: "/compare" },
      { name: "Financing", href: "/financing" },
      { name: "Delivery", href: "/delivery" },
    ]
  },
  { name: "Sell/Trade", href: "/trade-in" },
  { 
    name: "Protection", 
    href: "/protection-plans",
    submenu: [
      { name: "Protection Plans", href: "/protection-plans" },
      { name: "Warranty Info", href: "/warranty" },
    ]
  },
  { 
    name: "Resources",
    href: "/about",
    submenu: [
      { name: "About Us", href: "/about" },
      { name: "FAQ", href: "/faq" },
      { name: "Contact", href: "/contact" },
      { name: "Blueprints", href: "/blueprints" },
    ]
  },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <>
      {/* Top bar with contact info */}
      <div className={`bg-primary text-primary-foreground text-sm transition-all duration-300 ${scrolled ? "hidden" : "block"}`}>
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex flex-wrap items-center justify-between gap-2 py-2">
          <div className="flex items-center gap-4 sm:gap-6">
            <a 
              href="tel:1-866-787-3332" 
              className="flex items-center gap-1.5 hover:text-primary-foreground/80 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span className="font-medium">1-866-787-3332</span>
            </a>
            <a 
              href="tel:416-985-2277" 
              className="hidden sm:flex items-center gap-1.5 hover:text-primary-foreground/80 transition-colors"
            >
              <span>Local: 416-985-2277</span>
            </a>
          </div>
          <a 
            href="https://maps.google.com/?q=30+Major+Mackenzie+E+Richmond+Hill+ON"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-primary-foreground/80 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">30 Major Mackenzie E, Richmond Hill, ON L4C 1G7</span>
            <span className="sm:hidden">Richmond Hill, ON</span>
          </a>
        </div>
      </div>

      {/* Main header */}
      <header className={`sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border transition-shadow duration-300 ${scrolled ? "shadow-sm" : ""}`}>
        <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <PlanetMotorsLogo size={scrolled ? "sm" : "md"} showTagline={!scrolled} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:gap-1">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.submenu && setActiveSubmenu(item.name)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <Link
                  href={item.href}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted"
                >
                  {item.name}
                  {item.submenu && <ChevronDown className="w-3.5 h-3.5" />}
                </Link>

                {/* Submenu */}
                {item.submenu && activeSubmenu === item.name && (
                  <div className="absolute top-full left-0 pt-2">
                    <div className="bg-card rounded-xl shadow-lg border border-border py-2 min-w-[220px]">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className="block px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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

          {/* CTA Buttons */}
          <div className="hidden lg:flex lg:items-center lg:gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/financing">Get Pre-Approved</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/inventory">Browse Inventory</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </nav>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-border bg-background">
            <div className="px-6 py-4 space-y-1">
              {navigation.map((item) => (
                <div key={item.name}>
                  <Link
                    href={item.href}
                    className="block text-base font-medium text-foreground py-3 px-3 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <div className="pl-4 space-y-1 mb-2">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className="block text-sm text-muted-foreground py-2 px-3 rounded-lg hover:bg-muted transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div className="pt-4 flex flex-col gap-3">
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/financing">Get Pre-Approved</Link>
                </Button>
                <Button className="w-full" asChild>
                  <Link href="/inventory">Browse Inventory</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  )
}
