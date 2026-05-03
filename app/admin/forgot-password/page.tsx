"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mail, Shield, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleReset = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const redirectTo = `${globalThis.location.origin}/auth/callback?redirectTo=${encodeURIComponent("/admin/reset-password")}`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

      if (resetError) throw resetError
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to send reset email")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <PlanetMotorsLogo size="lg" />
          <div className="flex items-center justify-center gap-2 mt-4">
            <Shield className="w-5 h-5 text-blue-400" />
            <h1 className="text-xl font-semibold text-white">Admin Portal</h1>
          </div>
          <p className="text-sm text-gray-400 mt-1">
            Password Recovery
          </p>
        </div>

        <Card className="border-gray-800 bg-gray-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white">Reset Password</CardTitle>
            <CardDescription>
              {sent
                ? "Check your inbox for the reset link"
                : "Enter your admin email to receive a password reset link"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-950/50 border border-green-900 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                  <p className="text-sm text-green-300">
                    If an account exists for <span className="font-semibold text-white">{email}</span>, a reset link has been sent.
                  </p>
                </div>
                <Button asChild className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/admin/login">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Admin Login
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@planetmotors.ca"
                      className="pl-10 h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white aria-busy:opacity-80 aria-busy:cursor-wait"
                  disabled={isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Reset Link
                    </>
                  )}
                </Button>

                <div className="text-center pt-1">
                  <Link
                    href="/admin/login"
                    className="text-sm text-blue-400 hover:text-blue-300 transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    Back to login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-600 mt-6">
          Planet Motors &copy; {new Date().getFullYear()} &middot; OMVIC Licensed
        </p>
      </div>
    </div>
  )
}
