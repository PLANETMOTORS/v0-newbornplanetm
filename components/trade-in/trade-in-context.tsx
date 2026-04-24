"use client"

import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import {
  isValidEmail,
  isValidCanadianPhoneNumber,
  isValidCanadianPostalCode,
  formatCanadianPhoneNumber,
  formatCanadianPostalCode,
} from "@/lib/validation"
import { useAuth } from "@/contexts/auth-context"

export const vehicleMakes: Record<string, string[]> = {
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

export const vehicleTrims: Record<string, string[]> = {
  "ILX": ["Base", "Premium", "A-Spec", "Technology"],
  "Integra": ["Base", "A-Spec", "A-Spec Technology"],
  "MDX": ["Base", "Technology", "A-Spec", "Advance", "Type S"],
  "NSX": ["Base", "Type S"],
  "RDX": ["Base", "Technology", "A-Spec", "Advance"],
  "TLX": ["Base", "Technology", "A-Spec", "Advance", "Type S"],
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
  "Bronco": ["Base", "Big Bend", "Black Diamond", "Outer Banks", "Badlands", "Wildtrak"],
  "Edge": ["SE", "SEL", "ST-Line", "Titanium", "ST"],
  "Escape": ["S", "SE", "SEL", "Titanium", "ST-Line"],
  "Explorer": ["Base", "XLT", "Limited", "ST", "Platinum", "King Ranch"],
  "F-150": ["XL", "XLT", "Lariat", "King Ranch", "Platinum", "Limited", "Raptor"],
  "Maverick": ["XL", "XLT", "Lariat"],
  "Mustang": ["EcoBoost", "EcoBoost Premium", "GT", "GT Premium", "Mach 1", "Shelby GT500"],
  "Ranger": ["XL", "XLT", "Lariat"],
  "Accord": ["LX", "EX", "EX-L", "Sport", "Sport SE", "Touring"],
  "Civic": ["LX", "Sport", "EX", "EX-L", "Touring", "Si", "Type R"],
  "CR-V": ["LX", "EX", "EX-L", "Touring", "Hybrid"],
  "HR-V": ["LX", "Sport", "EX-L"],
  "Odyssey": ["LX", "EX", "EX-L", "Touring", "Elite"],
  "Passport": ["Sport", "EX-L", "TrailSport", "Elite"],
  "Pilot": ["LX", "EX", "EX-L", "Touring", "Elite", "TrailSport", "Black Edition"],
  "Ridgeline": ["Sport", "RTL", "RTL-E", "Black Edition"],
  "Elantra": ["SE", "SEL", "N Line", "Limited", "N"],
  "Ioniq 5": ["SE", "SEL", "Limited"],
  "Ioniq 6": ["SE", "SEL", "Limited"],
  "Kona": ["SE", "SEL", "N Line", "Limited", "N"],
  "Palisade": ["SE", "SEL", "XRT", "Limited", "Calligraphy"],
  "Santa Fe": ["SE", "SEL", "XRT", "Limited", "Calligraphy"],
  "Sonata": ["SE", "SEL", "SEL Plus", "N Line", "Limited"],
  "Tucson": ["SE", "SEL", "XRT", "N Line", "Limited"],
  "Cherokee": ["Latitude", "Latitude Plus", "Limited", "Trailhawk"],
  "Compass": ["Sport", "Latitude", "Limited", "Trailhawk"],
  "Gladiator": ["Sport", "Sport S", "Overland", "Rubicon", "Mojave"],
  "Grand Cherokee": ["Laredo", "Limited", "Overland", "Summit", "Trailhawk"],
  "Wagoneer": ["Series I", "Series II", "Series III"],
  "Wrangler": ["Sport", "Sport S", "Sahara", "Rubicon", "High Altitude"],
  "EV6": ["Light", "Wind", "GT-Line", "GT"],
  "Forte": ["FE", "LXS", "GT-Line", "GT"],
  "K5": ["LXS", "GT-Line", "EX", "GT"],
  "Seltos": ["LX", "S", "EX", "SX", "SX Turbo"],
  "Sorento": ["LX", "S", "EX", "SX", "SX Prestige", "X-Line"],
  "Soul": ["LX", "S", "EX", "GT-Line", "Turbo"],
  "Sportage": ["LX", "EX", "SX", "SX Prestige", "X-Line", "X-Pro"],
  "Stinger": ["GT-Line", "GT1", "GT2"],
  "Telluride": ["LX", "S", "EX", "SX", "SX Prestige", "X-Line", "X-Pro"],
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
  "CX-30": ["Base", "Select", "Preferred", "Premium", "Turbo", "Turbo Premium Plus"],
  "CX-5": ["Sport", "Select", "Preferred", "Premium", "Premium Plus", "Turbo", "Signature"],
  "CX-50": ["Select", "Preferred", "Premium", "Premium Plus", "Turbo", "Turbo Meridian"],
  "CX-9": ["Sport", "Touring", "Carbon Edition", "Grand Touring", "Signature"],
  "CX-90": ["Select", "Preferred", "Premium", "Premium Plus", "PHEV Premium Plus"],
  "Mazda3": ["Base", "Select", "Preferred", "Carbon Edition", "Premium", "Turbo", "Turbo Premium Plus"],
  "MX-5 Miata": ["Sport", "Club", "Grand Touring"],
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
  "911": ["Carrera", "Carrera S", "Carrera 4S", "Turbo", "Turbo S", "GT3"],
  "Boxster": ["Base", "S", "GTS", "Spyder"],
  "Cayenne": ["Base", "S", "E-Hybrid", "GTS", "Turbo", "Turbo GT"],
  "Cayman": ["Base", "S", "GTS", "GT4"],
  "Macan": ["Base", "S", "GTS", "Turbo"],
  "Panamera": ["Base", "4", "4S", "GTS", "Turbo", "Turbo S"],
  "Taycan": ["Base", "4S", "GTS", "Turbo", "Turbo S"],
  "1500": ["Tradesman", "Big Horn", "Laramie", "Rebel", "Limited", "TRX"],
  "2500": ["Tradesman", "Big Horn", "Laramie", "Power Wagon", "Limited"],
  "3500": ["Tradesman", "Big Horn", "Laramie", "Limited"],
  "Ascent": ["Base", "Premium", "Limited", "Touring", "Onyx Edition"],
  "Crosstrek": ["Base", "Premium", "Sport", "Limited"],
  "Forester": ["Base", "Premium", "Sport", "Limited", "Touring", "Wilderness"],
  "Impreza": ["Base", "Premium", "Sport", "Limited"],
  "Legacy": ["Base", "Premium", "Sport", "Limited", "Touring"],
  "Outback": ["Base", "Premium", "Limited", "Touring", "Onyx Edition XT", "Wilderness"],
  "Solterra": ["Premium", "Limited", "Touring"],
  "WRX": ["Base", "Premium", "Limited", "GT"],
  "Model 3": ["Standard Range Plus", "Long Range", "Performance"],
  "Model S": ["Long Range", "Plaid"],
  "Model X": ["Long Range", "Plaid"],
  "Model Y": ["Standard Range", "Long Range", "Performance"],
  "Cybertruck": ["Single Motor", "Dual Motor", "Tri Motor", "Cyberbeast"],
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
  "Atlas": ["S", "SE", "SE with Technology", "SEL", "SEL Premium"],
  "Golf": ["S", "SE", "R-Line"],
  "GTI": ["S", "SE", "Autobahn"],
  "ID.4": ["Standard", "Pro", "Pro S", "Pro S Plus"],
  "Jetta": ["S", "Sport", "SE", "SEL"],
  "Taos": ["S", "SE", "SEL"],
  "Tiguan": ["S", "SE", "SE R-Line", "SEL", "SEL R-Line"],
  "C40": ["Core", "Plus", "Ultimate", "Recharge"],
  "S60": ["Core", "Plus", "Ultimate", "Polestar Engineered"],
  "S90": ["Core", "Plus", "Ultimate"],
  "V60": ["Core", "Plus", "Ultimate", "Polestar Engineered"],
  "V90": ["Core", "Plus", "Ultimate"],
  "XC40": ["Core", "Plus", "Ultimate", "Recharge"],
  "XC60": ["Core", "Plus", "Ultimate", "Polestar Engineered"],
  "XC90": ["Core", "Plus", "Ultimate"],
  "default": ["Base", "Standard", "Premium", "Luxury", "Sport", "Limited"],
}

export const conditionOptions = [
  { value: "excellent", label: "Excellent", description: "Like new, no visible wear, all features work perfectly", multiplier: 1.1 },
  { value: "good", label: "Good", description: "Minor wear, small scratches, everything functions properly", multiplier: 1.0 },
  { value: "fair", label: "Fair", description: "Noticeable wear, some cosmetic issues, may need minor repairs", multiplier: 0.9 },
  { value: "poor", label: "Poor", description: "Significant wear, mechanical or body issues, needs work", multiplier: 0.75 },
]

export const TRADE_IN_DRAFT_KEY = "pm:trade-in-draft"

export interface TradeInOffer {
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

export interface FoundVehicle {
  year: number; make: string; model: string; trim: string
  vin: string; estimatedMileage: string; color: string
}

export interface InstantQuote { quoteId: string; vehicle: string; value: number }

interface TradeInContextValue {
  step: number; goToStep: (n: number) => void; nextStep: () => void; prevStep: () => void
  stepContentRef: React.RefObject<HTMLDivElement>
  lookupMethod: "plate" | "vin" | "manual"; setLookupMethod: (v: "plate" | "vin" | "manual") => void
  province: string; setProvince: (v: string) => void
  plateNumber: string; setPlateNumber: (v: string) => void
  vinNumber: string; setVinNumber: (v: string) => void
  isLookingUp: boolean; vehicleFound: boolean; foundVehicle: FoundVehicle | null
  handlePlateLookup: () => Promise<void>; handleVinLookup: () => Promise<void>
  selectedYear: string; setSelectedYear: (v: string) => void
  selectedMake: string; setSelectedMake: (v: string) => void
  selectedModel: string; setSelectedModel: (v: string) => void
  selectedTrim: string; setSelectedTrim: (v: string) => void
  mileage: string; setMileage: (v: string) => void
  condition: string; setCondition: (v: string) => void
  hasAccident: boolean; setHasAccident: (v: boolean) => void
  hasMechanicalIssues: boolean; setHasMechanicalIssues: (v: boolean) => void
  hasLien: boolean; setHasLien: (v: boolean) => void
  payoffAmount: string; setPayoffAmount: (v: string) => void
  additionalNotes: string; setAdditionalNotes: (v: string) => void
  photos: Record<string, { file: File; preview: string }>
  fileInputRefs: React.MutableRefObject<Record<string, HTMLInputElement | null>>
  handlePhotoUpload: (angle: string, file: File | null) => void
  removePhoto: (angle: string) => void
  email: string; phone: string; postalCode: string
  emailError: string; phoneError: string; postalCodeError: string
  handleEmailChange: (v: string) => void; handlePhoneChange: (v: string) => void; handlePostalCodeChange: (v: string) => void
  setEmail: (v: string) => void; setPhone: (v: string) => void
  offer: TradeInOffer | null; setOffer: (o: TradeInOffer | null) => void
  showOffer: boolean; setShowOffer: (v: boolean) => void
  isCalculating: boolean; calculationProgress: number; calculateOffer: () => Promise<void>
  showAcceptModal: boolean; setShowAcceptModal: (v: boolean) => void
  showApplyModal: boolean; setShowApplyModal: (v: boolean) => void
  showAuthModal: boolean; setShowAuthModal: (v: boolean) => void
  instantQuote: InstantQuote | null
}

const TradeInContext = createContext<TradeInContextValue | null>(null)

export function useTradeIn() {
  const ctx = useContext(TradeInContext)
  if (!ctx) throw new Error("useTradeIn must be used inside TradeInProvider")
  return ctx
}

export function TradeInProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [step, setStep] = useState(1)
  const draftLoadedRef = useRef(false)
  const stepContentRef = useRef<HTMLDivElement>(null)

  const scrollToStep = () => setTimeout(() => { stepContentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }) }, 100)
  const goToStep = (n: number) => { setStep(n); scrollToStep() }
  const nextStep = () => { setStep(s => Math.min(s + 1, 4)); scrollToStep() }
  const prevStep = () => { setStep(s => Math.max(s - 1, 1)); scrollToStep() }

  const [lookupMethod, setLookupMethod] = useState<"plate" | "vin" | "manual">("plate")
  const [province, setProvince] = useState("")
  const [plateNumber, setPlateNumber] = useState("")
  const [vinNumber, setVinNumber] = useState("")
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [vehicleFound, setVehicleFound] = useState(false)
  const [showOffer, setShowOffer] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculationProgress, setCalculationProgress] = useState(0)
  const [instantQuote, setInstantQuote] = useState<InstantQuote | null>(null)
  const [foundVehicle, setFoundVehicle] = useState<FoundVehicle | null>(null)
  const [selectedYear, setSelectedYear] = useState("")
  const [selectedMake, setSelectedMake] = useState("")
  const [selectedModel, setSelectedModel] = useState("")
  const [selectedTrim, setSelectedTrim] = useState("")
  const [mileage, setMileage] = useState("")
  const [condition, setCondition] = useState("good")
  const [hasAccident, setHasAccident] = useState(false)
  const [hasMechanicalIssues, setHasMechanicalIssues] = useState(false)
  const [hasLien, setHasLien] = useState(false)
  const [payoffAmount, setPayoffAmount] = useState("")
  const [additionalNotes, setAdditionalNotes] = useState("")
  const [photos, setPhotos] = useState<Record<string, { file: File; preview: string }>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [emailError, setEmailError] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [postalCodeError, setPostalCodeError] = useState("")
  const [offer, setOffer] = useState<TradeInOffer | null>(null)
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [showApplyModal, setShowApplyModal] = useState(false)

  useEffect(() => {
    const quoteId = searchParams.get("quote")
    const vehicle = searchParams.get("vehicle")
    const value = searchParams.get("value")
    const action = searchParams.get("action")
    if (quoteId && vehicle && value) {
      const parsedValue = parseInt(value) || 0
      setInstantQuote({ quoteId, vehicle: decodeURIComponent(vehicle), value: parsedValue })
      const parts = decodeURIComponent(vehicle).split(" ")
      if (parts.length >= 3) { setSelectedYear(parts[0]); setSelectedMake(parts[1]); setSelectedModel(parts.slice(2).join(" ")) }
      goToStep(2)
      if (action === "apply" && user) {
        setOffer({ quoteId, offerNumber: `PM-${Date.now().toString(36).toUpperCase()}`, vehicle: decodeURIComponent(vehicle), offerAmount: parsedValue, validUntil: new Date(Date.now() + 7*24*60*60*1000).toISOString().split("T")[0], mileage: "N/A", condition: "good", cbbValue: { low: parsedValue, mid: parsedValue, high: parsedValue }, adjustments: [], payoff: 0, equity: parsedValue, comparison: { privateSale: Math.round(parsedValue*1.1), dealerTrade: Math.round(parsedValue*0.9) } })
        setShowOffer(true)
        setTimeout(() => setShowApplyModal(true), 100)
      }
    } else if (vehicle && !quoteId) {
      const parts = decodeURIComponent(vehicle).split(" ")
      if (parts.length >= 3) { setSelectedYear(parts[0]); setSelectedMake(parts[1]); setSelectedModel(parts.slice(2).join(" ")) }
      else if (parts.length === 2) { setSelectedMake(parts[0]); setSelectedModel(parts[1]) }
      const mp = searchParams.get("mileage")
      if (mp) setMileage(mp.replace(/[^0-9]/g, ""))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, user])

  useEffect(() => {
    if (draftLoadedRef.current) return
    draftLoadedRef.current = true
    if (searchParams.get("quote") || searchParams.get("vehicle") || searchParams.get("value") || searchParams.get("mileage")) return
    try {
      const raw = window.localStorage.getItem(TRADE_IN_DRAFT_KEY)
      if (!raw) return
      const d = JSON.parse(raw) as Record<string, unknown>
      if (d.savedAt && Date.now() - new Date(d.savedAt as string).getTime() > 7*24*60*60*1000) { window.localStorage.removeItem(TRADE_IN_DRAFT_KEY); return }
      if (typeof d.step === "number" && d.step >= 1 && d.step <= 3) setStep(d.step as number)
      if (typeof d.lookupMethod === "string") setLookupMethod(d.lookupMethod as "plate"|"vin"|"manual")
      if (typeof d.selectedYear === "string") setSelectedYear(d.selectedYear)
      if (typeof d.selectedMake === "string") setSelectedMake(d.selectedMake)
      if (typeof d.selectedModel === "string") setSelectedModel(d.selectedModel)
      if (typeof d.selectedTrim === "string") setSelectedTrim(d.selectedTrim)
      if (typeof d.mileage === "string") setMileage(d.mileage)
      if (typeof d.condition === "string") setCondition(d.condition)
      if (typeof d.hasAccident === "boolean") setHasAccident(d.hasAccident)
      if (typeof d.hasMechanicalIssues === "boolean") setHasMechanicalIssues(d.hasMechanicalIssues)
      if (typeof d.hasLien === "boolean") setHasLien(d.hasLien)
      if (typeof d.payoffAmount === "string") setPayoffAmount(d.payoffAmount)
      if (typeof d.additionalNotes === "string") setAdditionalNotes(d.additionalNotes)
      if (typeof d.email === "string") setEmail(d.email)
      if (typeof d.phone === "string") setPhone(d.phone)
      if (typeof d.postalCode === "string") setPostalCode(d.postalCode)
      if (typeof d.vinNumber === "string") setVinNumber(d.vinNumber)
    } catch (err) { console.error("Failed to restore trade-in draft:", err) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!draftLoadedRef.current) return
    const t = window.setTimeout(() => {
      try {
        if (!(selectedYear || selectedMake || mileage || email || vinNumber)) return
        window.localStorage.setItem(TRADE_IN_DRAFT_KEY, JSON.stringify({ step, lookupMethod, selectedYear, selectedMake, selectedModel, selectedTrim, mileage, condition, hasAccident, hasMechanicalIssues, hasLien, payoffAmount, additionalNotes, email, phone, postalCode, vinNumber, savedAt: new Date().toISOString() }))
      } catch (err) { console.error("Failed to save trade-in draft:", err) }
    }, 500)
    return () => window.clearTimeout(t)
  }, [step, lookupMethod, selectedYear, selectedMake, selectedModel, selectedTrim, mileage, condition, hasAccident, hasMechanicalIssues, hasLien, payoffAmount, additionalNotes, email, phone, postalCode, vinNumber])

  const handleEmailChange = (v: string) => { setEmail(v); if (v && !v.includes("@")) setEmailError("Email must include @ symbol"); else if (v && !isValidEmail(v)) setEmailError("Please enter a valid email address"); else setEmailError("") }
  const handlePhoneChange = (v: string) => { const f = formatCanadianPhoneNumber(v); setPhone(f); const d = v.replace(/\D/g,""); if (d.length>0&&d.length<10) setPhoneError("Please enter a complete 10-digit phone number"); else if (d.length>=10&&!isValidCanadianPhoneNumber(f)) setPhoneError("Please enter a valid Canadian phone number"); else setPhoneError("") }
  const handlePostalCodeChange = (v: string) => { const f = formatCanadianPostalCode(v); setPostalCode(f); const c = v.replace(/\s/g,""); if (c.length>0&&c.length<6) setPostalCodeError("Please enter a complete postal code (e.g., L4C 2G1)"); else if (c.length>=6&&!isValidCanadianPostalCode(f)) setPostalCodeError("Please enter a valid Canadian postal code"); else setPostalCodeError("") }

  const handlePhotoUpload = (angle: string, file: File | null) => { if (!file||!file.type.startsWith("image/")||file.size>10*1024*1024) return; const r = new FileReader(); r.onloadend = () => setPhotos(p => ({...p,[angle]:{file,preview:r.result as string}})); r.readAsDataURL(file) }
  const removePhoto = (angle: string) => setPhotos(p => { const n={...p}; delete n[angle]; return n })

  const handlePlateLookup = async () => { setIsLookingUp(true); await new Promise(r=>setTimeout(r,2000)); setVehicleFound(true); setFoundVehicle({year:2021,make:"Honda",model:"Accord",trim:"Sport 2.0T",vin:"1HGCV2F34MA012345",estimatedMileage:"45,000",color:"Crystal Black Pearl"}); setSelectedYear("2021"); setSelectedMake("Honda"); setSelectedModel("Accord"); setSelectedTrim("Sport 2.0T"); setMileage("45000"); setIsLookingUp(false) }

  const handleVinLookup = async () => {
    setIsLookingUp(true)
    try {
      const res = await fetch(`/api/v1/trade-in/vin-decode?vin=${encodeURIComponent(vinNumber)}`)
      const data = await res.json()
      if (data.success && data.vehicle) { const v=data.vehicle; setVehicleFound(true); setFoundVehicle({year:parseInt(v.year)||0,make:v.make,model:v.model,trim:v.trim,vin:v.vin,estimatedMileage:"",color:""}); setSelectedYear(v.year); setSelectedMake(v.make); setSelectedModel(v.model); if(v.trim) setSelectedTrim(v.trim) }
      else { setVehicleFound(false); setFoundVehicle(null); alert(data.error||"Could not decode this VIN. Please check and try again.") }
    } catch { alert("Failed to look up VIN. Please try again or enter details manually.") }
    finally { setIsLookingUp(false) }
  }

  const calcFallback = () => {
    const age = new Date().getFullYear()-parseInt(selectedYear); const km=parseInt(mileage.replace(/,/g,""))||50000
    const base: Record<string,number> = {"BMW":45000,"Mercedes-Benz":48000,"Audi":45000,"Lexus":42000,"Tesla":55000,"Porsche":70000,"Toyota":28000,"Honda":28000,"Volkswagen":27000,"Hyundai":25000,"Kia":25000,"Ford":30000,"Chevrolet":28000,"Jeep":32000,"Ram":40000,"Subaru":28000}
    let v=base[selectedMake]||28000
    for(let y=0;y<age;y++){if(y===0)v*=0.80;else if(y<3)v*=0.88;else if(y<6)v*=0.90;else v*=0.92}
    if(km>age*20000)v-=(km-age*20000)*0.05
    const cm=({excellent:1.10,good:1.0,fair:0.85,poor:0.65} as Record<string,number>)[condition]||1.0
    v=Math.max(500,Math.round(v*cm/50)*50)
    return {low:Math.round(v*0.90/50)*50,mid:v,high:Math.round(v*1.10/50)*50}
  }

  const calculateOffer = async () => {
    setIsCalculating(true); setCalculationProgress(0)
    const iv=setInterval(()=>setCalculationProgress(p=>Math.min(p+5,90)),300)
    let lo:number,mi:number,hi:number
    try {
      const res=await fetch("/api/vehicle-valuation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({year:selectedYear,make:selectedMake,model:selectedModel,trim:selectedTrim,mileage,condition,postalCode})})
      clearInterval(iv); setCalculationProgress(100)
      if(res.ok){const val=await res.json();lo=val.lowValue;mi=val.midValue;hi=val.highValue}
      else{const f=calcFallback();lo=f.low;mi=f.mid;hi=f.high}
    } catch { clearInterval(iv); setCalculationProgress(100); const f=calcFallback();lo=f.low;mi=f.mid;hi=f.high }
    if(hasAccident){lo=Math.round(lo*0.85);mi=Math.round(mi*0.85);hi=Math.round(hi*0.85)}
    if(hasMechanicalIssues){lo=Math.round(lo*0.92);mi=Math.round(mi*0.92);hi=Math.round(hi*0.92)}
    lo=Math.round(lo/50)*50;mi=Math.round(mi/50)*50;hi=Math.round(hi/50)*50
    const eq=hasLien&&payoffAmount?mi-parseFloat(payoffAmount):mi
    setOffer({quoteId:`PQ-${Date.now().toString(36).toUpperCase()}`,offerNumber:`PM-${Date.now().toString(36).toUpperCase()}`,vehicle:`${selectedYear} ${selectedMake} ${selectedModel} ${selectedTrim}`.trim(),mileage,condition,cbbValue:{low:lo,mid:mi,high:hi},adjustments:[hasAccident&&{reason:"Accident history",amount:Math.round(-(mi*0.15))},hasMechanicalIssues&&{reason:"Mechanical issues",amount:Math.round(-(mi*0.08))}].filter(Boolean),offerAmount:mi,payoff:hasLien?parseFloat(payoffAmount)||0:0,equity:eq,validUntil:new Date(Date.now()+7*24*60*60*1000).toLocaleDateString("en-CA"),comparison:{privateSale:Math.round(mi*1.15/50)*50,dealerTrade:Math.round(mi*0.88/50)*50}})
    setIsCalculating(false); setShowOffer(true)
  }

  return (
    <TradeInContext.Provider value={{ step,goToStep,nextStep,prevStep,stepContentRef,lookupMethod,setLookupMethod,province,setProvince,plateNumber,setPlateNumber,vinNumber,setVinNumber,isLookingUp,vehicleFound,foundVehicle,handlePlateLookup,handleVinLookup,selectedYear,setSelectedYear,selectedMake,setSelectedMake,selectedModel,setSelectedModel,selectedTrim,setSelectedTrim,mileage,setMileage,condition,setCondition,hasAccident,setHasAccident,hasMechanicalIssues,setHasMechanicalIssues,hasLien,setHasLien,payoffAmount,setPayoffAmount,additionalNotes,setAdditionalNotes,photos,fileInputRefs,handlePhotoUpload,removePhoto,email,phone,postalCode,emailError,phoneError,postalCodeError,handleEmailChange,handlePhoneChange,handlePostalCodeChange,setEmail,setPhone,offer,setOffer,showOffer,setShowOffer,isCalculating,calculationProgress,calculateOffer,showAcceptModal,setShowAcceptModal,showApplyModal,setShowApplyModal,showAuthModal,setShowAuthModal,instantQuote }}>
      {children}
    </TradeInContext.Provider>
  )
}
