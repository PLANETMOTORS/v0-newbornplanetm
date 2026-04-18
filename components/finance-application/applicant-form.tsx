"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { User, MapPin, Home, Briefcase, DollarSign } from "lucide-react"
import type { ApplicantData } from "./types"
import { PostalCodeInput } from "./postal-code-input"

interface ApplicantFormProps {
  title: string
  description: string
  data: ApplicantData
  onChange: (data: ApplicantData) => void
  isPrimary: boolean
  validationErrors?: string[]
}

export
function ApplicantForm({ title, description, data, onChange, isPrimary: _isPrimary, validationErrors = [] }: ApplicantFormProps) {
  const updateField = (field: keyof ApplicantData, value: string | boolean | { day: string; month: string; year: string }) => {
    onChange({ ...data, [field]: value })
  }
  
  // Helper to check if a field has an error
  const hasFieldError = (fieldName: string): boolean => {
    return validationErrors.some(err => 
      err.toLowerCase().includes(fieldName.toLowerCase())
    )
  }
  
  // Get error class for inputs
  const getInputErrorClass = (fieldName: string): string => {
    return hasFieldError(fieldName) ? "border-destructive ring-1 ring-destructive bg-destructive/5" : ""
  }
  
  // Get error class for labels
  const getLabelClass = (fieldName: string): string => {
    return hasFieldError(fieldName) ? "text-destructive font-medium" : ""
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
            <Label htmlFor="salutation">Salutation</Label>
            <Select value={data.salutation} onValueChange={(v) => updateField("salutation", v)}>
              <SelectTrigger id="salutation"><SelectValue placeholder="Select" /></SelectTrigger>
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
            <Label htmlFor="firstName" className={getLabelClass("First Name")}>First Name *</Label>
            <Input id="firstName" value={data.firstName} onChange={(e) => updateField("firstName", e.target.value)} required className={getInputErrorClass("First Name")} />
          </div>
          <div>
            <Label htmlFor="middleName">Middle Name</Label>
            <Input id="middleName" value={data.middleName} onChange={(e) => updateField("middleName", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="lastName" className={getLabelClass("Last Name")}>Last Name *</Label>
            <Input id="lastName" value={data.lastName} onChange={(e) => updateField("lastName", e.target.value)} required className={getInputErrorClass("Last Name")} />
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
            <Label className={getLabelClass("Date of Birth")}>Date of Birth *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={data.dateOfBirth.day} onValueChange={(v) => updateField("dateOfBirth", { ...data.dateOfBirth, day: v })}>
                <SelectTrigger className={getInputErrorClass("Date of Birth")}><SelectValue placeholder="Day" /></SelectTrigger>
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
            <Label className={getLabelClass("Gender")}>Gender *</Label>
            <Select value={data.gender} onValueChange={(v) => updateField("gender", v)}>
              <SelectTrigger className={getInputErrorClass("Gender")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={getLabelClass("Marital Status")}>Marital Status *</Label>
            <Select value={data.maritalStatus} onValueChange={(v) => updateField("maritalStatus", v)}>
              <SelectTrigger className={getInputErrorClass("Marital Status")}><SelectValue placeholder="Select" /></SelectTrigger>
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
            <Label className={getLabelClass("Phone")}>Phone * <span className="text-xs text-primary font-medium">(3-digit area + 7-digit number)</span></Label>
            <Input 
              type="tel" 
              value={data.phone} 
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                const formatted = digits.length <= 3 ? digits :
                  digits.length <= 6 ? `(${digits.slice(0, 3)}) ${digits.slice(3)}` :
                  `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
                updateField("phone", formatted)
              }} 
              placeholder="(XXX) XXX-XXXX" 
              className={getInputErrorClass("Phone")}
            />
          </div>
          <div>
            <Label>Mobile Phone</Label>
            <Input 
              type="tel" 
              value={data.mobilePhone} 
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                const formatted = digits.length <= 3 ? digits :
                  digits.length <= 6 ? `(${digits.slice(0, 3)}) ${digits.slice(3)}` :
                  `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
                updateField("mobilePhone", formatted)
              }} 
              placeholder="(XXX) XXX-XXXX" 
            />
          </div>
          <div>
            <Label htmlFor="email" className={getLabelClass("Email")}>Email *</Label>
            <Input id="email" type="email" value={data.email} onChange={(e) => updateField("email", e.target.value)} className={getInputErrorClass("Email")} />
          </div>
          <div>
            <Label className={getLabelClass("Credit Rating")}>Credit Rating *</Label>
            <Select value={data.creditRating} onValueChange={(v) => updateField("creditRating", v)}>
              <SelectTrigger className={getInputErrorClass("Credit Rating")}><SelectValue placeholder="Select rating" /></SelectTrigger>
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
          <PostalCodeInput
            value={data.postalCode}
            onChange={(postalCode, addressData) => {
              const newData = {
                ...data,
                postalCode,
                ...(addressData?.city && { city: addressData.city }),
                ...(addressData?.province && { province: addressData.province }),
                ...(addressData?.streetName && { streetName: addressData.streetName }),
                ...(addressData?.streetType && { streetType: addressData.streetType }),
                ...(addressData?.direction && { streetDirection: addressData.direction }),
              }
              onChange(newData)
            }}
          />
<div>
  <Label className={getLabelClass("Address Type")}>Address Type *</Label>
  <Select value={data.addressType} onValueChange={(v) => updateField("addressType", v)}>
  <SelectTrigger className={getInputErrorClass("Address Type")}><SelectValue placeholder="Select" /></SelectTrigger>
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
  <Label className={getLabelClass("Street Number")}>Street Number *</Label>
  <Input value={data.streetNumber} onChange={(e) => updateField("streetNumber", e.target.value)} className={getInputErrorClass("Street Number")} />
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
            <Label>City * <span className="text-xs text-muted-foreground">(from postal code)</span></Label>
            <Input 
              value={data.city} 
              onChange={(e) => updateField("city", e.target.value)}
              readOnly={Boolean(data.city && data.postalCode.length >= 6)}
              className={data.city && data.postalCode.length >= 6 ? "bg-muted" : ""}
            />
          </div>
          <div>
            <Label>Province * <span className="text-xs text-muted-foreground">(from postal code)</span></Label>
            <Input 
              value={data.province} 
              readOnly={Boolean(data.province && data.postalCode.length >= 6)}
              className={data.province && data.postalCode.length >= 6 ? "bg-muted" : ""}
            />
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
            <Label className={getLabelClass("Home Status")}>Home Status *</Label>
            <Select value={data.homeStatus} onValueChange={(v) => updateField("homeStatus", v)}>
              <SelectTrigger className={getInputErrorClass("Home Status")}><SelectValue placeholder="Select" /></SelectTrigger>
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
            <Label className={getLabelClass("Monthly Payment")}>Monthly Payment *</Label>
            <Input type="number" value={data.monthlyPayment} onChange={(e) => updateField("monthlyPayment", e.target.value)} placeholder="$0.00" className={getInputErrorClass("Monthly Payment")} />
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
            <Label className={getLabelClass("Employment Type")}>Employment Type *</Label>
            <Select value={data.employmentCategory} onValueChange={(v) => updateField("employmentCategory", v)}>
              <SelectTrigger className={getInputErrorClass("Employment Type")}><SelectValue placeholder="Select" /></SelectTrigger>
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
            <Label className={getLabelClass("Employment Status")}>Status *</Label>
            <Select value={data.employmentStatus} onValueChange={(v) => updateField("employmentStatus", v)}>
              <SelectTrigger className={getInputErrorClass("Employment Status")}><SelectValue placeholder="Select" /></SelectTrigger>
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
            <Label className={getLabelClass("Employer Name")}>Employer Name *</Label>
            <Input value={data.employerName} onChange={(e) => updateField("employerName", e.target.value)} className={getInputErrorClass("Employer Name")} />
          </div>
          <div>
            <Label className={getLabelClass("Occupation")}>Occupation *</Label>
            <Input value={data.occupation} onChange={(e) => updateField("occupation", e.target.value)} className={getInputErrorClass("Occupation")} />
          </div>
          <div>
            <Label>Job Title</Label>
            <Input value={data.jobTitle} onChange={(e) => updateField("jobTitle", e.target.value)} />
          </div>
<div>
  <Label>Employer Phone * <span className="text-xs text-primary font-medium">(3-digit area + 7-digit number)</span></Label>
  <div className="flex gap-2">
  <Input 
    type="tel" 
    value={data.employerPhone} 
    onChange={(e) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
      const formatted = digits.length <= 3 ? digits :
        digits.length <= 6 ? `(${digits.slice(0, 3)}) ${digits.slice(3)}` :
        `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
      updateField("employerPhone", formatted)
    }} 
    placeholder="(XXX) XXX-XXXX"
    className="flex-1" 
  />
              <Input value={data.employerPhoneExt} onChange={(e) => updateField("employerPhoneExt", e.target.value)} placeholder="Ext." className="w-20" />
            </div>
          </div>
          <PostalCodeInput
            value={data.employerPostalCode}
            label="Employer Postal Code *"
            onChange={(postalCode, addressData) => {
              onChange({
                ...data,
                employerPostalCode: postalCode,
                ...(addressData?.city && { employerCity: addressData.city }),
                ...(addressData?.province && { employerProvince: addressData.province }),
              })
            }}
          />
          <div className="md:col-span-2">
            <Label>Employer Address</Label>
            <Input value={data.employerStreet} onChange={(e) => updateField("employerStreet", e.target.value)} placeholder="Street address" />
          </div>
          <div>
            <Label>City <span className="text-xs text-muted-foreground">(from postal code)</span></Label>
            <Input 
              value={data.employerCity} 
              onChange={(e) => updateField("employerCity", e.target.value)}
              readOnly={Boolean(data.employerCity && data.employerPostalCode.length >= 6)}
              className={data.employerCity && data.employerPostalCode.length >= 6 ? "bg-muted" : ""}
            />
          </div>
          <div>
            <Label>Province <span className="text-xs text-muted-foreground">(from postal code)</span></Label>
            <Input 
              value={data.employerProvince} 
              readOnly={Boolean(data.employerProvince && data.employerPostalCode.length >= 6)}
              className={data.employerProvince && data.employerPostalCode.length >= 6 ? "bg-muted" : ""}
            />
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
            <Label className={getLabelClass("Gross Income")}>Gross Income *</Label>
            <Input type="number" value={data.grossIncome} onChange={(e) => updateField("grossIncome", e.target.value)} placeholder="$0.00" className={getInputErrorClass("Gross Income")} />
          </div>
          <div>
            <Label className={getLabelClass("Income Frequency")}>Income Frequency *</Label>
            <Select value={data.incomeFrequency} onValueChange={(v) => updateField("incomeFrequency", v)}>
              <SelectTrigger className={getInputErrorClass("Income Frequency")}><SelectValue placeholder="Select" /></SelectTrigger>
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
            <Label>Annual Total * <span className="text-xs text-muted-foreground">(Auto-calculated)</span></Label>
            <Input 
              type="text" 
              value={data.annualTotal ? `$${parseFloat(data.annualTotal).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"} 
              readOnly 
              className="bg-amber-50 font-semibold" 
            />
          </div>
        </div>
      </section>
    </div>
  )
}
