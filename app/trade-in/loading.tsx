import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function TradeInLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="h-20 bg-background border-b" />

      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          {/* Title */}
          <Skeleton className="h-10 w-72 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-12" />

          {/* Form Skeleton */}
          <Card>
            <CardContent className="p-6 space-y-6">
              {/* Step indicators */}
              <div className="flex justify-center gap-4 mb-8">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-10 rounded-full" />
                ))}
              </div>

              {/* Form fields */}
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}

              {/* Submit button */}
              <Skeleton className="h-12 w-full mt-6" />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
