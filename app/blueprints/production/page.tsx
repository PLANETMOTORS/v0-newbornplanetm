import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Database, DollarSign, Building2, ClipboardCheck } from "lucide-react"

export default function ProductionBlueprintPage() {
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
            Production Architecture & Schema
          </h1>
          <p className="text-lg text-muted-foreground">
            Database schemas, Canadian tax configuration, and business rules
          </p>
        </div>

        <Tabs defaultValue="schema" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="schema">Database Schema</TabsTrigger>
            <TabsTrigger value="taxes">Canadian Taxes</TabsTrigger>
            <TabsTrigger value="lenders">Multi-Lender</TabsTrigger>
            <TabsTrigger value="inspection">210-Point Inspection</TabsTrigger>
          </TabsList>

          {/* Database Schema */}
          <TabsContent value="schema" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Core Tables
                </CardTitle>
                <CardDescription>15 core database tables for the Planet Motors platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4">
                  {[
                    { name: "customers", desc: "User accounts with Canadian fields" },
                    { name: "customer_addresses", desc: "Delivery addresses (postal codes)" },
                    { name: "vehicles", desc: "Inventory with CBB valuation" },
                    { name: "vehicle_photos", desc: "Vehicle images (360 spins)" },
                    { name: "vehicle_features", desc: "Features/options" },
                    { name: "inspections", desc: "210-point inspection" },
                    { name: "inspection_items", desc: "Individual inspection points" },
                    { name: "orders", desc: "Purchase orders with taxes" },
                    { name: "financing_applications", desc: "Credit applications" },
                    { name: "financing_offers", desc: "Multi-lender offers" },
                    { name: "trade_ins", desc: "Trade-in vehicles" },
                    { name: "payments", desc: "Payment records (Stripe)" },
                    { name: "deliveries", desc: "Delivery scheduling" },
                    { name: "returns", desc: "10-day return policy" },
                    { name: "documents", desc: "Order documents" },
                  ].map((table) => (
                    <div key={table.name} className="p-3 bg-muted rounded-lg">
                      <p className="font-mono text-sm font-medium">{table.name}</p>
                      <p className="text-xs text-muted-foreground">{table.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Table Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                  <pre className="text-foreground">{`CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vin CHAR(17) UNIQUE NOT NULL,
  stock_number VARCHAR(20) UNIQUE NOT NULL,
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  trim VARCHAR(100),
  body_style VARCHAR(50),
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  transmission VARCHAR(50),
  drivetrain VARCHAR(20),
  fuel_type VARCHAR(20),
  engine VARCHAR(100),
  mileage INTEGER NOT NULL,
  
  -- Pricing (Canadian Dollars)
  acquisition_cost DECIMAL(12,2),
  reconditioning_cost DECIMAL(12,2),
  list_price DECIMAL(12,2) NOT NULL,
  sale_price DECIMAL(12,2),
  msrp DECIMAL(12,2),
  
  -- Valuation
  cbb_value DECIMAL(12,2), -- Canadian Black Book
  valuation_date TIMESTAMP,
  
  -- Status
  status VARCHAR(20) DEFAULT 'available',
  location_id UUID REFERENCES locations(id),
  
  -- Flags
  featured BOOLEAN DEFAULT FALSE,
  certified BOOLEAN DEFAULT FALSE,
  new_arrival BOOLEAN DEFAULT FALSE,
  price_drop BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trade-Ins Table Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                  <pre className="text-foreground">{`CREATE TABLE trade_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customers(id),
  
  -- Vehicle Info
  vin VARCHAR(17),
  year INTEGER NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  trim VARCHAR(100),
  mileage INTEGER NOT NULL,
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  
  -- Condition
  condition_rating VARCHAR(20),
  accident_history BOOLEAN DEFAULT FALSE,
  mechanical_issues TEXT,
  cosmetic_issues TEXT,
  
  -- Valuation (Canadian Black Book)
  kbb_value DECIMAL(12,2),
  offer_amount DECIMAL(12,2),
  final_value DECIMAL(12,2),
  
  status VARCHAR(30) DEFAULT 'pending',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Table Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                  <pre className="text-foreground">{`CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id) NOT NULL,
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  
  -- Pricing (CAD)
  vehicle_price DECIMAL(12,2) NOT NULL,
  trade_in_credit DECIMAL(12,2) DEFAULT 0,
  down_payment DECIMAL(12,2) DEFAULT 0,
  documentation_fee DECIMAL(12,2) DEFAULT 499.00,
  registration_fee DECIMAL(12,2),
  omvic_fee DECIMAL(12,2) DEFAULT 10.00, -- Ontario only
  
  -- Canadian Taxes
  province VARCHAR(2) NOT NULL,
  gst_rate DECIMAL(5,4),
  pst_rate DECIMAL(5,4),
  hst_rate DECIMAL(5,4),
  qst_rate DECIMAL(5,4),
  tax_amount DECIMAL(12,2) NOT NULL,
  
  -- Totals
  subtotal DECIMAL(12,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  amount_financed DECIMAL(12,2),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);`}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Canadian Taxes */}
          <TabsContent value="taxes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Canadian Tax Configuration
                </CardTitle>
                <CardDescription>Province-specific tax rates for vehicle purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Province</th>
                        <th className="text-left py-3 px-4 font-medium">Tax Type</th>
                        <th className="text-left py-3 px-4 font-medium">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { province: "Ontario", type: "HST", rate: "13%" },
                        { province: "British Columbia", type: "GST + PST", rate: "5% + 7%" },
                        { province: "Alberta", type: "GST", rate: "5%" },
                        { province: "Quebec", type: "GST + QST", rate: "5% + 9.975%" },
                        { province: "Nova Scotia", type: "HST", rate: "15%" },
                        { province: "New Brunswick", type: "HST", rate: "15%" },
                        { province: "PEI", type: "HST", rate: "15%" },
                        { province: "Manitoba", type: "GST + PST", rate: "5% + 7%" },
                        { province: "Saskatchewan", type: "GST + PST", rate: "5% + 6%" },
                      ].map((row) => (
                        <tr key={row.province} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.province}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{row.type}</Badge>
                          </td>
                          <td className="py-3 px-4 font-mono">{row.rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Order Fees Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Standard Fees</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Documentation Fee</span>
                        <Badge>$499 CAD</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>OMVIC Fee (Ontario)</span>
                        <Badge>$10 CAD</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Registration Fee</span>
                        <Badge variant="outline">Varies by province</Badge>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-3">Optional Add-ons</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Extended Warranty</span>
                        <Badge variant="secondary">Lubrico</Badge>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted rounded">
                        <span>Home Delivery</span>
                        <Badge variant="outline">Distance-based</Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Multi-Lender Configuration */}
          <TabsContent value="lenders" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Multi-Lender Configuration
                </CardTitle>
                <CardDescription>Carvana-style multi-lender financing integration</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Lender</th>
                        <th className="text-left py-3 px-4 font-medium">Type</th>
                        <th className="text-left py-3 px-4 font-medium">Min Credit</th>
                        <th className="text-left py-3 px-4 font-medium">Max Term</th>
                        <th className="text-left py-3 px-4 font-medium">Base Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { lender: "TD Auto Finance", type: "Bank", minCredit: 680, maxTerm: "84 months", baseRate: "4.79%" },
                        { lender: "RBC", type: "Bank", minCredit: 700, maxTerm: "84 months", baseRate: "4.99%" },
                        { lender: "Scotiabank", type: "Bank", minCredit: 680, maxTerm: "84 months", baseRate: "5.19%" },
                        { lender: "BMO", type: "Bank", minCredit: 660, maxTerm: "72 months", baseRate: "5.49%" },
                        { lender: "CIBC", type: "Bank", minCredit: 650, maxTerm: "84 months", baseRate: "5.79%" },
                        { lender: "Desjardins", type: "Credit Union", minCredit: 600, maxTerm: "96 months", baseRate: "6.99%" },
                      ].map((row) => (
                        <tr key={row.lender} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.lender}</td>
                          <td className="py-3 px-4">
                            <Badge variant={row.type === "Bank" ? "default" : "secondary"}>
                              {row.type}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">{row.minCredit}</td>
                          <td className="py-3 px-4">{row.maxTerm}</td>
                          <td className="py-3 px-4 font-mono text-primary">{row.baseRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lenders Table Schema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                  <pre className="text-foreground">{`CREATE TABLE lenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  lender_type VARCHAR(30) DEFAULT 'prime',
  
  -- Credit Requirements
  min_credit_score INTEGER,
  max_income DECIMAL(12,2),
  min_income DECIMAL(12,2),
  max_loan_amount DECIMAL(12,2),
  min_loan_amount DECIMAL(12,2),
  min_term_months INTEGER,
  max_term_months INTEGER,
  
  -- Rates
  base_rate DECIMAL(5,3),
  rate_range_min DECIMAL(5,3),
  rate_range_max DECIMAL(5,3),
  
  -- Integration
  api_endpoint VARCHAR(500),
  api_key_secret_name VARCHAR(100),
  
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financing Offers Table (Multi-Lender)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted rounded-lg p-6 font-mono text-sm overflow-x-auto">
                  <pre className="text-foreground">{`CREATE TABLE financing_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES financing_applications(id),
  lender_id UUID NOT NULL REFERENCES lenders(id),
  
  status VARCHAR(30) DEFAULT 'pending',
  offer_number VARCHAR(50),
  
  -- Terms
  approved_amount DECIMAL(12,2),
  interest_rate DECIMAL(5,3),
  term_months INTEGER,
  monthly_payment DECIMAL(12,2),
  processing_fee DECIMAL(12,2),
  total_cost DECIMAL(12,2),
  
  down_payment_required DECIMAL(12,2) DEFAULT 0,
  conditions TEXT,
  
  is_selected BOOLEAN DEFAULT FALSE,
  selected_at TIMESTAMP,
  
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}</pre>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Financing Application Flow</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { step: 1, name: "Pre-qualification (Soft Pull)", desc: "No credit impact, instant decision" },
                    { step: 2, name: "Select Vehicle", desc: "Browse inventory, calculate payments" },
                    { step: 3, name: "Full Application (Hard Pull)", desc: "Submit to multiple lenders" },
                    { step: 4, name: "Compare Offers", desc: "View APR, terms from all lenders" },
                    { step: 5, name: "Select Best Offer", desc: "Choose lender, finalize terms" },
                    { step: 6, name: "E-Sign Documents", desc: "Digital contract signing" },
                    { step: 7, name: "Schedule Delivery", desc: "Pick hub or home delivery" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
                        {item.step}
                      </div>
                      <div className="flex-1 p-3 bg-muted rounded-lg">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 210-Point Inspection */}
          <TabsContent value="inspection" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  210-Point Inspection Template
                </CardTitle>
                <CardDescription>Clutch-style comprehensive vehicle inspection (vs Carvana 150-point)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium">Category</th>
                        <th className="text-left py-3 px-4 font-medium">Points</th>
                        <th className="text-left py-3 px-4 font-medium">Items</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { category: "Exterior", points: 35, items: "Body panels, paint, glass, lights" },
                        { category: "Interior", points: 30, items: "Seats, dashboard, controls, HVAC" },
                        { category: "Engine", points: 40, items: "Oil, coolant, belts, hoses, emissions" },
                        { category: "Transmission", points: 20, items: "Fluid, shifting, clutch" },
                        { category: "Brakes", points: 25, items: "Pads, rotors, lines, fluid" },
                        { category: "Suspension", points: 20, items: "Shocks, struts, bushings, alignment" },
                        { category: "Electrical", points: 20, items: "Battery, alternator, lights, sensors" },
                        { category: "Safety", points: 20, items: "Airbags, seatbelts, ADAS" },
                      ].map((row) => (
                        <tr key={row.category} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4 font-medium">{row.category}</td>
                          <td className="py-3 px-4">
                            <Badge variant="outline">{row.points} points</Badge>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{row.items}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                  <p className="text-sm font-medium">Total: 210 Points</p>
                  <p className="text-xs text-muted-foreground">40% more thorough than Carvana&apos;s 150-point inspection</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Inspection Status Values</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-center">
                    <Badge className="bg-green-600">PASS</Badge>
                    <p className="text-xs text-muted-foreground mt-2">Item meets standards</p>
                  </div>
                  <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-center">
                    <Badge className="bg-red-600">FAIL</Badge>
                    <p className="text-xs text-muted-foreground mt-2">Needs repair</p>
                  </div>
                  <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-center">
                    <Badge className="bg-yellow-600">REPAIRED</Badge>
                    <p className="text-xs text-muted-foreground mt-2">Fixed during reconditioning</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg text-center">
                    <Badge variant="outline">N/A</Badge>
                    <p className="text-xs text-muted-foreground mt-2">Not applicable</p>
                  </div>
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
