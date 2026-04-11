import { NextResponse } from "next/server"
import { createClient as createSanityClient } from "next-sanity"
import { groq } from "next-sanity"
import { createClient } from "@/lib/supabase/server"
import { requireAdminUser } from "@/lib/auth/admin"

// Force dynamic to prevent build-time errors
export const dynamic = "force-dynamic"

// Validate dataset name - must be lowercase, numbers, dashes only
function isValidDataset(dataset: string): boolean {
  return /^[a-z0-9-]+$/.test(dataset) && dataset.length <= 64
}

export async function GET() {
  // Get and validate environment variables
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "4588vjsz"
  let dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production"
  
  // Validate dataset - if invalid, use production
  if (!isValidDataset(dataset)) {
    console.warn(`Invalid dataset name "${dataset}", using "production"`)
    dataset = "production"
  }
  
  // Create client with validated config
  const sanityClient = createSanityClient({
    projectId,
    dataset,
    apiVersion: "2024-01-01",
    useCdn: false,
  })
  try {
    const supabase = await createClient()
    const adminCheck = await requireAdminUser(supabase)
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: adminCheck.response.status })
    }

    // Test basic connection
    const connectionTest = await sanityClient.fetch(groq`*[_type == "siteSettings"] | order(_updatedAt desc)[0]{ dealerName }`)
    
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
    const siteSettings = await sanityClient.fetch(groq`*[_type == "siteSettings"] | order(_updatedAt desc)[0]{
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
      projectId,
      dataset,
      documentCounts: counts,
      siteSettings: siteSettings || null,
      dealerName: connectionTest?.dealerName || "No dealer name found"
    })
  } catch (error) {
    console.error("Sanity connection error:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      projectId,
      dataset
    }, { status: 500 })
  }
}
