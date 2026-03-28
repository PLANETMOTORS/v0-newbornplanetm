"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowRight, User } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { AuthRequiredModal } from "@/components/auth-required-modal"

export function FinanceApplicationForm() {
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    income: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      setShowAuthModal(true)
      return
    }
    
    // Process financing application
    console.log("Submitting finance application:", formData)
    // Redirect to financing application confirmation
    window.location.href = "/financing/application"
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Input 
              placeholder="First Name" 
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              required
            />
          </div>
          <div>
            <Input 
              placeholder="Last Name" 
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              required
            />
          </div>
        </div>
        <Input 
          type="email" 
          placeholder="Email Address" 
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <Input 
          type="tel" 
          placeholder="Phone Number" 
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          required
        />
        <Input 
          type="text" 
          placeholder="Annual Income (e.g., $75,000)" 
          value={formData.income}
          onChange={(e) => setFormData({ ...formData, income: e.target.value })}
          required
        />
        
        <Button type="submit" className="w-full" size="lg">
          Get Pre-Approved
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        
        <p className="text-xs text-center text-muted-foreground">
          <User className="w-3 h-3 inline mr-1" />
          Sign in required to submit application
        </p>
      </form>

      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="get pre-approved for financing"
        redirectTo="/financing"
      />
    </>
  )
}
