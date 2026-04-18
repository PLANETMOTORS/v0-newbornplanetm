"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { 
  Settings, AlertTriangle, DollarSign, Car, Wrench, 
  CheckCircle, MapPin, Phone, Clock, ChevronRight,
  Gauge, Shield, Star, HelpCircle
} from "lucide-react"

export default function ClutchGuideCanadaPage() {
  const clutchProblems = [
    {
      symptom: "Clutch Slipping",
      description: "Engine revs increase but vehicle doesn&apos;t accelerate proportionally",
      cause: "Worn clutch disc, oil contamination, or weak pressure plate",
      urgency: "High",
      cost: "$800 - $1,500"
    },
    {
      symptom: "Hard to Shift Gears",
      description: "Difficulty engaging gears, grinding sounds when shifting",
      cause: "Worn clutch cable, hydraulic system issues, or damaged synchros",
      urgency: "Medium",
      cost: "$200 - $800"
    },
    {
      symptom: "Clutch Pedal Sticking",
      description: "Pedal stays down or returns slowly",
      cause: "Faulty clutch master/slave cylinder, cable stretch",
      urgency: "Medium",
      cost: "$150 - $500"
    },
    {
      symptom: "Burning Smell",
      description: "Acrid burning odor especially after hill starts or heavy traffic",
      cause: "Clutch overheating from excessive slipping",
      urgency: "High",
      cost: "$1,000 - $2,000"
    },
    {
      symptom: "Vibration When Engaging",
      description: "Shuddering or vibration when releasing the clutch",
      cause: "Warped flywheel, contaminated clutch disc, worn motor mounts",
      urgency: "Medium",
      cost: "$300 - $1,200"
    }
  ]

  const clutchCostsByProvince = [
    { province: "Ontario", avgCost: "$1,200 - $1,800", laborRate: "$120-150/hr" },
    { province: "British Columbia", avgCost: "$1,300 - $2,000", laborRate: "$130-160/hr" },
    { province: "Alberta", avgCost: "$1,100 - $1,700", laborRate: "$110-140/hr" },
    { province: "Quebec", avgCost: "$1,000 - $1,600", laborRate: "$100-130/hr" },
    { province: "Manitoba", avgCost: "$900 - $1,400", laborRate: "$90-120/hr" },
    { province: "Saskatchewan", avgCost: "$900 - $1,400", laborRate: "$90-120/hr" }
  ]

  const manualCars = [
    { name: "Mazda MX-5 Miata", type: "Sports Car", clutchLife: "60,000-80,000 km" },
    { name: "Honda Civic Si", type: "Sport Compact", clutchLife: "80,000-120,000 km" },
    { name: "Subaru WRX", type: "Performance AWD", clutchLife: "50,000-80,000 km" },
    { name: "Ford Mustang GT", type: "Muscle Car", clutchLife: "60,000-100,000 km" },
    { name: "Volkswagen GTI", type: "Hot Hatch", clutchLife: "80,000-120,000 km" },
    { name: "Toyota GR86", type: "Sports Car", clutchLife: "70,000-100,000 km" }
  ]

  const faqs = [
    {
      question: "How long does a clutch last in Canada?",
      answer: "In Canadian driving conditions, a clutch typically lasts 100,000-150,000 km with proper use. However, heavy city driving, winter conditions, and aggressive driving can reduce this to 60,000-80,000 km."
    },
    {
      question: "How much does clutch replacement cost in Canada?",
      answer: "Clutch replacement in Canada costs between $1,000-$2,500 depending on the vehicle. This includes parts ($300-$800) and labor ($700-$1,700). Luxury and performance vehicles can cost $3,000+."
    },
    {
      question: "Can I drive with a bad clutch?",
      answer: "Driving with a failing clutch is dangerous and can cause further damage. A slipping clutch can leave you stranded, while a stuck clutch can cause accidents. Get it inspected immediately."
    },
    {
      question: "Does cold weather affect the clutch?",
      answer: "Yes, Canadian winters affect clutch performance. Cold temperatures make clutch fluid thicker, causing harder pedal feel. Hydraulic clutch systems may feel sluggish until warmed up."
    },
    {
      question: "Should I buy a manual or automatic car in Canada?",
      answer: "Automatics are better for heavy traffic and winter driving. Manuals offer more control, better fuel economy, and lower maintenance costs. Only 2% of new cars sold in Canada are manual."
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" tabIndex={-1}>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-teal-800 via-teal-700 to-slate-800 text-white py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="bg-teal-500 text-white mb-4">Complete Guide</Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Clutch Guide Canada
              </h1>
              <p className="text-xl md:text-2xl text-teal-100 mb-8">
                Everything Canadians need to know about clutch systems, replacement costs, 
                manual transmission cars, and clutch repair services across Canada.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link href="/inventory?transmission=Manual">
                  <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                    <Car className="w-5 h-5 mr-2" />
                    Browse Manual Cars
                  </Button>
                </Link>
                <Link href="/contact">
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                    <Phone className="w-5 h-5 mr-2" />
                    Get Expert Advice
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What is a Clutch Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">What is a Car Clutch?</h2>
              <div className="prose prose-lg max-w-none">
                <p className="text-lg text-muted-foreground mb-6">
                  A <strong>clutch</strong> is a mechanical device that engages and disengages power transmission 
                  between the engine and transmission in manual vehicles. When you press the clutch pedal, 
                  it disconnects the engine from the wheels, allowing you to change gears smoothly.
                </p>
                <div className="grid md:grid-cols-3 gap-6 mt-8">
                  <Card>
                    <CardHeader>
                      <Settings className="w-10 h-10 text-teal-600 mb-2" />
                      <CardTitle>Clutch Disc</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        The friction material that connects and disconnects the engine from the transmission.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <Gauge className="w-10 h-10 text-teal-600 mb-2" />
                      <CardTitle>Pressure Plate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Applies pressure to hold the clutch disc against the flywheel when engaged.
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <Wrench className="w-10 h-10 text-teal-600 mb-2" />
                      <CardTitle>Flywheel</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        A heavy disc attached to the crankshaft that provides a smooth surface for the clutch.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Clutch Problems Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-2 text-center">Common Clutch Problems</h2>
              <p className="text-muted-foreground text-center mb-10">
                Recognize these warning signs before your clutch fails completely
              </p>
              
              <div className="space-y-4">
                {clutchProblems.map((problem, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <AlertTriangle className={`w-5 h-5 ${problem.urgency === 'High' ? 'text-red-500' : 'text-yellow-500'}`} />
                            <h3 className="text-lg font-semibold">{problem.symptom}</h3>
                            <Badge variant={problem.urgency === 'High' ? 'destructive' : 'secondary'}>
                              {problem.urgency} Urgency
                            </Badge>
                          </div>
                          <p className="text-muted-foreground mb-2">{problem.description}</p>
                          <p className="text-sm"><strong>Cause:</strong> {problem.cause}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Estimated Repair</p>
                          <p className="text-xl font-bold text-green-600">{problem.cost}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Clutch Replacement Cost by Province */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-2 text-center">Clutch Replacement Cost in Canada</h2>
              <p className="text-muted-foreground text-center mb-10">
                Average clutch replacement costs by province (2026)
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {clutchCostsByProvince.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <MapPin className="w-5 h-5 text-teal-600" />
                        <h3 className="font-semibold text-lg">{item.province}</h3>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Cost:</span>
                          <span className="font-bold text-green-600">{item.avgCost}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Labor Rate:</span>
                          <span>{item.laborRate}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="mt-8 p-6 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-teal-600" />
                  What&apos;s Included in Clutch Replacement?
                </h3>
                <ul className="grid md:grid-cols-2 gap-2 text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> New clutch disc</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> New pressure plate</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Throw-out bearing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Pilot bearing/bushing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Flywheel resurfacing</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-500" /> Labor (4-8 hours)</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Best Manual Cars Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold mb-2 text-center">Best Clutch Cars in Canada</h2>
              <p className="text-muted-foreground text-center mb-10">
                Top manual transmission vehicles available at Planet Motors
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {manualCars.map((car, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="font-bold text-lg mb-2">{car.name}</h3>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <Badge variant="secondary">{car.type}</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Clutch Life:</span>
                          <span className="font-medium">{car.clutchLife}</span>
                        </div>
                      </div>
                      <Link href={`/inventory?search=${encodeURIComponent(car.name)}`}>
                        <Button className="w-full mt-4" variant="outline">
                          View Inventory <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="text-center mt-8">
                <Link href="/inventory?transmission=Manual">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                    Browse All Manual Cars
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-2 text-center">Clutch FAQs for Canadian Drivers</h2>
              <p className="text-muted-foreground text-center mb-10">
                Common questions about clutches in Canadian conditions
              </p>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-2 flex items-start gap-3">
                        <HelpCircle className="w-5 h-5 text-teal-600 mt-1 flex-shrink-0" />
                        {faq.question}
                      </h3>
                      <p className="text-muted-foreground ml-8">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Why Planet Motors Section */}
        <section className="py-16 bg-teal-800 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Why Buy Manual Cars from Planet Motors?</h2>
              <div className="grid md:grid-cols-3 gap-8 mb-10">
                <div>
                  <Shield className="w-12 h-12 mx-auto mb-4 text-teal-300" />
                  <h3 className="font-semibold text-xl mb-2">210-Point Inspection</h3>
                  <p className="text-teal-100">Every clutch system thoroughly tested and verified</p>
                </div>
                <div>
                  <Star className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                  <h3 className="font-semibold text-xl mb-2">4.8 Star Rating</h3>
                  <p className="text-teal-100">500+ verified customer reviews since 2015</p>
                </div>
                <div>
                  <Clock className="w-12 h-12 mx-auto mb-4 text-teal-300" />
                  <h3 className="font-semibold text-xl mb-2">10-Day Guarantee</h3>
                  <p className="text-teal-100">Full refund if you&apos;re not satisfied with your clutch car</p>
                </div>
              </div>
              <Link href="/inventory?transmission=Manual">
                <Button size="lg" className="bg-teal-600 hover:bg-teal-700">
                  Browse Our Manual Transmission Inventory
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
