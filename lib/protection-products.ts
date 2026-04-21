import {
  Shield,
  FileText,
  Car,
  LockKeyhole,
  PaintBucket,
  Sparkles,
  Droplets,
  CircleDot,
  Sun,
} from "lucide-react"

export interface ProtectionProduct {
  slug: string
  name: string
  shortName: string
  tagline: string
  description: string
  icon: typeof Shield
  heroDescription: string
  howItWorks: { step: number; title: string; description: string }[]
  covered: string[]
  notCovered: string[]
  benefits: { title: string; description: string }[]
  faqs: { question: string; answer: string }[]
  ctaText: string
  seo: {
    title: string
    description: string
    keywords: string[]
  }
}

export const PROTECTION_PRODUCTS: ProtectionProduct[] = [
  {
    slug: "gap-coverage",
    name: "Companion GAP Coverage",
    shortName: "GAP Coverage",
    tagline: "Never owe more than your car is worth",
    description: "Covers the difference between your car's value and what you owe if it's totaled or stolen.",
    icon: Shield,
    heroDescription:
      "If your vehicle is totaled or stolen, your insurance pays the current market value — but that's often less than what you owe on your loan. Companion GAP Coverage bridges the gap so you're never stuck paying for a car you can't drive.",
    howItWorks: [
      { step: 1, title: "Incident Occurs", description: "Your vehicle is declared a total loss due to collision, theft, fire, or other covered peril." },
      { step: 2, title: "Insurance Pays Out", description: "Your auto insurer pays the vehicle's current market value — which depreciates the moment you drive off the lot." },
      { step: 3, title: "GAP Covers the Rest", description: "Companion GAP Coverage pays the remaining balance on your loan or lease, so you owe nothing out of pocket." },
    ],
    covered: [
      "Difference between insurance payout and loan/lease balance",
      "Theft or total loss due to collision, fire, or other covered peril",
      "Lease gap amount if applicable",
      "Coverage for the full length of your loan or lease",
      "Automatic attachment to your financing agreement",
    ],
    notCovered: [
      "Deductibles on your insurance policy",
      "Missed or late loan payments",
      "Regular maintenance or mechanical repairs",
      "Voluntary surrender of the vehicle",
      "Negative equity rolled over from a previous loan",
    ],
    benefits: [
      { title: "Financial Security", description: "Protects your finances from large unexpected bills after a total loss event." },
      { title: "Peace of Mind", description: "Drive knowing you won't owe more than your car is worth — ever." },
      { title: "Easy & Automatic", description: "Coverage attaches directly to your financing agreement with zero hassle." },
      { title: "Full-Term Protection", description: "Active for the full length of your loan or lease — no gaps in coverage." },
    ],
    faqs: [
      { question: "What is GAP insurance?", answer: "GAP (Guaranteed Asset Protection) insurance covers the difference between your vehicle's actual cash value and the outstanding balance on your auto loan or lease if the vehicle is totaled or stolen." },
      { question: "Who needs GAP coverage?", answer: "Anyone with a car loan or lease where the balance could exceed the vehicle's market value — which is common in the first 2-3 years of ownership due to rapid depreciation." },
      { question: "How much does GAP coverage cost?", answer: "GAP coverage through Planet Motors is competitively priced and can be bundled with your PlanetCare protection package for additional savings. Contact us for a personalized quote." },
      { question: "Does GAP coverage replace auto insurance?", answer: "No. GAP coverage supplements your existing auto insurance. You still need comprehensive and collision coverage — GAP covers what your insurance doesn't after a total loss." },
      { question: "Is GAP coverage transferable?", answer: "Yes, Companion GAP Coverage is fully transferable to a new owner if you sell or trade in your vehicle, which can increase its resale value." },
    ],
    ctaText: "Get GAP Coverage Quote",
    seo: {
      title: "Companion GAP Coverage | Protect Your Auto Loan | Planet Motors",
      description: "GAP insurance covers the difference between your car's value and what you owe. Protect yourself from financial loss after a total loss or theft. Available at Planet Motors Richmond Hill.",
      keywords: ["GAP insurance Canada", "GAP coverage Ontario", "auto loan protection", "negative equity protection", "Planet Motors GAP"],
    },
  },
  {
    slug: "extended-warranty",
    name: "Extended Vehicle Warranty",
    shortName: "Extended Warranty",
    tagline: "Comprehensive mechanical breakdown protection",
    description: "Comprehensive mechanical breakdown protection after manufacturer warranty expires.",
    icon: FileText,
    heroDescription:
      "When your manufacturer warranty expires, you're one breakdown away from a costly repair bill. Our Extended Vehicle Warranty covers major mechanical and electrical components — so you drive with confidence, not anxiety.",
    howItWorks: [
      { step: 1, title: "Choose Your Plan", description: "Select from multiple coverage levels based on your vehicle's age, mileage, and your budget." },
      { step: 2, title: "Drive With Confidence", description: "Your vehicle is protected against unexpected mechanical and electrical breakdowns." },
      { step: 3, title: "File a Claim Easily", description: "When a covered component fails, visit any licensed repair facility. We pay the shop directly — no out-of-pocket stress." },
    ],
    covered: [
      "Engine and transmission components",
      "Electrical systems and wiring",
      "Heating and air conditioning",
      "Steering and suspension",
      "Fuel delivery and emissions systems",
      "Braking system components",
      "24/7 roadside assistance",
      "Rental car reimbursement",
      "Trip interruption coverage",
    ],
    notCovered: [
      "Pre-existing conditions at time of purchase",
      "Regular maintenance items (oil, filters, brakes pads)",
      "Cosmetic damage or wear items",
      "Damage from accidents or misuse",
      "Modifications or aftermarket parts",
    ],
    benefits: [
      { title: "Zero Deductible Options", description: "Choose a plan with $0 deductible so you pay nothing when a covered repair is needed." },
      { title: "Any Licensed Repair Shop", description: "Not limited to a specific network — use any licensed mechanic or dealership in Canada." },
      { title: "Roadside Assistance", description: "24/7 roadside help including towing, flat tire changes, battery boosts, and lockout service." },
      { title: "Transferable Coverage", description: "Increase your vehicle's resale value with warranty coverage that transfers to the next owner." },
    ],
    faqs: [
      { question: "Is an extended warranty worth it on a used car?", answer: "Yes — the average major repair on a modern vehicle costs $1,500–$4,000. An extended warranty can save you thousands and eliminates the financial uncertainty of unexpected breakdowns." },
      { question: "What's the difference between a manufacturer warranty and an extended warranty?", answer: "A manufacturer warranty comes with new vehicles and covers defects for a limited time. An extended warranty continues coverage after the manufacturer warranty expires, protecting against mechanical breakdowns." },
      { question: "Can I use any mechanic?", answer: "Yes. Our Extended Vehicle Warranty is honored at any licensed repair facility across Canada. We pay the shop directly so you don't have to handle reimbursement." },
      { question: "How long does coverage last?", answer: "Coverage terms vary by plan and vehicle. Options range from 1 year to 5+ years or by mileage limits. Contact us for a plan tailored to your vehicle." },
      { question: "Are there mileage limits?", answer: "Some plans include mileage caps while others offer unlimited mileage. We'll help you choose the right plan based on your driving habits." },
    ],
    ctaText: "Get Warranty Quote",
    seo: {
      title: "Extended Vehicle Warranty | Mechanical Breakdown Protection | Planet Motors",
      description: "Protect your used car with an extended warranty from Planet Motors. Covers engine, transmission, electrical, A/C, and more. Zero deductible options available in Richmond Hill, Ontario.",
      keywords: ["extended car warranty Canada", "used car warranty Ontario", "mechanical breakdown protection", "vehicle service contract", "Planet Motors warranty"],
    },
  },
  {
    slug: "incident-pro",
    name: "IncidentPro Protection",
    shortName: "IncidentPro",
    tagline: "Total loss and theft protection with fast claims",
    description: "Protection against accidents, theft, and total loss events with fast claims processing.",
    icon: Car,
    heroDescription:
      "Accidents happen. When they do, IncidentPro ensures your vehicle is replaced — not just insured. Get new-for-old replacement coverage, job loss protection, and payment coverage during disability, all in one plan.",
    howItWorks: [
      { step: 1, title: "Incident Happens", description: "Your vehicle is involved in an accident, theft, or total loss event covered under your plan." },
      { step: 2, title: "File Your Claim", description: "Contact our 24/7 claims team. We guide you through the process and handle the paperwork." },
      { step: 3, title: "Get Replaced, Not Just Paid", description: "Receive a replacement vehicle of equal value — not a depreciated payout. Drive away protected." },
    ],
    covered: [
      "New-for-old vehicle replacement up to $60,000",
      "Total loss from collision or accident",
      "Theft and attempted theft",
      "Fire, flood, and natural disaster damage",
      "Job loss payment protection (up to 12 months)",
      "Disability payment coverage",
      "Loan clearance on death or critical illness",
    ],
    notCovered: [
      "Mechanical breakdowns (covered by Extended Warranty)",
      "Cosmetic damage that doesn't affect drivability",
      "Intentional damage or fraud",
      "Driving under the influence incidents",
      "Vehicles used for commercial purposes without disclosure",
    ],
    benefits: [
      { title: "New-for-Old Replacement", description: "Your car is replaced with one of equal value — not a depreciated insurance cheque." },
      { title: "Job Loss Protection", description: "If you lose your job, your vehicle payments are covered for up to 12 months." },
      { title: "Life & Critical Illness", description: "Loan clearance up to $1M on death and $500K on critical illness diagnosis." },
      { title: "Fast Claims Processing", description: "Our dedicated claims team processes your claim quickly so you're back on the road fast." },
    ],
    faqs: [
      { question: "How is IncidentPro different from auto insurance?", answer: "Auto insurance pays the depreciated market value of your car. IncidentPro replaces your vehicle with one of equal value and provides additional protections like job loss coverage and critical illness loan clearance." },
      { question: "What does 'new-for-old replacement' mean?", answer: "If your vehicle is written off, we replace it with a comparable vehicle of the same value — not a depreciated cash payout like traditional insurance." },
      { question: "Does IncidentPro cover job loss?", answer: "Yes. If you involuntarily lose your job, IncidentPro covers your vehicle payments for up to 12 months, giving you breathing room during a difficult time." },
      { question: "Can I bundle IncidentPro with other protections?", answer: "Absolutely. IncidentPro is included in our PlanetCare Smart Secure and Life Proof packages, or can be purchased as a standalone product." },
    ],
    ctaText: "Get IncidentPro Quote",
    seo: {
      title: "IncidentPro Vehicle Protection | Replacement Coverage | Planet Motors",
      description: "IncidentPro provides new-for-old vehicle replacement, job loss protection, and critical illness loan clearance. Superior to traditional insurance. Planet Motors Richmond Hill.",
      keywords: ["vehicle replacement coverage", "total loss protection Canada", "job loss car payment protection", "IncidentPro", "Planet Motors protection"],
    },
  },
  {
    slug: "anti-theft",
    name: "InvisiTrak Anti-Theft System",
    shortName: "Anti-Theft",
    tagline: "GPS tracking and theft recovery with 24/7 monitoring",
    description: "GPS tracking and theft recovery system with 24/7 monitoring and mobile alerts.",
    icon: LockKeyhole,
    heroDescription:
      "Vehicle theft in Canada has surged 34% since 2021. InvisiTrak provides invisible GPS tracking, 24/7 professional monitoring, and rapid police coordination — giving you the best chance of recovering your vehicle if it's stolen.",
    howItWorks: [
      { step: 1, title: "Hidden Installation", description: "InvisiTrak is professionally installed in a concealed location in your vehicle — thieves can't find it or disable it." },
      { step: 2, title: "24/7 GPS Monitoring", description: "Your vehicle's location is tracked around the clock. Get instant alerts if unauthorized movement is detected." },
      { step: 3, title: "Rapid Recovery", description: "If stolen, our monitoring centre coordinates directly with police for rapid location and recovery of your vehicle." },
    ],
    covered: [
      "Professional concealed GPS device installation",
      "24/7 satellite-based GPS tracking",
      "Real-time mobile app alerts and notifications",
      "Unauthorized movement detection",
      "Direct police coordination for rapid recovery",
      "Battery backup — works even if car battery is disconnected",
      "Coverage across Canada and the US",
    ],
    notCovered: [
      "Vehicle damage that occurs during theft",
      "Personal belongings stolen from the vehicle",
      "Tracking in areas without cellular coverage",
      "Physical damage to the tracking device from accidents",
    ],
    benefits: [
      { title: "Theft Deterrent", description: "Vehicles with tracking systems are far less likely to be targeted by organized theft rings." },
      { title: "Insurance Savings", description: "Many insurers offer premium discounts for vehicles equipped with GPS tracking systems." },
      { title: "Peace of Mind", description: "Know where your vehicle is at all times through the InvisiTrak mobile app." },
      { title: "Recovery Rate", description: "Vehicles with GPS tracking have a significantly higher recovery rate than those without." },
    ],
    faqs: [
      { question: "How does InvisiTrak help prevent theft?", answer: "InvisiTrak uses concealed GPS technology that thieves can't find or disable. If your vehicle is stolen, our monitoring centre immediately coordinates with police for rapid recovery." },
      { question: "Will InvisiTrak lower my insurance premiums?", answer: "Many Canadian insurance companies offer discounts for vehicles equipped with approved anti-theft tracking devices. Check with your insurer — savings can be significant." },
      { question: "Does the system work if the car battery is disconnected?", answer: "Yes. InvisiTrak has a built-in battery backup that continues tracking even if the vehicle's main battery is disconnected or removed." },
      { question: "Can I track my vehicle from my phone?", answer: "Yes. The InvisiTrak mobile app lets you check your vehicle's location in real-time, set geofence alerts, and receive notifications of unauthorized movement." },
    ],
    ctaText: "Get Anti-Theft Quote",
    seo: {
      title: "InvisiTrak Anti-Theft GPS Tracking | Vehicle Recovery | Planet Motors",
      description: "Protect your vehicle with InvisiTrak GPS tracking and 24/7 monitoring. Concealed installation, rapid police coordination, and mobile alerts. Planet Motors Richmond Hill.",
      keywords: ["car anti-theft system Canada", "GPS vehicle tracking Ontario", "InvisiTrak", "stolen car recovery", "vehicle security system"],
    },
  },
  {
    slug: "paint-protection",
    name: "Paint Protection Film",
    shortName: "Paint Protection",
    tagline: "Invisible armor for your vehicle's finish",
    description: "Clear protective film that shields your paint from chips, scratches, and UV damage.",
    icon: PaintBucket,
    heroDescription:
      "Your vehicle's paint is under constant assault — road debris, gravel, UV rays, bird droppings, and harsh Canadian winters. Our Paint Protection Film (PPF) creates an invisible, self-healing barrier that keeps your finish showroom-perfect for years.",
    howItWorks: [
      { step: 1, title: "Surface Preparation", description: "Your vehicle's paint is meticulously cleaned, decontaminated, and polished to a perfect base." },
      { step: 2, title: "Precision Application", description: "Computer-cut PPF is applied by certified installers to high-impact areas or the full vehicle body." },
      { step: 3, title: "Self-Healing Protection", description: "The film's thermoplastic urethane technology self-heals minor scratches with heat, maintaining a flawless finish." },
    ],
    covered: [
      "Rock chips and road debris impact",
      "Scratches from minor contact",
      "UV damage and oxidation prevention",
      "Bug splatter and bird dropping stains",
      "Road salt and chemical damage",
      "Self-healing technology for minor swirl marks",
      "Professional installation warranty",
    ],
    notCovered: [
      "Deep scratches or dents from collisions",
      "Pre-existing paint damage or imperfections",
      "Damage from power washers at close range",
      "Film degradation from improper maintenance",
    ],
    benefits: [
      { title: "Invisible Protection", description: "Crystal-clear film that's virtually undetectable — protects without changing your vehicle's appearance." },
      { title: "Self-Healing Technology", description: "Minor scratches and swirl marks disappear with heat from the sun or warm water." },
      { title: "Resale Value", description: "Preserve your vehicle's original paint in perfect condition, maximizing its resale value." },
      { title: "Long-Lasting", description: "Premium films last 7-10 years with proper maintenance, outlasting any wax or coating." },
    ],
    faqs: [
      { question: "Will paint protection film change how my car looks?", answer: "No. Modern PPF is virtually invisible and maintains your vehicle's original gloss and colour. Most people can't tell it's there — but the protection is undeniable." },
      { question: "How long does paint protection film last?", answer: "Premium paint protection film typically lasts 7-10 years with proper care. It's covered by a manufacturer warranty against yellowing, cracking, and peeling." },
      { question: "Can PPF be removed?", answer: "Yes. Professional-grade PPF can be safely removed without damaging the underlying paint. This is especially valuable when selling or trading in your vehicle." },
      { question: "Which areas should I protect?", answer: "At minimum, we recommend the hood, front bumper, fenders, and side mirrors — these are the highest-impact areas. Full vehicle wraps offer complete protection." },
    ],
    ctaText: "Get PPF Quote",
    seo: {
      title: "Paint Protection Film (PPF) | Self-Healing Clear Bra | Planet Motors",
      description: "Protect your car's paint with premium paint protection film. Self-healing technology, UV protection, and invisible armor against chips and scratches. Planet Motors Richmond Hill.",
      keywords: ["paint protection film Canada", "PPF Ontario", "clear bra car", "self-healing film", "car paint protection Richmond Hill"],
    },
  },
  {
    slug: "replacement-warranty",
    name: "Replacement Warranty Plan",
    shortName: "Replacement Warranty",
    tagline: "New-for-old vehicle replacement if your car is written off",
    description: "New-for-old vehicle replacement if your car is written off within coverage period.",
    icon: Sparkles,
    heroDescription:
      "If your vehicle is written off, standard insurance gives you its depreciated value — often thousands less than what you paid. Our Replacement Warranty Plan replaces your vehicle with one of comparable value, so you're never left short.",
    howItWorks: [
      { step: 1, title: "Vehicle Write-Off", description: "Your vehicle is declared a total loss by your insurance company due to accident, theft, or other covered event." },
      { step: 2, title: "Claim Filed", description: "Contact us and we coordinate with your insurance company. No complicated paperwork for you." },
      { step: 3, title: "Vehicle Replaced", description: "You receive a replacement vehicle of comparable value — not a depreciated cheque. Back on the road quickly." },
    ],
    covered: [
      "New-for-old replacement up to covered value",
      "Total loss from collision or accident",
      "Theft where vehicle is not recovered",
      "Fire, vandalism, and natural disaster",
      "Zero deductible on replacement claim",
    ],
    notCovered: [
      "Partial damage or repairs (covered by warranty)",
      "Mechanical breakdown (covered by Extended Warranty)",
      "Depreciation claims without total loss",
      "Vehicles used for undisclosed commercial purposes",
    ],
    benefits: [
      { title: "True Replacement Value", description: "Get a vehicle of equal value — not a depreciated insurance payout." },
      { title: "Zero Deductible", description: "No out-of-pocket costs when filing a replacement claim." },
      { title: "Transferable", description: "Coverage transfers to new owners, adding value when you sell or trade." },
      { title: "Canada-Wide Coverage", description: "Protection that covers you anywhere in Canada." },
    ],
    faqs: [
      { question: "How does replacement warranty differ from regular insurance?", answer: "Regular insurance pays the current market value of your vehicle — which decreases every year. Replacement warranty pays what's needed to replace your vehicle with one of comparable value." },
      { question: "What qualifies as a 'total loss'?", answer: "A total loss is when your insurance company determines that the cost to repair your vehicle exceeds its market value. At that point, replacement warranty kicks in." },
      { question: "Is there a deductible?", answer: "No. Our Replacement Warranty Plan has a zero deductible — you pay nothing out of pocket when filing a claim." },
      { question: "How long is coverage active?", answer: "Coverage terms are customized to your vehicle and needs. Contact us for specific term options and pricing." },
    ],
    ctaText: "Get Replacement Warranty Quote",
    seo: {
      title: "Vehicle Replacement Warranty | New-for-Old Coverage | Planet Motors",
      description: "Get new-for-old vehicle replacement if your car is written off. Zero deductible, transferable coverage. Better than insurance depreciation payouts. Planet Motors Richmond Hill.",
      keywords: ["vehicle replacement warranty", "new for old car replacement", "total loss protection Ontario", "car replacement coverage Canada"],
    },
  },
  {
    slug: "rust-protection",
    name: "Rust Protection Coating",
    shortName: "Rust Protection",
    tagline: "Professional-grade undercoating for Canadian winters",
    description: "Professional-grade undercoating to prevent rust and corrosion from Canadian winters.",
    icon: Droplets,
    heroDescription:
      "Canadian roads are treated with millions of tonnes of salt every winter. Without protection, that salt attacks your vehicle's undercarriage, wheel wells, and body panels — causing rust that destroys structural integrity and resale value. Our rust protection coating creates a permanent barrier.",
    howItWorks: [
      { step: 1, title: "Thorough Inspection", description: "We inspect your vehicle's undercarriage, wheel wells, and body panels to assess current condition." },
      { step: 2, title: "Professional Application", description: "Multi-layer rust inhibitor and undercoating is applied to all vulnerable areas using specialized equipment." },
      { step: 3, title: "Ongoing Protection", description: "The coating creates a permanent moisture and salt barrier that prevents corrosion from forming." },
    ],
    covered: [
      "Full undercarriage rust protection coating",
      "Wheel well and fender protection",
      "Exposed metal surface treatment",
      "Salt and moisture barrier application",
      "Professional-grade rust inhibitor",
      "Application warranty against peeling or cracking",
    ],
    notCovered: [
      "Pre-existing rust damage or corrosion",
      "Cosmetic body panel rust (surface only)",
      "Damage from off-road use or impacts",
      "Areas not accessible during standard application",
    ],
    benefits: [
      { title: "Structural Protection", description: "Prevents rust from compromising your vehicle's structural integrity — critical for safety." },
      { title: "Resale Value", description: "A rust-free undercarriage significantly increases your vehicle's resale or trade-in value." },
      { title: "Canadian Winter Ready", description: "Specifically formulated to withstand road salt, calcium chloride, and harsh winter conditions." },
      { title: "One-Time Application", description: "Applied once with long-lasting protection — no repeated treatments needed." },
    ],
    faqs: [
      { question: "Does my new car need rust protection?", answer: "Yes. While modern vehicles have better factory rust protection than ever, Canadian road salt is extremely aggressive. Additional undercoating provides essential protection that factory coatings alone can't match." },
      { question: "When is the best time to apply rust protection?", answer: "Ideally, before your first winter — when the vehicle is new or recently purchased. However, rust protection can be applied at any time as long as there's no existing corrosion." },
      { question: "How long does rust protection last?", answer: "Our professional-grade coating provides long-lasting protection. The exact duration depends on driving conditions, but most applications last the life of normal vehicle ownership." },
      { question: "Is rust protection worth it in Canada?", answer: "Absolutely. Canadian municipalities use over 5 million tonnes of road salt annually. Rust damage is the leading cause of premature vehicle retirement in Canada — protection pays for itself many times over." },
    ],
    ctaText: "Get Rust Protection Quote",
    seo: {
      title: "Rust Protection Coating & Undercoating | Canadian Winter Ready | Planet Motors",
      description: "Professional rust protection coating and undercoating for Canadian winters. Prevent road salt corrosion and preserve your vehicle's structural integrity. Planet Motors Richmond Hill.",
      keywords: ["rust protection Canada", "car undercoating Ontario", "rust proofing", "winter car protection", "road salt protection"],
    },
  },
  {
    slug: "tire-rim-protection",
    name: "Tire and Rim Protection",
    shortName: "Tire & Rim",
    tagline: "Coverage for potholes, nails, curb damage, and road hazards",
    description: "Coverage for damage from potholes, nails, curb impact, and road hazards.",
    icon: CircleDot,
    heroDescription:
      "Canadian roads are tough on tires and rims. Potholes, construction debris, nails, and curb damage can cost hundreds per tire and thousands per rim to replace. Tire & Rim Protection covers these unexpected costs so you're never stranded with a surprise bill.",
    howItWorks: [
      { step: 1, title: "Road Hazard Strikes", description: "You hit a pothole, nail, curb, or road debris that damages your tire or rim beyond repair." },
      { step: 2, title: "Visit Any Tire Shop", description: "Take your vehicle to any licensed tire retailer or repair facility — no restricted network." },
      { step: 3, title: "We Cover the Bill", description: "Your damaged tire or rim is repaired or replaced at no cost to you. No deductible, unlimited claims." },
    ],
    covered: [
      "Tire damage from potholes and road hazards",
      "Nail and puncture damage beyond repair",
      "Rim damage from curb impact or potholes",
      "Bent or cracked alloy wheels",
      "Unlimited claims during coverage period",
      "No deductible on any claim",
      "Coverage at any licensed tire retailer",
    ],
    notCovered: [
      "Normal tire wear from regular driving",
      "Cosmetic curb rash that doesn't affect function",
      "Damage from racing or off-road use",
      "Tires below minimum tread depth at time of damage",
    ],
    benefits: [
      { title: "No Deductible", description: "Zero out-of-pocket cost for every covered tire or rim repair or replacement." },
      { title: "Unlimited Kilometres", description: "Coverage isn't limited by mileage — drive as much as you want, you're protected." },
      { title: "Any Tire Shop", description: "Use any licensed tire retailer or repair facility. No restricted dealer network." },
      { title: "Canadian Road Ready", description: "Designed for the reality of Canadian roads — potholes, frost heaves, and construction zones." },
    ],
    faqs: [
      { question: "How many claims can I make?", answer: "There's no limit on the number of claims during your coverage period. Whether it's your first pothole or your fifth, you're covered every time." },
      { question: "Do I have to use a specific tire shop?", answer: "No. You can visit any licensed tire retailer or repair facility. We'll reimburse the repair or replacement cost directly." },
      { question: "Does this cover cosmetic curb rash?", answer: "Tire & Rim Protection covers functional damage — cracked, bent, or structurally compromised wheels and tires damaged beyond repair. Minor cosmetic scratches are not covered." },
      { question: "Is there a deductible?", answer: "No. Every covered claim has a $0 deductible. You pay nothing for covered tire and rim repairs or replacements." },
    ],
    ctaText: "Get Tire & Rim Quote",
    seo: {
      title: "Tire and Rim Protection | Pothole & Road Hazard Coverage | Planet Motors",
      description: "Protect your tires and rims from potholes, nails, and curb damage. No deductible, unlimited claims, any tire shop. Planet Motors Richmond Hill, Ontario.",
      keywords: ["tire and rim protection Canada", "pothole damage coverage", "wheel protection plan", "road hazard tire coverage Ontario"],
    },
  },
  {
    slug: "window-tint",
    name: "Window Tint Film",
    shortName: "Window Tint",
    tagline: "Premium window tinting for UV protection, privacy, and comfort",
    description: "Premium window tinting for UV protection, privacy, and heat reduction.",
    icon: Sun,
    heroDescription:
      "Professional window tint does more than look good — it blocks up to 99% of harmful UV rays, reduces interior heat by up to 60%, protects your upholstery from fading, and adds privacy and security. Our premium ceramic tint films are the highest quality available.",
    howItWorks: [
      { step: 1, title: "Choose Your Shade", description: "Select from multiple tint levels — from barely-there UV protection to full privacy dark tint, all within Ontario legal limits." },
      { step: 2, title: "Professional Installation", description: "Our certified installers apply the film with precision, ensuring zero bubbles, peeling, or imperfections." },
      { step: 3, title: "Instant Improvement", description: "Enjoy immediate UV protection, heat reduction, and enhanced privacy from day one." },
    ],
    covered: [
      "Premium ceramic window tint film",
      "UV ray blocking up to 99%",
      "Infrared heat rejection technology",
      "Professional bubble-free installation",
      "Installation warranty against peeling and discolouration",
      "Compliance with Ontario tint regulations",
    ],
    notCovered: [
      "Damage from improper cleaning methods",
      "Scratches from sharp objects",
      "Film removal and re-application (separate service)",
      "Tint darkness levels exceeding legal limits",
    ],
    benefits: [
      { title: "UV Protection", description: "Blocks up to 99% of harmful UV rays — protecting your skin and preventing interior fading." },
      { title: "Heat Reduction", description: "Ceramic tint reduces interior heat by up to 60%, keeping your cabin cool in summer." },
      { title: "Privacy & Security", description: "Tinted windows deter theft by hiding valuables and add a layer of privacy for passengers." },
      { title: "Glare Reduction", description: "Reduces sun glare for safer, more comfortable driving in bright conditions." },
    ],
    faqs: [
      { question: "Is window tint legal in Ontario?", answer: "Yes, with restrictions. Ontario allows tinting on rear and rear side windows at any darkness level. Front side windows must allow at least 70% light transmission. We ensure all installations comply with provincial regulations." },
      { question: "How long does window tint last?", answer: "Our premium ceramic tint films are designed to last the lifetime of your vehicle with proper care. They come with a manufacturer warranty against fading, bubbling, and peeling." },
      { question: "Will tint interfere with my electronics?", answer: "No. Our ceramic tint films are non-metallic, so they won't interfere with GPS, cellular signals, satellite radio, or keyless entry systems." },
      { question: "How do I care for tinted windows?", answer: "Wait 3-5 days after installation before rolling windows down. Clean with a soft cloth and ammonia-free cleaner. Avoid abrasive materials or razor blades near the film." },
    ],
    ctaText: "Get Window Tint Quote",
    seo: {
      title: "Window Tint Film | Ceramic UV Protection & Privacy | Planet Motors",
      description: "Premium ceramic window tint installation. Blocks 99% UV rays, reduces heat by 60%, and adds privacy. Legal Ontario compliance. Planet Motors Richmond Hill.",
      keywords: ["window tint Ontario", "ceramic window film", "car window tinting Richmond Hill", "UV protection window tint Canada"],
    },
  },
]

export function getProductBySlug(slug: string): ProtectionProduct | undefined {
  return PROTECTION_PRODUCTS.find((p) => p.slug === slug)
}

export function getAllProductSlugs(): string[] {
  return PROTECTION_PRODUCTS.map((p) => p.slug)
}


// ── Carvana-style Component Coverage Matrix (Extended Warranty only) ────────

export interface CoverageCategory {
  category: string
  icon: string
  components: string[]
}

export const WARRANTY_COVERAGE_MATRIX: CoverageCategory[] = [
  {
    category: "Engine",
    icon: "⚙️",
    components: [
      "Engine block & cylinder heads",
      "Pistons, rings & connecting rods",
      "Crankshaft & bearings",
      "Camshaft & lifters",
      "Timing chain/belt & tensioners",
      "Oil pump & pickup tube",
      "Water pump",
      "Intake & exhaust manifolds",
      "Engine mounts",
      "Turbocharger / Supercharger",
    ],
  },
  {
    category: "Transmission",
    icon: "🔧",
    components: [
      "Transmission case & internals",
      "Torque converter",
      "Valve body & solenoids",
      "Transfer case (4WD/AWD)",
      "Clutch master & slave cylinder",
      "Flywheel & flex plate",
      "Shift linkage & cables",
      "CV joints & axle shafts",
      "Drive shaft & U-joints",
    ],
  },
  {
    category: "Electrical",
    icon: "⚡",
    components: [
      "Alternator & voltage regulator",
      "Starter motor & solenoid",
      "Power window motors & regulators",
      "Power door lock actuators",
      "Wiper motors (front & rear)",
      "Blower motor & resistor",
      "Radiator & condenser fans",
      "Instrument cluster & gauges",
      "Power seat motors",
      "Heated seat elements",
    ],
  },
  {
    category: "Cooling System",
    icon: "❄️",
    components: [
      "Radiator",
      "Thermostat & housing",
      "Heater core",
      "Coolant temperature sensor",
      "Cooling fan clutch",
      "Expansion/overflow tank",
    ],
  },
  {
    category: "Air Conditioning",
    icon: "🌡️",
    components: [
      "Compressor & clutch",
      "Condenser",
      "Evaporator",
      "Expansion valve / orifice tube",
      "Receiver/drier & accumulator",
      "A/C control module",
    ],
  },
  {
    category: "Steering & Suspension",
    icon: "🛞",
    components: [
      "Power steering pump & rack",
      "Steering gear box",
      "Ball joints (upper & lower)",
      "Control arms & bushings",
      "Tie rod ends (inner & outer)",
      "Wheel bearings & hubs",
      "Struts & shock absorbers",
      "Stabilizer bar links",
      "Coil & leaf springs",
    ],
  },
  {
    category: "Brakes",
    icon: "🛑",
    components: [
      "Brake master cylinder",
      "ABS module & pump",
      "Brake callipers",
      "Wheel cylinders",
      "Brake booster",
      "Brake lines (steel)",
      "Parking brake cables & mechanism",
    ],
  },
  {
    category: "Fuel System",
    icon: "⛽",
    components: [
      "Fuel pump & sending unit",
      "Fuel injectors",
      "Fuel pressure regulator",
      "Throttle body & position sensor",
      "Idle air control valve",
      "Mass airflow sensor",
    ],
  },
  {
    category: "Technology & Convenience",
    icon: "📱",
    components: [
      "Navigation / infotainment unit",
      "Backup camera",
      "Bluetooth module",
      "Keyless entry & push-button start",
      "Cruise control module",
      "Parking sensors",
      "Rain-sensing wipers",
      "Auto-dimming mirrors",
    ],
  },
]