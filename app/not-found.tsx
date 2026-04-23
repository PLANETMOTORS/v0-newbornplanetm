import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Home, Search, Phone } from "lucide-react"
import { PHONE_TOLL_FREE, PHONE_TOLL_FREE_TEL } from "@/lib/constants/dealership"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* 404 Illustration */}
        <div className="relative mb-8">
          <div className="text-[150px] font-bold text-muted-foreground/10 leading-none">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
              <Search className="w-12 h-12 text-primary" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-[-0.01em] text-foreground mb-4">
          Page Not Found
        </h1>
        <p className="text-muted-foreground mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may have been moved or 
          doesn&apos;t exist.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Button asChild>
            <Link href="/">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/inventory">
              <Search className="w-4 h-4 mr-2" />
              Browse Inventory
            </Link>
          </Button>
        </div>

        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Need help finding something?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center text-sm">
            <a
              href={`tel:${PHONE_TOLL_FREE_TEL}`}
              className="flex items-center justify-center gap-2 text-primary hover:underline"
            >
              <Phone className="w-4 h-4" />
              {PHONE_TOLL_FREE}
            </a>
            <span className="hidden sm:inline text-muted-foreground">|</span>
            <Link 
              href="/contact" 
              className="text-primary hover:underline"
            >
              Contact Us
            </Link>
            <span className="hidden sm:inline text-muted-foreground">|</span>
            <Link 
              href="/faq" 
              className="text-primary hover:underline"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
