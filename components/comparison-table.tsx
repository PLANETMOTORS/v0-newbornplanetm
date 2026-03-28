import { CheckCircle2, XCircle, Minus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ComparisonItem {
  feature: string
  planetMotors: boolean | string
  traditionalDealers: boolean | string
  privateSellers: boolean | string
}

const comparisonData: ComparisonItem[] = [
  {
    feature: "210-Point Inspection",
    planetMotors: true,
    traditionalDealers: "Varies",
    privateSellers: false
  },
  {
    feature: "Free Carfax Report",
    planetMotors: true,
    traditionalDealers: "Extra cost",
    privateSellers: false
  },
  {
    feature: "10-Day Return Policy",
    planetMotors: true,
    traditionalDealers: false,
    privateSellers: false
  },
  {
    feature: "No-Haggle Pricing",
    planetMotors: true,
    traditionalDealers: false,
    privateSellers: false
  },
  {
    feature: "Free Home Delivery",
    planetMotors: true,
    traditionalDealers: "Extra cost",
    privateSellers: false
  },
  {
    feature: "Warranty Included",
    planetMotors: true,
    traditionalDealers: "Varies",
    privateSellers: false
  },
  {
    feature: "Online Financing",
    planetMotors: true,
    traditionalDealers: "In-person",
    privateSellers: false
  },
  {
    feature: "Trade-In Accepted",
    planetMotors: true,
    traditionalDealers: true,
    privateSellers: false
  }
]

function RenderValue({ value }: { value: boolean | string }) {
  if (value === true) {
    return <CheckCircle2 className="w-5 h-5 text-green-600 mx-auto" />
  }
  if (value === false) {
    return <XCircle className="w-5 h-5 text-red-500 mx-auto" />
  }
  return <span className="text-sm text-muted-foreground">{value}</span>
}

export function ComparisonTable() {
  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-serif font-bold text-foreground mb-4">
            Why Choose Planet Motors?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how we compare to traditional dealerships and private sellers.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium">Feature</th>
                    <th className="p-4 font-medium text-center bg-primary/5 border-x">
                      <div className="text-primary font-bold">Planet Motors</div>
                    </th>
                    <th className="p-4 font-medium text-center">Traditional Dealers</th>
                    <th className="p-4 font-medium text-center">Private Sellers</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonData.map((row, index) => (
                    <tr key={row.feature} className={index % 2 === 0 ? "" : "bg-muted/20"}>
                      <td className="p-4 font-medium">{row.feature}</td>
                      <td className="p-4 text-center bg-primary/5 border-x">
                        <RenderValue value={row.planetMotors} />
                      </td>
                      <td className="p-4 text-center">
                        <RenderValue value={row.traditionalDealers} />
                      </td>
                      <td className="p-4 text-center">
                        <RenderValue value={row.privateSellers} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
