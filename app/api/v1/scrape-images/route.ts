import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ADMIN_EMAILS } from "@/lib/admin"
const DEFAULT_BATCH_LIMIT = 50
const MAX_BATCH_LIMIT = 100
const SCRAPE_CONCURRENCY = 5
const FETCH_TIMEOUT_MS = 5000

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { supabase }
}

// Scrape images from planetmotors.ca VDP page
async function scrapeVehicleImages(vdpUrl: string): Promise<{
  images: string[]
  has360: boolean
  spinUrl?: string
}> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(vdpUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      signal: controller.signal,
    })
    
    if (!response.ok) {
      console.warn(`[v0] Failed to fetch VDP: ${vdpUrl}`)
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
          images.push(url.replaceAll('&amp;', '&'))
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
  } finally {
    clearTimeout(timeout)
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  let index = 0

  async function runWorker() {
    while (index < items.length) {
      const currentIndex = index++
      results[currentIndex] = await worker(items[currentIndex])
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => runWorker())
  await Promise.all(workers)
  return results
}

// GET - Scrape images for all vehicles
export async function GET(request: Request) {
  try {
    const { supabase, error } = await requireAdmin()
    if (error) {
      return error
    }

    const { searchParams } = new URL(request.url)
    const rawLimit = Number.parseInt(searchParams.get("limit") || String(DEFAULT_BATCH_LIMIT), 10)
    const limit = Math.min(Math.max(1, Number.isNaN(rawLimit) ? DEFAULT_BATCH_LIMIT : rawLimit), MAX_BATCH_LIMIT)
    const rawOffset = Number.parseInt(searchParams.get("offset") || "0", 10)
    const offset = Math.max(0, Number.isNaN(rawOffset) ? 0 : rawOffset)
    
    // Get all vehicles with VDP URLs
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles')
      .select('id, stock_number, make, model, primary_image_url')
      .eq('status', 'available')
      .range(offset, offset + limit - 1)
    
    if (vehiclesError) throw vehiclesError

    const results = await mapWithConcurrency(vehicles || [], SCRAPE_CONCURRENCY, async (vehicle) => {
      // Skip if primary_image_url is already a real image
      if (vehicle.primary_image_url?.includes('.jpg') || 
          vehicle.primary_image_url?.includes('.png') ||
          vehicle.primary_image_url?.includes('.webp')) {
        return {
          id: vehicle.id,
          stock: vehicle.stock_number,
          status: 'already_has_image'
        }
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

          if (updateError) {
            return {
              id: vehicle.id,
              stock: vehicle.stock_number,
              status: 'update_failed',
              error: updateError.message,
            }
          }
          
          return {
            id: vehicle.id,
            stock: vehicle.stock_number,
            status: 'scraped',
            imageCount: scraped.images.length,
            has360: scraped.has360
          }
        } else {
          return {
            id: vehicle.id,
            stock: vehicle.stock_number,
            status: 'no_images_found'
          }
        }
      }

      return {
        id: vehicle.id,
        stock: vehicle.stock_number,
        status: 'skipped',
      }
    })
    
    return NextResponse.json({
      success: true,
      processed: results.length,
      offset,
      limit,
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
    const { supabase, error } = await requireAdmin()
    if (error) {
      return error
    }

    const { vehicleId, vdpUrl } = await request.json()
    
    if (!vdpUrl) {
      return NextResponse.json({ error: 'VDP URL required' }, { status: 400 })
    }
    
    const scraped = await scrapeVehicleImages(vdpUrl)
    
    if (vehicleId && scraped.images.length > 0) {
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
