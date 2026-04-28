import { Check, X } from 'lucide-react'

interface ComparisonRow {
  feature: string
  us: string
  others: string
  usValue?: boolean
  othersValue?: boolean
}

/**
 * Render a single comparison cell. Extracted from two nested ternaries to
 * satisfy SonarCloud rule typescript:S3358.
 */
function renderComparisonCell(value: boolean | undefined, fallback: string, variant: "us" | "others") {
  if (value === undefined) {
    const className = variant === "us"
      ? "text-green-700 dark:text-green-500 font-semibold"
      : "text-muted-foreground"
    return <span className={className}>{fallback}</span>
  }
  return value
    ? <Check className="h-5 w-5 text-green-600 mx-auto" />
    : <X className="h-5 w-5 text-red-500 mx-auto" />
}

interface ComparisonTableProps {
  title: string
  rows: ComparisonRow[]
  usLabel?: string
  othersLabel?: string
}

export function ComparisonTable({ title, rows, usLabel = 'Planet Motors', othersLabel = 'Others' }: Readonly<ComparisonTableProps>) {
  return (
    <section className="py-16 md:py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12 md:text-4xl">{title}</h2>
        <div className="max-w-3xl mx-auto overflow-hidden rounded-xl border bg-background shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-3 bg-muted/50 border-b">
            <div className="p-4 font-semibold">Feature</div>
            <div className="p-4 font-semibold text-center text-primary">{usLabel}</div>
            <div className="p-4 font-semibold text-center text-muted-foreground">{othersLabel}</div>
          </div>
          
          {/* Rows */}
          {rows.map((row, index) => (
            <div key={row.feature} className={`grid grid-cols-3 ${index === rows.length - 1 ? '' : 'border-b'}`}>
              <div className="p-4 font-semibold">{row.feature}</div>
              <div className="p-4 text-center">
                {renderComparisonCell(row.usValue, row.us, "us")}
              </div>
              <div className="p-4 text-center">
                {renderComparisonCell(row.othersValue, row.others, "others")}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
