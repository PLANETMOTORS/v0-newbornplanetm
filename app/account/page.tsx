"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { createClient } from "@/lib/supabase/client"
import type { OAuthProvider } from "@/lib/auth/oauth-providers"
import { useAuth } from "@/contexts/auth-context"
import { useFavorites } from "@/contexts/favorites-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  User, Mail, Phone, CreditCard, Shield, LogOut,
  Heart, Car, CheckCircle, Settings, Trash2, Bell, TrendingDown, Loader2,
  FileText, AlertCircle
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface PriceAlert {
  id: string
  email: string
  vehicle_id: string | null
  make: string | null
  model: string | null
  max_price: number | null
  notify_price_drops: boolean
  notify_new_listings: boolean
  is_active: boolean
  created_at: string
}

interface UserProfile {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string
  address: string
  postalCode: string
  city: string
  province: string
  createdAt: string
  emailVerified: boolean
  phoneVerified: boolean
}

interface RegistrationInput {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

const AGREEMENT_TYPE_LABEL: Record<string, string> = {
  finance: "Finance",
  lease: "Lease",
  cash: "Cash",
}

// Status badge colours — defined at module level to avoid recreation on every render
const STATUS_BADGE_COLOURS: Record<string, string> = {
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  funded: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-gray-100 text-gray-800",
}

export default function AccountPage() {
  const { user, isLoading: isAuthLoading, signOut } = useAuth()
  const { favorites, removeFavorite } = useFavorites()
  const [activeTab, setActiveTab] = useState("profile")
  const [authTab, setAuthTab] = useState("signin")
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")
  const [authMessage, setAuthMessage] = useState("")
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null)

  // Notification preferences
  const [priceDropEnabled, setPriceDropEnabled] = useState(false)
  const [newInventoryEnabled, setNewInventoryEnabled] = useState(false)
  const [notifLoading, setNotifLoading] = useState<string | null>(null)

  // Price alerts
  const [priceAlerts, setPriceAlerts] = useState<PriceAlert[]>([])
  const [alertsLoading, setAlertsLoading] = useState(false)

  // Delete account
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState("")

  // Finance application drafts
  interface FinanceDraft {
    id: string
    vehicle_id: string | null
    form_data: Record<string, unknown>
    updated_at: string
  }
  const [financeDrafts, setFinanceDrafts] = useState<FinanceDraft[]>([])
  const [draftsLoading, setDraftsLoading] = useState(false)

  // Finance applications (submitted)
  interface FinanceApp {
    id: string
    status: string
    agreement_type: string
    requested_amount: number | null
    estimated_payment: number | null
    created_at: string
    vehicle_id: string | null
    finance_applicants?: Array<{ first_name: string; last_name: string }>
  }
  const [financeApps, setFinanceApps] = useState<FinanceApp[]>([])
  const [appsLoading, setAppsLoading] = useState(false)

  // Fetch notification preferences and price alerts when user is available
  const fetchAccountData = useCallback(async () => {
    if (!user?.email) return

    // Fetch price alerts
    setAlertsLoading(true)
    try {
      const res = await fetch(`/api/alerts?email=${encodeURIComponent(user.email)}`)
      if (res.ok) {
        const data = await res.json()
        setPriceAlerts(data.alerts || [])
        // Derive notification prefs from active alerts
        const hasDropAlerts = (data.alerts || []).some((a: PriceAlert) => a.notify_price_drops && a.is_active)
        const hasNewAlerts = (data.alerts || []).some((a: PriceAlert) => a.notify_new_listings && a.is_active)
        setPriceDropEnabled(hasDropAlerts)
        setNewInventoryEnabled(hasNewAlerts)
      }
    } catch { /* silent */ }
    setAlertsLoading(false)

    // Fetch finance application drafts
    setDraftsLoading(true)
    try {
      const res = await fetch("/api/v1/financing/drafts")
      if (res.ok) {
        const data = await res.json()
        setFinanceDrafts(data.data || [])
      }
    } catch { /* silent */ }
    setDraftsLoading(false)

    // Fetch submitted finance applications
    setAppsLoading(true)
    try {
      const res = await fetch("/api/v1/financing/applications")
      if (res.ok) {
        const data = await res.json()
        setFinanceApps(data.data || [])
      }
    } catch { /* silent */ }
    setAppsLoading(false)
  }, [user?.email])

  useEffect(() => {
    fetchAccountData()
  }, [fetchAccountData])

  // Delete account handler
  const handleDeleteAccount = async () => {
    setDeleteLoading(true)
    setDeleteError("")
    try {
      const res = await fetch("/api/v1/customers/me/delete", { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error?.message || data.error || "Failed to delete account")
      }
      await signOut()
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete account")
    } finally {
      setDeleteLoading(false)
    }
  }

  const toggleNotification = async (type: 'priceDrops' | 'newListings') => {
    if (!user?.email) return
    setNotifLoading(type)
    const newValue = type === 'priceDrops' ? !priceDropEnabled : !newInventoryEnabled

    try {
      // If enabling and no alerts exist, create a general alert for the user
      if (newValue && priceAlerts.length === 0) {
        await fetch('/api/alerts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            preferences: {
              priceDrops: type === 'priceDrops' ? true : priceDropEnabled,
              newListings: type === 'newListings' ? true : newInventoryEnabled,
            },
          }),
        })
      }

      // Update notification preferences via profile
      await fetch('/api/v1/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            email: true,
            sms: false,
            push: true,
            priceDropAlerts: type === 'priceDrops' ? newValue : priceDropEnabled,
            newInventoryAlerts: type === 'newListings' ? newValue : newInventoryEnabled,
          },
        }),
      })

      if (type === 'priceDrops') setPriceDropEnabled(newValue)
      else setNewInventoryEnabled(newValue)

      // Refresh alerts
      await fetchAccountData()
    } catch { /* silent */ }
    setNotifLoading(null)
  }

  const deleteAlert = async (alertId: string) => {
    if (!user?.email) return
    try {
      await fetch(`/api/alerts?alertId=${alertId}&email=${encodeURIComponent(user.email)}`, {
        method: 'DELETE',
      })
      setPriceAlerts(prev => prev.filter(a => a.id !== alertId))
    } catch { /* silent */ }
  }

  const userProfile: UserProfile = {
    id: user?.id ?? "",
    email: user?.email ?? "",
    firstName: String(user?.user_metadata?.first_name ?? user?.user_metadata?.firstName ?? ""),
    lastName: String(user?.user_metadata?.last_name ?? user?.user_metadata?.lastName ?? ""),
    phone: String(user?.user_metadata?.phone ?? ""),
    address: "",
    postalCode: "",
    city: "",
    province: "",
    createdAt: user?.created_at ?? "",
    emailVerified: Boolean(user?.email_confirmed_at),
    phoneVerified: Boolean(user?.phone_confirmed_at),
  }

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setLoginError("")

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setLoginError(error.message)
      }
    } catch {
      setLoginError("Sign in failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (data: RegistrationInput) => {
    setIsLoading(true)
    setLoginError("")
    setAuthMessage("")

    try {
      const supabase = createClient()
      const redirectPath = "/account"
      const siteOrigin =
        globalThis.window?.location?.origin
        ?? process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL
        ?? process.env.NEXT_PUBLIC_SITE_URL
        ?? process.env.NEXT_PUBLIC_BASE_URL
        ?? "https://www.planetmotors.ca"
      const callbackUrl = `${siteOrigin}/auth/callback?redirectTo=${encodeURIComponent(redirectPath)}`
      const { data: signUpData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: callbackUrl,
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            phone: data.phone,
          },
        },
      })

      if (error) {
        setLoginError(error.message)
      } else if (!signUpData.session) {
        setAuthMessage("Check your email to confirm your account, then sign in.")
      }
    } catch {
      setLoginError("Registration failed. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(provider)
    setLoginError("")
    setAuthMessage("")

    try {
      const supabase = createClient()
      const callbackUrl = `${globalThis.location.origin}/auth/callback?redirectTo=${encodeURIComponent("/account")}`
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: callbackUrl },
      })

      if (error) {
        setLoginError(error.message)
        setOauthLoading(null)
        return
      }

      if (data?.url) {
        globalThis.location.assign(data.url)
        return
      }

      setLoginError("OAuth sign-in failed. Please try again.")
      setOauthLoading(null)
    } catch {
      setLoginError("OAuth sign-in failed. Please try again.")
      setOauthLoading(null)
    }
  }

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />

        <main id="main-content" tabIndex={-1} className="pt-32 pb-16">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                Loading your account...
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main id="main-content" tabIndex={-1} className="pt-32 pb-16">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Welcome Back</CardTitle>
                <CardDescription>Sign in to your Planet Motors account</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={authTab}
                  onValueChange={(value) => {
                    setAuthTab(value)
                    setLoginError("")
                    setAuthMessage("")
                  }}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 h-auto">
                    <TabsTrigger value="signin" className="px-4 py-2.5 min-h-[44px]">Sign In</TabsTrigger>
                    <TabsTrigger value="register" className="px-4 py-2.5 min-h-[44px]">Register</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="signin" className="space-y-4 mt-6">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const form = e.target as HTMLFormElement
                      const email = (form.elements.namedItem('email') as HTMLInputElement).value
                      const password = (form.elements.namedItem('password') as HTMLInputElement).value
                      handleLogin(email, password)
                    }}>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input id="email" name="email" type="email" placeholder="you@example.com" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <Input id="password" name="password" type="password" required />
                        </div>
                        {loginError && (
                          <p className="text-sm text-destructive">{loginError}</p>
                        )}
                        {authMessage && (
                          <p className="text-sm text-green-700">{authMessage}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                      </div>
                    </form>
                    <div className="text-center">
                      <Button asChild variant="link" className="text-sm text-muted-foreground">
                        <Link href="/auth/forgot-password">Forgot password?</Link>
                      </Button>
                    </div>
                    
                    <div className="relative my-4">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                        or continue with
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button
                        variant="outline"
                        disabled={!!oauthLoading}
                        onClick={() => handleOAuthLogin("google")}
                      >
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        {oauthLoading === "google" ? "Redirecting..." : "Google"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={!!oauthLoading}
                        onClick={() => handleOAuthLogin("facebook")}
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        {oauthLoading === "facebook" ? "Redirecting..." : "Facebook"}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="register" className="space-y-4 mt-6">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      const form = e.target as HTMLFormElement
                      handleRegister({
                        firstName: (form.elements.namedItem("firstName") as HTMLInputElement).value,
                        lastName: (form.elements.namedItem("lastName") as HTMLInputElement).value,
                        email: (form.elements.namedItem("registerEmail") as HTMLInputElement).value,
                        phone: (form.elements.namedItem("registerPhone") as HTMLInputElement).value,
                        password: (form.elements.namedItem("registerPassword") as HTMLInputElement).value,
                      })
                    }}>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input id="firstName" name="firstName" required />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input id="lastName" name="lastName" required />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="registerEmail">Email</Label>
                          <Input id="registerEmail" name="registerEmail" type="email" placeholder="you@example.com" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="registerPhone">Phone</Label>
                          <Input id="registerPhone" name="registerPhone" type="tel" placeholder="(416) 555-0123" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="registerPassword">Password</Label>
                          <Input id="registerPassword" name="registerPassword" type="password" required minLength={8} />
                          <p className="text-xs text-muted-foreground">Must be at least 8 characters</p>
                        </div>
                        {loginError && (
                          <p className="text-sm text-destructive">{loginError}</p>
                        )}
                        {authMessage && (
                          <p className="text-sm text-green-700">{authMessage}</p>
                        )}
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Creating Account..." : "Create Account"}
                        </Button>
                        <p className="text-xs text-center text-muted-foreground">
                          By creating an account, you agree to our{" "}
                          <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                          {" "}and{" "}
                          <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
                        </p>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </main>

        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main id="main-content" tabIndex={-1} className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-[-0.01em] mb-8">My Account</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-8">
              {/* Sidebar */}
              <div className="flex md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0 md:space-y-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <Button 
                  variant={activeTab === "profile" ? "secondary" : "ghost"} 
                  className="shrink-0 md:w-full justify-start min-h-[44px]"
                  onClick={() => setActiveTab("profile")}
                >
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
                <Button 
                  variant={activeTab === "saved" ? "secondary" : "ghost"} 
                  className="shrink-0 md:w-full justify-start min-h-[44px]"
                  onClick={() => setActiveTab("saved")}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Saved
                  <Badge className="ml-2">{favorites.length}</Badge>
                </Button>
                <Button 
                  variant={activeTab === "preapproval" ? "secondary" : "ghost"} 
                  className="shrink-0 md:w-full justify-start min-h-[44px]"
                  onClick={() => setActiveTab("preapproval")}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pre-Approval
                </Button>
                <Button 
                  variant={activeTab === "orders" ? "secondary" : "ghost"} 
                  className="shrink-0 md:w-full justify-start min-h-[44px]"
                  onClick={() => setActiveTab("orders")}
                >
                  <Car className="w-4 h-4 mr-2" />
                  Vehicles
                </Button>
                <Button 
                  variant={activeTab === "settings" ? "secondary" : "ghost"} 
                  className="shrink-0 md:w-full justify-start min-h-[44px]"
                  onClick={() => setActiveTab("settings")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Separator className="hidden md:block my-4" />
                <Button 
                  variant="ghost" 
                  className="shrink-0 md:w-full justify-start text-destructive min-h-[44px]"
                  onClick={() => { signOut().catch(() => { /* sign-out errors are non-actionable for the user */ }) }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>

              {/* Main Content */}
              <div className="md:col-span-3 space-y-6">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Profile Information</CardTitle>
                          <CardDescription>Update your personal details</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {userProfile.emailVerified && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" /> Email Verified
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profileFirstName">First Name</Label>
                          <Input id="profileFirstName" defaultValue={userProfile.firstName} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profileLastName">Last Name</Label>
                          <Input id="profileLastName" defaultValue={userProfile.lastName} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="profileEmail">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="profileEmail" className="pl-10" defaultValue={userProfile.email} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="profilePhone">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="profilePhone" className="pl-10" defaultValue={userProfile.phone} />
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profileAddress">Street Address</Label>
                          <Input id="profileAddress" defaultValue={userProfile.address} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profileCity">City</Label>
                          <Input id="profileCity" defaultValue={userProfile.city} />
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profileProvince">Province</Label>
                          <Input id="profileProvince" defaultValue={userProfile.province} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profilePostal">Postal Code</Label>
                          <Input id="profilePostal" defaultValue={userProfile.postalCode} />
                        </div>
                      </div>
                      
                      <Button>Save Changes</Button>
                    </CardContent>
                  </Card>
                )}

                {/* Saved Vehicles Tab */}
                {activeTab === "saved" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Saved Vehicles ({favorites.length})</CardTitle>
                      <CardDescription>Vehicles you&apos;ve added to your favorites</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {favorites.length === 0 ? (
                        <div className="text-center py-8">
                          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No saved vehicles yet</p>
                          <p className="text-sm text-muted-foreground mt-1">Heart a vehicle on the inventory page to save it here</p>
                          <Button className="mt-4" asChild>
                            <Link href="/inventory">Browse Inventory</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {favorites.map((vehicle) => (
                            <div key={vehicle.id} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                              <div className="relative w-24 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                                {vehicle.image ? (
                                  <Image
                                    src={vehicle.image}
                                    alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                                    fill
                                    className="object-cover"
                                    sizes="96px"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Car className="w-8 h-8 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <Link href={`/vehicles/${vehicle.id}`} className="font-semibold hover:underline">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </Link>
                                {vehicle.price && (
                                  <p className="text-sm text-muted-foreground">
                                    ${vehicle.price.toLocaleString()}
                                  </p>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="shrink-0 text-muted-foreground hover:text-destructive"
                                onClick={() => removeFavorite(vehicle.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Pre-Approval Tab */}
                {activeTab === "preapproval" && (
                  <div className="space-y-6">
                    {/* Incomplete / Draft Applications */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5" />
                          Saved Applications
                        </CardTitle>
                        <CardDescription>Resume incomplete finance applications</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {draftsLoading && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        {!draftsLoading && financeDrafts.length === 0 && (
                          <p className="text-sm text-muted-foreground py-4">No saved drafts</p>
                        )}
                        {!draftsLoading && financeDrafts.length > 0 && (
                          <div className="space-y-3">
                            {financeDrafts.map((draft) => {
                              const formData = draft.form_data as Record<string, unknown>
                              const applicant = formData.primaryApplicant as Record<string, string> | undefined
                              const vehicle = formData.vehicleInfo as Record<string, string> | undefined
                              const vehicleLabel = vehicle?.year && vehicle?.make && vehicle?.model
                                ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
                                : "General Application"
                              return (
                                <div key={draft.id} className="flex items-center justify-between p-3 rounded-lg border">
                                  <div>
                                    <p className="font-semibold text-sm">{vehicleLabel}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {applicant?.firstName ? `${applicant.firstName} ${applicant?.lastName || ""}` : "Not started"} &middot; Saved {new Date(draft.updated_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant="secondary">Draft</Badge>
                                    <Button size="sm" asChild>
                                      <Link href={draft.vehicle_id ? `/financing/application?vehicleId=${draft.vehicle_id}` : "/financing/application"}>
                                        Resume
                                      </Link>
                                    </Button>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Submitted Applications */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Submitted Applications</CardTitle>
                        <CardDescription>Your financing applications and their status</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {appsLoading && (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        {!appsLoading && financeApps.length === 0 && (
                          <div className="text-center py-6">
                            <CreditCard className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground text-sm mb-4">No submitted applications</p>
                            <Button asChild>
                              <Link href="/financing">Apply for Pre-Approval</Link>
                            </Button>
                          </div>
                        )}
                        {!appsLoading && financeApps.length > 0 && (
                          <div className="space-y-3">
                            {financeApps.map((app) => {
                              const agreementLabel = AGREEMENT_TYPE_LABEL[app.agreement_type] ?? "Cash"
                              return (
                                <div key={app.id} className="flex items-center justify-between p-3 rounded-lg border">
                                  <div>
                                    <p className="font-semibold text-sm">
                                      {agreementLabel} Application
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {app.requested_amount ? `$${Math.round(app.requested_amount).toLocaleString()}` : ""} &middot; {new Date(app.created_at).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Badge className={STATUS_BADGE_COLOURS[app.status] ?? "bg-gray-100 text-gray-800"}>
                                    {app.status.replaceAll("_", " ")}
                                  </Badge>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* My Vehicles/Orders Tab */}
                {activeTab === "orders" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>My Vehicles</CardTitle>
                      <CardDescription>Your purchase and delivery status</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <Car className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No vehicles purchased yet</p>
                        <Button className="mt-4" asChild>
                          <Link href="/inventory">Start Shopping</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Notification Preferences</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">Price Drop Alerts</p>
                            <p className="text-sm text-muted-foreground">Get notified when saved vehicles drop in price</p>
                          </div>
                          <Button
                            variant={priceDropEnabled ? "default" : "outline"}
                            size="sm"
                            disabled={notifLoading === 'priceDrops'}
                            onClick={() => toggleNotification('priceDrops')}
                          >
                            {notifLoading === 'priceDrops' && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {notifLoading !== 'priceDrops' && priceDropEnabled && (
                              <><Bell className="w-4 h-4 mr-1" /> Enabled</>
                            )}
                            {notifLoading !== 'priceDrops' && !priceDropEnabled && 'Enable'}
                          </Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">New Inventory Alerts</p>
                            <p className="text-sm text-muted-foreground">Be first to know about new arrivals</p>
                          </div>
                          <Button
                            variant={newInventoryEnabled ? "default" : "outline"}
                            size="sm"
                            disabled={notifLoading === 'newListings'}
                            onClick={() => toggleNotification('newListings')}
                          >
                            {notifLoading === 'newListings' && (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            )}
                            {notifLoading !== 'newListings' && newInventoryEnabled && (
                              <><Bell className="w-4 h-4 mr-1" /> Enabled</>
                            )}
                            {notifLoading !== 'newListings' && !newInventoryEnabled && 'Enable'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Active Price Alerts */}
                    {alertsLoading ? (
                      <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                          Loading alerts...
                        </CardContent>
                      </Card>
                    ) : priceAlerts.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingDown className="w-5 h-5" />
                            Active Alerts ({priceAlerts.length})
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {priceAlerts.map((alert) => (
                            <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border">
                              <div>
                                <p className="font-semibold text-sm">
                                  {alert.make && alert.model
                                    ? `${alert.make} ${alert.model}`
                                    : 'All Vehicles'}
                                </p>
                                <div className="flex gap-2 mt-1">
                                  {alert.notify_price_drops && (
                                    <Badge variant="secondary" className="text-xs">Price Drops</Badge>
                                  )}
                                  {alert.notify_new_listings && (
                                    <Badge variant="secondary" className="text-xs">New Listings</Badge>
                                  )}
                                  {alert.max_price && (
                                    <Badge variant="outline" className="text-xs">Under ${alert.max_price.toLocaleString()}</Badge>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => deleteAlert(alert.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => {
                            globalThis.location.href = "/auth/forgot-password"
                          }}
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                        <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
                          if (!deleteLoading) {
                            setDeleteDialogOpen(open)
                            if (!open) setDeleteError("")
                          }
                        }}>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Account
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure you want to delete your account?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete your account, saved vehicles, price alerts, and any finance application drafts.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            {deleteError && (
                              <p className="text-sm text-destructive flex items-center gap-1">
                                <AlertCircle className="w-4 h-4" />
                                {deleteError}
                              </p>
                            )}
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={deleteLoading}>Cancel</AlertDialogCancel>
                              <Button
                                variant="destructive"
                                onClick={handleDeleteAccount}
                                disabled={deleteLoading}
                              >
                                {deleteLoading ? (
                                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</>
                                ) : (
                                  "Delete My Account"
                                )}
                              </Button>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
