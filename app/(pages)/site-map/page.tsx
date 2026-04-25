import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { 
  Car, DollarSign, FileText, HelpCircle, Shield,
  Scale, LockKeyhole, Building2
} from "lucide-react"

export const metadata = {
  title: "Sitemap | Planet Motors",
  description: "Complete sitemap of Planet Motors website. Find all pages including inventory, financing, trade-in, and more.",
  alternates: {
    canonical: "/site-map",
  },
}

const sitemapSections = [
  {
    title: "Shop Vehicles",
    icon: Car,
    links: [
      { name: "Browse All Inventory", href: "/inventory" },
      { name: "Electric Vehicles", href: "/inventory?fuel=electric" },
      { name: "SUVs", href: "/inventory?body=suv" },
      { name: "Sedans", href: "/inventory?body=sedan" },
      { name: "Trucks", href: "/inventory?body=truck" },
      { name: "Luxury Vehicles", href: "/inventory?type=luxury" },
      { name: "Compare Vehicles", href: "/compare" },
      { name: "360 Vehicle Viewer", href: "/viewer" },
    ],
  },
  {
    title: "Trade-In",
    icon: DollarSign,
    links: [
      { name: "Trade-In Appraisal", href: "/trade-in" },
    ],
  },
  {
    title: "Financing",
    icon: FileText,
    links: [
      { name: "Financing Overview", href: "/financing" },
      { name: "Get Pre-Approved", href: "/financing#apply" },
      { name: "Payment Calculator", href: "/financing#calculator" },
      { name: "Bad Credit Options", href: "/financing#credit-options" },
    ],
  },
  {
    title: "Services & Protection",
    icon: Shield,
    links: [
      { name: "Protection Plans", href: "/protection-plans" },
      { name: "Warranty Options", href: "/warranty" },
      { name: "EV Battery Health", href: "/ev-battery" },
      { name: "210-Point Inspection", href: "/how-it-works#inspection" },
      { name: "Delivery Options", href: "/delivery" },
    ],
  },
  {
    title: "Help & Support",
    icon: HelpCircle,
    links: [
      { name: "How It Works", href: "/how-it-works" },
      { name: "FAQ", href: "/faq" },
      { name: "Contact Us", href: "/contact" },
      { name: "Schedule Test Drive", href: "/schedule" },
      { name: "Accessibility", href: "/accessibility" },
    ],
  },
  {
    title: "Company",
    icon: Building2,
    links: [
      { name: "About Planet Motors", href: "/about" },
      { name: "Careers", href: "/careers" },
      { name: "Our Team", href: "/about#team" },
      { name: "Showroom Location", href: "/contact#location" },
    ],
  },
  {
    title: "Legal",
    icon: Scale,
    links: [
      { name: "Terms of Service", href: "/terms" },
      { name: "Privacy Policy", href: "/privacy" },
      { name: "OMVIC Information", href: "/about#omvic" },
    ],
  },
  {
    title: "Account",
    icon: LockKeyhole,
    links: [
      { name: "My Account", href: "/account" },
      { name: "Saved Vehicles", href: "/favorites" },
      { name: "Recent Views", href: "/account#recent" },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" tabIndex={-1} className="pt-24 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-bold tracking-[-0.01em] mb-2">Sitemap</h1>
            <p className="text-muted-foreground mb-12">
              Navigate all pages on the Planet Motors website
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {sitemapSections.map((section) => (
                <div key={section.title}>
                  <div className="flex items-center gap-2 mb-4">
                    <section.icon className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-lg">{section.title}</h2>
                  </div>
                  <ul className="space-y-2">
                    {section.links.map((link, j) => (
                      <li key={j}>
                        <Link 
                          href={link.href}
                          className="text-muted-foreground hover:text-primary transition-colors text-sm"
                        >
                          {link.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            
            
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
