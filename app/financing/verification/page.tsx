"use client"

import { useState, useTransition, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft,
  Shield,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  CreditCard,
  Loader2,
  X
} from "lucide-react"

// ID Document types
const ID_TYPES = [
  { value: "drivers_license", label: "Driver's License" },
  { value: "passport", label: "Passport" },
  { value: "provincial_id", label: "Provincial ID Card" },
  { value: "citizenship_card", label: "Citizenship Card" },
  { value: "permanent_resident", label: "Permanent Resident Card" },
]

// Canadian provinces
const PROVINCES = [
  "Alberta", "British Columbia", "Manitoba", "New Brunswick", 
  "Newfoundland and Labrador", "Nova Scotia", "Ontario", 
  "Prince Edward Island", "Quebec", "Saskatchewan"
]

interface IDDocument {
  type: string
  number: string
  expiryDate: string
  issuingProvince: string
  frontImage: File | null
  backImage: File | null
  frontPreview: string | null
  backPreview: string | null
}

function IDVerificationContent() {
  useRouter()
  // useSearchParams is SSR-safe — no hydration mismatch
  const searchParams = useSearchParams()
  const applicationId = searchParams.get("applicationId")

  const [isPending, startTransition] = useTransition()
  const [isVerified, setIsVerified] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  
  const [primaryID, setPrimaryID] = useState<IDDocument>({
    type: "",
    number: "",
    expiryDate: "",
    issuingProvince: "Ontario",
    frontImage: null,
    backImage: null,
    frontPreview: null,
    backPreview: null,
  })

  const [secondaryID, setSecondaryID] = useState<IDDocument>({
    type: "",
    number: "",
    expiryDate: "",
    issuingProvince: "Ontario",
    frontImage: null,
    backImage: null,
    frontPreview: null,
    backPreview: null,
  })

  const [useSecondaryID, setUseSecondaryID] = useState(false)

  const handleImageUpload = (
    idType: "primary" | "secondary",
    side: "front" | "back",
    file: File | null
  ) => {
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      const preview = reader.result as string
      
      if (idType === "primary") {
        setPrimaryID(prev => ({
          ...prev,
          [`${side}Image`]: file,
          [`${side}Preview`]: preview,
        }))
      } else {
        setSecondaryID(prev => ({
          ...prev,
          [`${side}Image`]: file,
          [`${side}Preview`]: preview,
        }))
      }
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (idType: "primary" | "secondary", side: "front" | "back") => {
    if (idType === "primary") {
      setPrimaryID(prev => ({
        ...prev,
        [`${side}Image`]: null,
        [`${side}Preview`]: null,
      }))
    } else {
      setSecondaryID(prev => ({
        ...prev,
        [`${side}Image`]: null,
        [`${side}Preview`]: null,
      }))
    }
  }

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        // Build form data for API submission
        const formData = new FormData()
        formData.append("applicationId", applicationId || "")
        formData.append("primaryIdType", primaryID.type)
        formData.append("primaryIdNumber", primaryID.number)
        formData.append("primaryExpiryDate", primaryID.expiryDate)
        formData.append("primaryIssuingProvince", primaryID.issuingProvince)
        if (primaryID.frontImage) formData.append("primaryFrontImage", primaryID.frontImage)
        if (primaryID.backImage) formData.append("primaryBackImage", primaryID.backImage)

        // Secondary ID
        if (useSecondaryID && secondaryID.type) {
          formData.append("secondaryIdType", secondaryID.type)
          formData.append("secondaryIdNumber", secondaryID.number)
          if (secondaryID.frontImage) formData.append("secondaryFrontImage", secondaryID.frontImage)
          if (secondaryID.backImage) formData.append("secondaryBackImage", secondaryID.backImage)
        }

        // Submit to API
        const response = await fetch("/api/v1/id-verification", {
          method: "POST",
          body: formData
        })

        const result = await response.json()

        if (response.ok && result.success) {
          setIsVerified(true)
        } else {
          console.error("Verification failed:", result.error)
          setSubmitError(result.error || "Failed to submit verification. Please try again.")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setSubmitError("An error occurred. Please try again.")
      }
    })
  }

  const isFormValid = primaryID.type && primaryID.number && primaryID.frontImage

  if (isVerified) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Identity Verified</h2>
            <p className="text-muted-foreground mb-6">
              Your identity has been successfully verified. Your finance application is now complete and under review.
            </p>
            <div className="bg-muted p-4 rounded-lg mb-6 text-left">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Our finance team will review your application</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>You&apos;ll receive a decision within 24-48 hours</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Once approved, we&apos;ll contact you to finalize the purchase</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" asChild>
                <Link href="/inventory">Browse More Vehicles</Link>
              </Button>
              <Button variant="outline" className="flex-1" asChild>
                <Link href="/">Return Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/financing/application">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Application
            </Link>
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-[-0.01em]">Identity Verification</h1>
              <p className="text-muted-foreground">
                Securely verify your identity to complete your application
              </p>
            </div>
          </div>
          
          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 mt-4">
            <Badge variant="secondary" className="gap-1">
              <Shield className="w-3 h-3" />
              256-bit Encryption
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="w-3 h-3" />
              PIPEDA Compliant
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <FileText className="w-3 h-3" />
              Secure Document Handling
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Primary ID Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Primary Government ID
                </CardTitle>
                <CardDescription>
                  Upload a valid government-issued photo ID
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label>ID Type *</Label>
                    <Select
                      name="id-type"
                      value={primaryID.type}
                      onValueChange={(v) => setPrimaryID(prev => ({ ...prev, type: v }))}
                    >
                      <SelectTrigger className="mt-1.5" aria-label="ID type">
                        <SelectValue placeholder="Select ID type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ID_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>ID Number *</Label>
                    <Input
                      name="id-number"
                      className="mt-1.5"
                      placeholder="Enter ID number"
                      value={primaryID.number}
                      onChange={(e) => setPrimaryID(prev => ({ ...prev, number: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Expiry Date *</Label>
                    <Input
                      name="expiry-date"
                      type="date"
                      className="mt-1.5"
                      value={primaryID.expiryDate}
                      onChange={(e) => setPrimaryID(prev => ({ ...prev, expiryDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Issuing Province</Label>
                    <Select
                      name="issuing-province"
                      value={primaryID.issuingProvince}
                      onValueChange={(v) => setPrimaryID(prev => ({ ...prev, issuingProvince: v }))}
                    >
                      <SelectTrigger className="mt-1.5" aria-label="Issuing province">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map(province => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Image Upload */}
                <div>
                  <Label className="mb-3 block">Upload ID Images *</Label>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Front */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Front of ID</p>
                      {primaryID.frontPreview ? (
                        <div className="relative aspect-[1.6] rounded-lg overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element -- Blob URL from file upload */}
                          <img
                            src={primaryID.frontPreview}
                            alt="ID Front"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage("primary", "front")}
                            className="absolute top-2 right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="aspect-[1.6] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Upload Front</span>
                          <input
                            name="id-front-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload("primary", "front", e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>
                    
                    {/* Back */}
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Back of ID</p>
                      {primaryID.backPreview ? (
                        <div className="relative aspect-[1.6] rounded-lg overflow-hidden bg-muted">
                          {/* eslint-disable-next-line @next/next/no-img-element -- Blob URL from file upload */}
                          <img
                            src={primaryID.backPreview}
                            alt="ID Back"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removeImage("primary", "back")}
                            className="absolute top-2 right-2 w-8 h-8 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="aspect-[1.6] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors">
                          <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Click to upload</span>
                          <input
                            name="id-back-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleImageUpload("primary", "back", e.target.files?.[0] || null)}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Secondary ID (Optional) */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Secondary ID (Optional)
                    </CardTitle>
                    <CardDescription>
                      Provide additional ID for faster verification
                    </CardDescription>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setUseSecondaryID(!useSecondaryID)}
                  >
                    {useSecondaryID ? "Remove" : "Add Secondary ID"}
                  </Button>
                </div>
              </CardHeader>
              {useSecondaryID && (
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <Label>ID Type</Label>
                      <Select 
                        value={secondaryID.type} 
                        onValueChange={(v) => setSecondaryID(prev => ({ ...prev, type: v }))}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select ID type" />
                        </SelectTrigger>
                        <SelectContent>
                          {ID_TYPES.filter(t => t.value !== primaryID.type).map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>ID Number</Label>
                      <Input
                        name="secondary-id-number"
                        className="mt-1.5"
                        placeholder="Enter ID number"
                        value={secondaryID.number}
                        onChange={(e) => setSecondaryID(prev => ({ ...prev, number: e.target.value }))}
                      />
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Submit Button */}
            {submitError && (
              <div
                data-testid="verification-error-summary"
                role="alert"
                aria-live="assertive"
                className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}
            <Button
              data-testid="verification-btn-submit"
              className="w-full h-12 text-base aria-busy:opacity-80 aria-busy:cursor-wait"
              size="lg"
              aria-label="Submit for verification"
              aria-busy={isPending}
              onClick={() => { setSubmitError(null); handleSubmit() }}
              disabled={!isFormValid || isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Verifying Identity...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5 mr-2" />
                  Submit for Verification
                </>
              )}
            </Button>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Accepted Documents</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Canadian Driver&apos;s License</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Canadian Passport</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Provincial ID Card</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                  <span>Permanent Resident Card</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Photo Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>All four corners must be visible</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Image must be clear, not blurry</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>No glare or shadows on the ID</span>
                </div>
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span>Original document, no photocopies</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-foreground mb-1">Your Data is Secure</p>
                    <p className="text-muted-foreground">
                      We use bank-level encryption to protect your personal information. 
                      Your documents are securely stored and only used for verification purposes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function IDVerificationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <IDVerificationContent />
    </Suspense>
  )
}
