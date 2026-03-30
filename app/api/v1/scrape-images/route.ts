import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Scrape images from planetmotors.ca VDP page
async function scrapeVehicleImages(vdpUrl: string): Promise<{
  images: string[]
  has360: boolean
  spinUrl?: string
}> {
  try {
    const response = await fetch(vdpUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.log(`[v0] Failed to fetch VDP: ${vdpUrl}`)
      return { images: [], has360: false }
    }
    
    const html = await response.text()
    
    // Extract image URLs from the HTML
    const images: string[] = []
    
    // Pattern 1: Look for vehicle images in data attributes or img tags
    // Common patterns on dealer sites: vehicledetail images, homenet photos
    const imgPatterns = [
      /https?:\/\/[^"'\s]+\.homenetiol\.com[^"'\s]+\.(jpg|jpeg|png|webp)/gi,
      /https?:\/\/[^"'\s]+cloudinary[^"'\s]+\.(jpg|jpeg|png|webp)/gi,
      /https?:\/\/[^"'\s]+vehicle[^"'\s]+\.(jpg|jpeg|png|webp)/gi,
      /https?:\/\/[^"'\s]+inventory[^"'\s]+\.(jpg|jpeg|png|webp)/gi,
      /data-src="([^"]+\.(jpg|jpeg|png|webp))"/gi,
      /src="([^"]+photos[^"]+\.(jpg|jpeg|png|webp))"/gi,
    ]
    
    for (const pattern of imgPatterns) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const url = match[1] || match[0]
        if (url && !images.includes(url) && !url.includes('logo') && !url.includes('icon')) {
          images.push(url.replace(/&amp;/g, '&'))
        }
      }
    }
    
    // Check for 360 spin viewer
    const has360 = html.includes('spin') || 
                   html.includes('360') || 
                   html.includes('spincar') ||
                   html.includes('car360')
    
    // Try to extract spin URL if available
    let spinUrl: string | undefined
    const spinMatch = html.match(/https?:\/\/[^"'\s]+spin[^"'\s]+/i) ||
                      html.match(/https?:\/\/[^"'\s]+360[^"'\s]+/i)
    if (spinMatch) {
      spinUrl = spinMatch[0]
    }
    
    return { images: images.slice(0, 50), has360, spinUrl }
  } catch (error) {
    console.error(`[v0] Error scraping ${vdpUrl}:`, error)
    return { images: [], has360: false }
  }
}

// GET - Scrape images for all vehicles
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get all vehicles with VDP URLs
    const { data: vehicles, error } = await supabase
      .from('vehicles')
      .select('id, stock_number, make, model, primary_image_url')
      .eq('status', 'available')
    
    if (error) throw error
    
    const results = []
    
    for (const vehicle of vehicles || []) {
      // Skip if primary_image_url is already a real image
      if (vehicle.primary_image_url?.includes('.jpg') || 
          vehicle.primary_image_url?.includes('.png') ||
          vehicle.primary_image_url?.includes('.webp')) {
        results.push({
          id: vehicle.id,
          stock: vehicle.stock_number,
          status: 'already_has_image'
        })
        continue
      }
      
      // Scrape images from VDP URL
      if (vehicle.primary_image_url?.includes('planetmotors.ca')) {
        const scraped = await scrapeVehicleImages(vehicle.primary_image_url)
        
        if (scraped.images.length > 0) {
          // Update vehicle with scraped images
          const { error: updateError } = await supabase
            .from('vehicles')
            .update({
              primary_image_url: scraped.images[0],
              image_urls: scraped.images,
              has_360_spin: scraped.has360
            })
            .eq('id', vehicle.id)
          
          results.push({
            id: vehicle.id,
            stock: vehicle.stock_number,
            status: 'scraped',
            imageCount: scraped.images.length,
            has360: scraped.has360
          })
        } else {
          results.push({
            id: vehicle.id,
            stock: vehicle.stock_number,
            status: 'no_images_found'
          })
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
  } catch (error) {
    console.error('[v0] Scrape error:', error)
    return NextResponse.json({ error: 'Failed to scrape images' }, { status: 500 })
  }
}

// POST - Scrape images for a single vehicle by ID
export async function POST(request: Request) {
  try {
    const { vehicleId, vdpUrl } = await request.json()
    
    if (!vdpUrl) {
      return NextResponse.json({ error: 'VDP URL required' }, { status: 400 })
    }
    
    const scraped = await scrapeVehicleImages(vdpUrl)
    
    if (vehicleId && scraped.images.length > 0) {
      const supabase = await createClient()
      await supabase
        .from('vehicles')
        .update({
          primary_image_url: scraped.images[0],
          image_urls: scraped.images,
          has_360_spin: scraped.has360
        })
        .eq('id', vehicleId)
    }
    
    return NextResponse.json({
      success: true,
      images: scraped.images,
      has360: scraped.has360,
      spinUrl: scraped.spinUrl
    })
  } catch (error) {
    console.error('[v0] Scrape error:', error)
    return NextResponse.json({ error: 'Failed to scrape' }, { status: 500 })
  }
}
