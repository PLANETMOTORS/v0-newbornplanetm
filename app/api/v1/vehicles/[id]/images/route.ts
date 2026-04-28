import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { supabase }
}

// Scrape images from Planet Motors VDP page
async function scrapeImagesFromVDP(vdpUrl: string): Promise<{
  images: string[]
  has360: boolean
  spin360Url?: string
}> {
  try {
    // Fetch the VDP page
    const response = await fetch(vdpUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PlanetMotorsBot/1.0)'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to fetch VDP: ${response.status}`)
    }
    
    const html = await response.text()
    
    // Extract image URLs from the HTML
    // Look for common patterns in dealer websites
    // Patterns use negated character classes ([^"'\s]) with a bounded suffix
    // so there are no nested quantifiers and no catastrophic backtracking risk.
    const imagePatterns = [
      // HomeNet IOL pattern — fixed host, path chars are [^"'\s]
      /https:\/\/photos\.homenetiol\.com\/[^"'\s]{1,500}\.(?:jpg|jpeg|png|webp)/gi,
      // CDN patterns — cdn prefix, then path chars
      /https:\/\/cdn[^"'\s]{0,200}\/[^"'\s]{1,300}\.(?:jpg|jpeg|png|webp)/gi,
      // General image patterns — "inventory" keyword in URL
      /https:\/\/[^"'\s]{0,100}inventory[^"'\s]{0,400}\.(?:jpg|jpeg|png|webp)/gi,
    ]
    
    const allImages: Set<string> = new Set()
    
    for (const pattern of imagePatterns) {
      for (const match of html.matchAll(pattern)) {
        allImages.add(match[0])
      }
    }
    
    // Check for 360 spin viewer
    const has360 = html.includes('spin360') || html.includes('360-view') || html.includes('spincar')
    
    // Extract 360 spin URL if available
    let spin360Url: string | undefined
    const spinMatch = /https:\/\/[^"'\s]*(?:spin|360)[^"'\s]*\.(?:xml|json|js)/i.exec(html)
    if (spinMatch) {
      spin360Url = spinMatch[0]
    }
    
    // Filter and sort images
    const images = Array.from(allImages)
      .filter(url => !url.includes('thumb') && !url.includes('icon'))
      .sort((a, b) => a.localeCompare(b))
    
    return {
      images,
      has360,
      spin360Url
    }
  } catch (error) {
    console.error('Error scraping VDP:', error)
    return { images: [], has360: false }
  }
}

type ScrapedImages = Awaited<ReturnType<typeof scrapeImagesFromVDP>>

async function scrapeAndPersist(
  supabase: Awaited<ReturnType<typeof requireAdmin>>['supabase'],
  vehicleId: string,
  vdpUrl: string,
): Promise<ScrapedImages> {
  const result = await scrapeImagesFromVDP(vdpUrl)
  if (result.images.length > 0 && supabase) {
    await supabase
      .from('vehicles')
      .update({
        primary_image_url: result.images[0],
        image_urls: result.images,
        has_360_spin: result.has360,
      })
      .eq('id', vehicleId)
  }
  return result
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, error: adminError } = await requireAdmin()
  if (adminError) {
    return adminError
  }
  
  // Fetch vehicle
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('id, stock_number, vin, primary_image_url, image_urls, has_360_spin')
    .eq('id', id)
    .single()
  
  if (error || !vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }
  
  // If we already have images cached, return them
  if (vehicle.image_urls?.length) {
    return NextResponse.json({
      vehicleId: vehicle.id,
      stockNumber: vehicle.stock_number,
      images: vehicle.image_urls,
      primaryImage: vehicle.primary_image_url,
      has360: vehicle.has_360_spin || false,
      cached: true
    })
  }
  
  // Otherwise, scrape from VDP URL
  const vdpUrl = vehicle.primary_image_url
  
  if (!vdpUrl?.startsWith('http')) {
    return NextResponse.json({
      vehicleId: vehicle.id,
      stockNumber: vehicle.stock_number,
      images: [],
      primaryImage: null,
      has360: false,
      error: 'No VDP URL available'
    })
  }
  
  // Scrape images
  const { images, has360, spin360Url } = await scrapeAndPersist(supabase, id, vdpUrl)

  return NextResponse.json({
    vehicleId: vehicle.id,
    stockNumber: vehicle.stock_number,
    images,
    primaryImage: images[0] || null,
    has360,
    spin360Url,
    cached: false
  })
}

// Force refresh images for a vehicle
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { supabase, error: adminError } = await requireAdmin()
  if (adminError) {
    return adminError
  }
  
  // Fetch vehicle
  const { data: vehicle, error } = await supabase
    .from('vehicles')
    .select('id, stock_number, primary_image_url')
    .eq('id', id)
    .single()
  
  if (error || !vehicle) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }
  
  const vdpUrl = vehicle.primary_image_url
  
  if (!vdpUrl?.startsWith('http')) {
    return NextResponse.json({ error: 'No VDP URL available' }, { status: 400 })
  }
  
  // Force scrape images
  const { images, has360, spin360Url } = await scrapeAndPersist(supabase, id, vdpUrl)

  return NextResponse.json({
    vehicleId: vehicle.id,
    stockNumber: vehicle.stock_number,
    images,
    primaryImage: images[0] || null,
    has360,
    spin360Url,
    refreshed: true
  })
}
