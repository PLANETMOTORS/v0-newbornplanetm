import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Briefcase, MapPin, Heart, TrendingUp, Users,
  Car, Zap, Shield, ArrowRight, CheckCircle
} from "lucide-react"
import { BreadcrumbJsonLd } from "@/components/seo/json-ld"

export const metadata = {
  title: "Careers | Planet Motors",
  description: "Join the Planet Motors team. Explore career opportunities in automotive sales, customer service, and technology.",
  alternates: {
    canonical: '/careers',
  },
}

const openPositions = [
  {
    title: "Sales Consultant",
    department: "Sales",
    location: "Richmond Hill, ON",
    type: "Full-time",
    description: "Help customers find their perfect vehicle. No pressure sales environment with competitive commission structure.",
    requirements: ["Valid G license", "Customer service experience", "Automotive knowledge preferred"],
  },
  {
    title: "Vehicle Acquisition Specialist",
    department: "Purchasing",
    location: "Richmond Hill, ON",
    type: "Full-time",
    description: "Source and evaluate quality pre-owned vehicles for our inventory. CBB certification training provided.",
    requirements: ["3+ years automotive experience", "Strong negotiation skills", "Valid G license"],
  },
  {
    title: "Customer Experience Representative",
    department: "Customer Service",
    location: "Remote / Hybrid",
    type: "Full-time",
    description: "Provide exceptional support to customers throughout their buying journey via phone, chat, and email.",
    requirements: ["Excellent communication skills", "Problem-solving mindset", "Bilingual (English/French) a plus"],
  },
  {
    title: "Automotive Technician",
    department: "Service",
    location: "Richmond Hill, ON",
    type: "Full-time",
    description: "Perform our comprehensive 210-point inspections and ensure every vehicle meets our quality standards.",
    requirements: ["310S or 310T certification", "EV experience preferred", "Diagnostic tool proficiency"],
  },
  {
    title: "Full-Stack Developer",
    department: "Technology",
    location: "Remote / Hybrid",
    type: "Full-time",
    description: "Build and maintain our e-commerce platform. Work with Next.js, TypeScript, and AWS.",
    requirements: ["3+ years React/Next.js", "TypeScript proficiency", "AWS or cloud experience"],
  },
]

const benefits = [
  { icon: Heart, title: "Health & Dental", description: "Comprehensive benefits for you and your family" },
  { icon: TrendingUp, title: "RRSP Matching", description: "We match up to 4% of your contributions" },
  { icon: Car, title: "Employee Vehicle Program", description: "Discounts on vehicle purchases and leases" },
  { icon: Zap, title: "EV Charging", description: "Free workplace charging for electric vehicles" },
  { icon: Users, title: "Team Events", description: "Regular team outings and company celebrations" },
  { icon: Shield, title: "Paid Time Off", description: "Generous vacation plus personal days" },
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background">
      <BreadcrumbJsonLd items={[{ name: "Home", url: "/" }, { name: "Careers", url: "/careers" }]} />
      <Header />

      <main id="main-content" tabIndex={-1}>
        {/* Hero */}
        <section className="bg-primary py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground">
              <Briefcase className="w-3 h-3 mr-1" />
              We are Hiring
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold tracking-[-0.01em] md:tracking-[-0.02em] text-primary-foreground mb-4">
              Join the Planet Motors Team
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto">
              Help us transform the car buying experience in Canada. We are looking for passionate 
              individuals who share our commitment to fairness, integrity, and exceptional customer service.
            </p>
          </div>
        </section>

        {/* Why Work Here */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Why Planet Motors?</h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              We are building Canada&apos;s most trusted online car buying platform. Join a team that values 
              innovation, transparency, and work-life balance.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, i) => (
                <Card key={i} className="text-center">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <benefit.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-muted-foreground text-sm">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Open Positions */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Open Positions</h2>
            <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-12">
              Explore our current opportunities. Do not see the perfect role? Send us your resume at careers@planetmotors.ca
            </p>
            
            <div className="space-y-6 max-w-4xl mx-auto">
              {openPositions.map((position, i) => (
                <Card key={i} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{position.department}</Badge>
                          <Badge variant="secondary">{position.type}</Badge>
                        </div>
                        <h3 className="text-xl font-semibold mb-2">{position.title}</h3>
                        <p className="text-muted-foreground mb-4">{position.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {position.location}
                          </span>
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm font-semibold">Requirements:</p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {position.requirements.map((req, j) => (
                              <li key={j} className="flex items-center gap-2">
                                <CheckCircle className="w-3 h-3 text-green-500" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <Button className="lg:self-start">
                        Apply Now
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Do Not See the Right Role?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              We are always looking for talented individuals. Send your resume and tell us how you can 
              contribute to our mission of transforming car buying in Canada.
            </p>
            <Button size="lg" variant="outline" asChild>
              <Link href="mailto:careers@planetmotors.ca">
                Send Your Resume
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
