import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header Skeleton */}
      <div className="h-20 bg-background border-b" />

      <main className="pt-24 pb-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Title */}
          <Skeleton className="h-10 w-48 mx-auto mb-4" />
          <Skeleton className="h-6 w-96 mx-auto mb-12" />

          {/* Featured Post Skeleton */}
          <Card className="overflow-hidden mb-12">
            <div className="grid md:grid-cols-2">
              <Skeleton className="aspect-[16/9] md:aspect-auto md:h-full" />
              <CardContent className="p-6 space-y-4">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </div>
          </Card>

          {/* Blog Grid Skeleton */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[16/9]" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
