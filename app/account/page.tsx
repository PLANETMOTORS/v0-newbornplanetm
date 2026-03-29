"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { 
  User, Mail, Phone, MapPin, CreditCard, Bell, Shield, LogOut, 
  Heart, Car, FileText, Clock, CheckCircle, Settings, Eye,
  Calendar, DollarSign, Truck, Star
} from "lucide-react"

// API-ready interfaces
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

interface SavedVehicle {
  id: string
  vehicleId: string
  vehicleName: string
  price: number
  image: string
  savedAt: string
}

interface PreApproval {
  id: string
  status: "pending" | "approved" | "declined"
  amount: number
  rate: number
  term: number
  lender: string
  expiresAt: string
}

interface OrderHistory {
  id: string
  vehicleName: string
  orderDate: string
  status: "pending" | "processing" | "delivered" | "completed"
  totalAmount: number
}

// Mock user data - will be replaced with API calls
const mockUser: UserProfile = {
  id: "usr_123456",
  email: "john.smith@example.com",
  firstName: "John",
  lastName: "Smith",
  phone: "(416) 555-0123",
  address: "123 Main Street",
  postalCode: "M5V 1K4",
  city: "Toronto",
  province: "ON",
  createdAt: "2024-01-15",
  emailVerified: true,
  phoneVerified: true
}

const mockSavedVehicles: SavedVehicle[] = [
  {
    id: "sv_001",
    vehicleId: "2024-tesla-model-y",
    vehicleName: "2024 Tesla Model Y Long Range",
    price: 64990,
    image: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=200&h=150&fit=crop",
    savedAt: "2024-03-20"
  },
  {
    id: "sv_002",
    vehicleId: "2024-porsche-taycan",
    vehicleName: "2024 Porsche Taycan 4S",
    price: 134500,
    image: "https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=200&h=150&fit=crop",
    savedAt: "2024-03-18"
  }
]

const mockPreApproval: PreApproval = {
  id: "pa_789",
  status: "approved",
  amount: 75000,
  rate: 5.49,
  term: 72,
  lender: "TD Bank",
  expiresAt: "2024-04-28"
}

export default function AccountPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [activeTab, setActiveTab] = useState("profile")
  const [isLoading, setIsLoading] = useState(false)
  const [loginError, setLoginError] = useState("")

  // Mock login function - will be replaced with API call
  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setLoginError("")
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // For demo, accept any credentials
    if (email && password) {
      setIsLoggedIn(true)
    } else {
      setLoginError("Please enter your email and password")
    }
    setIsLoading(false)
  }

  // Mock register function - will be replaced with API call
  const handleRegister = async (data: any) => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsLoggedIn(true)
    setIsLoading(false)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="pt-32 pb-16">
          <div className="container mx-auto px-4 max-w-md">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-serif">Welcome Back</CardTitle>
                <CardDescription>Sign in to your Planet Motors account</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="signin">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Create Account</TabsTrigger>
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
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Signing in..." : "Sign In"}
                        </Button>
                      </div>
                    </form>
                    <div className="text-center">
                      <Button variant="link" className="text-sm text-muted-foreground">
                        Forgot password?
                      </Button>
                    </div>
                    
                    <div className="relative my-4">
                      <Separator />
                      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                        or continue with
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        Google
                      </Button>
                      <Button variant="outline">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                        </svg>
                        GitHub
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="register" className="space-y-4 mt-6">
                    <form onSubmit={(e) => {
                      e.preventDefault()
                      handleRegister({})
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
      
      <main className="pt-32 pb-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-serif font-bold mb-8">My Account</h1>
            
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
                  <Badge className="ml-2">{mockSavedVehicles.length}</Badge>
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
                  onClick={() => setIsLoggedIn(false)}
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
                          {mockUser.emailVerified && (
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
                          <Input id="profileFirstName" defaultValue={mockUser.firstName} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profileLastName">Last Name</Label>
                          <Input id="profileLastName" defaultValue={mockUser.lastName} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="profileEmail">Email</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="profileEmail" className="pl-10" defaultValue={mockUser.email} />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="profilePhone">Phone</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input id="profilePhone" className="pl-10" defaultValue={mockUser.phone} />
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profileAddress">Street Address</Label>
                          <Input id="profileAddress" defaultValue={mockUser.address} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profileCity">City</Label>
                          <Input id="profileCity" defaultValue={mockUser.city} />
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="profileProvince">Province</Label>
                          <Input id="profileProvince" defaultValue={mockUser.province} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="profilePostal">Postal Code</Label>
                          <Input id="profilePostal" defaultValue={mockUser.postalCode} />
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
                      <CardTitle>Saved Vehicles</CardTitle>
                      <CardDescription>Vehicles you&apos;ve added to your favorites</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {mockSavedVehicles.length > 0 ? (
                        <div className="space-y-4">
                          {mockSavedVehicles.map(vehicle => (
                            <div key={vehicle.id} className="flex items-center gap-4 p-4 border rounded-lg">
                              <img 
                                src={vehicle.image} 
                                alt={vehicle.vehicleName}
                                className="w-24 h-16 object-cover rounded"
                              />
                              <div className="flex-1">
                                <h4 className="font-semibold">{vehicle.vehicleName}</h4>
                                <p className="text-lg font-bold text-primary">${vehicle.price.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">Saved on {vehicle.savedAt}</p>
                              </div>
                              <div className="flex gap-2">
                                <Button size="sm" asChild>
                                  <Link href={`/vehicles/${vehicle.vehicleId}`}>
                                    <Eye className="w-4 h-4 mr-1" /> View
                                  </Link>
                                </Button>
                                <Button size="sm" variant="outline">
                                  <Heart className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground">No saved vehicles yet</p>
                          <Button className="mt-4" asChild>
                            <Link href="/inventory">Browse Inventory</Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Pre-Approval Tab */}
                {activeTab === "preapproval" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Financing Pre-Approval</CardTitle>
                      <CardDescription>Your financing status and options</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {mockPreApproval.status === "approved" ? (
                        <div className="space-y-6">
                          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <CheckCircle className="w-6 h-6 text-green-600" />
                              <span className="text-lg font-semibold text-green-800">Pre-Approved!</span>
                            </div>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div>
                                <p className="text-sm text-green-700">Approved Amount</p>
                                <p className="text-2xl font-bold text-green-800">${mockPreApproval.amount.toLocaleString()}</p>
                              </div>
                              <div>
                                <p className="text-sm text-green-700">Interest Rate</p>
                                <p className="text-2xl font-bold text-green-800">{mockPreApproval.rate}%</p>
                              </div>
                              <div>
                                <p className="text-sm text-green-700">Term</p>
                                <p className="text-2xl font-bold text-green-800">{mockPreApproval.term} months</p>
                              </div>
                            </div>
                            <p className="text-sm text-green-700 mt-4">
                              Lender: {mockPreApproval.lender} | Valid until: {mockPreApproval.expiresAt}
                            </p>
                          </div>
                          <Button size="lg" className="w-full" asChild>
                            <Link href="/inventory">Shop Within Your Budget</Link>
                          </Button>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">Get pre-approved in minutes</p>
                          <Button asChild>
                            <Link href="/financing">Apply for Pre-Approval</Link>
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
                            <p className="font-medium">Price Drop Alerts</p>
                            <p className="text-sm text-muted-foreground">Get notified when saved vehicles drop in price</p>
                          </div>
                          <Button variant="outline" size="sm">Enable</Button>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">New Inventory Alerts</p>
                            <p className="text-sm text-muted-foreground">Be first to know about new arrivals</p>
                          </div>
                          <Button variant="outline" size="sm">Enable</Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>Security</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                          <Shield className="w-4 h-4 mr-2" />
                          Change Password
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-destructive">
                          Delete Account
                        </Button>
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
