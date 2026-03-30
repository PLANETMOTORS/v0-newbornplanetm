import Image from "next/image"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Award, Users, MapPin, Heart, Target, Star, Globe, Trophy } from "lucide-react"

export default function AboutPage() {
  // Real team members from Planet Motors
  const teamMembers = [
    { name: "Hamza Patel", role: "Sales Consultant", image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop" },
    { name: "Adam Watkins", role: "Finance Manager", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop" },
    { name: "Tony", role: "Sales Manager", image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&h=300&fit=crop" }
  ]

  // Real awards from Planet Motors
  const awards = [
    { title: "CarGurus Top Rated Dealer", years: "2023, 2024", icon: Trophy },
    { title: "Autotrader Best Priced Dealer", years: "2021, 2022", icon: Award },
    { title: "Google 4.8-Star Rating", years: "277+ Reviews", icon: Star },
  ]

  // Languages offered
  const languages = [
    "English", "French", "Mandarin", "Arabic", "Punjabi", "Spanish", "Hindi", "Farsi", "Urdu"
  ]

  const milestones = [
    { year: "2015", title: "Founded", description: "Planet Motors established in Richmond Hill, Ontario with a vision of fairness and integrity" },
    { year: "2018", title: "OMVIC Licensed", description: "Became an officially licensed Ontario motor vehicle dealer" },
    { year: "2020", title: "Digital Platform", description: "Launched online buying experience with virtual tours" },
    { year: "2021", title: "Autotrader Award", description: "Recognized as Best Priced Dealer in the GTA" },
    { year: "2023", title: "CarGurus Top Rated", description: "Earned Top Rated Dealer status for customer satisfaction" },
    { year: "2024", title: "Nationwide Delivery", description: "Expanded to serve all of Canada with coast-to-coast delivery" },
    { year: "2025", title: "EV Specialist", description: "Became a leading used EV dealer with battery health certification" }
  ]

  // Real customer reviews from Google
  const customerReviews = [
    { name: "Parsa", rating: 5, review: "Exceptional service from start to finish. Hamza was incredibly helpful and made the entire process seamless.", date: "2 weeks ago" },
    { name: "Jee Han", rating: 5, review: "Best car buying experience I&apos;ve ever had. Transparent pricing, no pressure, and the car was exactly as described.", date: "1 month ago" },
    { name: "Morgan", rating: 5, review: "Bought a Tesla Model Y from Planet Motors. The battery health report gave me complete confidence.", date: "1 month ago" },
    { name: "Ayman", rating: 5, review: "Adam in financing got me an amazing rate. Highly recommend for anyone with any credit situation.", date: "2 months ago" },
    { name: "Chrispin", rating: 5, review: "The 210-point inspection report was thorough. No surprises, just a great car at a fair price.", date: "2 months ago" },
    { name: "Cory", rating: 5, review: "Tony went above and beyond to find me the perfect vehicle. Will definitely be back!", date: "3 months ago" },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="bg-primary py-20">
          <div className="container mx-auto px-4 text-center">
            <Badge className="mb-4 bg-accent text-accent-foreground">Serving Canadians Since 2015</Badge>
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

        {/* Logo Meaning Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-8">The Meaning Behind Our Logo</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="p-6 text-center">
                  <div className="text-5xl mb-4">🦅</div>
                  <h3 className="font-semibold text-xl mb-2">Wings</h3>
                  <p className="text-muted-foreground">
                    Symbolize the freedom and independence that comes with owning your own vehicle
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-5xl mb-4">🛡️</div>
                  <h3 className="font-semibold text-xl mb-2">Shield</h3>
                  <p className="text-muted-foreground">
                    Represents the protection and security we provide through our warranties and guarantees
                  </p>
                </Card>
                <Card className="p-6 text-center">
                  <div className="text-5xl mb-4">🔑</div>
                  <h3 className="font-semibold text-xl mb-2">Key</h3>
                  <p className="text-muted-foreground">
                    Signifies the keys to your new vehicle and the beginning of your journey with us
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Awards Section */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Awards &amp; Recognition</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {awards.map((award, i) => (
                <Card key={i} className="p-6 text-center border-2 border-primary/20">
                  <award.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                  <h3 className="font-semibold text-lg mb-1">{award.title}</h3>
                  <p className="text-primary font-medium">{award.years}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Our Core Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <Card className="text-center p-6">
                <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-xl mb-2">Transparency</h3>
                <p className="text-muted-foreground">
                  No hidden fees, no surprises. Every vehicle comes with a complete history report and detailed 210-point inspection.
                </p>
              </Card>
              <Card className="text-center p-6">
                <Heart className="h-12 w-12 mx-auto mb-4 text-accent" />
                <h3 className="font-semibold text-xl mb-2">Customer First</h3>
                <p className="text-muted-foreground">
                  Your satisfaction is our priority. Our 10-day return policy means you can buy with complete confidence.
                </p>
              </Card>
              <Card className="text-center p-6">
                <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-xl mb-2">Quality Assured</h3>
                <p className="text-muted-foreground">
                  Every vehicle undergoes our rigorous 210-point inspection before being PM Certified for sale.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 text-center">
              <div>
                <p className="text-2xl sm:text-4xl font-bold text-primary">9,500+</p>
                <p className="text-xs sm:text-base text-muted-foreground">Vehicles Sold</p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl font-bold text-primary">4.8/5</p>
                <p className="text-xs sm:text-base text-muted-foreground">Google Rating</p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl font-bold text-primary">277+</p>
                <p className="text-xs sm:text-base text-muted-foreground">Happy Customers</p>
              </div>
              <div>
                <p className="text-2xl sm:text-4xl font-bold text-primary">10</p>
                <p className="text-xs sm:text-base text-muted-foreground">Years in Business</p>
              </div>
            </div>
          </div>
        </section>

        {/* Languages Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Globe className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h2 className="text-3xl font-bold mb-4">We Speak Your Language</h2>
              <p className="text-muted-foreground mb-8">
                Our diverse team can assist you in multiple languages to ensure you feel comfortable throughout the buying process.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-sm px-4 py-2">
                    {lang}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">What Our Customers Say</h2>
            <p className="text-center text-muted-foreground mb-12">Real reviews from our Google Business Profile</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {customerReviews.map((review, i) => (
                <Card key={i} className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    {[...Array(review.rating)].map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">&quot;{review.review}&quot;</p>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{review.name}</span>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Our Story Timeline */}
        <section className="py-16 bg-muted/30">
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
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Meet Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {teamMembers.map((member, i) => (
                <Card key={i} className="overflow-hidden text-center">
                  <div className="relative aspect-square">
                    <Image
                      src={member.image}
                      alt={member.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
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
        <section className="py-16 bg-muted/30">
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
                      sizes="(max-width: 768px) 100vw, 50vw"
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
                      <p><strong>Toll-Free:</strong> 1-866-797-3332</p>
                      <p><strong>Local:</strong> 416-985-2277</p>
                      <p><strong>Email:</strong> info@planetmotors.ca</p>
                    </div>
                    <div className="mt-6 pt-6 border-t">
                      <p className="font-medium mb-2">Business Hours</p>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Monday - Friday: 9:00 AM - 7:00 PM</p>
                        <p>Saturday: 9:00 AM - 6:00 PM</p>
                        <p>Sunday: Closed</p>
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
