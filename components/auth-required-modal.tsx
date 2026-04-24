"use client"

import Link from "next/link"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ShieldCheck, UserPlus, LogIn } from "lucide-react"

interface AuthRequiredModalProps {
  isOpen: boolean
  onClose: () => void
  action?: string
  redirectTo?: string
}

export function AuthRequiredModal({ 
  isOpen, 
  onClose, 
  action = "continue",
  redirectTo = ""
}: AuthRequiredModalProps) {
  const encodedRedirect = encodeURIComponent(redirectTo || globalThis.location.pathname)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">Sign In Required</DialogTitle>
          <DialogDescription className="text-center text-base">
            Please sign in or create an account to {action}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          <Button asChild className="w-full h-12 text-lg">
            <Link href={`/auth/login?redirectTo=${encodedRedirect}`}>
              <LogIn className="w-5 h-5 mr-2" />
              Sign In
            </Link>
          </Button>
          
          <Button asChild variant="outline" className="w-full h-12 text-lg">
            <Link href={`/auth/signup?redirectTo=${encodedRedirect}`}>
              <UserPlus className="w-5 h-5 mr-2" />
              Create Account
            </Link>
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 flex-shrink-0" />
            <p>Your information is protected with industry-standard encryption</p>
          </div>
        </div>

        <div className="mt-2 text-center">
          <button 
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Continue browsing
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
