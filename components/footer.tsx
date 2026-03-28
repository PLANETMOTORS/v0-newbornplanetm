import Link from "next/link"
import { Phone, MapPin, Mail, Clock, Shield } from "lucide-react"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"

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
    { name: "Sell Your Car", href: "/sell" },
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

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12">
          {/* Brand & Contact */}
          <div className="lg:col-span-2">
            <div className="mb-6 bg-white rounded-lg p-3 inline-block">
              <PlanetMotorsLogo size="lg" />
            </div>
            <p className="text-background/70 text-sm leading-relaxed mb-6">
              Canada&apos;s trusted destination for premium pre-owned vehicles with nationwide delivery. 210-point inspection, 10-day money-back guarantee, and competitive multi-lender financing.
            </p>
            
            <div className="space-y-3">
              <a 
                href="tel:1-866-797-3332" 
                className="flex items-center gap-3 text-sm text-background/70 hover:text-background transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>1-866-797-3332 (Toll Free)</span>
              </a>
              <a 
                href="tel:416-985-2277" 
                className="flex items-center gap-3 text-sm text-background/70 hover:text-background transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>416-985-2277 (Local)</span>
              </a>
              <a 
                href="mailto:info@planetmotors.ca" 
                className="flex items-center gap-3 text-sm text-background/70 hover:text-background transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span>info@planetmotors.ca</span>
              </a>
              <a 
                href="https://maps.google.com/?q=30+Major+Mackenzie+E+Richmond+Hill+ON"
                target="_blank"
                rel="noopener noreferrer" 
                className="flex items-start gap-3 text-sm text-background/70 hover:text-background transition-colors"
              >
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>30 Major Mackenzie E<br />Richmond Hill, ON L4C 1G7</span>
              </a>
              <div className="flex items-center gap-3 text-sm text-background/70">
                <Clock className="w-4 h-4" />
                <span>Mon-Fri: 9AM-7PM | Sat: 10AM-5PM | Sun: Closed</span>
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
        <div className="mt-12 p-6 bg-background/5 rounded-xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-background/80" />
              <div>
                <p className="font-semibold">OMVIC Registered Dealer</p>
                <p className="text-sm text-background/70">Ontario Motor Vehicle Industry Council Licensed</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold">210</p>
                <p className="text-xs text-background/70">Point Inspection</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">10-Day</p>
                <p className="text-xs text-background/70">Money Back</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">$250</p>
                <p className="text-xs text-background/70">Refundable Deposit</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">Nationwide</p>
                <p className="text-xs text-background/70">Free Delivery</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-background/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/60">
            &copy; {new Date().getFullYear()} Planet Motors. All rights reserved. | planetmotors.ca
          </p>
          <div className="flex items-center gap-6">
            <a 
              href="https://facebook.com/planetmotors" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-background/60 hover:text-background transition-colors"
            >
              Facebook
            </a>
            <a 
              href="https://instagram.com/planetmotors" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-background/60 hover:text-background transition-colors"
            >
              Instagram
            </a>
            <a 
              href="https://youtube.com/planetmotors" 
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-background/60 hover:text-background transition-colors"
            >
              YouTube
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
