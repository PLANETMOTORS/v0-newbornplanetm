import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Award, Users, MapPin, Heart, Target } from "lucide-react"

export default function AboutPage() {
  const teamMembers = [
    { name: "Joe Haji", role: "Founder & CEO", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop" },
    { name: "Cory Seda", role: "Operations Director", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop" },
    { name: "Ahmad K.", role: "Sales Manager", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop" }
  ]

  const milestones = [
    { year: "2015", title: "Founded", description: "Planet Motors established in Richmond Hill, Ontario" },
    { year: "2018", title: "OMVIC Licensed", description: "Received official dealer license #4048307" },
    { year: "2020", title: "Online Platform", description: "Launched digital-first buying experience" },
    { year: "2023", title: "Nationwide Delivery", description: "Expanded to serve all of Canada" },
    { year: "2024", title: "9,500+ Vehicles", description: "Grew inventory to serve more Canadians" }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-primary py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground">OMVIC Licensed #4048307</Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
              Fairness &amp; Integrity
            </h1>
            <p className="text-xl text-primary-foreground/80 max-w-3xl mx-auto">
              At Planet Motors, we believe buying a used car should be simple, transparent, and stress-free. 
              Our mission is to provide Canadians with the best selection of quality pre-owned vehicles 
              backed by our 210-point inspection and 10-day money-back guarantee.
            </p>
          </div>
        </section>

        {/* Values */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center p-6">
                <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-xl mb-2">Transparency</h3>
                <p className="text-muted-foreground">
                  No hidden fees, no surprises. Every vehicle comes with a complete history report and detailed inspection.
                </p>
              </Card>
              <Card className="text-center p-6">
                <Heart className="h-12 w-12 mx-auto mb-4 text-accent" />
                <h3 className="font-semibold text-xl mb-2">Customer First</h3>
                <p className="text-muted-foreground">
                  Your satisfaction is our priority. Our 10-day return policy means you can buy with confidence.
                </p>
              </Card>
              <Card className="text-center p-6">
                <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-xl mb-2">Quality Assured</h3>
                <p className="text-muted-foreground">
                  Every vehicle undergoes our rigorous 210-point inspection before being offered for sale.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div>
                <p className="text-4xl font-bold text-primary">9,500+</p>
                <p className="text-muted-foreground">Vehicles Sold</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">4.9/5</p>
                <p className="text-muted-foreground">Customer Rating</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">210</p>
                <p className="text-muted-foreground">Point Inspection</p>
              </div>
              <div>
                <p className="text-4xl font-bold text-primary">10</p>
                <p className="text-muted-foreground">Day Returns</p>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Timeline */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Journey</h2>
            <div className="max-w-3xl mx-auto">
              {milestones.map((milestone, i) => (
                <div key={i} className="flex gap-6 mb-8 last:mb-0">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                      {milestone.year}
                    </div>
                    {i < milestones.length - 1 && (
                      <div className="w-0.5 flex-1 bg-border mt-2" />
                    )}
                  </div>
                  <div className="pb-8">
                    <h3 className="font-semibold text-lg">{milestone.title}</h3>
                    <p className="text-muted-foreground">{milestone.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Meet Our Leadership</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {teamMembers.map((member, i) => (
                <Card key={i} className="overflow-hidden text-center">
                  <div className="relative aspect-square">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-lg">{member.name}</h3>
                    <p className="text-muted-foreground">{member.role}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Location */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <Card className="overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="relative aspect-square md:aspect-auto">
                    <Image
                      src="https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=600&h=400&fit=crop"
                      alt="Planet Motors Showroom"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <MapPin className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-xl">Visit Our Showroom</h3>
                    </div>
                    <address className="not-italic text-muted-foreground mb-4">
                      <strong>Planet Motors</strong><br />
                      30 Major Mackenzie Dr E<br />
                      Richmond Hill, ON L4C 1G7<br />
                      Canada
                    </address>
                    <div className="space-y-2 text-sm">
                      <p><strong>Toll-Free:</strong> 1-866-787-3332</p>
                      <p><strong>Local:</strong> 416-985-2277</p>
                      <p><strong>Email:</strong> info@planetmotors.ca</p>
                    </div>
                    <div className="mt-6 pt-6 border-t">
                      <p className="font-medium mb-2">Business Hours</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Monday - Friday: 9:00 AM - 8:00 PM</p>
                        <p>Saturday: 10:00 AM - 6:00 PM</p>
                        <p>Sunday: 11:00 AM - 5:00 PM</p>
                      </div>
                    </div>
                  </CardContent>
                </div>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
