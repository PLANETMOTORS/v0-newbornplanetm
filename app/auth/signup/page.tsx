"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { initiateOAuthLogin } from "@/lib/auth/oauth-helpers"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, LockKeyhole, User, Phone, CheckCircle } from "lucide-react"
import { GoogleIcon, FacebookIcon } from "@/components/ui/brand-icons"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"

function SignUpForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirectTo = searchParams.get("redirectTo")
  // Sanitize redirectTo to prevent open redirect (OWASP WSTG-SESS-04)
  const redirectTo = (rawRedirectTo && /^\/[^/]/.test(rawRedirectTo) && !/[\r\n\t]/.test(rawRedirectTo))
    ? rawRedirectTo
    : "/account"
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [marketingConsent, setMarketingConsent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSignUp = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (!acceptTerms) {
      setError("Please accept the terms and conditions")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
            `${globalThis.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
          data: {
            first_name: formData.firstName,
            last_name: formData.lastName,
            phone: formData.phone,
            marketing_consent: marketingConsent
          }
        }
      })
      
      if (error) throw error
      router.push("/auth/verify-email")
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create account")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setIsLoading(true)
    setError("")
    try {
      await initiateOAuthLogin(provider, redirectTo)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "OAuth signup failed")
      setIsLoading(false)
    }
  }

  const benefits = [
    "Save your favorite vehicles",
    "Track your reservations",
    "Get personalized recommendations",
    "Faster checkout process",
    "Exclusive member deals"
  ]

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/30">
      <Header />
      
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Benefits */}
            <div className="hidden lg:block">
              <Link href="/" className="inline-block mb-8">
                <PlanetMotorsLogo size="xl" />
              </Link>
              <h1 className="text-4xl font-bold tracking-[-0.01em] mb-4">Join Planet Motors</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Create your account to access member-only perks and pricing
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-lg">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="mt-12 p-6 bg-primary/5 rounded-xl">
                <p className="text-lg font-semibold mb-2">Already have an account?</p>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Sign In Instead
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right Column - Form */}
            <div>
              <div className="lg:hidden text-center mb-8">
                <Link href="/" className="inline-block mb-6">
                  <PlanetMotorsLogo size="lg" />
                </Link>
                <h1 className="text-3xl font-bold tracking-[-0.01em] mb-2">Create Account</h1>
                <p className="text-muted-foreground">
                  Join thousands of happy customers
                </p>
              </div>

              <Card className="shadow-lg">
                <CardHeader className="space-y-1 pb-4 lg:block hidden">
                  <CardTitle className="text-2xl">Create Account</CardTitle>
                  <CardDescription>
                    Enter your details to get started
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* OAuth Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline" 
                      className="h-12"
                      onClick={() => handleOAuthLogin("google")}
                      disabled={isLoading}
                    >
                      <GoogleIcon className="mr-2 h-5 w-5" />
                      Google
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-12"
                      onClick={() => handleOAuthLogin("facebook")}
                      disabled={isLoading}
                    >
                      <FacebookIcon className="mr-2 h-5 w-5" />
                      Facebook
                    </Button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">
                        Or continue with email
                      </span>
                    </div>
                  </div>

                  {/* Signup Form */}
                  <form onSubmit={handleSignUp} className="space-y-4">
                    {error && (
                      <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            id="firstName"
                            name="firstName"
                            placeholder="John"
                            className="pl-10 h-12"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          placeholder="Doe"
                          className="h-12"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          className="pl-10 h-12"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="(416) 555-0123"
                          className="pl-10 h-12"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="pl-10 pr-10 h-12"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          minLength={8}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Must be at least 8 characters
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <div className="relative">
                        <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="pl-10 h-12"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-start space-x-2">
                        <Checkbox 
                          id="terms" 
                          checked={acceptTerms}
                          onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                          className="mt-1"
                        />
                        <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-tight">
                          I agree to the{" "}
                          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                          {" "}and{" "}
                          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                        </Label>
                      </div>
                      <div className="flex items-start space-x-2">
                        <Checkbox 
                          id="marketing" 
                          checked={marketingConsent}
                          onCheckedChange={(checked) => setMarketingConsent(checked as boolean)}
                          className="mt-1"
                        />
                        <Label htmlFor="marketing" className="text-sm font-normal cursor-pointer leading-tight">
                          Send me exclusive deals and new vehicle alerts (optional)
                        </Label>
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating account..." : "Create Account"}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4 pt-0 lg:hidden">
                  <div className="text-center text-sm">
                    Already have an account?{" "}
                    <Link href="/auth/login" className="text-primary font-semibold hover:underline">
                      Sign in
                    </Link>
                  </div>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <SignUpForm />
    </Suspense>
  )
}
