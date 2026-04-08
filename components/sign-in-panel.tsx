"use client"

import { useState } from "react"
import Link from "next/link"
import { X, Mail, Lock, ArrowRight, LogIn, Car, DollarSign, FileText, ChevronRight, Phone, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

interface SignInPanelProps {
  isOpen: boolean
  onClose: () => void
}

const menuLinks = [
  { name: "Shop Inventory", href: "/inventory", icon: Car },
  { name: "Sell Your Car", href: "/sell-your-car", icon: DollarSign },
  { name: "Trade-In", href: "/trade-in", icon: DollarSign },
  { name: "Financing", href: "/financing", icon: FileText },
  { name: "About Us", href: "/about", icon: null },
  { name: "Contact", href: "/contact", icon: Phone },
]

export function SignInPanel({ isOpen, onClose }: SignInPanelProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"welcome" | "login">("welcome")

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    // TODO: Implement actual authentication
    setTimeout(() => {
      setIsLoading(false)
      // Handle sign-in logic here
    }, 1500)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[9998] transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Side Panel */}
      <div
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out overflow-y-auto animate-in slide-in-from-right"
      >
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b bg-white z-10">
          <h2 className="text-xl font-bold">Welcome to Planet Motors</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {step === "welcome" ? (
            <>
              {/* Sign In CTA */}
              <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-5 border border-primary/20">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <LogIn className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Sign in to your account</p>
                    <p className="text-sm text-gray-600">Access saved vehicles and more</p>
                  </div>
                  <Button onClick={() => setStep("login")} size="sm">
                    Sign In
                  </Button>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Menu</p>
                {menuLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={onClose}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <span className="font-medium text-gray-900">{link.name}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </Link>
                ))}
              </div>

              <Separator className="my-4" />

              {/* Quick Actions */}
              <div className="space-y-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</p>
                
                <Link href="/financing" onClick={onClose} className="block p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:border-green-300 hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-gray-900 mb-1">Get Pre-Qualified</h3>
                  <p className="text-sm text-gray-600">
                    Financing pre-approval without affecting your credit
                  </p>
                </Link>

                <Link href="/trade-in" onClick={onClose} className="block p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:border-blue-300 hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-gray-900 mb-1">Get Your Offer</h3>
                  <p className="text-sm text-gray-600">
                    Get a real offer for your car in less than 2 minutes
                  </p>
                </Link>

                <Link href="/contact" onClick={onClose} className="block p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:border-purple-300 hover:shadow-sm transition-all">
                  <h3 className="font-semibold text-gray-900 mb-1">Schedule Tour</h3>
                  <p className="text-sm text-gray-600">
                    Book a virtual or in-person tour of a vehicle
                  </p>
                </Link>
              </div>

              <Separator className="my-4" />

              {/* Sign Up */}
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">
                  Don&apos;t have an account?
                </p>
                <Button variant="outline" className="w-full h-10">
                  Create Account
                </Button>
              </div>
            </>
          ) : (
            <>
              {/* Login Form */}
              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <a href="#" className="text-xs font-medium text-primary hover:underline">
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-11"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <Separator className="my-4" />

              {/* Social Login */}
              <div className="space-y-3">
                <p className="text-center text-sm text-gray-600">Or continue with</p>
                <Button variant="outline" className="w-full h-10">
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in with Google
                </Button>
                <Button variant="outline" className="w-full h-10">
                  <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Sign in with Facebook
                </Button>
              </div>

              <Separator className="my-4" />

              {/* Back Button */}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setStep("welcome")}
              >
                ← Back
              </Button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
