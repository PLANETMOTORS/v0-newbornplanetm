import { NextRequest, NextResponse } from "next/server"

// GET /api/v1/financing/offers - Get offers from multiple lenders
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const prequalificationId = searchParams.get("prequalificationId")
  const applicationId = searchParams.get("applicationId")

  if (!prequalificationId && !applicationId) {
    return NextResponse.json(
      { error: "Prequalification ID or Application ID required" },
      { status: 400 }
    )
  }

  // Mock offers from multiple lenders
  const offers = [
    {
      id: "offer_td_001",
      lenderId: "td",
      lenderName: "TD Auto Finance",
      lenderLogo: "/lenders/td-logo.png",
      status: "approved",
      rate: 5.49,
      rateType: "fixed",
      term: 72,
      monthlyPayment: 749.99,
      totalInterest: 5999.28,
      totalCost: 53999.28,
      downPaymentRequired: 5000,
      features: [
        "No prepayment penalty",
        "Rate lock for 7 days",
        "Same-day funding available",
      ],
      conditions: [
        "Proof of income required",
        "Valid driver's license",
      ],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      recommended: true,
      savings: 1200, // vs average
    },
    {
      id: "offer_scotia_001",
      lenderId: "scotia",
      lenderName: "Scotiabank",
      lenderLogo: "/lenders/scotia-logo.png",
      status: "approved",
      rate: 5.79,
      rateType: "fixed",
      term: 72,
      monthlyPayment: 762.45,
      totalInterest: 6496.40,
      totalCost: 54896.40,
      downPaymentRequired: 5000,
      features: [
        "Scene+ points eligible",
        "Flexible payment dates",
      ],
      conditions: [
        "Proof of income required",
        "Valid driver's license",
      ],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      recommended: false,
    },
    {
      id: "offer_desj_001",
      lenderId: "desjardins",
      lenderName: "Desjardins",
      lenderLogo: "/lenders/desjardins-logo.png",
      status: "approved",
      rate: 5.29,
      rateType: "fixed",
      term: 84,
      monthlyPayment: 658.99,
      totalInterest: 7155.16,
      totalCost: 55355.16,
      downPaymentRequired: 3000,
      features: [
        "Lowest monthly payment",
        "Extended term available",
        "Lower down payment",
      ],
      conditions: [
        "Proof of income required",
        "Valid driver's license",
        "Quebec or Ontario resident",
      ],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      recommended: false,
      badge: "Lowest Payment",
    },
  ]

  return NextResponse.json({
    success: true,
    data: {
      offers,
      summary: {
        totalOffers: offers.length,
        bestRate: Math.min(...offers.map(o => o.rate)),
        lowestPayment: Math.min(...offers.map(o => o.monthlyPayment)),
        recommendedOfferId: offers.find(o => o.recommended)?.id,
      },
    },
  })
}
