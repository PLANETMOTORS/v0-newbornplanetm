"use client"

import Link from "next/link"
import { Phone, MapPin, Mail, Clock, Shield } from "lucide-react"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"

export type FooterProps = {
  siteSettings: {
    dealerName: string
    phone: string
    email: string
    streetAddress: string
    city: string
    province: string
    postalCode: string
    googleMapsUrl?: string
    facebookUrl?: string
    instagramUrl?: string
    twitterUrl?: string
    youtubeUrl?: string
    businessHours?: Array<{
      day: string
      open: string
      close: string
      isClosed: boolean
    }>
    depositAmount?: number
  }
}

const footerLinks = {
  vehicles: [
    { name: "Browse Inventory", href: "/inventory" },
    { name: "Certified Pre-Owned", href: "/inventory?condition=cpo" },
    { name: "360 Spin Viewer", href: "/viewer" },
    { name: "New Arrivals", href: "/inventory?sort=newest" },
    { name: "Electric Vehicles", href: "/inventory?type=electric" },
  ],
  services: [
    { name: "Protection Plans", href: "/protection-plans" },
    { name: "Financing", href: "/financing" },
    { name: "Trade-In", href: "/trade-in" },
    { name: "Service Center", href: "/service" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Contact", href: "/contact" },
    { name: "Blog", href: "/blog" },
  ],
  legal: [
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "Accessibility", href: "/accessibility" },
    { name: "Sitemap", href: "/sitemap" },
  ],
}

export function FooterContent({ siteSettings }: FooterProps) {
  // Format business hours
  const weekdayHours = siteSettings.businessHours?.find(h => h.day === "Monday")
  const saturdayHours = siteSettings.businessHours?.find(h => h.day === "Saturday")
  const sundayHours = siteSettings.businessHours?.find(h => h.day === "Sunday")

  const formatHoursDisplay = () => {
    const weekday = weekdayHours && !weekdayHours.isClosed 
      ? `Mon-Fri: ${weekdayHours.open}-${weekdayHours.close}` 
      : "Mon-Fri: 9AM-7PM"
    const saturday = saturdayHours && !saturdayHours.isClosed 
      ? `Sat: ${saturdayHours.open}-${saturdayHours.close}` 
      : "Sat: 9AM-6PM"
    const sunday = sundayHours?.isClosed ? "Sun: Closed" : ""
    
    return `${weekday} | ${saturday}${sunday ? ` | ${sunday}` : ""}`
  }

  const depositAmount = siteSettings.depositAmount || 250

  return (
    <footer className="bg-foreground text-background" role="contentinfo" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand & Contact */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <PlanetMotorsLogo size="lg" />
            </div>
            <p className="text-background/70 text-sm leading-relaxed mb-6">
              Canada&apos;s trusted destination for premium pre-owned vehicles with nationwide delivery. 210-point inspection, 10-day money-back guarantee, and competitive multi-lender financing.
            </p>
            
            <div className="space-y-3">
              <a 
                href={`tel:${siteSettings.phone.replace(/[^0-9]/g, '')}`}
                className="flex items-center gap-3 text-sm text-background/70 hover:text-background transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>{siteSettings.phone} (Toll Free)</span>
              </a>
              <a 
                href={`mailto:${siteSettings.email}`}
                className="flex items-center gap-3 text-sm text-background/70 hover:text-background transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>{siteSettings.email}</span>
              </a>
              <a 
                href={siteSettings.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(`${siteSettings.streetAddress} ${siteSettings.city} ${siteSettings.province}`)}`}
                target="_blank"
                rel="noopener noreferrer" 
                className="flex items-start gap-3 text-sm text-background/70 hover:text-background transition-colors"
              >
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{siteSettings.streetAddress}<br />{siteSettings.city}, {siteSettings.province?.slice(0, 2)} {siteSettings.postalCode}</span>
              </a>
              <div className="flex items-center gap-3 text-sm text-background/70">
                <Clock className="w-4 h-4" />
                <span>{formatHoursDisplay()}</span>
              </div>
            </div>
          </div>

          {/* Vehicles */}
          <div>
            <h3 className="font-semibold mb-4">Vehicles</h3>
            <ul className="space-y-3">
              {footerLinks.vehicles.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us & Social */}
          <div>
            <h3 className="font-semibold mb-4">Contact Us</h3>
            <div className="space-y-4">
              <a 
                href={`https://www.google.com/maps/search/${encodeURIComponent(siteSettings.streetAddress + ' ' + siteSettings.city)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm text-background/70 hover:text-background transition-colors"
              >
                {siteSettings.city}
              </a>
              <a 
                href={`tel:${siteSettings.phone.replace(/[^0-9]/g, '')}`}
                className="block text-sm text-background/70 hover:text-background transition-colors"
              >
                Call us
              </a>
              <a 
                href={`mailto:${siteSettings.email}`}
                className="block text-sm text-background/70 hover:text-background transition-colors"
              >
                Email us
              </a>
              <a 
                href="/contact"
                className="block text-sm text-background/70 hover:text-background transition-colors"
              >
                Chat with us
              </a>
              
              {/* Social Media Icons */}
              <div className="pt-2 flex items-center gap-3">
                <a 
                  href="https://www.facebook.com/PlanetMotors.ca" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-background/70 hover:text-background transition-colors"
                  aria-label="Facebook"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a 
                  href="https://x.com/PlanetMotorsCA" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-background/70 hover:text-background transition-colors"
                  aria-label="X"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.165-6.75-5.913 6.75h-3.308l7.73-8.835L.424 2.25h6.7l4.676 6.188 5.368-6.188zM17.55 19.5h1.828L5.88 4.24H4.02L17.55 19.5z"/>
                  </svg>
                </a>
                <a 
                  href="https://www.instagram.com/planetmotors.ca" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 text-background/70 hover:text-background transition-colors"
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
                  className="p-2 text-background/70 hover:text-background transition-colors"
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
                  className="p-2 text-background/70 hover:text-background transition-colors"
                  aria-label="TikTok"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* OMVIC Badge */}
        <div className="mt-12 p-4 sm:p-6 bg-background/5 rounded-xl">
          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <Shield className="w-8 h-8 text-background/80 shrink-0" />
              <div>
                <p className="font-semibold">OMVIC Registered Dealer</p>
                <p className="text-sm text-background/70">Ontario Motor Vehicle Industry Council Licensed</p>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 w-full">
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold">210</p>
                <p className="text-xs text-background/70">Point Inspection</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold">10-Day</p>
                <p className="text-xs text-background/70">Money Back</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold">${depositAmount}</p>
                <p className="text-xs text-background/70">Refundable Deposit</p>
              </div>
              <div className="text-center">
                <p className="text-xl sm:text-2xl font-bold">Canada</p>
                <p className="text-xs text-background/70">Wide Delivery</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/20 flex flex-col items-center gap-4 text-center">
          <p className="text-sm text-background/60">
            &copy; {new Date().getFullYear()} {siteSettings.dealerName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4 sm:gap-6">
            {siteSettings.facebookUrl && (
              <a 
                href={siteSettings.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-background/60 hover:text-background transition-colors"
              >
                Facebook
              </a>
            )}
            {siteSettings.instagramUrl && (
              <a 
                href={siteSettings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-background/60 hover:text-background transition-colors"
              >
                Instagram
              </a>
            )}
            {siteSettings.youtubeUrl && (
              <a 
                href={siteSettings.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-background/60 hover:text-background transition-colors"
              >
                YouTube
              </a>
            )}
            {siteSettings.twitterUrl && (
              <a 
                href={siteSettings.twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-background/60 hover:text-background transition-colors"
              >
                X (Twitter)
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  )
}
