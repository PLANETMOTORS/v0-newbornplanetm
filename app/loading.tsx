import { Spinner } from "@/components/ui/spinner"

export default function Loading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <Spinner className="mx-auto mb-4 size-8" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  )
}
