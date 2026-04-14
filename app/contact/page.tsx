import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact Us | Planet Motors - Phone, Email, Live Chat",
  description: "Get in touch with Planet Motors. Call 1-866-797-3332, email info@planetmotors.ca, or visit us at 30 Major Mackenzie Dr E, Richmond Hill, ON.",
}

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ContactPageJsonLd } from "@/components/seo/json-ld"
import { LiveChatWidget } from "@/components/live-chat-widget"
import { ContactForm } from "@/components/contact-form"
import { Button } from "@/components/ui/button"
import { Phone, MapPin, Mail, Clock, MessageCircle, Car } from "lucide-react"

const contactMethods = [
  {
    icon: Phone,
    title: "Phone",
    primary: "1-866-797-3332",
    secondary: "Local: 416-985-2277",
    description: "Speak directly with our team",
  },
  {
    icon: Mail,
    title: "Email",
    primary: "info@planetmotors.ca",
    secondary: "sales@planetmotors.ca",
    description: "We respond within 2 hours",
  },
  {
    icon: MessageCircle,
    title: "Live Chat",
    primary: "Available Now",
    secondary: "24/7 Support",
    description: "Chat with us instantly",
  },
  {
    icon: MapPin,
    title: "Visit Us",
    primary: "30 Major Mackenzie Dr E",
    secondary: "Richmond Hill, ON L4C 1G7",
    description: "Walk-ins welcome",
  },
]

const departments = [
  { name: "Sales", phone: "416-985-2277", email: "sales@planetmotors.ca" },
  { name: "Financing", phone: "416-985-2277", email: "financing@planetmotors.ca" },
  { name: "Service", phone: "416-985-2277", email: "service@planetmotors.ca" },
  { name: "Trade-In", phone: "416-985-2277", email: "tradein@planetmotors.ca" },
]

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <ContactPageJsonLd />
      <Header />

      {/* Hero */}
      <section className="pt-8 pb-16 lg:pt-16 lg:pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="font-serif text-4xl md:text-5xl font-semibold tracking-tight">
              Contact Us
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Have questions? We&apos;re here to help. Reach out through any of the methods below.
            </p>
          </div>

          {/* Contact Methods Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {contactMethods.map((method) => (
              <div key={method.title} className="bg-card rounded-xl p-6 border border-border hover:border-primary/30 transition-colors">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <method.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg mb-1">{method.title}</h3>
                <p className="text-primary font-medium">{method.primary}</p>
                <p className="text-sm text-muted-foreground">{method.secondary}</p>
                <p className="text-sm text-muted-foreground mt-2">{method.description}</p>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="bg-card rounded-2xl border border-border p-8">
              <h2 className="font-semibold text-xl mb-6">Send Us a Message</h2>
              <ContactForm />
            </div>

            {/* Map & Hours */}
            <div className="space-y-6">
              {/* Map placeholder */}
              <div className="bg-muted rounded-xl h-64 flex items-center justify-center">
                <div className="text-center">
                  <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">30 Major Mackenzie Dr E</p>
                  <p className="text-muted-foreground">Richmond Hill, ON L4C 1G7</p>
                  <Button variant="outline" size="sm" className="mt-4" asChild>
                    <a
                      href="https://maps.google.com/?q=30+Major+Mackenzie+Dr+E+Richmond+Hill+ON"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open in Google Maps
                    </a>
                  </Button>
                </div>
              </div>

              {/* Hours */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">Business Hours</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monday - Friday</span>
                    <span className="font-medium">9:00 AM - 7:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Saturday</span>
                    <span className="font-medium">9:00 AM - 6:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sunday</span>
                    <span className="font-medium">Closed</span>
                  </div>
                </div>
              </div>

              {/* Departments */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Car className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">Departments</h3>
                </div>
                <div className="space-y-4">
                  {departments.map((dept) => (
                    <div key={dept.name} className="flex items-center justify-between">
                      <span className="font-medium">{dept.name}</span>
                      <div className="text-right">
                        <a href={`tel:${dept.phone}`} className="text-sm text-primary hover:underline block">
                          {dept.phone}
                        </a>
                        <a href={`mailto:${dept.email}`} className="text-xs text-muted-foreground hover:underline">
                          {dept.email}
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
      <LiveChatWidget />
    </div>
  )
}
