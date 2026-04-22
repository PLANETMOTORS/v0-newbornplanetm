"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, EyeOff, Mail, LockKeyhole, Chrome, Facebook, Loader2 } from "lucide-react"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const rawRedirectTo = searchParams.get("redirectTo")
  // Sanitize redirectTo to prevent open redirect (OWASP WSTG-SESS-04)
  const redirectTo = (rawRedirectTo && /^\/[^/]/.test(rawRedirectTo) && !/[\r\n\t]/.test(rawRedirectTo))
    ? rawRedirectTo
    : "/account"
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      router.push(redirectTo)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: "google" | "facebook") => {
    setIsLoading(true)
    setError("")
    
    try {
      const supabase = createClient()
      const callbackUrl = `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: callbackUrl,
        },
      })
      
      if (error) {
        throw error
      }
      if (data?.url) {
        window.location.assign(data.url)
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Sign in failed. Please try email login."
      setError(errorMessage)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <Header />
      
      <main id="main-content" tabIndex={-1} className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-6">
              <PlanetMotorsLogo size="lg" />
            </Link>
            <h1 className="text-3xl font-bold tracking-[-0.01em] mb-2">Welcome Back</h1>
            <p className="text-muted-foreground">
              Sign in to manage your vehicles, reservations, and more
            </p>
          </div>

          <Card className="shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl text-center">Sign In</CardTitle>
              <CardDescription className="text-center">
                Choose your preferred sign in method
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
                  <Chrome className="mr-2 h-5 w-5" />
                  Google
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12"
                  onClick={() => handleOAuthLogin("facebook")}
                  disabled={isLoading}
                >
                  <Facebook className="mr-2 h-5 w-5" />
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

              {/* Email/Password Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10 h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link 
                      href="/auth/forgot-password" 
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10 h-12"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    Remember me for 30 days
                  </Label>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg"
                  disabled={isLoading}
                >
                  {isLoading ? "Signing in..." : "Sign In"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4 pt-0">
              <div className="text-center text-sm">
                Don&apos;t have an account?
              </div>
              <Button variant="outline" className="w-full h-12" asChild>
                <Link href="/auth/signup">
                  Create Account
                </Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Trust Indicators */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Protected by industry-standard encryption</p>
            <p className="mt-1">
              <a href="https://www.omvic.on.ca" target="_blank" rel="noopener noreferrer" className="hover:underline">
                OMVIC Licensed Dealer
              </a>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function LoginLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  )
}
