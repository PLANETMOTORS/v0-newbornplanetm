import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileText, Database, Server, Shield, Globe, Layers, Download, ExternalLink, DollarSign, CheckCircle2 } from "lucide-react"

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
    description: "System design, architecture principles, and platform infrastructure documentation.",
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
  { label: "Database Tables", value: "13" },
  { label: "Provinces", value: "10" },
  { label: "Lenders", value: "6" },
  { label: "Inspection Points", value: "210" },
]

const costEstimation = {
  aws: [
    { service: "ECS Fargate", config: "14 services, auto-scaling", cost: "$3,000" },
    { service: "RDS PostgreSQL", config: "db.r6g.large, Multi-AZ", cost: "$1,200" },
    { service: "ElastiCache Redis", config: "cache.r6g.large", cost: "$400" },
    { service: "OpenSearch", config: "3 nodes, m5.xlarge", cost: "$500" },
    { service: "S3 + CloudFront", config: "5TB + 10TB transfer", cost: "$1,600" },
    { service: "Data Transfer", config: "Inter-region, internet", cost: "$4,200" },
  ],
  thirdParty: [
    { service: "Twilio", config: "SMS + Voice", cost: "$800" },
    { service: "SendGrid", config: "Pro plan", cost: "$200" },
    { service: "HubSpot", config: "Professional", cost: "$1,000" },
    { service: "FullStory", config: "Business", cost: "$1,000" },
    { service: "Optimizely", config: "Web experimentation", cost: "$2,000" },
    { service: "CarFax + CBB", config: "API subscriptions", cost: "$1,000" },
  ]
}

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
└─────────────��───────────────────────────────────────────────────────┘
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

        {/* Cost Estimation */}
        <Card className="mt-12 mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Cost Estimation (Monthly CAD)
            </CardTitle>
            <CardDescription>
              Estimated monthly infrastructure and service costs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Badge variant="outline">AWS Services</Badge>
                  <span className="text-sm text-muted-foreground">$14,000/month</span>
                </h4>
                <div className="space-y-3">
                  {costEstimation.aws.map((item) => (
                    <div key={item.service} className="flex justify-between items-center text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">{item.service}</p>
                        <p className="text-muted-foreground text-xs">{item.config}</p>
                      </div>
                      <span className="font-mono">{item.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Badge variant="outline">Third-Party Services</Badge>
                  <span className="text-sm text-muted-foreground">$10,000/month</span>
                </h4>
                <div className="space-y-3">
                  {costEstimation.thirdParty.map((item) => (
                    <div key={item.service} className="flex justify-between items-center text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">{item.service}</p>
                        <p className="text-muted-foreground text-xs">{item.config}</p>
                      </div>
                      <span className="font-mono">{item.cost}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 p-4 bg-primary/5 rounded-lg">
              <p className="text-lg font-bold text-center">
                Total Estimated: <span className="text-primary">~$24,000 CAD/month</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Pre-Launch Checklist */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Pre-Launch Checklist
            </CardTitle>
            <CardDescription>
              Technical review items for production launch
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">Infrastructure</h4>
                <ul className="space-y-2 text-sm">
                  {["VPC and subnets configured", "Security groups locked down", "ECS cluster running", "RDS Multi-AZ enabled", "ElastiCache cluster running", "SSL certificates installed"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="h-4 w-4 border rounded flex items-center justify-center text-xs">[ ]</div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">Integrations</h4>
                <ul className="space-y-2 text-sm">
                  {["Stripe webhooks configured", "CarFax API tested", "CBB API tested", "All 6 lender APIs tested", "Twilio verified", "SendGrid domain verified"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="h-4 w-4 border rounded flex items-center justify-center text-xs">[ ]</div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-3 text-sm uppercase tracking-wide text-muted-foreground">Security & Testing</h4>
                <ul className="space-y-2 text-sm">
                  {["AWS Shield enabled", "WAF rules configured", "PCI-DSS compliance verified", "PIPEDA compliance verified", "Load testing complete", "Security audit passed"].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <div className="h-4 w-4 border rounded flex items-center justify-center text-xs">[ ]</div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  )
}
