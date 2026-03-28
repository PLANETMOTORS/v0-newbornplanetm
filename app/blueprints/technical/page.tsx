import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Server, Database, Shield, Clock, Code } from "lucide-react"

export default function TechnicalBlueprintPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Button variant="ghost" asChild className="mb-4">
            <Link href="/blueprints">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blueprints
            </Link>
          </Button>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4">
            Technical Blueprint
          </h1>
          <p className="text-lg text-muted-foreground">
            Complete technical documentation for Planet Motors platform
          </p>
        </div>

        <Tabs defaultValue="stack" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="stack">Tech Stack</TabsTrigger>
            <TabsTrigger value="services">Microservices</TabsTrigger>
            <TabsTrigger value="api">API Architecture</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
          </TabsList>

          {/* Technology Stack */}
          <TabsContent value="stack" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  Frontend Technologies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Component</th>
                        <th className="text-left py-3 px-4 font-medium">Technology</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { component: "UI Framework", tech: "React 19" },
                        { component: "Language", tech: "TypeScript" },
                        { component: "State Management", tech: "Context API + SWR" },
                        { component: "Routing", tech: "Next.js App Router" },
                        { component: "Bundler", tech: "Turbopack" },
                        { component: "CSS Solution", tech: "Tailwind CSS" },
                        { component: "Testing (Unit)", tech: "Jest" },
                        { component: "Testing (E2E)", tech: "Playwright" },
                        { component: "Component Dev", tech: "Storybook" },
                        { component: "Maps", tech: "Google Maps" },
                      ].map((row) => (
                        <tr key={row.component} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{row.component}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">{row.tech}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  Backend Technologies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Component</th>
                        <th className="text-left py-3 px-4 font-medium">Technology</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { component: "Primary Language", tech: "TypeScript (Node.js)" },
                        { component: "Primary Framework", tech: "Express.js 4.x" },
                        { component: "Secondary Language", tech: "Python 3.11+" },
                        { component: "Secondary Framework", tech: "FastAPI" },
                        { component: "ORM", tech: "Sequelize 6.x" },
                        { component: "API Style", tech: "REST" },
                      ].map((row) => (
                        <tr key={row.component} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">{row.component}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">{row.tech}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Infrastructure
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Databases</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Primary RDBMS</span>
                        <Badge>PostgreSQL (AWS RDS)</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Caching</span>
                        <Badge>ElastiCache (Redis)</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Search Engine</span>
                        <Badge>PostgreSQL Full-Text</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Cloud Infrastructure</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Cloud Provider</span>
                        <Badge>Amazon Web Services</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Container</span>
                        <Badge>AWS ECS Fargate</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Region</span>
                        <Badge>ca-central-1 (Montreal)</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Microservices */}
          <TabsContent value="services" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Service Configuration</CardTitle>
                <CardDescription>ECS Fargate service specifications for all microservices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Service</th>
                        <th className="text-left py-3 px-4 font-medium">Technology</th>
                        <th className="text-left py-3 px-4 font-medium">CPU</th>
                        <th className="text-left py-3 px-4 font-medium">Memory</th>
                        <th className="text-left py-3 px-4 font-medium">Instances</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { service: "API Gateway", tech: "Express.js", cpu: 512, mem: 1024, instances: "3-10" },
                        { service: "Inventory", tech: "Express.js", cpu: 256, mem: 512, instances: "2-8" },
                        { service: "Pricing", tech: "Express.js", cpu: 256, mem: 512, instances: "2-6" },
                        { service: "Customer", tech: "Express.js", cpu: 256, mem: 512, instances: "2-6" },
                        { service: "Order", tech: "Express.js", cpu: 512, mem: 1024, instances: "2-8" },
                        { service: "Payment", tech: "Express.js", cpu: 256, mem: 512, instances: "2-6" },
                        { service: "Financing", tech: "Express.js", cpu: 512, mem: 1024, instances: "2-6" },
                        { service: "Trade-In", tech: "Express.js", cpu: 256, mem: 512, instances: "2-6" },
                        { service: "Delivery", tech: "Express.js", cpu: 256, mem: 512, instances: "1-4" },
                        { service: "Notification", tech: "Express.js", cpu: 256, mem: 512, instances: "1-4" },
                        { service: "Search", tech: "Express.js", cpu: 512, mem: 512, instances: "2-8" },
                        { service: "Auth", tech: "Express.js", cpu: 256, mem: 512, instances: "2-6" },
                        { service: "Media", tech: "Express.js", cpu: 512, mem: 1024, instances: "2-8" },
                        { service: "Analytics", tech: "Python FastAPI", cpu: 1024, mem: 2048, instances: "1-4" },
                      ].map((row) => (
                        <tr key={row.service} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.service}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{row.tech}</Badge>
                          </td>
                          <td className="py-3 px-4">{row.cpu}</td>
                          <td className="py-3 px-4">{row.mem}</td>
                          <td className="py-3 px-4">{row.instances}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Architecture */}
          <TabsContent value="api" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 font-mono text-sm">
                    {[
                      { method: "GET", path: "/api/v1/vehicles", desc: "List vehicles with filtering" },
                      { method: "GET", path: "/api/v1/vehicles/:id", desc: "Get vehicle details" },
                      { method: "GET", path: "/api/v1/vehicles/vin/:vin", desc: "Get vehicle by VIN" },
                      { method: "POST", path: "/api/v1/vehicles", desc: "Create vehicle (internal)" },
                      { method: "PATCH", path: "/api/v1/vehicles/:id/status", desc: "Update status" },
                      { method: "GET", path: "/api/v1/vehicles/:id/photos", desc: "Get vehicle photos" },
                      { method: "GET", path: "/api/v1/vehicles/:id/inspection", desc: "Get inspection" },
                      { method: "POST", path: "/api/v1/vehicles/search", desc: "Advanced search" },
                    ].map((endpoint) => (
                      <div key={endpoint.path} className="flex items-start gap-2 p-2 bg-muted rounded">
                        <Badge className={endpoint.method === "GET" ? "bg-green-600" : endpoint.method === "POST" ? "bg-blue-600" : "bg-yellow-600"}>
                          {endpoint.method}
                        </Badge>
                        <div>
                          <p className="text-foreground">{endpoint.path}</p>
                          <p className="text-xs text-muted-foreground">{endpoint.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Financing API (Multi-Lender)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 font-mono text-sm">
                    {[
                      { method: "POST", path: "/api/v1/financing/prequalify", desc: "Soft credit pull" },
                      { method: "POST", path: "/api/v1/financing/apply", desc: "Full application" },
                      { method: "GET", path: "/api/v1/financing/applications/:id", desc: "Get status" },
                      { method: "GET", path: "/api/v1/financing/offers", desc: "Get multi-lender offers" },
                      { method: "POST", path: "/api/v1/financing/offers/:id/select", desc: "Select offer" },
                      { method: "POST", path: "/api/v1/financing/calculate", desc: "Calculate payment" },
                      { method: "GET", path: "/api/v1/financing/lenders", desc: "List lenders" },
                    ].map((endpoint) => (
                      <div key={endpoint.path} className="flex items-start gap-2 p-2 bg-muted rounded">
                        <Badge className={endpoint.method === "GET" ? "bg-green-600" : "bg-blue-600"}>
                          {endpoint.method}
                        </Badge>
                        <div>
                          <p className="text-foreground">{endpoint.path}</p>
                          <p className="text-xs text-muted-foreground">{endpoint.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Order API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 font-mono text-sm">
                    {[
                      { method: "GET", path: "/api/v1/orders", desc: "List customer orders" },
                      { method: "POST", path: "/api/v1/orders", desc: "Create order" },
                      { method: "GET", path: "/api/v1/orders/:id", desc: "Get order details" },
                      { method: "PATCH", path: "/api/v1/orders/:id/status", desc: "Update status" },
                      { method: "POST", path: "/api/v1/orders/:id/cancel", desc: "Cancel order" },
                      { method: "GET", path: "/api/v1/orders/:id/documents", desc: "Get documents" },
                      { method: "POST", path: "/api/v1/orders/:id/documents", desc: "Upload signed doc" },
                    ].map((endpoint) => (
                      <div key={endpoint.path} className="flex items-start gap-2 p-2 bg-muted rounded">
                        <Badge className={endpoint.method === "GET" ? "bg-green-600" : endpoint.method === "POST" ? "bg-blue-600" : "bg-yellow-600"}>
                          {endpoint.method}
                        </Badge>
                        <div>
                          <p className="text-foreground">{endpoint.path}</p>
                          <p className="text-xs text-muted-foreground">{endpoint.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trade-In API</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 font-mono text-sm">
                    {[
                      { method: "POST", path: "/api/v1/trade-in/instant-offer", desc: "Get instant offer" },
                      { method: "GET", path: "/api/v1/trade-in/offers/:id", desc: "Get offer details" },
                      { method: "POST", path: "/api/v1/trade-in/offers/:id/accept", desc: "Accept offer" },
                      { method: "POST", path: "/api/v1/trade-in/offers/:id/decline", desc: "Decline offer" },
                      { method: "POST", path: "/api/v1/trade-in/offers/:id/photos", desc: "Upload photos" },
                      { method: "GET", path: "/api/v1/trade-in/valuation", desc: "Get CBB valuation" },
                    ].map((endpoint) => (
                      <div key={endpoint.path} className="flex items-start gap-2 p-2 bg-muted rounded">
                        <Badge className={endpoint.method === "GET" ? "bg-green-600" : "bg-blue-600"}>
                          {endpoint.method}
                        </Badge>
                        <div>
                          <p className="text-foreground">{endpoint.path}</p>
                          <p className="text-xs text-muted-foreground">{endpoint.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Security Layers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Layer</th>
                        <th className="text-left py-3 px-4 font-medium">Implementation</th>
                        <th className="text-left py-3 px-4 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { layer: "Edge", impl: "AWS Shield Advanced", desc: "DDoS protection, managed WAF" },
                        { layer: "Network", impl: "VPC, Security Groups", desc: "Network isolation" },
                        { layer: "Application", impl: "Helmet.js, express-validator", desc: "Headers, input validation" },
                        { layer: "Data", impl: "AWS KMS", desc: "Encryption at rest, column-level PII encryption" },
                        { layer: "Access", impl: "IAM, JWT", desc: "Authentication, authorization" },
                      ].map((row) => (
                        <tr key={row.layer} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.layer}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{row.impl}</Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roadmap */}
          <TabsContent value="roadmap" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Implementation Roadmap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {[
                    { phase: "Phase 1", duration: "Months 1-3", items: ["Core Infrastructure", "Auth Service", "Search Service", "Vehicle Inventory"] },
                    { phase: "Phase 2", duration: "Months 4-6", items: ["Orders", "Payments (Stripe)", "Financing Applications", "Customer Portal"] },
                    { phase: "Phase 3", duration: "Months 7-9", items: ["Multi-Lender Integration", "Trade-In Service", "Delivery Scheduling", "10-Day Returns"] },
                    { phase: "Phase 4", duration: "Months 10-12", items: ["Analytics Dashboard", "A/B Testing", "Mobile App", "Performance Optimization"] },
                  ].map((phase) => (
                    <div key={phase.phase} className="flex gap-4">
                      <div className="flex-shrink-0 w-24">
                        <Badge className="w-full justify-center">{phase.phase}</Badge>
                        <p className="text-xs text-center text-muted-foreground mt-1">{phase.duration}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2">
                          {phase.items.map((item) => (
                            <Badge key={item} variant="secondary">{item}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  )
}
