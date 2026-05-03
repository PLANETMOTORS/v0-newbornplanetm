"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Eye, EyeOff, LockKeyhole, Shield, Loader2, CheckCircle2 } from "lucide-react"
import { PlanetMotorsLogo } from "@/components/planet-motors-logo"

export default function AdminResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [hasSession, setHasSession] = useState<boolean | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session)
    })
  }, [])

  useEffect(() => {
    if (!success) return
    const id = setTimeout(() => router.push("/admin/login"), 3000)
    return () => clearTimeout(id)
  }, [success, router])

  const handleReset = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    setIsSubmitting(true)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) throw updateError
      setSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update password")
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
            Set New Password
          </p>
        </div>

        <Card className="border-gray-800 bg-gray-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white">New Password</CardTitle>
            <CardDescription>
              {success
                ? "Your password has been updated"
                : "Choose a strong password for your admin account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {(() => {
              if (success) {
                return (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-green-950/50 border border-green-900 rounded-lg">
                      <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                      <p className="text-sm text-green-300">
                        Password updated successfully. Redirecting to login...
                      </p>
                    </div>
                    <Button asChild className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href="/admin/login">
                        Go to Admin Login
                      </Link>
                    </Button>
                  </div>
                )
              }
              if (hasSession === null) {
                return (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                    <span className="ml-2 text-sm text-gray-400">Verifying session...</span>
                  </div>
                )
              }
              if (hasSession === false) {
                return (
                  <div className="space-y-4">
                    <div className="p-3 text-sm text-yellow-400 bg-yellow-950/50 border border-yellow-900 rounded-lg">
                      No active session. Please use the reset link from your email, or request a new one.
                    </div>
                    <Button asChild className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white">
                      <Link href="/admin/forgot-password">
                        Request Reset Link
                      </Link>
                    </Button>
                  </div>
                )
              }
              return (
                <form onSubmit={handleReset} className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900 rounded-lg">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300">New Password</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 8 characters"
                      className="pl-10 pr-10 h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      aria-pressed={showPassword}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Re-enter your password"
                      className="pl-10 h-11 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={8}
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
                      Updating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Update Password
                    </>
                  )}
                </Button>
              </form>
              )
            })()}
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-600 mt-6">
          Planet Motors &copy; {new Date().getFullYear()} &middot; OMVIC Licensed
        </p>
      </div>
    </div>
  )
}
