import Link from "next/link"

const footerLinks = {
  vehicles: [
    { name: "New Vehicles", href: "/inventory?condition=new" },
    { name: "Pre-Owned", href: "/inventory?condition=used" },
    { name: "Certified Pre-Owned", href: "/inventory?condition=cpo" },
    { name: "360 Spin Viewer", href: "/viewer" },
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
    { name: "Privacy Policy", href: "/privacy" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-background rounded-full flex items-center justify-center">
                <span className="text-foreground font-bold text-lg">PM</span>
              </div>
              <span className="font-serif text-xl font-semibold">
                Planet Motors
              </span>
            </Link>
            <p className="text-background/70 text-sm leading-relaxed">
              Your trusted destination for premium vehicles. Explore our collection of 9,500+ vehicles with interactive 360-degree views.
            </p>
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
        </div>

        <div className="mt-16 pt-8 border-t border-background/20 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/60">
            {new Date().getFullYear()} Planet Motors. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/terms" className="text-sm text-background/60 hover:text-background transition-colors">
              Terms
            </Link>
            <Link href="/privacy" className="text-sm text-background/60 hover:text-background transition-colors">
              Privacy
            </Link>
            <Link href="/cookies" className="text-sm text-background/60 hover:text-background transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
