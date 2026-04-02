import { NextResponse } from "next/server"
import { sanityClient } from "@/lib/sanity/client"
import { groq } from "next-sanity"

export async function GET() {
  try {
    // Test basic connection
    const connectionTest = await sanityClient.fetch(groq`*[_type == "siteSettings"][0]{ dealerName }`)
    
    // Count documents
    const counts = await sanityClient.fetch(groq`{
      "siteSettings": count(*[_type == "siteSettings"]),
      "navigation": count(*[_type == "navigation"]),
      "homepage": count(*[_type == "homepage"]),
      "vehicles": count(*[_type == "vehicle"]),
      "testimonials": count(*[_type == "testimonial"]),
      "faqs": count(*[_type == "faqEntry" || _type == "faq"]),
      "blogPosts": count(*[_type == "blogPost"]),
      "promotions": count(*[_type == "promotion"]),
      "banners": count(*[_type == "banner"]),
      "lenders": count(*[_type == "lender"]),
      "total": count(*[!(_id in path("_.*"))])
    }`)
    
    // Get site settings
    const siteSettings = await sanityClient.fetch(groq`*[_type == "siteSettings"][0]{
      dealerName,
      phone,
      email,
      streetAddress,
      city,
      province
    }`)
    
    return NextResponse.json({
      success: true,
      connection: "Connected to Sanity",
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "4588vjsz",
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "planetmotors_cms",
      documentCounts: counts,
      siteSettings: siteSettings || null,
      dealerName: connectionTest?.dealerName || "No dealer name found"
    })
  } catch (error) {
    console.error("Sanity connection error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "4588vjsz",
      dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || "planetmotors_cms"
    }, { status: 500 })
  }
}
