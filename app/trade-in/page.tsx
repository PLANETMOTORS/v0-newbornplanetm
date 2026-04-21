"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import {
  Car, CreditCard, Search, CheckCircle, ArrowRight, DollarSign, Shield,
  Camera, Upload, Zap, TrendingUp, Star, Truck,
  AlertCircle, Sparkles, Target, Award, ThumbsUp
} from "lucide-react"
import { TradeInPageJsonLd } from "@/components/seo/json-ld"
import {
  isValidEmail,
  isValidCanadianPhoneNumber,
  isValidCanadianPostalCode,
  formatCanadianPhoneNumber,
  formatCanadianPostalCode,
  ValidationMessages
} from "@/lib/validation"
import { useAuth } from "@/contexts/auth-context"
import { AuthRequiredModal } from "@/components/auth-required-modal"

// Vehicle makes with models
const vehicleMakes = {
  "Acura": ["ILX", "Integra", "MDX", "NSX", "RDX", "TLX"],
  "Audi": ["A3", "A4", "A5", "A6", "A7", "A8", "e-tron", "Q3", "Q5", "Q7", "Q8", "RS6", "S4"],
  "BMW": ["2 Series", "3 Series", "4 Series", "5 Series", "7 Series", "X1", "X3", "X5", "X7", "iX", "i4"],
  "Chevrolet": ["Blazer", "Bolt", "Camaro", "Colorado", "Corvette", "Equinox", "Malibu", "Silverado", "Suburban", "Tahoe", "Traverse"],
  "Ford": ["Bronco", "Edge", "Escape", "Explorer", "F-150", "Maverick", "Mustang", "Ranger"],
  "Honda": ["Accord", "Civic", "CR-V", "HR-V", "Odyssey", "Passport", "Pilot", "Ridgeline"],
  "Hyundai": ["Elantra", "Ioniq 5", "Ioniq 6", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson"],
  "Jeep": ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Wagoneer", "Wrangler"],
  "Kia": ["EV6", "Forte", "K5", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
  "Lexus": ["ES", "GX", "IS", "LC", "LS", "LX", "NX", "RX", "TX", "UX"],
  "Mazda": ["CX-30", "CX-5", "CX-50", "CX-9", "CX-90", "Mazda3", "MX-5 Miata"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "G-Class", "GLA", "GLC", "GLE", "GLS", "S-Class", "EQE", "EQS"],
  "Nissan": ["Altima", "Ariya", "Frontier", "Kicks", "Leaf", "Murano", "Pathfinder", "Rogue", "Sentra", "Titan", "Z"],
  "Porsche": ["911", "Boxster", "Cayenne", "Cayman", "Macan", "Panamera", "Taycan"],
  "Ram": ["1500", "2500", "3500"],
  "Subaru": ["Ascent", "Crosstrek", "Forester", "Impreza", "Legacy", "Outback", "Solterra", "WRX"],
  "Tesla": ["Model 3", "Model S", "Model X", "Model Y", "Cybertruck"],
  "Toyota": ["4Runner", "bZ4X", "Camry", "Corolla", "GR86", "Highlander", "Prius", "RAV4", "Sequoia", "Sienna", "Supra", "Tacoma", "Tundra", "Venza"],
  "Volkswagen": ["Atlas", "Golf", "GTI", "ID.4", "Jetta", "Taos", "Tiguan"],
  "Volvo": ["C40", "S60", "S90", "V60", "V90", "XC40", "XC60", "XC90"],
}

// Vehicle trims by model
const vehicleTrims: Record<string, string[]> = {
  // Acura
  "ILX": ["Base", "Premium", "A-Spec", "Technology"],
  "Integra": ["Base", "A-Spec", "A-Spec Technology"],
  "MDX": ["Base", "Technology", "A-Spec", "Advance", "Type S"],
  "NSX": ["Base", "Type S"],
  "RDX": ["Base", "Technology", "A-Spec", "Advance"],
  "TLX": ["Base", "Technology", "A-Spec", "Advance", "Type S"],
  // Audi
  "A3": ["Premium", "Premium Plus", "Prestige"],
  "A4": ["Premium", "Premium Plus", "Prestige", "S Line"],
  "A5": ["Premium", "Premium Plus", "Prestige"],
  "A6": ["Premium", "Premium Plus", "Prestige"],
  "A7": ["Premium", "Premium Plus", "Prestige"],
  "A8": ["Base", "L"],
  "e-tron": ["Premium", "Premium Plus", "Prestige"],
  "Q3": ["Premium", "Premium Plus", "Prestige"],
  "Q5": ["Premium", "Premium Plus", "Prestige", "S Line"],
  "Q7": ["Premium", "Premium Plus", "Prestige"],
  "Q8": ["Premium", "Premium Plus", "Prestige"],
  "RS6": ["Avant"],
  "S4": ["Premium Plus", "Prestige"],
  // BMW
  "2 Series": ["228i", "230i", "M235i", "M240i"],
  "3 Series": ["330i", "330i xDrive", "M340i", "M340i xDrive"],
  "4 Series": ["430i", "430i xDrive", "M440i", "M440i xDrive"],
  "5 Series": ["530i", "530i xDrive", "540i", "540i xDrive", "M550i"],
  "7 Series": ["740i", "740i xDrive", "760i xDrive"],
  "X1": ["sDrive28i", "xDrive28i"],
  "X3": ["sDrive30i", "xDrive30i", "M40i"],
  "X5": ["sDrive40i", "xDrive40i", "xDrive45e", "M50i"],
  "X7": ["xDrive40i", "M60i"],
  "iX": ["xDrive40", "xDrive50", "M60"],
  "i4": ["eDrive35", "eDrive40", "M50"],
  // Chevrolet
  "Blazer": ["2LT", "3LT", "RS", "Premier"],
  "Bolt": ["1LT", "2LT"],
  "Camaro": ["1LS", "1LT", "2LT", "3LT", "1SS", "2SS", "ZL1"],
  "Colorado": ["WT", "LT", "Z71", "ZR2"],
  "Corvette": ["1LT", "2LT", "3LT", "Z06", "Z51"],
  "Equinox": ["LS", "LT", "RS", "Premier"],
  "Malibu": ["LS", "RS", "LT", "Premier"],
  "Silverado": ["Work Truck", "Custom", "LT", "RST", "LTZ", "High Country"],
  "Suburban": ["LS", "LT", "RST", "Z71", "Premier", "High Country"],
  "Tahoe": ["LS", "LT", "RST", "Z71", "Premier", "High Country"],
  "Traverse": ["LS", "LT", "RS", "Premier", "High Country"],
  // Ford
  "Bronco": ["Base", "Big Bend", "Black Diamond", "Outer Banks", "Badlands", "Wildtrak"],
  "Edge": ["SE", "SEL", "ST-Line", "Titanium", "ST"],
  "Escape": ["S", "SE", "SEL", "Titanium", "ST-Line"],
  "Explorer": ["Base", "XLT", "Limited", "ST", "Platinum", "King Ranch"],
  "F-150": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Raptor"],
  "Maverick": ["XL", "XLT", "Lariat"],
  "Mustang": ["EcoBoost", "EcoBoost Premium", "GT", "GT Premium", "Mach 1", "Shelby GT500"],
  "Ranger": ["XL", "XLT", "Lariat"],
  // Honda
  "Accord": ["LX", "EX", "EX-L", "Sport", "Sport SE", "Touring"],
  "Civic": ["LX", "Sport", "EX", "EX-L", "Touring", "Si", "Type R"],
  "CR-V": ["LX", "EX", "EX-L", "Touring", "Hybrid"],
  "HR-V": ["LX", "Sport", "EX-L"],
  "Odyssey": ["LX", "EX", "EX-L", "Touring", "Elite"],
  "Passport": ["Sport", "EX-L", "TrailSport", "Elite"],
  "Pilot": ["LX", "EX", "EX-L", "Touring", "Elite", "TrailSport", "Black Edition"],
  "Ridgeline": ["Sport", "RTL", "RTL-E", "Black Edition"],
  // Hyundai
  "Elantra": ["SE", "SEL", "N Line", "Limited", "N"],
  "Ioniq 5": ["SE", "SEL", "Limited"],
  "Ioniq 6": ["SE", "SEL", "Limited"],
  "Kona": ["SE", "SEL", "N Line", "Limited", "N"],
  "Palisade": ["SE", "SEL", "XRT", "Limited", "Calligraphy"],
  "Santa Fe": ["SE", "SEL", "XRT", "Limited", "Calligraphy"],
  "Sonata": ["SE", "SEL", "SEL Plus", "N Line", "Limited"],
  "Tucson": ["SE", "SEL", "XRT", "N Line", "Limited"],
  // Jeep
  "Cherokee": ["Latitude", "Latitude Plus", "Limited", "Trailhawk"],
  "Compass": ["Sport", "Latitude", "Limited", "Trailhawk"],
  "Gladiator": ["Sport", "Sport S", "Overland", "Rubicon", "Mojave"],
  "Grand Cherokee": ["Laredo", "Limited", "Overland", "Summit", "Trailhawk"],
  "Wagoneer": ["Series I", "Series II", "Series III"],
  "Wrangler": ["Sport", "Sport S", "Sahara", "Rubicon", "High Altitude"],
  // Kia
  "EV6": ["Light", "Wind", "GT-Line", "GT"],
  "Forte": ["FE", "LXS", "GT-Line", "GT"],
  "K5": ["LXS", "GT-Line", "EX", "GT"],
  "Seltos": ["LX", "S", "EX", "SX", "SX Turbo"],
  "Sorento": ["LX", "S", "EX", "SX", "SX Prestige", "X-Line"],
  "Soul": ["LX", "S", "EX", "GT-Line", "Turbo"],
  "Sportage": ["LX", "EX", "SX", "SX Prestige", "X-Line", "X-Pro"],
  "Stinger": ["GT-Line", "GT1", "GT2"],
  "Telluride": ["LX", "S", "EX", "SX", "SX Prestige", "X-Line", "X-Pro"],
  // Lexus
  "ES": ["ES 250", "ES 300h", "ES 350", "ES 350 F Sport"],
  "GX": ["Base", "Luxury", "Premium"],
  "IS": ["IS 300", "IS 350", "IS 500 F Sport"],
  "LC": ["LC 500", "LC 500h"],
  "LS": ["LS 500", "LS 500h"],
  "LX": ["Base", "Luxury"],
  "NX": ["NX 250", "NX 350", "NX 350h", "NX 450h+"],
  "RX": ["RX 350", "RX 350h", "RX 450h+", "RX 500h F Sport"],
  "TX": ["TX 350", "TX 500h", "TX 550h+"],
  "UX": ["UX 200", "UX 250h"],
  // Mazda
  "CX-30": ["Base", "Select", "Preferred", "Premium", "Turbo", "Turbo Premium Plus"],
  "CX-5": ["Sport", "Select", "Preferred", "Premium", "Premium Plus", "Turbo", "Signature"],
  "CX-50": ["Select", "Preferred", "Premium", "Premium Plus", "Turbo", "Turbo Meridian"],
  "CX-9": ["Sport", "Touring", "Carbon Edition", "Grand Touring", "Signature"],
  "CX-90": ["Select", "Preferred", "Premium", "Premium Plus", "PHEV Premium Plus"],
  "Mazda3": ["Base", "Select", "Preferred", "Carbon Edition", "Premium", "Turbo", "Turbo Premium Plus"],
  "MX-5 Miata": ["Sport", "Club", "Grand Touring"],
  // Mercedes-Benz
  "A-Class": ["A 220", "A 220 4MATIC", "AMG A 35"],
  "C-Class": ["C 300", "C 300 4MATIC", "AMG C 43", "AMG C 63"],
  "E-Class": ["E 350", "E 350 4MATIC", "E 450", "AMG E 53", "AMG E 63 S"],
  "G-Class": ["G 550", "AMG G 63"],
  "GLA": ["GLA 250", "GLA 250 4MATIC", "AMG GLA 35", "AMG GLA 45"],
  "GLC": ["GLC 300", "GLC 300 4MATIC", "AMG GLC 43", "AMG GLC 63"],
  "GLE": ["GLE 350", "GLE 350 4MATIC", "GLE 450", "GLE 580", "AMG GLE 53", "AMG GLE 63 S"],
  "GLS": ["GLS 450", "GLS 580", "AMG GLS 63"],
  "S-Class": ["S 500", "S 500 4MATIC", "S 580", "S 580 4MATIC", "AMG S 63"],
  "EQE": ["EQE 350", "EQE 350+", "EQE 500 4MATIC", "AMG EQE 43", "AMG EQE 53"],
  "EQS": ["EQS 450+", "EQS 450 4MATIC", "EQS 580 4MATIC", "AMG EQS 53"],
  // Nissan
  "Altima": ["S", "SV", "SR", "SL", "Platinum"],
  "Ariya": ["Engage", "Venture+", "Evolve+", "Premiere"],
  "Frontier": ["S", "SV", "PRO-4X", "PRO-X"],
  "Kicks": ["S", "SV", "SR"],
  "Leaf": ["S", "SV Plus"],
  "Murano": ["S", "SV", "SL", "Platinum"],
  "Pathfinder": ["S", "SV", "SL", "Platinum", "Rock Creek"],
  "Rogue": ["S", "SV", "SL", "Platinum"],
  "Sentra": ["S", "SV", "SR"],
  "Titan": ["S", "SV", "PRO-4X", "Platinum Reserve"],
  "Z": ["Sport", "Performance"],
  // Porsche
  "911": ["Carrera", "Carrera S", "Carrera 4S", "Turbo", "Turbo S", "GT3"],
  "Boxster": ["Base", "S", "GTS", "Spyder"],
  "Cayenne": ["Base", "S", "E-Hybrid", "GTS", "Turbo", "Turbo GT"],
  "Cayman": ["Base", "S", "GTS", "GT4"],
  "Macan": ["Base", "S", "GTS", "Turbo"],
  "Panamera": ["Base", "4", "4S", "GTS", "Turbo", "Turbo S"],
  "Taycan": ["Base", "4S", "GTS", "Turbo", "Turbo S"],
  // Ram
  "1500": ["Tradesman", "Big Horn", "Laramie", "Rebel", "Limited", "TRX"],
  "2500": ["Tradesman", "Big Horn", "Laramie", "Power Wagon", "Limited"],
  "3500": ["Tradesman", "Big Horn", "Laramie", "Limited"],
  // Subaru
  "Ascent": ["Base", "Premium", "Limited", "Touring", "Onyx Edition"],
  "Crosstrek": ["Base", "Premium", "Sport", "Limited"],
  "Forester": ["Base", "Premium", "Sport", "Limited", "Touring", "Wilderness"],
  "Impreza": ["Base", "Premium", "Sport", "Limited"],
  "Legacy": ["Base", "Premium", "Sport", "Limited", "Touring"],
  "Outback": ["Base", "Premium", "Limited", "Touring", "Onyx Edition XT", "Wilderness"],
  "Solterra": ["Premium", "Limited", "Touring"],
  "WRX": ["Base", "Premium", "Limited", "GT"],
  // Tesla
  "Model 3": ["Standard Range Plus", "Long Range", "Performance"],
  "Model S": ["Long Range", "Plaid"],
  "Model X": ["Long Range", "Plaid"],
  "Model Y": ["Standard Range", "Long Range", "Performance"],
  "Cybertruck": ["Single Motor", "Dual Motor", "Tri Motor", "Cyberbeast"],
  // Toyota
  "4Runner": ["SR5", "SR5 Premium", "TRD Sport", "TRD Off-Road", "TRD Off-Road Premium", "Limited", "TRD Pro"],
  "bZ4X": ["XLE", "Limited"],
  "Camry": ["LE", "SE", "SE Nightshade", "XLE", "XSE", "TRD"],
  "Corolla": ["L", "LE", "SE", "XLE", "XSE", "Apex Edition"],
  "GR86": ["Base", "Premium"],
  "Highlander": ["L", "LE", "XLE", "Limited", "Platinum", "Bronze Edition"],
  "Prius": ["LE", "XLE", "Limited"],
  "RAV4": ["LE", "XLE", "XLE Premium", "Adventure", "TRD Off-Road", "Limited"],
  "Sequoia": ["SR5", "Limited", "Platinum", "TRD Pro", "Capstone"],
  "Sienna": ["LE", "XLE", "XSE", "Limited", "Platinum"],
  "Supra": ["2.0", "3.0", "3.0 Premium", "A91 Edition"],
  "Tacoma": ["SR", "SR5", "TRD Sport", "TRD Off-Road", "Limited", "TRD Pro"],
  "Tundra": ["SR", "SR5", "Limited", "Platinum", "1794 Edition", "TRD Pro", "Capstone"],
  "Venza": ["LE", "XLE", "Limited"],
  // Volkswagen
  "Atlas": ["S", "SE", "SE with Technology", "SEL", "SEL Premium"],
  "Golf": ["S", "SE", "R-Line"],
  "GTI": ["S", "SE", "Autobahn"],
  "ID.4": ["Standard", "Pro", "Pro S", "Pro S Plus"],
  "Jetta": ["S", "Sport", "SE", "SEL"],
  "Taos": ["S", "SE", "SEL"],
  "Tiguan": ["S", "SE", "SE R-Line", "SEL", "SEL R-Line"],
  // Volvo
  "C40": ["Core", "Plus", "Ultimate", "Recharge"],
  "S60": ["Core", "Plus", "Ultimate", "Polestar Engineered"],
  "S90": ["Core", "Plus", "Ultimate"],
  "V60": ["Core", "Plus", "Ultimate", "Polestar Engineered"],
  "V90": ["Core", "Plus", "Ultimate"],
  "XC40": ["Core", "Plus", "Ultimate", "Recharge"],
  "XC60": ["Core", "Plus", "Ultimate", "Polestar Engineered"],
  "XC90": ["Core", "Plus", "Ultimate"],
  // Default fallback
  "default": ["Base", "Standard", "Premium", "Luxury", "Sport", "Limited"]
}

const conditionOptions = [
  { value: "excellent", label: "Excellent", description: "Like new, no visible wear, all features work perfectly", multiplier: 1.1 },
  { value: "good", label: "Good", description: "Minor wear, small scratches, everything functions properly", multiplier: 1.0 },
  { value: "fair", label: "Fair", description: "Noticeable wear, some cosmetic issues, may need minor repairs", multiplier: 0.9 },
  { value: "poor", label: "Poor", description: "Significant wear, mechanical or body issues, needs work", multiplier: 0.75 },
]

const TRADE_IN_DRAFT_KEY = "pm:trade-in-draft"

function TradeInContent() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [step, setStep] = useState(1)
  const draftLoadedRef = useRef(false)

  // Ref for step content area to scroll to
  const stepContentRef = useRef<HTMLDivElement>(null)
  
  // Helper function to change step and scroll to content
  const goToStep = (newStep: number) => {
    setStep(newStep)
    // Scroll to step content after state update
    setTimeout(() => {
      stepContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }
  
  const [lookupMethod, setLookupMethod] = useState<"plate" | "vin" | "manual">("plate")
  const [province, setProvince] = useState("")
  const [plateNumber, setPlateNumber] = useState("")
  const [vinNumber, setVinNumber] = useState("")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [vehicleFound, setVehicleFound] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationProgress, setCalculationProgress] = useState(0)
  
  // Quote from Instant Cash Offer
  const [instantQuote, setInstantQuote] = useState<{
    quoteId: string
    vehicle: string
    value: number
  } | null>(null)
  
  // Check for quote parameters from Instant Quote
  useEffect(() => {
    const quoteId = searchParams.get("quote")
    const vehicle = searchParams.get("vehicle")
    const value = searchParams.get("value")
    const action = searchParams.get("action")
    
    if (quoteId && vehicle && value) {
      const parsedValue = parseInt(value) || 0
      setInstantQuote({
        quoteId,
        vehicle: decodeURIComponent(vehicle),
        value: parsedValue
      })

      // Parse vehicle info and pre-fill form
      const parts = decodeURIComponent(vehicle).split(" ")
      if (parts.length >= 3) {
        setSelectedYear(parts[0])
        setSelectedMake(parts[1])
        setSelectedModel(parts.slice(2).join(" "))
      }

      // Skip to step 2 since we already have vehicle info
      goToStep(2)

      // If user just signed in and has action=apply, open the apply modal
      if (action === "apply" && user) {
        // Set up the offer object for the modal
        const offerData = {
          quoteId,
          offerNumber: `PM-${Date.now().toString(36).toUpperCase()}`,
          vehicle: decodeURIComponent(vehicle),
          offerAmount: parseInt(value) || 0,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          mileage: mileage || "N/A",
          condition: "good",
          cbbValue: {
            low: parseInt(value) || 0,
            mid: parseInt(value) || 0,
            high: parseInt(value) || 0,
          },
          adjustments: [],
          payoff: 0,
          equity: parseInt(value) || 0,
          comparison: {
            privateSale: Math.round((parseInt(value) || 0) * 1.1),
            dealerTrade: Math.round((parseInt(value) || 0) * 0.9),
          },
        }
        setOffer(offerData)
        setShowOffer(true)
        // Small delay to ensure state is set
        setTimeout(() => setShowApplyModal(true), 100)
      }
    } else if (vehicle && !quoteId) {
      // Quick Estimate from homepage — pre-fill vehicle info
      const vehicleStr = decodeURIComponent(vehicle)
      const parts = vehicleStr.split(" ")
      if (parts.length >= 3) {
        setSelectedYear(parts[0])
        setSelectedMake(parts[1])
        setSelectedModel(parts.slice(2).join(" "))
      } else if (parts.length === 2) {
        setSelectedMake(parts[0])
        setSelectedModel(parts[1])
      }
      const mileageParam = searchParams.get("mileage")
      if (mileageParam) {
        setMileage(mileageParam.replace(/[^0-9]/g, ""))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user])
  
  // Vehicle details
  const [foundVehicle, setFoundVehicle] = useState<{
    year: number
    make: string
    model: string
    trim: string
    vin: string
    estimatedMileage: string
    color: string
  } | null>(null)
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedMake, setSelectedMake] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedTrim, setSelectedTrim] = useState("")
  const [mileage, setMileage] = useState("")
  const [condition, setCondition] = useState("good")
  
  // Condition questions
  const [hasAccident, setHasAccident] = useState(false)
  const [hasMechanicalIssues, setHasMechanicalIssues] = useState(false)
  const [hasLien, setHasLien] = useState(false)
  const [payoffAmount, setPayoffAmount] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")

  // Photos — keyed by angle name for the upload grid
  const [photos, setPhotos] = useState<Record<string, { file: File; preview: string }>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Contact info
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [postalCode, setPostalCode] = useState("")
  
  // Validation errors
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [postalCodeError, setPostalCodeError] = useState("")

  // Restore draft from localStorage on mount (skip if URL params pre-fill)
  useEffect(() => {
    if (draftLoadedRef.current) return
    draftLoadedRef.current = true

    // Don't restore draft if URL params are driving the form
    const hasUrlPrefill = searchParams.get("quote") || searchParams.get("vehicle") || searchParams.get("value") || searchParams.get("mileage")
    if (hasUrlPrefill) return

    try {
      const raw = window.localStorage.getItem(TRADE_IN_DRAFT_KEY)
      if (!raw) return
      const d = JSON.parse(raw) as Record<string, unknown>

      // Only restore if saved within the last 7 days
      if (d.savedAt && Date.now() - new Date(d.savedAt as string).getTime() > 7 * 24 * 60 * 60 * 1000) {
        window.localStorage.removeItem(TRADE_IN_DRAFT_KEY)
        return
      }

      if (typeof d.step === "number" && d.step >= 1 && d.step <= 3) setStep(d.step as number)
      if (typeof d.lookupMethod === "string") setLookupMethod(d.lookupMethod as "plate" | "vin" | "manual")
      if (typeof d.selectedYear === "string") setSelectedYear(d.selectedYear as string)
      if (typeof d.selectedMake === "string") setSelectedMake(d.selectedMake as string)
      if (typeof d.selectedModel === "string") setSelectedModel(d.selectedModel as string)
      if (typeof d.selectedTrim === "string") setSelectedTrim(d.selectedTrim as string)
      if (typeof d.mileage === "string") setMileage(d.mileage as string)
      if (typeof d.condition === "string") setCondition(d.condition as string)
      if (typeof d.hasAccident === "boolean") setHasAccident(d.hasAccident as boolean)
      if (typeof d.hasMechanicalIssues === "boolean") setHasMechanicalIssues(d.hasMechanicalIssues as boolean)
      if (typeof d.hasLien === "boolean") setHasLien(d.hasLien as boolean)
      if (typeof d.payoffAmount === "string") setPayoffAmount(d.payoffAmount as string)
      if (typeof d.additionalNotes === "string") setAdditionalNotes(d.additionalNotes as string)
      if (typeof d.email === "string") setEmail(d.email as string)
      if (typeof d.phone === "string") setPhone(d.phone as string)
      if (typeof d.postalCode === "string") setPostalCode(d.postalCode as string)
      if (typeof d.vinNumber === "string") setVinNumber(d.vinNumber as string)
    } catch (err) {
      console.error("Failed to restore trade-in draft:", err)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Auto-save draft to localStorage on every form change (debounced 500ms)
  useEffect(() => {
    if (!draftLoadedRef.current) return

    const timeout = window.setTimeout(() => {
      try {
        // Don't save if user hasn't entered anything meaningful
        const hasData = selectedYear || selectedMake || mileage || email || vinNumber
        if (!hasData) return

        const payload = {
          step,
          lookupMethod,
          selectedYear,
          selectedMake,
          selectedModel,
          selectedTrim,
          mileage,
          condition,
          hasAccident,
          hasMechanicalIssues,
          hasLien,
          payoffAmount,
          additionalNotes,
          email,
          phone,
          postalCode,
          vinNumber,
          savedAt: new Date().toISOString(),
        }
        window.localStorage.setItem(TRADE_IN_DRAFT_KEY, JSON.stringify(payload))
      } catch (err) {
        console.error("Failed to save trade-in draft:", err)
      }
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [
    step, lookupMethod,
    selectedYear, selectedMake, selectedModel, selectedTrim,
    mileage, condition,
    hasAccident, hasMechanicalIssues, hasLien, payoffAmount, additionalNotes,
    email, phone, postalCode, vinNumber,
  ])

  // Validation handlers
  const handleEmailChange = (value: string) => {
    setEmail(value)
    // Show specific guidance based on what's missing
    if (value && !value.includes('@')) {
      setEmailError("Email must include @ symbol (e.g., name@email.com)")
    } else if (value && !isValidEmail(value)) {
      setEmailError(ValidationMessages.email)
    } else {
      setEmailError("")
    }
  }
  
  const handlePhoneChange = (value: string) => {
    const formatted = formatCanadianPhoneNumber(value)
    setPhone(formatted)
    // Show error if user has entered some digits but format is incomplete/invalid
    const digitsOnly = value.replace(/\D/g, '')
    if (digitsOnly.length > 0 && digitsOnly.length < 10) {
      setPhoneError("Please enter a complete 10-digit phone number")
    } else if (digitsOnly.length >= 10 && !isValidCanadianPhoneNumber(formatted)) {
      setPhoneError(ValidationMessages.phone)
    } else {
      setPhoneError("")
    }
  }
  
  const handlePostalCodeChange = (value: string) => {
    const formatted = formatCanadianPostalCode(value)
    setPostalCode(formatted)
    // Show error if user has started entering but it's incomplete
    const cleanValue = value.replace(/\s/g, '')
    if (cleanValue.length > 0 && cleanValue.length < 6) {
      setPostalCodeError("Please enter a complete postal code (e.g., L4C 2G1)")
    } else if (cleanValue.length >= 6 && !isValidCanadianPostalCode(formatted)) {
      setPostalCodeError(ValidationMessages.postalCode)
    } else {
      setPostalCodeError("")
    }
  }
  
  // Photo upload handler
  const handlePhotoUpload = (angle: string, file: File | null) => {
    if (!file) return
    // Validate file type and size (max 10MB)
    if (!file.type.startsWith('image/')) return
    if (file.size > 10 * 1024 * 1024) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotos(prev => ({
        ...prev,
        [angle]: { file, preview: reader.result as string }
      }))
    }
    reader.readAsDataURL(file)
  }

  const removePhoto = (angle: string) => {
    setPhotos(prev => {
      const next = { ...prev }
      delete next[angle]
      return next
    })
  }

  // Offer
  interface TradeInOffer {
    quoteId?: string
    offerNumber: string
    vehicle: string
    mileage: string
    condition: string
    cbbValue: { low: number; mid: number; high: number }
    adjustments: Array<{ reason: string; amount: number } | false>
    offerAmount: number
    payoff: number
    equity: number
    validUntil: string
    comparison: { privateSale: number; dealerTrade: number }
  }
  const [offer, setOffer] = useState<TradeInOffer | null>(null)
  
  // Modal states
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)

  const handlePlateLookup = async () => {
    setIsLookingUp(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    setVehicleFound(true)
    setFoundVehicle({
      year: 2021,
      make: "Honda",
      model: "Accord",
      trim: "Sport 2.0T",
      vin: "1HGCV2F34MA012345",
      estimatedMileage: "45,000",
      color: "Crystal Black Pearl",
    })
    setSelectedYear("2021")
    setSelectedMake("Honda")
    setSelectedModel("Accord")
    setSelectedTrim("Sport 2.0T")
    setMileage("45000")
    setIsLookingUp(false)
  }

  const handleVinLookup = async () => {
    setIsLookingUp(true)
    try {
      const response = await fetch(`/api/v1/trade-in/vin-decode?vin=${encodeURIComponent(vinNumber)}`)
      const data = await response.json()

      if (data.success && data.vehicle) {
        const v = data.vehicle
        setVehicleFound(true)
        setFoundVehicle({
          year: parseInt(v.year) || 0,
          make: v.make,
          model: v.model,
          trim: v.trim,
          vin: v.vin,
          estimatedMileage: "",
          color: "",
        })
        setSelectedYear(v.year)
        setSelectedMake(v.make)
        setSelectedModel(v.model)
        if (v.trim) setSelectedTrim(v.trim)
      } else {
        // Show inline error — vehicle not found
        setVehicleFound(false)
        setFoundVehicle(null)
        alert(data.error || "Could not decode this VIN. Please check and try again.")
      }
    } catch {
      alert("Failed to look up VIN. Please try again or enter details manually.")
    } finally {
      setIsLookingUp(false)
    }
  }

  const calculateOffer = async () => {
    setIsCalculating(true)
    setCalculationProgress(0)

    // Progress animation while API works
    const progressInterval = setInterval(() => {
      setCalculationProgress(prev => Math.min(prev + 5, 90))
    }, 300)

    let lowValue: number, midValue: number, highValue: number

    try {
      // Call the real vehicle-valuation API with postal code for regional pricing
      const response = await fetch("/api/vehicle-valuation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: selectedYear,
          make: selectedMake,
          model: selectedModel,
          trim: selectedTrim,
          mileage,
          condition,
          postalCode,
        }),
      })

      clearInterval(progressInterval)
      setCalculationProgress(100)

      if (response.ok) {
        const valuation = await response.json()
        lowValue = valuation.lowValue
        midValue = valuation.midValue
        highValue = valuation.highValue
      } else {
        // Fallback to local calculation
        const fallback = calculateLocalFallback()
        lowValue = fallback.low
        midValue = fallback.mid
        highValue = fallback.high
      }
    } catch {
      clearInterval(progressInterval)
      setCalculationProgress(100)
      const fallback = calculateLocalFallback()
      lowValue = fallback.low
      midValue = fallback.mid
      highValue = fallback.high
    }

    // Apply condition adjustments
    if (hasAccident) {
      lowValue = Math.round(lowValue * 0.85)
      midValue = Math.round(midValue * 0.85)
      highValue = Math.round(highValue * 0.85)
    }
    if (hasMechanicalIssues) {
      lowValue = Math.round(lowValue * 0.92)
      midValue = Math.round(midValue * 0.92)
      highValue = Math.round(highValue * 0.92)
    }

    // Round to nearest 50
    lowValue = Math.round(lowValue / 50) * 50
    midValue = Math.round(midValue / 50) * 50
    highValue = Math.round(highValue / 50) * 50

    const equity = hasLien && payoffAmount ? midValue - parseFloat(payoffAmount) : midValue

    const generatedQuoteId = `PQ-${Date.now().toString(36).toUpperCase()}`
    setOffer({
      quoteId: generatedQuoteId,
      offerNumber: `PM-${Date.now().toString(36).toUpperCase()}`,
      vehicle: `${selectedYear} ${selectedMake} ${selectedModel} ${selectedTrim}`.trim(),
      mileage,
      condition,
      cbbValue: { low: lowValue, mid: midValue, high: highValue },
      adjustments: [
        hasAccident && { reason: "Accident history", amount: Math.round(-(midValue * 0.15)) },
        hasMechanicalIssues && { reason: "Mechanical issues", amount: Math.round(-(midValue * 0.08)) },
      ].filter(Boolean),
      offerAmount: midValue,
      payoff: hasLien ? parseFloat(payoffAmount) || 0 : 0,
      equity,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA'),
      comparison: {
        privateSale: Math.round(midValue * 1.15 / 50) * 50,
        dealerTrade: Math.round(midValue * 0.88 / 50) * 50,
      },
    })

    setIsCalculating(false)
    setShowOffer(true)
  }

  // Local fallback when API is unavailable
  const calculateLocalFallback = () => {
    const currentYear = new Date().getFullYear()
    const age = currentYear - parseInt(selectedYear)
    const mileageNum = parseInt(mileage.replace(/,/g, '')) || 50000
    const baseTiers: Record<string, number> = {
      "BMW": 45000, "Mercedes-Benz": 48000, "Audi": 45000, "Lexus": 42000,
      "Tesla": 55000, "Porsche": 70000, "Toyota": 28000, "Honda": 28000,
      "Volkswagen": 27000, "Hyundai": 25000, "Kia": 25000, "Ford": 30000,
      "Chevrolet": 28000, "Jeep": 32000, "Ram": 40000, "Subaru": 28000,
    }
    let value = baseTiers[selectedMake] || 28000
    for (let y = 0; y < age; y++) {
      if (y === 0) value *= 0.80
      else if (y < 3) value *= 0.88
      else if (y < 6) value *= 0.90
      else value *= 0.92
    }
    const expectedKm = age * 20000
    if (mileageNum > expectedKm) value -= (mileageNum - expectedKm) * 0.05
    const condMul = { excellent: 1.10, good: 1.0, fair: 0.85, poor: 0.65 }[condition] || 1.0
    value = Math.max(500, value * condMul)
    value = Math.round(value / 50) * 50
    return { low: Math.round(value * 0.90 / 50) * 50, mid: value, high: Math.round(value * 1.10 / 50) * 50 }
  }

  const nextStep = () => {
    setStep(s => Math.min(s + 1, 4))
    setTimeout(() => {
      stepContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }
  const prevStep = () => {
    setStep(s => Math.max(s - 1, 1))
    setTimeout(() => {
      stepContentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header />
      
      <main id="main-content" tabIndex={-1} className="overflow-x-hidden max-w-full">
        {/* Instant Quote Banner - Shows when coming from AI Quote */}
        {instantQuote && (
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4">
            <div className="container mx-auto px-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Your Instant Quote for {instantQuote.vehicle}</p>
                    <p className="text-2xl font-bold">${instantQuote.value.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-white/20 px-3 py-1 rounded-full">Quote ID: {instantQuote.quoteId}</span>
                  <span className="text-white/80">Complete details below to finalize your offer</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Hero Section — Clean, Clutch-Inspired */}
        <section className="relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16 sm:py-24 overflow-hidden">
          {/* Subtle background grid */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.08),transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(16,185,129,0.06),transparent_50%)]" />

          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight">
                What&apos;s Your Car Worth?
              </h1>
              <p className="text-lg sm:text-xl text-slate-300 max-w-xl mx-auto">
                Get an instant trade-in offer in under 60 seconds.
                <br className="hidden sm:block" />
                No haggling. No spam. Just your number.
              </p>
            </div>

            {/* VIN Lookup Card — Front and Center */}
            <div className="max-w-xl mx-auto">
              <Card className="shadow-2xl border-0 bg-white/[0.03] backdrop-blur-xl border border-white/10">
                <CardContent className="p-6 sm:p-8">
                  <Tabs
                    value={lookupMethod}
                    onValueChange={(v: string) => setLookupMethod(v as "vin" | "plate" | "manual")}
                  >
                    <TabsList className="grid w-full grid-cols-3 mb-6 bg-white/5 border border-white/10 h-12">
                      <TabsTrigger value="vin" className="text-white/70 data-[state=active]:bg-primary data-[state=active]:text-white text-sm font-medium">VIN Lookup</TabsTrigger>
                      <TabsTrigger value="plate" className="text-white/70 data-[state=active]:bg-primary data-[state=active]:text-white text-sm font-medium">Plate #</TabsTrigger>
                      <TabsTrigger value="manual" className="text-white/70 data-[state=active]:bg-primary data-[state=active]:text-white text-sm font-medium">Manual</TabsTrigger>
                    </TabsList>

                    {/* VIN Tab */}
                    <TabsContent value="vin" className="space-y-4">
                      <div className="relative">
                        <Input
                          placeholder="Enter your 17-character VIN"
                          className="uppercase text-lg tracking-wider font-mono h-14 bg-white/5 border-white/20 text-white placeholder:text-white/30 pr-12"
                          maxLength={17}
                          value={vinNumber}
                          onChange={(e) => setVinNumber(e.target.value.toUpperCase())}
                        />
                        {vinNumber.length > 0 && (
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-white/40 font-mono">
                            {vinNumber.length}/17
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3 flex-shrink-0" />
                        Found on your registration, insurance card, or driver-side door jamb
                      </p>
                      <Button
                        className="w-full h-14 text-lg font-semibold"
                        size="lg"
                        onClick={handleVinLookup}
                        disabled={vinNumber.length !== 17 || isLookingUp}
                      >
                        {isLookingUp ? (
                          <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Decoding VIN...</span>
                        ) : (
                          <><Search className="mr-2 h-5 w-5" /> Look Up My Vehicle</>
                        )}
                      </Button>
                    </TabsContent>

                    {/* Plate Tab */}
                    <TabsContent value="plate" className="space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        <div className="col-span-2">
                          <Input
                            placeholder="License plate"
                            className="uppercase text-lg tracking-wider font-mono h-14 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                            value={plateNumber}
                            onChange={(e) => setPlateNumber(e.target.value.toUpperCase())}
                          />
                        </div>
                        <Select value={province} onValueChange={setProvince}>
                          <SelectTrigger aria-label="Province" className="h-14 bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="ON" />
                          </SelectTrigger>
                          <SelectContent>
                            {["ON","QC","BC","AB","SK","MB","NS","NB","NL","PE","NT","NU","YT"].map(p => (
                              <SelectItem key={p} value={p}>{p}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        className="w-full h-14 text-lg font-semibold"
                        size="lg"
                        onClick={handlePlateLookup}
                        disabled={!plateNumber || isLookingUp}
                      >
                        {isLookingUp ? (
                          <span className="flex items-center gap-2"><span className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" /> Looking Up...</span>
                        ) : (
                          <><Search className="mr-2 h-5 w-5" /> Look Up Vehicle</>
                        )}
                      </Button>
                    </TabsContent>

                    {/* Manual Tab */}
                    <TabsContent value="manual" className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <Select value={selectedYear} onValueChange={setSelectedYear}>
                          <SelectTrigger aria-label="Year" className="h-12 bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 25 }, (_, i) => 2026 - i).map((year) => (
                              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedMake} onValueChange={(v) => { setSelectedMake(v); setSelectedModel(""); setSelectedTrim(""); }}>
                          <SelectTrigger aria-label="Make" className="h-12 bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="Make" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(vehicleMakes).map((make) => (
                              <SelectItem key={make} value={make}>{make}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedModel} onValueChange={(v) => { setSelectedModel(v); setSelectedTrim(""); }} disabled={!selectedMake}>
                          <SelectTrigger aria-label="Model" className="h-12 bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="Model" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedMake && vehicleMakes[selectedMake as keyof typeof vehicleMakes]?.map((model) => (
                              <SelectItem key={model} value={model}>{model}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedTrim} onValueChange={setSelectedTrim} disabled={!selectedModel}>
                          <SelectTrigger aria-label="Trim" className="h-12 bg-white/5 border-white/20 text-white">
                            <SelectValue placeholder="Trim" />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedModel && (vehicleTrims[selectedModel] || vehicleTrims["default"])?.map((trim) => (
                              <SelectItem key={trim} value={trim}>{trim}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Input
                        placeholder="Mileage (km)"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className="h-12 bg-white/5 border-white/20 text-white placeholder:text-white/30"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value.replace(/[^0-9]/g, ''))}
                        autoComplete="off"
                      />
                      <Button
                        className="w-full h-14 text-lg font-semibold"
                        size="lg"
                        onClick={() => { goToStep(2); setVehicleFound(true); }}
                        disabled={!selectedYear || !selectedMake || !selectedModel || !selectedTrim || !mileage}
                      >
                        Get My Instant Offer <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                      {(!selectedYear || !selectedMake || !selectedModel || !selectedTrim || !mileage) && (
                        <p className="text-xs text-white/50 text-center mt-2">
                          Please fill in all fields above to get your offer
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Trust signals — minimal */}
              <div className="flex items-center justify-center gap-6 mt-6 text-xs sm:text-sm text-white/40">
                <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> No Obligation</span>
                <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> Instant Result</span>
                <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" /> Free Pickup</span>
              </div>
            </div>
          </div>
        </section>

        {/* VIN Lookup Result — Shows when vehicle found via VIN/Plate */}
        {vehicleFound && foundVehicle && (lookupMethod === "vin" || lookupMethod === "plate") && step === 1 && (
          <section className="py-8 bg-emerald-50 dark:bg-emerald-950/20 border-b">
            <div className="container mx-auto px-4">
              <div className="max-w-xl mx-auto">
                <Card className="shadow-lg border-emerald-200 dark:border-emerald-800">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-full flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="h-6 w-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">Vehicle Found!</h3>
                        <p className="text-2xl font-bold mt-1">
                          {foundVehicle.year} {foundVehicle.make} {foundVehicle.model} {foundVehicle.trim}
                        </p>
                        {foundVehicle.vin && (
                          <p className="text-sm text-muted-foreground font-mono mt-1">VIN: {foundVehicle.vin}</p>
                        )}
                        <div className="mt-4 space-y-3">
                          <Input
                            placeholder="Enter your mileage (km)"
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            className="h-12"
                            value={mileage}
                            onChange={(e) => setMileage(e.target.value.replace(/[^0-9]/g, ''))}
                            autoComplete="off"
                          />
                          <Button
                            className="w-full h-12 text-lg"
                            size="lg"
                            onClick={() => goToStep(2)}
                            disabled={!mileage}
                          >
                            Continue to Get Offer <ArrowRight className="ml-2 h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* Main Wizard Section */}
        {!showOffer && step >= 2 && (
          <section className="py-12 bg-muted/30">
<div className="container mx-auto px-4">
  <div className="max-w-4xl mx-auto" ref={stepContentRef}>
  {/* Progress Steps */}
  <div className="flex items-center justify-between mb-8 px-4">
                  {/* Vehicle info summary */}
                  <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2 mr-4">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span className="text-sm font-medium truncate">
                      {selectedYear} {selectedMake} {selectedModel}
                    </span>
                  </div>
                  {[
                    { num: 2, label: "Condition" },
                    { num: 3, label: "Photos" },
                    { num: 4, label: "Your Offer" },
                  ].map((s, i) => (
                    <div key={s.num} className="flex items-center">
                      <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all ${
                        step >= s.num
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {step > s.num ? <CheckCircle className="h-5 w-5" /> : i + 1}
                      </div>
                      <span className={`ml-2 hidden sm:block text-sm ${
                        step >= s.num ? "text-foreground font-medium" : "text-muted-foreground"
                      }`}>
                        {s.label}
                      </span>
                      {i < 2 && (
                        <div className={`hidden sm:block w-12 lg:w-24 h-0.5 mx-3 ${
                          step > s.num ? "bg-primary" : "bg-muted"
                        }`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Step 2: Condition */}
                {step === 2 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-primary" />
                        Vehicle Condition
                      </CardTitle>
                      <CardDescription>
                        Help us give you the most accurate offer
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Vehicle Summary */}
                      <div className="p-4 bg-muted/50 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{selectedYear} {selectedMake} {selectedModel} {selectedTrim}</p>
                          <p className="text-sm text-muted-foreground">{mileage ? parseInt(mileage).toLocaleString() : '0'} km</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => goToStep(1)}>Edit</Button>
                      </div>

                      {/* Condition Selection */}
                      <div className="space-y-3">
                        <Label className="text-base font-semibold">Overall Condition</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {conditionOptions.map((opt) => (
                            <div
                              key={opt.value}
                              className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                                condition === opt.value 
                                  ? "border-primary bg-primary/5" 
                                  : "border-muted hover:border-primary/50"
                              }`}
                              onClick={() => setCondition(opt.value)}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold">{opt.label}</span>
                                {condition === opt.value && <CheckCircle className="h-5 w-5 text-primary" />}
                              </div>
                              <p className="text-sm text-muted-foreground">{opt.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Additional Questions */}
                      <div className="space-y-4 pt-4 border-t">
                        <Label className="text-base font-semibold">Additional Information</Label>
                        
                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                          <Checkbox 
                            id="accident" 
                            checked={hasAccident}
                            onCheckedChange={(c) => setHasAccident(c as boolean)}
                          />
                          <div className="space-y-1">
                            <Label htmlFor="accident" className="cursor-pointer font-medium">
                              Has this vehicle been in an accident?
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Include any collision, even minor fender benders
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                          <Checkbox 
                            id="mechanical" 
                            checked={hasMechanicalIssues}
                            onCheckedChange={(c) => setHasMechanicalIssues(c as boolean)}
                          />
                          <div className="space-y-1">
                            <Label htmlFor="mechanical" className="cursor-pointer font-medium">
                              Are there any mechanical issues?
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Check engine light, transmission issues, unusual sounds, etc.
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3 p-4 border rounded-lg">
                          <Checkbox 
                            id="lien" 
                            checked={hasLien}
                            onCheckedChange={(c) => setHasLien(c as boolean)}
                          />
                          <div className="space-y-1">
                            <Label htmlFor="lien" className="cursor-pointer font-medium">
                              Is there a loan or lien on this vehicle?
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              We can pay off your lender directly
                            </p>
                          </div>
                        </div>

                        {hasLien && (
                          <div className="ml-7 space-y-2">
                            <Label>Approximate Payoff Amount</Label>
                            <Input 
                              type="number" 
                              placeholder="Enter payoff amount"
                              value={payoffAmount}
                              onChange={(e) => setPayoffAmount(e.target.value)}
                              className="max-w-xs"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Additional Notes (optional)</Label>
                          <Textarea 
                            placeholder="Any other details about your vehicle..."
                            value={additionalNotes}
                            onChange={(e) => setAdditionalNotes(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={prevStep} className="flex-1">
                          Back
                        </Button>
                        <Button onClick={nextStep} className="flex-1">
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 3: Photos */}
                {step === 3 && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-primary" />
                        Add Photos (Optional)
                      </CardTitle>
                      <CardDescription>
                        Photos can increase your offer by up to 10%
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Photo Upload Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {["Front", "Back", "Interior", "Dashboard"].map((angle) => (
                          <div key={angle} className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              className="sr-only"
                              ref={(el) => { fileInputRefs.current[angle] = el }}
                              onChange={(e) => {
                                handlePhotoUpload(angle, e.target.files?.[0] || null)
                                e.currentTarget.value = ""
                              }}
                            />
                            {photos[angle] ? (
                              <div className="aspect-video rounded-lg overflow-hidden relative group/photo border-2 border-green-500">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={photos[angle].preview} alt={angle} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/photo:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => fileInputRefs.current[angle]?.click()}
                                    className="bg-white text-black px-2 py-1 rounded text-xs font-medium"
                                  >
                                    Replace
                                  </button>
                                  <button
                                    aria-label={`Remove ${angle} photo`}
                                    onClick={() => removePhoto(angle)}
                                    className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium"
                                  >
                                    Remove
                                  </button>
                                </div>
                                <CheckCircle className="absolute top-2 right-2 w-5 h-5 text-green-500" />
                              </div>
                            ) : (
                              <div
                                onClick={() => fileInputRefs.current[angle]?.click()}
                                className="aspect-video border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary hover:bg-primary/5 cursor-pointer transition-all"
                              >
                                <Upload className="h-8 w-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">{angle}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {Object.keys(photos).length > 0 && (
                        <p className="text-sm text-green-600 font-medium">
                          ✓ {Object.keys(photos).length} photo{Object.keys(photos).length > 1 ? 's' : ''} added
                        </p>
                      )}

                      <div className="p-4 bg-teal-50 dark:bg-teal-950/20 border border-teal-200 dark:border-teal-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-teal-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-teal-900 dark:text-teal-100">Photos boost your offer!</p>
                            <p className="text-sm text-teal-700 dark:text-teal-300">
                              Vehicles with photos typically receive offers 5-10% higher than those without.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={prevStep} className="flex-1">
                          Back
                        </Button>
                        <Button variant="outline" onClick={nextStep} className="flex-1">
                          Skip for Now
                        </Button>
                        <Button onClick={nextStep} className="flex-1">
                          Continue
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Step 4: Get Offer */}
                {step === 4 && !isCalculating && !showOffer && (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        Get Your Instant Offer
                      </CardTitle>
                      <CardDescription>
                        Enter your contact info to receive your offer
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Vehicle Summary */}
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="font-semibold text-lg">{selectedYear} {selectedMake} {selectedModel} {selectedTrim}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
                          <span>{mileage ? parseInt(mileage).toLocaleString() : '0'} km</span>
                          <span>|</span>
                          <span className="capitalize">{condition} condition</span>
                          {hasAccident && <><span>|</span><span>Accident history</span></>}
                        </div>
                      </div>

                      {/* Contact Form */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Email Address <span className="text-destructive">*</span></Label>
                          <Input 
                            type="email" 
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => handleEmailChange(e.target.value)}
                            className={emailError ? "border-destructive" : ""}
                          />
                          {emailError ? (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {emailError}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Example: name@email.com</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label>Phone Number <span className="text-destructive">*</span></Label>
                          <Input 
                            type="tel" 
                            placeholder="(416) 555-1234"
                            value={phone}
                            onChange={(e) => handlePhoneChange(e.target.value)}
                            className={phoneError ? "border-destructive" : ""}
                          />
                          {phoneError ? (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {phoneError}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Format: (416) 555-1234</p>
                          )}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label>Postal Code <span className="text-destructive">*</span></Label>
                          <Input 
                            placeholder="A1A 1A1"
                            value={postalCode}
                            onChange={(e) => handlePostalCodeChange(e.target.value)}
                            className={`max-w-xs uppercase ${postalCodeError ? "border-destructive" : ""}`}
                          />
                          {postalCodeError ? (
                            <p className="text-xs text-destructive flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              {postalCodeError}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">Format: A1A 1A1 - For scheduling free pickup</p>
                          )}
                        </div>
                      </div>

                      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex items-start gap-3">
                          <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <p className="font-medium text-green-900 dark:text-green-100">Your privacy is protected</p>
                            <p className="text-sm text-green-700 dark:text-green-300">
                              We never share your information. No spam calls, guaranteed.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={prevStep} className="flex-1">
                          Back
                        </Button>
                        <Button 
                          onClick={calculateOffer} 
                          className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground h-12 text-lg"
                          disabled={
                            !email || 
                            !phone || 
                            !postalCode ||
                            !isValidEmail(email) || 
                            !isValidCanadianPhoneNumber(phone) ||
                            !isValidCanadianPostalCode(postalCode)
                          }
                        >
                          <Sparkles className="mr-2 h-5 w-5" />
                          Get My Offer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Calculating Animation */}
                {isCalculating && (
                  <Card className="shadow-lg">
                    <CardContent className="py-16 text-center">
                      <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 rounded-full flex items-center justify-center">
                        <DollarSign className="h-10 w-10 text-primary animate-pulse" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">Calculating Your Offer...</h3>
                      <Progress value={calculationProgress} className="max-w-md mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Checking Canadian Black Book values and market data
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Offer Display */}
        {showOffer && offer && (
          <section className="py-12 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                {/* Success Header */}
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-3xl font-bold mb-2">Your Instant Offer is Ready!</h2>
                  <p className="text-muted-foreground">Offer #{offer.offerNumber} | Valid until {offer.validUntil}</p>
                </div>

                {/* Main Offer Card */}
                <Card className="shadow-2xl border-2 border-primary mb-8 overflow-hidden">
                  <div className="bg-primary text-primary-foreground p-6 text-center">
                    <p className="text-sm uppercase tracking-wide mb-2">Your Planet Motors Trade-In Offer</p>
                    <p className="text-5xl font-bold">${offer.offerAmount.toLocaleString()}</p>
                    <p className="text-sm mt-2 opacity-80">Powered by Canadian Black Book</p>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    {/* Vehicle */}
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold text-lg">{offer.vehicle}</p>
                        <p className="text-sm text-muted-foreground">{offer.mileage && offer.mileage !== "N/A" ? parseInt(offer.mileage).toLocaleString() + ' km' : ''}{offer.mileage && offer.mileage !== "N/A" && offer.condition ? ' | ' : ''}{offer.condition ? offer.condition + ' condition' : ''}</p>
                      </div>
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* CBB Value Range */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">CBB Value Range</span>
                        <span className="font-medium">${offer.cbbValue.low.toLocaleString()} - ${offer.cbbValue.high.toLocaleString()}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-primary/50 via-primary to-primary/50 rounded-full"
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>

                    {/* Payoff/Equity */}
                    {offer.payoff > 0 && (
                      <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg space-y-2">
                        <div className="flex justify-between">
                          <span>Trade-In Offer</span>
                          <span className="font-medium">${offer.offerAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-red-600">
                          <span>Loan Payoff</span>
                          <span className="font-medium">-${offer.payoff.toLocaleString()}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-bold text-lg">
                          <span>Your Equity</span>
                          <span className={offer.equity >= 0 ? "text-green-600" : "text-red-600"}>
                            ${Math.abs(offer.equity).toLocaleString()}
                            {offer.equity < 0 && " owed"}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Comparison */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Dealer</p>
                        <p className="font-medium text-xs sm:text-base text-muted-foreground line-through">${offer.comparison.dealerTrade.toLocaleString()}</p>
                      </div>
                      <div className="text-center border-x">
                        <p className="text-xs sm:text-sm text-primary font-medium mb-1">Planet Motors</p>
                        <p className="font-bold text-base sm:text-xl text-primary">${offer.offerAmount.toLocaleString()}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs sm:text-sm text-muted-foreground mb-1">Private</p>
                        <p className="font-medium text-xs sm:text-base text-muted-foreground">${offer.comparison.privateSale.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Why Planet Motors */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center text-xs sm:text-sm">
                      <div>
                        <Zap className="h-6 w-6 mx-auto mb-1 text-primary" />
                        <p className="font-medium">Instant Offer</p>
                        <p className="text-xs text-muted-foreground">No waiting</p>
                      </div>
                      <div>
                        <Truck className="h-6 w-6 mx-auto mb-1 text-primary" />
                        <p className="font-medium">Free Pickup</p>
                        <p className="text-xs text-muted-foreground">Canada-wide</p>
                      </div>
                      <div>
                        <CreditCard className="h-6 w-6 mx-auto mb-1 text-primary" />
                        <p className="font-medium">24h Payment</p>
                        <p className="text-xs text-muted-foreground">E-Transfer or cheque</p>
                      </div>
                    </div>

{/* CTA Buttons */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
  <Button 
    size="lg" 
    className="h-14 text-lg bg-accent hover:bg-accent/90 text-accent-foreground"
    onClick={() => setShowAcceptModal(true)}
  >
  <ThumbsUp className="mr-2 h-5 w-5" />
  Accept Offer
  </Button>
  <Button 
    size="lg" 
    variant="outline" 
    className="h-14 text-lg"
    onClick={() => {
      if (!user) {
        setShowAuthModal(true)
      } else {
        setShowApplyModal(true)
      }
    }}
  >
  <Car className="mr-2 h-5 w-5" />
  Apply to a Purchase
  </Button>
  </div>

                    <p className="text-center text-sm text-muted-foreground">
                      Questions? Call us at <strong>1-866-797-3332</strong>
                    </p>
                  </CardContent>
                </Card>

                {/* Next Steps */}
                <Card className="shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      What Happens Next?
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">1</div>
                        <div>
                          <h4 className="font-semibold">Accept Your Offer</h4>
                          <p className="text-sm text-muted-foreground">Click accept and confirm your details</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">2</div>
                        <div>
                          <h4 className="font-semibold">Schedule Pickup</h4>
                          <p className="text-sm text-muted-foreground">We come to you, anywhere in Canada</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">3</div>
                        <div>
                          <h4 className="font-semibold">Get Paid</h4>
                          <p className="text-sm text-muted-foreground">Payment within 24 hours via e-Transfer</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </section>
        )}

        {/* How It Works */}
        {!showOffer && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-16">
                <Badge className="mb-4">Why Planet Motors</Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                  The Smarter Way to Trade-In
                </h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Skip the dealership games. Get a fair price in 60 seconds, not 6 hours.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { 
                    icon: Zap, 
                    title: "60-Second Offers", 
                    desc: "Get an instant offer powered by Canadian Black Book. No waiting, no haggling.",
                    highlight: "Instant Offer"
                  },
                  { 
                    icon: TrendingUp, 
                    title: "Best Price Guarantee", 
                    desc: "We beat any competitor offer by $500 or we will give you $100.",
                    highlight: "Guaranteed"
                  },
                  { 
                    icon: Truck, 
                    title: "Free Canada-Wide Pickup", 
                    desc: "We come to your home or office. No need to drive anywhere.",
                    highlight: "100% Free"
                  },
                  { 
                    icon: CreditCard, 
                    title: "24-Hour Payment", 
                    desc: "Get paid within 24 hours via e-Transfer or certified cheque.",
                    highlight: "Fast Cash"
                  },
                ].map((item, i) => (
                  <Card key={i} className="relative overflow-hidden border-2 hover:border-primary transition-all group">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <item.icon className="h-7 w-7 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-sm mb-3">{item.desc}</p>
                      <Badge variant="secondary" className="text-xs">
                        {item.highlight}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Comparison Table */}
        {!showOffer && (
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">How We Compare</h2>
                <p className="text-muted-foreground">See why Canadians choose Planet Motors</p>
              </div>
              
              <div className="max-w-4xl mx-auto overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b-2">
                      <th className="text-left p-4">Feature</th>
                      <th className="p-4 bg-primary text-primary-foreground rounded-t-lg">
                        <div className="flex items-center justify-center gap-2">
                          <Award className="h-5 w-5" />
                          Planet Motors
                        </div>
                      </th>
                      <th className="p-4 text-muted-foreground">Traditional Dealer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Offer Speed", "60 seconds", "2+ hours"],
                      ["Price Guarantee", "Beat by $500", "No"],
                      ["Pickup Service", "Free, Canada-wide", "N/A"],
                      ["Payment Time", "24 hours", "Same day (cheque)"],
                      ["Valuation Source", "Canadian Black Book", "Trade-in guides"],
                      ["Phone Calls Required", "None", "Many"],
                      ["Haggling", "No games", "Expected"],
                    ].map(([feature, pm, dealer], i) => (
                      <tr key={i} className="border-b">
                        <td className="p-4 font-medium">{feature}</td>
                        <td className="p-4 bg-primary/5 text-center font-semibold text-primary">{pm}</td>
                        <td className="p-4 text-center text-muted-foreground">{dealer}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {/* Testimonials */}
        {!showOffer && (
          <section className="py-20 bg-background">
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold mb-4">What Canadians Are Saying</h2>
                <div className="flex items-center justify-center gap-2 text-amber-500">
                  {[1,2,3,4,5].map(i => <Star key={i} className="h-5 w-5 fill-current" />)}
                  <span className="ml-2 text-foreground font-medium">4.8 Star Rating</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {[
                  {
                    name: "Sarah M.",
                    location: "Toronto, ON",
                    text: "Got $3,000 more than what the dealer offered. The whole process took 30 minutes and they picked up my car from work!",
                    rating: 5,
                  },
                  {
                    name: "Mike R.",
                    location: "Vancouver, BC",
                    text: "No games, no haggling. Just a fair price and quick payment. Exactly what I was looking for. Way better than dealing with Craigslist.",
                    rating: 5,
                  },
                  {
                    name: "Jennifer L.",
                    location: "Calgary, AB",
                    text: "They paid off my loan directly and e-Transferred my equity the next day. So easy compared to trading in at a dealership.",
                    rating: 5,
                  },
                ].map((review, i) => (
                  <Card key={i} className="p-6">
                    <div className="flex items-center gap-1 mb-3 text-amber-500">
                      {Array(review.rating).fill(0).map((_, j) => (
                        <Star key={j} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4">&quot;{review.text}&quot;</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary">
                        {review.name[0]}
                      </div>
                      <div>
                        <p className="font-medium">{review.name}</p>
                        <p className="text-sm text-muted-foreground">{review.location}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Final CTA */}
        {!showOffer && (
          <section className="py-20 bg-primary text-primary-foreground">
            <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Get Your Offer?
              </h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Join thousands of Canadians who have already traded in their vehicles with Planet Motors.
              </p>
              <Button 
                size="lg" 
                variant="secondary" 
                className="h-14 px-8 text-lg"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Get My Instant Offer
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <p className="mt-4 text-sm opacity-70">
                No phone calls. No spam. See your offer in 60 seconds.
              </p>
            </div>
          </section>
        )}
      </main>

      {/* Accept Offer Modal */}
      <Dialog open={showAcceptModal} onOpenChange={setShowAcceptModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              Accept Your Offer
            </DialogTitle>
            <DialogDescription>
              {offer ? `Your ${offer.vehicle} offer of $${offer.offerAmount.toLocaleString()}` : 'Confirm your trade-in offer'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">What happens next:</h4>
              <ol className="text-sm text-green-700 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">1</span>
                  <span>We&apos;ll contact you within 2 hours to schedule a pickup</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">2</span>
                  <span>Free pickup anywhere in Canada at your convenience</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">3</span>
                  <span>Get paid within 24 hours via e-Transfer or cheque</span>
                </li>
              </ol>
            </div>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="accept-email">Confirm Email <span className="text-destructive">*</span></Label>
                <Input id="accept-email" type="email" placeholder="your@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="accept-phone">Confirm Phone <span className="text-destructive">*</span></Label>
                <Input id="accept-phone" type="tel" placeholder="(416) 555-1234" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="accept-terms" />
                <Label htmlFor="accept-terms" className="text-sm text-muted-foreground leading-tight">
                  I confirm the vehicle condition is as described and agree to Planet Motors&apos; terms of service
                </Label>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowAcceptModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={!email || !phone}
              onClick={async () => {
                if (!email || !phone) {
                  alert('Please enter your email and phone number.')
                  return
                }
                try {
                  // Collect photo previews (base64) to send with the acceptance
                  const photoData: Record<string, string> = {}
                  for (const [angle, photo] of Object.entries(photos)) {
                    if (photo?.preview) {
                      photoData[angle] = photo.preview
                    }
                  }
                  // Call API to save acceptance and notify dealership
                  const response = await fetch('/api/v1/trade-in/accept', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      quoteId: offer?.quoteId,
                      vehicleYear: selectedYear,
                      vehicleMake: selectedMake,
                      vehicleModel: selectedModel,
                      mileage,
                      condition: condition,
                      postalCode,
                      photos: Object.keys(photoData).length > 0 ? photoData : undefined,
                      offerAmount: offer?.offerAmount,
                      customerEmail: email,
                      customerPhone: phone,
                    })
                  })
                  
                  const data = await response.json()
                  
                  if (data.success) {
                    try { window.localStorage.removeItem(TRADE_IN_DRAFT_KEY) } catch { /* localStorage unavailable */ }
                    setShowAcceptModal(false)
                    alert(`Offer Accepted!\n\nYou will receive a confirmation email and SMS shortly.\n\nOur team will contact you within 2 hours to schedule your free pickup.\n\nQuote ID: ${offer?.quoteId}`)
                  } else {
                    alert('There was an issue processing your acceptance. Please try again or call us at 1-866-797-3332.')
                  }
                } catch (error) {
                  console.error('Error accepting offer:', error)
                  // Still show success to user - fallback for API errors
                  try { window.localStorage.removeItem(TRADE_IN_DRAFT_KEY) } catch { /* localStorage unavailable */ }
                  setShowAcceptModal(false)
                  alert(`Offer Accepted!\n\nOur team will contact you within 2 hours to schedule your free pickup.\n\nQuote ID: ${offer?.quoteId}`)
                }
              }}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Confirm & Accept Offer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply to Purchase Modal */}
      <Dialog open={showApplyModal} onOpenChange={setShowApplyModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="w-6 h-6 text-primary" />
              Apply Trade-In to a Purchase
            </DialogTitle>
            <DialogDescription>
              Use your trade-in value towards a vehicle from our inventory
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Show signed in user info */}
            {user && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">Signed in as {user.email}</p>
                  <p className="text-xs text-green-700">Your trade-in will be saved to your account</p>
                </div>
              </div>
            )}
            
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-muted-foreground">Your Trade-In Value</span>
                <span className="text-2xl font-bold text-primary">${offer?.offerAmount.toLocaleString() || '0'}</span>
              </div>
              <p className="text-sm text-muted-foreground">This amount will be applied as a down payment on your new vehicle</p>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">What are you looking for?</h4>
              <div className="grid grid-cols-2 gap-2">
                {['SUV', 'Sedan', 'Truck', 'Electric', 'Luxury', 'Under $30k'].map((type) => (
                  <Button
                    key={type}
                    variant="outline"
                    size="sm"
                    className="justify-start"
                    onClick={async () => {
                      // Save trade-in quote before navigating
                      try {
                        if (user) {
                          await fetch('/api/v1/trade-in/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              quoteId: offer?.quoteId,
                              vehicleYear: selectedYear,
                              vehicleMake: selectedMake,
                              vehicleModel: selectedModel,
                              mileage,
                              condition: condition,
                              postalCode,
                              offerAmount: offer?.offerAmount,
                              customerEmail: email || user.email,
                              customerPhone: phone,
                            })
                          })
                        }
                      } catch { /* save failed silently */ }
                      try { window.localStorage.removeItem(TRADE_IN_DRAFT_KEY) } catch { /* localStorage unavailable */ }
                      setShowApplyModal(false)
                      // Build inventory URL with trade-in info + category filter
                      const params = new URLSearchParams({
                        tradeIn: String(offer?.offerAmount || 0),
                        quoteId: offer?.quoteId || '',
                        tradeInVehicle: encodeURIComponent(offer?.vehicle || '')
                      })
                      if (type === 'Electric') params.set('fuelType', 'Electric')
                      else if (type === 'Under $30k') params.set('maxPrice', '30000')
                      else if (type === 'Luxury') params.set('category', 'Luxury')
                      else params.set('bodyType', type)
                      window.location.href = `/inventory?${params.toString()}`
                    }}
                  >
                    {type}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              <Sparkles className="w-4 h-4 mt-0.5 text-primary" />
              <span>Your trade-in quote will be saved to your account. Browse inventory and apply it to any vehicle purchase.</span>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowApplyModal(false)}>
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                try {
                  // Save trade-in quote to user's account
                  if (user) {
                    await fetch('/api/v1/trade-in/save', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        quoteId: offer?.quoteId,
                        vehicleYear: selectedYear,
                        vehicleMake: selectedMake,
                        vehicleModel: selectedModel,
                        mileage,
                        condition: condition,
                        postalCode,
                        offerAmount: offer?.offerAmount,
                        customerEmail: email || user.email,
                        customerPhone: phone,
                      })
                    })
                  }
                } catch (error) {
                  console.error('Error saving trade-in:', error)
                }
                
                try { window.localStorage.removeItem(TRADE_IN_DRAFT_KEY) } catch { /* localStorage unavailable */ }
                setShowApplyModal(false)
                // Redirect to inventory with full trade-in info
                const params = new URLSearchParams({
                  tradeIn: String(offer?.offerAmount || 0),
                  quoteId: offer?.quoteId || '',
                  tradeInVehicle: encodeURIComponent(offer?.vehicle || '')
                })
                window.location.href = `/inventory?${params.toString()}`
              }}
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Browse Inventory
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Required Modal for Apply to Purchase */}
      <AuthRequiredModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        action="apply your trade-in to a vehicle purchase"
        redirectTo={`/trade-in?quote=${offer?.quoteId || ''}&vehicle=${encodeURIComponent(offer?.vehicle || '')}&value=${offer?.offerAmount || 0}&action=apply`}
      />

      <Footer />
    </div>
  )
}

// Wrap with Suspense for useSearchParams
export default function TradeInPage() {
  return (
    <>
      <TradeInPageJsonLd />
      <Suspense fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading trade-in...</p>
          </div>
        </div>
      }>
        <TradeInContent />
      </Suspense>
    </>
  )
}
