import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Layers, GitBranch, Globe, BarChart3 } from "lucide-react"

export default function EnterpriseBlueprintPage() {
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
            Enterprise Architecture
          </h1>
          <p className="text-lg text-muted-foreground">
            System design, architecture principles, and competitive analysis
          </p>
        </div>

        <Tabs defaultValue="principles" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="principles">Principles</TabsTrigger>
            <TabsTrigger value="network">Network</TabsTrigger>
            <TabsTrigger value="cicd">CI/CD</TabsTrigger>
            <TabsTrigger value="comparison">Carvana vs Clutch</TabsTrigger>
          </TabsList>

          {/* Architecture Principles */}
          <TabsContent value="principles" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Architecture Principles
                </CardTitle>
                <CardDescription>
                  Key design principles combining best practices from Carvana and Clutch.ca
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Principle</th>
                        <th className="text-left py-3 px-4 font-medium">Source</th>
                        <th className="text-left py-3 px-4 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { principle: "Simplicity First", source: "Clutch", desc: "ECS over Kubernetes, single DB" },
                        { principle: "Scale When Needed", source: "Carvana", desc: "Auto-scaling, multi-lender" },
                        { principle: "Security Always", source: "Carvana", desc: "Multi-layer security" },
                        { principle: "Customer-Centric", source: "Clutch", desc: "10-day returns, 210-point inspection" },
                        { principle: "Data-Driven", source: "Carvana", desc: "FullStory, Optimizely" },
                      ].map((row) => (
                        <tr key={row.principle} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.principle}</td>
                          <td className="py-3 px-4">
                            <Badge variant={row.source === "Carvana" ? "default" : "secondary"}>
                              {row.source}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{row.desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>External Systems Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                  <pre className="text-foreground">{`EXTERNAL SYSTEMS
├── CARFAX (Vehicle History)
├── Canadian Black Book (Valuation)
├── EasyDeal Canada (Credit Bureau - Clutch!)
├── TransUnion Canada (Credit Bureau)
├── TD Auto Finance (Lender)
├── RBC (Lender)
├── Scotiabank (Lender)
├── BMO (Lender)
├── CIBC (Lender)
├── Desjardins (Credit Union Lender)
├── Stripe (Payment Processing)
├── Twilio (SMS/Voice)
├── SendGrid (Email)
├── FullStory (Session Analytics)
└── Optimizely (A/B Testing)

PLANET MOTORS PLATFORM (AWS ca-central-1)
├── CloudFront + WAF + Shield
├── Application Load Balancers
├── ECS Fargate Cluster (14 services)
├── RDS PostgreSQL
├── ElastiCache Redis
├── OpenSearch
├── S3 (Images, Documents)
├── SQS (Queues)
├── MSK (Kafka)
└── Amazon MQ (RabbitMQ)`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Network Architecture */}
          <TabsContent value="network" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  VPC Configuration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                  <pre className="text-foreground">{`VPC: 10.0.0.0/16

Public Subnets (10.0.200.0/24, 10.0.102.0/24, 10.0.103.0/24):
├── NAT Gateways
├── Application Load Balancers
└── Bastion Hosts

Private Subnets (10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24):
├── ECS Fargate Services
├── RDS PostgreSQL
├── ElastiCache Redis
├── OpenSearch
└── Amazon MQ`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* CI/CD Pipeline */}
          <TabsContent value="cicd" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  CI/CD Pipeline (GitHub Actions)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { step: 1, name: "Push to main branch", status: "trigger" },
                    { step: 2, name: "Run tests (unit, Cypress)", status: "test" },
                    { step: 3, name: "Build Docker images", status: "build" },
                    { step: 4, name: "Push to ECR", status: "push" },
                    { step: 5, name: "Deploy to staging (ECS)", status: "deploy" },
                    { step: 6, name: "Run integration tests", status: "test" },
                    { step: 7, name: "Manual approval", status: "approval" },
                    { step: 8, name: "Deploy to production (ECS)", status: "deploy" },
                    { step: 9, name: "Health check", status: "verify" },
                    { step: 10, name: "Notify team", status: "notify" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {item.step}
                      </div>
                      <div className="flex-1 p-3 bg-muted rounded-lg flex items-center justify-between">
                        <span>{item.name}</span>
                        <Badge variant="outline">{item.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Monitoring & Observability</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Tool</th>
                        <th className="text-left py-3 px-4 font-medium">Purpose</th>
                        <th className="text-left py-3 px-4 font-medium">Source</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { tool: "CloudWatch", purpose: "Metrics, logs, alarms", source: "Clutch" },
                        { tool: "X-Ray", purpose: "Distributed tracing", source: "Clutch" },
                        { tool: "FullStory", purpose: "Session replay", source: "Carvana" },
                        { tool: "PagerDuty", purpose: "Alerting", source: "Carvana" },
                      ].map((row) => (
                        <tr key={row.tool} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.tool}</td>
                          <td className="py-3 px-4">{row.purpose}</td>
                          <td className="py-3 px-4">
                            <Badge variant="secondary">{row.source}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Carvana vs Clutch Comparison */}
          <TabsContent value="comparison" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Company Overview Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Metric</th>
                        <th className="text-left py-3 px-4 font-medium">Clutch.ca (Canada)</th>
                        <th className="text-left py-3 px-4 font-medium">Carvana (USA)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { metric: "Founded", clutch: "2017", carvana: "2012" },
                        { metric: "Headquarters", clutch: "Toronto, Ontario", carvana: "Tempe, Arizona" },
                        { metric: "CEO", clutch: "Dan Park", carvana: "Ernest Garcia III" },
                        { metric: "Employees", clutch: "392", carvana: "5,000+" },
                        { metric: "Revenue (2024)", clutch: "$320M CAD", carvana: "$10.7B+ USD" },
                        { metric: "Vehicles Sold (2024)", clutch: "~15,000", carvana: "312,000+" },
                        { metric: "Public/Private", clutch: "Private", carvana: "Public (NYSE: CVNA)" },
                        { metric: "Total Funding", clutch: "$362M CAD", carvana: "IPO (2017) + Debt" },
                        { metric: "Profitability", clutch: "Q3 2024", carvana: "EBITDA positive 2024" },
                        { metric: "Markets Served", clutch: "5 Canadian Provinces", carvana: "50 US States" },
                        { metric: "Return Policy", clutch: "10-Day Return", carvana: "7-Day Return" },
                        { metric: "Inspection Points", clutch: "210-point", carvana: "150-point" },
                      ].map((row) => (
                        <tr key={row.metric} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.metric}</td>
                          <td className="py-3 px-4">{row.clutch}</td>
                          <td className="py-3 px-4">{row.carvana}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Technology Stack Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Component</th>
                        <th className="text-left py-3 px-4 font-medium">Carvana</th>
                        <th className="text-left py-3 px-4 font-medium">Clutch.ca</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { component: "Frontend", carvana: "React 18 / TypeScript / Redux", clutch: "React 18 / TypeScript / Context API" },
                        { component: "Backend", carvana: "C# (.NET Core 8)", clutch: "TypeScript (Node.js / Express.js)" },
                        { component: "Database", carvana: "Azure SQL + Cosmos DB", clutch: "PostgreSQL (AWS RDS)" },
                        { component: "Cloud", carvana: "Microsoft Azure", clutch: "Amazon Web Services" },
                        { component: "Container", carvana: "Azure Kubernetes (AKS)", clutch: "AWS ECS Fargate" },
                        { component: "CDN", carvana: "Azure Front Door + Akamai", clutch: "CloudFront + Fastly" },
                      ].map((row) => (
                        <tr key={row.component} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.component}</td>
                          <td className="py-3 px-4">{row.carvana}</td>
                          <td className="py-3 px-4">{row.clutch}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
