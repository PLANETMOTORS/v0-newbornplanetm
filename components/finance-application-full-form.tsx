"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  User, MapPin, Home, Briefcase, DollarSign, Car, FileText, Upload,
  ArrowRight, ArrowLeft, CheckCircle, Loader2, Shield, AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

// =====================================================
// TYPES
// =====================================================
interface ApplicantData {
  // Personal Info
  salutation: string
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  dateOfBirth: { day: string; month: string; year: string }
  gender: string
  maritalStatus: string
  phone: string
  mobilePhone: string
  email: string
  noEmail: boolean
  languagePreference: string
  creditRating: string
  
  // Address
  postalCode: string
  addressType: string
  suiteNumber: string
  streetNumber: string
  streetName: string
  streetType: string
  streetDirection: string
  city: string
  province: string
  durationYears: string
  durationMonths: string
  
  // Housing
  homeStatus: string
  marketValue: string
  mortgageAmount: string
  mortgageHolder: string
  monthlyPayment: string
  outstandingMortgage: string
  
  // Employment
  employmentCategory: string
  employmentStatus: string
  employerName: string
  occupation: string
  jobTitle: string
  employerStreet: string
  employerCity: string
  employerProvince: string
  employerPostalCode: string
  employerPhone: string
  employerPhoneExt: string
  employmentYears: string
  employmentMonths: string
  
  // Income
  grossIncome: string
  incomeFrequency: string
  otherIncomeType: string
  otherIncomeAmount: string
  otherIncomeFrequency: string
  otherIncomeDescription: string
  annualTotal: string
}

interface VehicleInfo {
  vin: string
  year: string
  make: string
  model: string
  trim: string
  color: string
  mileage: string
  totalPrice: string
  downPayment: string
  maxDownPayment: string
}

interface TradeInInfo {
  hasTradeIn: boolean
  vin: string
  year: string
  make: string
  model: string
  trim: string
  color: string
  mileage: string
  condition: string
  estimatedValue: string
  hasLien: boolean
  lienHolder: string
  lienAmount: string
}

interface FinancingTerms {
  agreementType: "finance" | "cash"
  salesTaxRate: string
  interestRate: string
  adminFee: string
  loanTermMonths: number
  paymentFrequency: "weekly" | "bi-weekly" | "semi-monthly" | "monthly"
}

interface DocumentUpload {
  type: string
  name: string
  file: File | null
  url?: string
}

// Initial state
const emptyApplicant: ApplicantData = {
  salutation: "", firstName: "", middleName: "", lastName: "", suffix: "",
  dateOfBirth: { day: "", month: "", year: "" },
  gender: "", maritalStatus: "", phone: "", mobilePhone: "", email: "",
  noEmail: false, languagePreference: "en", creditRating: "",
  postalCode: "", addressType: "", suiteNumber: "", streetNumber: "",
  streetName: "", streetType: "", streetDirection: "", city: "", province: "Ontario",
  durationYears: "", durationMonths: "",
  homeStatus: "", marketValue: "", mortgageAmount: "", mortgageHolder: "",
  monthlyPayment: "", outstandingMortgage: "",
  employmentCategory: "", employmentStatus: "", employerName: "", occupation: "",
  jobTitle: "", employerStreet: "", employerCity: "", employerProvince: "",
  employerPostalCode: "", employerPhone: "", employerPhoneExt: "",
  employmentYears: "", employmentMonths: "",
  grossIncome: "", incomeFrequency: "annually", otherIncomeType: "",
  otherIncomeAmount: "", otherIncomeFrequency: "", otherIncomeDescription: "",
  annualTotal: ""
}

// =====================================================
// MAIN COMPONENT
// =====================================================
interface FinanceApplicationFullFormProps {
  vehicleId?: string
  vehicleData?: {
    id: string
    year: number
    make: string
    model: string
    trim: string
    price: number
    vin?: string
    mileage?: number
    color?: string
  }
}

export function FinanceApplicationFullForm({ vehicleId, vehicleData }: FinanceApplicationFullFormProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  // Form state
  const [primaryApplicant, setPrimaryApplicant] = useState<ApplicantData>(emptyApplicant)
  const [includeCoApplicant, setIncludeCoApplicant] = useState(false)
  const [coApplicant, setCoApplicant] = useState<ApplicantData>(emptyApplicant)
  const [coApplicantRelation, setCoApplicantRelation] = useState("")
  
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    vin: vehicleData?.vin || "",
    year: vehicleData?.year?.toString() || "",
    make: vehicleData?.make || "",
    model: vehicleData?.model || "",
    trim: vehicleData?.trim || "",
    color: vehicleData?.color || "",
    mileage: vehicleData?.mileage?.toString() || "",
    totalPrice: vehicleData?.price?.toString() || "",
    downPayment: "0",
    maxDownPayment: ""
  })
  
  const [tradeIn, setTradeIn] = useState<TradeInInfo>({
    hasTradeIn: false, vin: "", year: "", make: "", model: "", trim: "",
    color: "", mileage: "", condition: "", estimatedValue: "",
    hasLien: false, lienHolder: "", lienAmount: ""
  })
  
  const [financingTerms, setFinancingTerms] = useState<FinancingTerms>({
    agreementType: "finance",
    salesTaxRate: "13",
    interestRate: "",
    adminFee: "895",
    loanTermMonths: 72,
    paymentFrequency: "bi-weekly"
  })
  
  const [documents, setDocuments] = useState<DocumentUpload[]>([])
  const [additionalNotes, setAdditionalNotes] = useState("")
  
  const steps = [
    { number: 1, title: "Applicant", icon: User },
    { number: 2, title: "Co-Applicant", icon: User },
    { number: 3, title: "Vehicle & Financing", icon: Car },
    { number: 4, title: "Review & Submit", icon: FileText },
    { number: 5, title: "Documents", icon: Upload },
    { number: 6, title: "ID Verification", icon: Shield },
  ]
  
  // Calculate financing details
  const calculateFinancing = () => {
    const price = parseFloat(vehicleInfo.totalPrice) || 0
    const downPayment = parseFloat(vehicleInfo.downPayment) || 0
    const tradeValue = tradeIn.hasTradeIn ? (parseFloat(tradeIn.estimatedValue) || 0) : 0
    const lienAmount = tradeIn.hasLien ? (parseFloat(tradeIn.lienAmount) || 0) : 0
    const netTrade = tradeValue - lienAmount
    const adminFee = parseFloat(financingTerms.adminFee) || 895
    const taxRate = parseFloat(financingTerms.salesTaxRate) / 100 || 0.13
    
    const subtotal = price + adminFee - downPayment - netTrade
    const tax = subtotal * taxRate
    const amountFinanced = subtotal + tax
    
    // Calculate payment
    const rate = (parseFloat(financingTerms.interestRate) || 8.99) / 100
    const monthlyRate = rate / 12
    const term = financingTerms.loanTermMonths
    
    let paymentsPerYear = 12
    if (financingTerms.paymentFrequency === "weekly") paymentsPerYear = 52
    else if (financingTerms.paymentFrequency === "bi-weekly") paymentsPerYear = 26
    else if (financingTerms.paymentFrequency === "semi-monthly") paymentsPerYear = 24
    
    const periodicRate = rate / paymentsPerYear
    const totalPayments = (term / 12) * paymentsPerYear
    
    const payment = amountFinanced * (periodicRate * Math.pow(1 + periodicRate, totalPayments)) / 
      (Math.pow(1 + periodicRate, totalPayments) - 1)
    
    const totalToRepay = payment * totalPayments
    const totalInterest = totalToRepay - amountFinanced
    
    return {
      price,
      downPayment,
      netTrade,
      adminFee,
      tax,
      amountFinanced,
      payment: isNaN(payment) ? 0 : payment,
      totalToRepay: isNaN(totalToRepay) ? 0 : totalToRepay,
      totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
      totalPayments
    }
  }
  
  const financing = calculateFinancing()
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch("/api/v1/financing/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryApplicant,
          coApplicant: includeCoApplicant ? coApplicant : null,
          coApplicantRelation: includeCoApplicant ? coApplicantRelation : null,
          vehicleInfo,
          tradeIn: tradeIn.hasTradeIn ? tradeIn : null,
          financingTerms,
          additionalNotes,
          vehicleId
        })
      })
      
      if (response.ok) {
        setIsSubmitted(true)
      }
    } catch (error) {
      console.error("Submit error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Render success state - redirect to ID verification
  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Application Received!</h2>
        <p className="text-muted-foreground mb-6">
          Your finance application has been saved. Complete identity verification to finalize your application.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => window.location.href = `/financing/verification?vehicleId=${vehicleId}`}>
            <Shield className="w-4 h-4 mr-2" />
            Continue to ID Verification
          </Button>
          <Button variant="outline" onClick={() => window.location.href = "/inventory"}>
            Complete Later
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          ID verification is required to complete your application
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            // Skip co-applicant step if not needed
            if (step.number === 2 && !includeCoApplicant && currentStep !== 1) {
              return null
            }
            return (
              <div key={step.number} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  currentStep >= step.number 
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "ml-2 text-sm font-medium hidden sm:block",
                  currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-12 lg:w-24 h-0.5 mx-2",
                    currentStep > step.number ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {/* STEP 1: Primary Applicant */}
          {currentStep === 1 && (
            <ApplicantForm
              title="Primary Applicant Information"
              description="Enter your personal, address, employment, and income information"
              data={primaryApplicant}
              onChange={setPrimaryApplicant}
              isPrimary
            />
          )}
          
          {/* STEP 2: Co-Applicant */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Checkbox
                  id="includeCoApplicant"
                  checked={includeCoApplicant}
                  onCheckedChange={(checked) => setIncludeCoApplicant(checked as boolean)}
                />
                <Label htmlFor="includeCoApplicant" className="text-base font-medium cursor-pointer">
                  Include Co-Applicant / Co-Signer
                </Label>
              </div>
              
              {includeCoApplicant && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label>Relation to Primary Applicant *</Label>
                      <Select value={coApplicantRelation} onValueChange={setCoApplicantRelation}>
                        <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="common_law">Common-Law Partner</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <ApplicantForm
                    title="Co-Applicant Information"
                    description="Enter co-applicant details"
                    data={coApplicant}
                    onChange={setCoApplicant}
                    isPrimary={false}
                  />
                </>
              )}
            </div>
          )}
          
          {/* STEP 3: Vehicle & Financing */}
          {currentStep === 3 && (
            <VehicleFinancingForm
              vehicleInfo={vehicleInfo}
              setVehicleInfo={setVehicleInfo}
              tradeIn={tradeIn}
              setTradeIn={setTradeIn}
              financingTerms={financingTerms}
              setFinancingTerms={setFinancingTerms}
              financing={financing}
              additionalNotes={additionalNotes}
              setAdditionalNotes={setAdditionalNotes}
            />
          )}
          
          {/* STEP 4: Review */}
          {currentStep === 4 && (
            <ReviewStep
              primaryApplicant={primaryApplicant}
              coApplicant={includeCoApplicant ? coApplicant : null}
              vehicleInfo={vehicleInfo}
              tradeIn={tradeIn}
              financingTerms={financingTerms}
              financing={financing}
            />
          )}
          
          {/* STEP 5: Documents */}
          {currentStep === 5 && (
            <DocumentsStep
              documents={documents}
              setDocuments={setDocuments}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {currentStep < 5 ? (
          <Button onClick={() => setCurrentStep(prev => prev + 1)}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

// =====================================================
// APPLICANT FORM COMPONENT
// =====================================================
interface ApplicantFormProps {
  title: string
  description: string
  data: ApplicantData
  onChange: (data: ApplicantData) => void
  isPrimary: boolean
}

function ApplicantForm({ title, description, data, onChange, isPrimary }: ApplicantFormProps) {
  const updateField = (field: keyof ApplicantData, value: any) => {
    onChange({ ...data, [field]: value })
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      {/* Personal Information */}
      <section>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <User className="w-4 h-4" />
          Personal Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Salutation</Label>
            <Select value={data.salutation} onValueChange={(v) => updateField("salutation", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Mr.">Mr.</SelectItem>
                <SelectItem value="Mrs.">Mrs.</SelectItem>
                <SelectItem value="Ms.">Ms.</SelectItem>
                <SelectItem value="Miss">Miss</SelectItem>
                <SelectItem value="Dr.">Dr.</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>First Name *</Label>
            <Input value={data.firstName} onChange={(e) => updateField("firstName", e.target.value)} required />
          </div>
          <div>
            <Label>Middle Name</Label>
            <Input value={data.middleName} onChange={(e) => updateField("middleName", e.target.value)} />
          </div>
          <div>
            <Label>Last Name *</Label>
            <Input value={data.lastName} onChange={(e) => updateField("lastName", e.target.value)} required />
          </div>
          <div>
            <Label>Suffix</Label>
            <Select value={data.suffix} onValueChange={(v) => updateField("suffix", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Jr.">Jr.</SelectItem>
                <SelectItem value="Sr.">Sr.</SelectItem>
                <SelectItem value="II">II</SelectItem>
                <SelectItem value="III">III</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date of Birth *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={data.dateOfBirth.day} onValueChange={(v) => updateField("dateOfBirth", { ...data.dateOfBirth, day: v })}>
                <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={data.dateOfBirth.month} onValueChange={(v) => updateField("dateOfBirth", { ...data.dateOfBirth, month: v })}>
                <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={data.dateOfBirth.year} onValueChange={(v) => updateField("dateOfBirth", { ...data.dateOfBirth, year: v })}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 80 }, (_, i) => {
                    const year = new Date().getFullYear() - 18 - i
                    return <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Gender *</Label>
            <Select value={data.gender} onValueChange={(v) => updateField("gender", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Marital Status *</Label>
            <Select value={data.maritalStatus} onValueChange={(v) => updateField("maritalStatus", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="common_law">Common-Law</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="separated">Separated</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Phone *</Label>
            <Input type="tel" value={data.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="(___) ___-____" />
          </div>
          <div>
            <Label>Mobile Phone</Label>
            <Input type="tel" value={data.mobilePhone} onChange={(e) => updateField("mobilePhone", e.target.value)} placeholder="(___) ___-____" />
          </div>
          <div>
            <Label>Email *</Label>
            <Input type="email" value={data.email} onChange={(e) => updateField("email", e.target.value)} />
          </div>
          <div>
            <Label>Credit Rating *</Label>
            <Select value={data.creditRating} onValueChange={(v) => updateField("creditRating", v)}>
              <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent [750+]</SelectItem>
                <SelectItem value="good">Good [700+]</SelectItem>
                <SelectItem value="average">Average [600+]</SelectItem>
                <SelectItem value="poor">Poor [500+]</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
      
      <Separator />
      
      {/* Address */}
      <section>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Current Address
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Postal Code *</Label>
            <Input value={data.postalCode} onChange={(e) => updateField("postalCode", e.target.value.toUpperCase())} placeholder="A1A 1A1" />
          </div>
          <div>
            <Label>Address Type *</Label>
            <Select value={data.addressType} onValueChange={(v) => updateField("addressType", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Suite/Unit No.</Label>
            <Input value={data.suiteNumber} onChange={(e) => updateField("suiteNumber", e.target.value)} />
          </div>
          <div>
            <Label>Street Number *</Label>
            <Input value={data.streetNumber} onChange={(e) => updateField("streetNumber", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <Label>Street Name *</Label>
            <Input value={data.streetName} onChange={(e) => updateField("streetName", e.target.value)} />
          </div>
          <div>
            <Label>Street Type</Label>
            <Select value={data.streetType} onValueChange={(v) => updateField("streetType", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Street">Street</SelectItem>
                <SelectItem value="Avenue">Avenue</SelectItem>
                <SelectItem value="Road">Road</SelectItem>
                <SelectItem value="Drive">Drive</SelectItem>
                <SelectItem value="Boulevard">Boulevard</SelectItem>
                <SelectItem value="Crescent">Crescent</SelectItem>
                <SelectItem value="Court">Court</SelectItem>
                <SelectItem value="Way">Way</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Direction</Label>
            <Select value={data.streetDirection} onValueChange={(v) => updateField("streetDirection", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="N">North</SelectItem>
                <SelectItem value="S">South</SelectItem>
                <SelectItem value="E">East</SelectItem>
                <SelectItem value="W">West</SelectItem>
                <SelectItem value="NE">Northeast</SelectItem>
                <SelectItem value="NW">Northwest</SelectItem>
                <SelectItem value="SE">Southeast</SelectItem>
                <SelectItem value="SW">Southwest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>City *</Label>
            <Input value={data.city} onChange={(e) => updateField("city", e.target.value)} />
          </div>
          <div>
            <Label>Province *</Label>
            <Select value={data.province} onValueChange={(v) => updateField("province", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ontario">Ontario</SelectItem>
                <SelectItem value="Quebec">Quebec</SelectItem>
                <SelectItem value="British Columbia">British Columbia</SelectItem>
                <SelectItem value="Alberta">Alberta</SelectItem>
                <SelectItem value="Manitoba">Manitoba</SelectItem>
                <SelectItem value="Saskatchewan">Saskatchewan</SelectItem>
                <SelectItem value="Nova Scotia">Nova Scotia</SelectItem>
                <SelectItem value="New Brunswick">New Brunswick</SelectItem>
                <SelectItem value="Newfoundland">Newfoundland</SelectItem>
                <SelectItem value="PEI">Prince Edward Island</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Years at Address</Label>
              <Input type="number" value={data.durationYears} onChange={(e) => updateField("durationYears", e.target.value)} min="0" />
            </div>
            <div className="flex-1">
              <Label>Months</Label>
              <Input type="number" value={data.durationMonths} onChange={(e) => updateField("durationMonths", e.target.value)} min="0" max="11" />
            </div>
          </div>
        </div>
      </section>
      
      <Separator />
      
      {/* Home/Mortgage Details */}
      <section>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Home className="w-4 h-4" />
          Home/Mortgage Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Home Status *</Label>
            <Select value={data.homeStatus} onValueChange={(v) => updateField("homeStatus", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="own">Own</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="live_with_parents">Live with Parents</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {data.homeStatus === "own" && (
            <>
              <div>
                <Label>Market Value</Label>
                <Input type="number" value={data.marketValue} onChange={(e) => updateField("marketValue", e.target.value)} placeholder="$0.00" />
              </div>
              <div>
                <Label>Mortgage Amount</Label>
                <Input type="number" value={data.mortgageAmount} onChange={(e) => updateField("mortgageAmount", e.target.value)} placeholder="$0.00" />
              </div>
              <div>
                <Label>Mortgage Holder</Label>
                <Input value={data.mortgageHolder} onChange={(e) => updateField("mortgageHolder", e.target.value)} />
              </div>
            </>
          )}
          <div>
            <Label>Monthly Payment *</Label>
            <Input type="number" value={data.monthlyPayment} onChange={(e) => updateField("monthlyPayment", e.target.value)} placeholder="$0.00" />
          </div>
        </div>
      </section>
      
      <Separator />
      
      {/* Employment */}
      <section>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Current Employment
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Employment Type *</Label>
            <Select value={data.employmentCategory} onValueChange={(v) => updateField("employmentCategory", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full-Time</SelectItem>
                <SelectItem value="part_time">Part-Time</SelectItem>
                <SelectItem value="self_employed">Self-Employed</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="unemployed">Unemployed</SelectItem>
                <SelectItem value="disability">Disability</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Status *</Label>
            <Select value={data.employmentStatus} onValueChange={(v) => updateField("employmentStatus", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="probation">On Probation</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="seasonal">Seasonal</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Employer Name *</Label>
            <Input value={data.employerName} onChange={(e) => updateField("employerName", e.target.value)} />
          </div>
          <div>
            <Label>Occupation *</Label>
            <Input value={data.occupation} onChange={(e) => updateField("occupation", e.target.value)} />
          </div>
          <div>
            <Label>Job Title</Label>
            <Input value={data.jobTitle} onChange={(e) => updateField("jobTitle", e.target.value)} />
          </div>
          <div>
            <Label>Employer Phone *</Label>
            <div className="flex gap-2">
              <Input type="tel" value={data.employerPhone} onChange={(e) => updateField("employerPhone", e.target.value)} className="flex-1" />
              <Input value={data.employerPhoneExt} onChange={(e) => updateField("employerPhoneExt", e.target.value)} placeholder="Ext." className="w-20" />
            </div>
          </div>
          <div className="md:col-span-2">
            <Label>Employer Address</Label>
            <Input value={data.employerStreet} onChange={(e) => updateField("employerStreet", e.target.value)} placeholder="Street address" />
          </div>
          <div>
            <Label>City</Label>
            <Input value={data.employerCity} onChange={(e) => updateField("employerCity", e.target.value)} />
          </div>
          <div>
            <Label>Province</Label>
            <Select value={data.employerProvince} onValueChange={(v) => updateField("employerProvince", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Ontario">Ontario</SelectItem>
                <SelectItem value="Quebec">Quebec</SelectItem>
                <SelectItem value="British Columbia">British Columbia</SelectItem>
                <SelectItem value="Alberta">Alberta</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Years Employed</Label>
              <Input type="number" value={data.employmentYears} onChange={(e) => updateField("employmentYears", e.target.value)} min="0" />
            </div>
            <div className="flex-1">
              <Label>Months</Label>
              <Input type="number" value={data.employmentMonths} onChange={(e) => updateField("employmentMonths", e.target.value)} min="0" max="11" />
            </div>
          </div>
        </div>
      </section>
      
      <Separator />
      
      {/* Income */}
      <section>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Income Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Gross Income *</Label>
            <Input type="number" value={data.grossIncome} onChange={(e) => updateField("grossIncome", e.target.value)} placeholder="$0.00" />
          </div>
          <div>
            <Label>Income Frequency *</Label>
            <Select value={data.incomeFrequency} onValueChange={(v) => updateField("incomeFrequency", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Other Income Type</Label>
            <Select value={data.otherIncomeType} onValueChange={(v) => updateField("otherIncomeType", v)}>
              <SelectTrigger><SelectValue placeholder="Select if applicable" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pension">Pension</SelectItem>
                <SelectItem value="rental">Rental Income</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="child_support">Child Support</SelectItem>
                <SelectItem value="government">Government Benefits</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {data.otherIncomeType && (
            <>
              <div>
                <Label>Other Income Amount</Label>
                <Input type="number" value={data.otherIncomeAmount} onChange={(e) => updateField("otherIncomeAmount", e.target.value)} placeholder="$0.00" />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={data.otherIncomeFrequency} onValueChange={(v) => updateField("otherIncomeFrequency", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.otherIncomeType === "other" && (
                <div>
                  <Label>Description</Label>
                  <Input value={data.otherIncomeDescription} onChange={(e) => updateField("otherIncomeDescription", e.target.value)} />
                </div>
              )}
            </>
          )}
          <div>
            <Label>Annual Total *</Label>
            <Input type="number" value={data.annualTotal} onChange={(e) => updateField("annualTotal", e.target.value)} placeholder="$0.00" className="bg-amber-50 font-semibold" />
          </div>
        </div>
      </section>
    </div>
  )
}

// =====================================================
// VEHICLE & FINANCING FORM
// =====================================================
interface VehicleFinancingFormProps {
  vehicleInfo: VehicleInfo
  setVehicleInfo: (v: VehicleInfo) => void
  tradeIn: TradeInInfo
  setTradeIn: (t: TradeInInfo) => void
  financingTerms: FinancingTerms
  setFinancingTerms: (f: FinancingTerms) => void
  financing: ReturnType<typeof calculateFinancing>
  additionalNotes: string
  setAdditionalNotes: (n: string) => void
}

function calculateFinancing(): { price: number; downPayment: number; netTrade: number; adminFee: number; tax: number; amountFinanced: number; payment: number; totalToRepay: number; totalInterest: number; totalPayments: number } {
  return { price: 0, downPayment: 0, netTrade: 0, adminFee: 0, tax: 0, amountFinanced: 0, payment: 0, totalToRepay: 0, totalInterest: 0, totalPayments: 0 }
}

function VehicleFinancingForm({ vehicleInfo, setVehicleInfo, tradeIn, setTradeIn, financingTerms, setFinancingTerms, financing, additionalNotes, setAdditionalNotes }: VehicleFinancingFormProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Vehicle Info */}
      <div className="space-y-6">
        <section>
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Vehicle Information
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>VIN (autofill available)</Label>
              <Input value={vehicleInfo.vin} onChange={(e) => setVehicleInfo({ ...vehicleInfo, vin: e.target.value })} placeholder="Enter 17-character VIN" />
            </div>
            <div>
              <Label>Year</Label>
              <Input value={vehicleInfo.year} onChange={(e) => setVehicleInfo({ ...vehicleInfo, year: e.target.value })} />
            </div>
            <div>
              <Label>Make</Label>
              <Input value={vehicleInfo.make} onChange={(e) => setVehicleInfo({ ...vehicleInfo, make: e.target.value })} />
            </div>
            <div>
              <Label>Model/Trim</Label>
              <Input value={vehicleInfo.model} onChange={(e) => setVehicleInfo({ ...vehicleInfo, model: e.target.value })} />
            </div>
            <div>
              <Label>Color</Label>
              <Input value={vehicleInfo.color} onChange={(e) => setVehicleInfo({ ...vehicleInfo, color: e.target.value })} />
            </div>
            <div>
              <Label>Current KMs</Label>
              <Input type="number" value={vehicleInfo.mileage} onChange={(e) => setVehicleInfo({ ...vehicleInfo, mileage: e.target.value })} />
            </div>
            <div>
              <Label>Total Price Before Tax</Label>
              <Input type="number" value={vehicleInfo.totalPrice} onChange={(e) => setVehicleInfo({ ...vehicleInfo, totalPrice: e.target.value })} className="bg-green-50" />
            </div>
            <div>
              <Label>Down Payment</Label>
              <Input type="number" value={vehicleInfo.downPayment} onChange={(e) => setVehicleInfo({ ...vehicleInfo, downPayment: e.target.value })} className="bg-green-50" />
            </div>
            <div>
              <Label>Max Down Payment If Needed</Label>
              <Input type="number" value={vehicleInfo.maxDownPayment} onChange={(e) => setVehicleInfo({ ...vehicleInfo, maxDownPayment: e.target.value })} />
            </div>
          </div>
        </section>
        
        <Separator />
        
        {/* Trade-In */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Checkbox
              id="hasTradeIn"
              checked={tradeIn.hasTradeIn}
              onCheckedChange={(checked) => setTradeIn({ ...tradeIn, hasTradeIn: checked as boolean })}
            />
            <Label htmlFor="hasTradeIn" className="font-medium cursor-pointer">Include Trade-in</Label>
          </div>
          
          {tradeIn.hasTradeIn && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="col-span-2">
                <Label>VIN</Label>
                <Input value={tradeIn.vin} onChange={(e) => setTradeIn({ ...tradeIn, vin: e.target.value })} />
              </div>
              <div>
                <Label>Year</Label>
                <Input value={tradeIn.year} onChange={(e) => setTradeIn({ ...tradeIn, year: e.target.value })} />
              </div>
              <div>
                <Label>Make</Label>
                <Input value={tradeIn.make} onChange={(e) => setTradeIn({ ...tradeIn, make: e.target.value })} />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={tradeIn.model} onChange={(e) => setTradeIn({ ...tradeIn, model: e.target.value })} />
              </div>
              <div>
                <Label>Mileage</Label>
                <Input type="number" value={tradeIn.mileage} onChange={(e) => setTradeIn({ ...tradeIn, mileage: e.target.value })} />
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={tradeIn.condition} onValueChange={(v) => setTradeIn({ ...tradeIn, condition: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimated Value</Label>
                <Input type="number" value={tradeIn.estimatedValue} onChange={(e) => setTradeIn({ ...tradeIn, estimatedValue: e.target.value })} />
              </div>
              <div className="col-span-2 flex items-center gap-3 mt-2">
                <Checkbox
                  id="hasLien"
                  checked={tradeIn.hasLien}
                  onCheckedChange={(checked) => setTradeIn({ ...tradeIn, hasLien: checked as boolean })}
                />
                <Label htmlFor="hasLien" className="cursor-pointer">Vehicle has existing lien</Label>
              </div>
              {tradeIn.hasLien && (
                <>
                  <div>
                    <Label>Lien Holder</Label>
                    <Input value={tradeIn.lienHolder} onChange={(e) => setTradeIn({ ...tradeIn, lienHolder: e.target.value })} />
                  </div>
                  <div>
                    <Label>Lien Amount</Label>
                    <Input type="number" value={tradeIn.lienAmount} onChange={(e) => setTradeIn({ ...tradeIn, lienAmount: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          )}
        </section>
        
        <Separator />
        
        {/* Additional Notes */}
        <section>
          <Label>Additional Notes</Label>
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any additional information for your application..."
            rows={3}
          />
        </section>
      </div>
      
      {/* Right Column - Financing */}
      <div className="space-y-6">
        <section className="bg-muted/30 rounded-xl p-6">
          <h4 className="font-semibold mb-4">Financing</h4>
          
          {/* Agreement Type */}
          <div className="mb-4">
            <Label className="text-xs uppercase text-muted-foreground">Agreement Type</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={financingTerms.agreementType === "finance" ? "default" : "outline"}
                onClick={() => setFinancingTerms({ ...financingTerms, agreementType: "finance" })}
                className="flex-1"
              >
                Finance
              </Button>
              <Button
                type="button"
                variant={financingTerms.agreementType === "cash" ? "default" : "outline"}
                onClick={() => setFinancingTerms({ ...financingTerms, agreementType: "cash" })}
                className="flex-1"
              >
                Cash (Out-the-Door)
              </Button>
            </div>
          </div>
          
          {financingTerms.agreementType === "finance" && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-xs">Sales Tax %</Label>
                  <Input value={financingTerms.salesTaxRate} onChange={(e) => setFinancingTerms({ ...financingTerms, salesTaxRate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Interest Rate %</Label>
                  <Input value={financingTerms.interestRate} onChange={(e) => setFinancingTerms({ ...financingTerms, interestRate: e.target.value })} placeholder="8.99" />
                </div>
              </div>
              
              <div className="mb-4">
                <Label className="text-xs">Admin Fee $</Label>
                <Input value={financingTerms.adminFee} onChange={(e) => setFinancingTerms({ ...financingTerms, adminFee: e.target.value })} />
              </div>
              
              {/* Loan Term */}
              <div className="mb-4">
                <Label className="text-xs uppercase text-muted-foreground">Loan Term (Months)</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[24, 36, 48, 60, 72, 84, 96].map((term) => (
                    <Button
                      key={term}
                      type="button"
                      size="sm"
                      variant={financingTerms.loanTermMonths === term ? "default" : "outline"}
                      onClick={() => setFinancingTerms({ ...financingTerms, loanTermMonths: term })}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Payment Frequency */}
              <div className="mb-6">
                <Label className="text-xs uppercase text-muted-foreground">Payment Frequency</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[
                    { value: "weekly", label: "Weekly" },
                    { value: "bi-weekly", label: "Bi-Weekly" },
                    { value: "semi-monthly", label: "Semi-Mo" },
                    { value: "monthly", label: "Monthly" },
                  ].map((freq) => (
                    <Button
                      key={freq.value}
                      type="button"
                      size="sm"
                      variant={financingTerms.paymentFrequency === freq.value ? "default" : "outline"}
                      onClick={() => setFinancingTerms({ ...financingTerms, paymentFrequency: freq.value as any })}
                    >
                      {freq.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Loan Breakdown */}
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle Price:</span>
                  <span>${financing.price.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Admin Fee:</span>
                  <span>${financing.adminFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales Tax ({financingTerms.salesTaxRate}%):</span>
                  <span>+${financing.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Down Payment:</span>
                  <span>-${financing.downPayment.toLocaleString()}</span>
                </div>
                {financing.netTrade > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Trade Value:</span>
                    <span>-${financing.netTrade.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Amount Financed:</span>
                  <span>${financing.amountFinanced.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Total Cost */}
              <div className="mt-4 p-4 bg-background rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">TOTAL COST</div>
                <div className="flex justify-between text-sm">
                  <span>{financing.totalPayments.toFixed(0)} payments x ${financing.payment.toFixed(2)}:</span>
                  <span>${financing.totalToRepay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total to Repay:</span>
                  <span>${financing.totalToRepay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Interest:</span>
                  <span>${financing.totalInterest.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Payment Display */}
              <div className="mt-4 p-6 bg-primary/10 rounded-xl text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  {financingTerms.paymentFrequency === "bi-weekly" ? "Bi-Weekly" : 
                   financingTerms.paymentFrequency === "weekly" ? "Weekly" :
                   financingTerms.paymentFrequency === "semi-monthly" ? "Semi-Monthly" : "Monthly"} Payment
                </div>
                <div className="text-4xl font-bold text-primary">
                  ${financing.payment.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {financingTerms.loanTermMonths} months @ {financingTerms.interestRate || "0"}% APR
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

// =====================================================
// REVIEW STEP
// =====================================================
interface ReviewStepProps {
  primaryApplicant: ApplicantData
  coApplicant: ApplicantData | null
  vehicleInfo: VehicleInfo
  tradeIn: TradeInInfo
  financingTerms: FinancingTerms
  financing: any
}

function ReviewStep({ primaryApplicant, coApplicant, vehicleInfo, tradeIn, financingTerms, financing }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <p className="text-sm text-amber-800">Please review all information carefully before submitting.</p>
      </div>
      
      {/* Primary Applicant Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Primary Applicant</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{primaryApplicant.firstName} {primaryApplicant.lastName}</span></div>
          <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{primaryApplicant.phone}</span></div>
          <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{primaryApplicant.email}</span></div>
          <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{primaryApplicant.streetNumber} {primaryApplicant.streetName}, {primaryApplicant.city}</span></div>
          <div><span className="text-muted-foreground">Employer:</span> <span className="font-medium">{primaryApplicant.employerName}</span></div>
          <div><span className="text-muted-foreground">Annual Income:</span> <span className="font-medium">${primaryApplicant.annualTotal}</span></div>
          <div><span className="text-muted-foreground">Credit Rating:</span> <span className="font-medium capitalize">{primaryApplicant.creditRating}</span></div>
        </CardContent>
      </Card>
      
      {/* Co-Applicant Summary */}
      {coApplicant && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Co-Applicant</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{coApplicant.firstName} {coApplicant.lastName}</span></div>
            <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{coApplicant.phone}</span></div>
            <div><span className="text-muted-foreground">Employer:</span> <span className="font-medium">{coApplicant.employerName}</span></div>
            <div><span className="text-muted-foreground">Annual Income:</span> <span className="font-medium">${coApplicant.annualTotal}</span></div>
          </CardContent>
        </Card>
      )}
      
      {/* Vehicle Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vehicle & Financing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}</span></div>
          <div><span className="text-muted-foreground">Price:</span> <span className="font-medium">${parseFloat(vehicleInfo.totalPrice).toLocaleString()}</span></div>
          <div><span className="text-muted-foreground">Down Payment:</span> <span className="font-medium">${parseFloat(vehicleInfo.downPayment).toLocaleString()}</span></div>
          <div><span className="text-muted-foreground">Term:</span> <span className="font-medium">{financingTerms.loanTermMonths} months</span></div>
          <div><span className="text-muted-foreground">Payment:</span> <span className="font-medium">${financing.payment.toFixed(2)}/{financingTerms.paymentFrequency}</span></div>
          <div><span className="text-muted-foreground">Amount Financed:</span> <span className="font-medium">${financing.amountFinanced.toLocaleString()}</span></div>
        </CardContent>
      </Card>
      
      {/* Trade-In Summary */}
      {tradeIn.hasTradeIn && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Trade-In Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{tradeIn.year} {tradeIn.make} {tradeIn.model}</span></div>
            <div><span className="text-muted-foreground">Value:</span> <span className="font-medium">${parseFloat(tradeIn.estimatedValue).toLocaleString()}</span></div>
            {tradeIn.hasLien && (
              <div><span className="text-muted-foreground">Lien:</span> <span className="font-medium">${parseFloat(tradeIn.lienAmount).toLocaleString()}</span></div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// =====================================================
// DOCUMENTS STEP
// =====================================================
interface DocumentsStepProps {
  documents: DocumentUpload[]
  setDocuments: (d: DocumentUpload[]) => void
  onSubmit: () => void
  isSubmitting: boolean
}

function DocumentsStep({ documents, setDocuments, onSubmit, isSubmitting }: DocumentsStepProps) {
  const documentTypes = [
    { value: "drivers_license", label: "Driver's License", required: true },
    { value: "proof_of_income", label: "Proof of Income (Pay Stub/T4)", required: true },
    { value: "proof_of_address", label: "Proof of Address (Utility Bill)", required: false },
    { value: "void_cheque", label: "Void Cheque", required: false },
  ]
  
  const handleFileChange = (type: string, file: File | null) => {
    const existing = documents.find(d => d.type === type)
    if (existing) {
      setDocuments(documents.map(d => d.type === type ? { ...d, file } : d))
    } else {
      setDocuments([...documents, { type, name: file?.name || "", file }])
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload Verification Documents</h3>
        <p className="text-sm text-muted-foreground">
          Please upload the following documents to verify your identity and income.
        </p>
      </div>
      
      <div className="grid gap-4">
        {documentTypes.map((docType) => {
          const uploaded = documents.find(d => d.type === docType.value)
          return (
            <div key={docType.value} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  uploaded?.file ? "bg-green-100" : "bg-muted"
                )}>
                  {uploaded?.file ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{docType.label}</p>
                  {uploaded?.file && (
                    <p className="text-sm text-muted-foreground">{uploaded.file.name}</p>
                  )}
                </div>
              </div>
              <div>
                <input
                  type="file"
                  id={docType.value}
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(docType.value, e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant={uploaded?.file ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => document.getElementById(docType.value)?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploaded?.file ? "Replace" : "Upload"}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Your documents are secure</p>
          <p className="text-muted-foreground">
            All uploaded documents are encrypted and stored securely. They will only be used for verification purposes.
          </p>
        </div>
      </div>
    </div>
  )
}
