import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Database, Server, Shield, Globe, Layers, Download, ExternalLink } from "lucide-react"

const blueprints = [
  {
    id: "technical",
    title: "Technical Blueprint",
    description: "Complete technical documentation including technology stack, microservices architecture, and API specifications.",
    icon: Server,
    sections: ["Technology Stack", "Microservices", "API Architecture", "Security", "Implementation Roadmap"],
    lastUpdated: "March 2026",
    pages: 295,
    href: "/blueprints/technical"
  },
  {
    id: "enterprise",
    title: "Enterprise Architecture",
    description: "System design, architecture principles, and Carvana vs Clutch.ca comparison analysis.",
    icon: Layers,
    sections: ["Architecture Principles", "System Context", "Network Architecture", "CI/CD Pipeline", "Comparison"],
    lastUpdated: "March 2026",
    pages: 176,
    href: "/blueprints/enterprise"
  },
  {
    id: "production",
    title: "Production Architecture & Schema",
    description: "Database schemas, Canadian tax configuration, multi-lender setup, and 210-point inspection template.",
    icon: Database,
    sections: ["Database Schema", "Canadian Taxes", "Multi-Lender Config", "Inspection Template", "Security"],
    lastUpdated: "March 2026",
    pages: 329,
    href: "/blueprints/production"
  }
]

const quickStats = [
  { label: "Microservices", value: "14" },
  { label: "API Endpoints", value: "45+" },
  { label: "Database Tables", value: "15" },
  { label: "Provinces", value: "5" },
  { label: "Lenders", value: "6" },
  { label: "Inspection Points", value: "210" },
]

export default function BlueprintsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Developer Handoff Pipeline</Badge>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-4 text-balance">
            Planet Motors Technical Blueprints
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
            Comprehensive technical documentation for the Planet Motors platform. 
            Built on best practices from Carvana and Clutch.ca.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
          {quickStats.map((stat) => (
            <Card key={stat.label} className="text-center">
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Blueprint Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {blueprints.map((blueprint) => {
            const Icon = blueprint.icon
            return (
              <Card key={blueprint.id} className="flex flex-col hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <Badge variant="outline">{blueprint.pages} lines</Badge>
                  </div>
                  <CardTitle className="text-xl">{blueprint.title}</CardTitle>
                  <CardDescription>{blueprint.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Sections:</p>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {blueprint.sections.map((section) => (
                      <Badge key={section} variant="secondary" className="text-xs">
                        {section}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Last updated: {blueprint.lastUpdated}
                  </p>
                </CardContent>
                <div className="p-6 pt-0 mt-auto">
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <Link href={blueprint.href}>
                        <FileText className="h-4 w-4 mr-2" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/blueprints/download?doc=${blueprint.id}`}>
                        <Download className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Architecture Overview */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Architecture Overview
            </CardTitle>
            <CardDescription>
              High-level system architecture for Planet Motors platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
              <pre className="text-foreground">{`
┌─────────────────────────────────────────────────────────────────────┐
│                            INTERNET                                  │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 CloudFront + WAF + Shield Advanced                   │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Application Load Balancers                        │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ECS FARGATE CLUSTER                           │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    API GATEWAY SERVICE                      │     │
│  │                  (Express.js + JWT Auth)                    │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                   │                                  │
│  ┌────────────┬────────────┬────────────┬────────────┐              │
│  │ Inventory  │  Customer  │   Order    │  Pricing   │              │
│  │  Service   │  Service   │  Service   │  Service   │              │
│  └────────────┴────────────┴────────────┴────────────┘              │
│  ┌────────────┬────────────┬────────────┬────────────┐              │
│  │  Payment   │ Financing  │  Trade-In  │  Delivery  │              │
│  │  Service   │  Service   │  Service   │  Service   │              │
│  └────────────┴────────────┴────────────┴────────────┘              │
│  ┌────────────┬────────────┬────────────┬────────────┐              │
│  │Notification│   Search   │    Auth    │   Media    │              │
│  │  Service   │  Service   │  Service   │  Service   │              │
│  └────────────┴────────────┴────────────┴────────────┘              │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                    Analytics Service                        │     │
│  │                    (Python FastAPI)                         │     │
│  └────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          DATA LAYER                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐ │
│  │ RDS PostgreSQL │  │  ElastiCache   │  │       Amazon S3        │ │
│  │   (Primary)    │  │    (Redis)     │  │   (Images, Docs)       │ │
│  └────────────────┘  └────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
              `}</pre>
            </div>
          </CardContent>
        </Card>

        {/* Service Configuration Table */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Service Configuration
            </CardTitle>
            <CardDescription>
              ECS Fargate service specifications
            </CardDescription>
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
                    <th className="text-left py-3 px-4 font-medium">Min/Max Instances</th>
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

        {/* API Quick Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              API Quick Reference
            </CardTitle>
            <CardDescription>
              Key API endpoints for the Planet Motors platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Vehicle API</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">GET</Badge>
                    <span>/api/v1/vehicles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">GET</Badge>
                    <span>/api/v1/vehicles/:id</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">POST</Badge>
                    <span>/api/v1/vehicles/search</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">GET</Badge>
                    <span>/api/v1/vehicles/:id/inspection</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Financing API (Multi-Lender)</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">POST</Badge>
                    <span>/api/v1/financing/prequalify</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">POST</Badge>
                    <span>/api/v1/financing/apply</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">GET</Badge>
                    <span>/api/v1/financing/offers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">POST</Badge>
                    <span>/api/v1/financing/offers/:id/select</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Order API</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">POST</Badge>
                    <span>/api/v1/orders</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">GET</Badge>
                    <span>/api/v1/orders/:id</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-600">PATCH</Badge>
                    <span>/api/v1/orders/:id/status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">GET</Badge>
                    <span>/api/v1/orders/:id/documents</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-3">Trade-In API</h4>
                <div className="space-y-2 font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">POST</Badge>
                    <span>/api/v1/trade-in/instant-offer</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">GET</Badge>
                    <span>/api/v1/trade-in/offers/:id</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600">POST</Badge>
                    <span>/api/v1/trade-in/offers/:id/accept</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-600">GET</Badge>
                    <span>/api/v1/trade-in/valuation</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
