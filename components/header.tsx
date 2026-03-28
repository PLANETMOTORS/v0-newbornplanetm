"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Inventory", href: "/inventory" },
  { name: "360 Viewer", href: "/viewer" },
  { 
    name: "Protection Plans", 
    href: "/protection-plans",
    submenu: [
      { name: "Basic Coverage", href: "/protection-plans#basic" },
      { name: "Premium Coverage", href: "/protection-plans#premium" },
      { name: "Ultimate Coverage", href: "/protection-plans#ultimate" },
    ]
  },
  { 
    name: "Blueprints", 
    href: "/blueprints",
    submenu: [
      { name: "Technical Blueprint", href: "/blueprints/technical" },
      { name: "Enterprise Architecture", href: "/blueprints/enterprise" },
      { name: "Production Schema", href: "/blueprints/production" },
    ]
  },
  { name: "Contact", href: "/contact" },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">PM</span>
          </div>
          <span className="font-serif text-xl font-semibold tracking-tight">
            Planet Motors
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex lg:items-center lg:gap-8">
          {navigation.map((item) => (
            <div
              key={item.name}
              className="relative"
              onMouseEnter={() => item.submenu && setActiveSubmenu(item.name)}
              onMouseLeave={() => setActiveSubmenu(null)}
            >
              <Link
                href={item.href}
                className={cn(
                  "text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                )}
              >
                {item.name}
                {item.submenu && <ChevronDown className="w-3 h-3" />}
              </Link>

              {/* Submenu */}
              {item.submenu && activeSubmenu === item.name && (
                <div className="absolute top-full left-0 pt-2">
                  <div className="bg-card rounded-lg shadow-lg border border-border py-2 min-w-[200px]">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        className="block px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
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

        {/* CTA Button */}
        <div className="hidden lg:flex lg:items-center lg:gap-4">
          <Button variant="outline" size="sm">
            Schedule Test Drive
          </Button>
          <Button size="sm">
            Browse Inventory
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
          <div className="px-6 py-4 space-y-4">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  className="block text-base font-medium text-foreground py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
                {item.submenu && (
                  <div className="pl-4 space-y-2 mt-2">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        className="block text-sm text-muted-foreground py-1"
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
              <Button variant="outline" className="w-full">
                Schedule Test Drive
              </Button>
              <Button className="w-full">
                Browse Inventory
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
