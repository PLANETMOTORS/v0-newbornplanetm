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
                href="tel:416-985-2277" 
                className="flex items-center gap-3 text-sm text-background/70 hover:text-background transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>416-985-2277 (Local)</span>
              </a>
              <a 
                href={`mailto:${siteSettings.email}`}
                className="flex items-center gap-3 text-sm text-background/70 hover:text-background transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>{siteSettings.email}</span>
              </a>
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(`${siteSettings.streetAddress} ${siteSettings.city} ${siteSettings.province}`)}`}
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
