import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const ADMIN_EMAILS = ["admin@planetmotors.ca", "toni@planetmotors.ca"]

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
    const imagePatterns = [
      // HomeNet IOL pattern
      /https:\/\/photos\.homenetiol\.com\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi,
      // CDN patterns
      /https:\/\/cdn[^"'\s]*\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi,
      // General image patterns
      /https:\/\/[^"'\s]*inventory[^"'\s]*\.(?:jpg|jpeg|png|webp)/gi,
    ]
    
    const allImages: Set<string> = new Set()
    
    for (const pattern of imagePatterns) {
      const matches = html.match(pattern)
      if (matches) {
        matches.forEach(url => allImages.add(url))
      }
    }
    
    // Check for 360 spin viewer
    const has360 = html.includes('spin360') || html.includes('360-view') || html.includes('spincar')
    
    // Extract 360 spin URL if available
    let spin360Url: string | undefined
    const spinMatch = html.match(/https:\/\/[^"'\s]*(?:spin|360)[^"'\s]*\.(?:xml|json|js)/i)
    if (spinMatch) {
      spin360Url = spinMatch[0]
    }
    
    // Filter and sort images
    const images = Array.from(allImages)
      .filter(url => !url.includes('thumb') && !url.includes('icon'))
      .sort()
    
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

export async function GET(
  request: NextRequest,
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
  if (vehicle.image_urls && vehicle.image_urls.length > 0) {
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
  
  if (!vdpUrl || !vdpUrl.startsWith('http')) {
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
  const { images, has360, spin360Url } = await scrapeImagesFromVDP(vdpUrl)
  
  // Update vehicle with scraped images
  if (images.length > 0) {
    await supabase
      .from('vehicles')
      .update({
        primary_image_url: images[0],
        image_urls: images,
        has_360_spin: has360
      })
      .eq('id', id)
  }
  
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
  request: NextRequest,
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
  
  if (!vdpUrl || !vdpUrl.startsWith('http')) {
    return NextResponse.json({ error: 'No VDP URL available' }, { status: 400 })
  }
  
  // Force scrape images
  const { images, has360, spin360Url } = await scrapeImagesFromVDP(vdpUrl)
  
  // Update vehicle
  if (images.length > 0) {
    await supabase
      .from('vehicles')
      .update({
        primary_image_url: images[0],
        image_urls: images,
        has_360_spin: has360
      })
      .eq('id', id)
  }
  
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
