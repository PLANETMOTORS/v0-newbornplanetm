/**
 * Vehicle Image Scraper for Planet Motors
 * Fetches vehicle images from planetmotors.ca VDP URLs
 * 
 * Usage: npx ts-node scripts/scrape-vehicle-images.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface Vehicle {
  id: string
  stock_number: string
  vin: string
  primary_image_url: string // Contains VDP URL
}

// Extract vehicle ID from VDP URL
function extractVehicleId(vdpUrl: string): string | null {
  // URL format: https://www.planetmotors.ca//inventory/2023-tesla-model-y-13287864/13287864/
  const match = vdpUrl.match(/\/(\d+)\/?$/)
  return match ? match[1] : null
}

// Construct image URLs based on vehicle ID
// Planet Motors uses HomeNet IOL for images
function constructImageUrls(vehicleId: string, photoCount: number = 20): string[] {
  const baseUrl = `https://photos.homenetiol.com/vehicle`
  const images: string[] = []
  
  for (let i = 1; i <= photoCount; i++) {
    // HomeNet image URL pattern
    images.push(`${baseUrl}/${vehicleId}/${i}.jpg`)
  }
  
  return images
}

// Alternative: Fetch from Planet Motors CDN
function constructPlanetMotorsImageUrls(vehicleId: string, stockNumber: string): {
  primary: string
  gallery: string[]
  spin360Url?: string
} {
  // Planet Motors image patterns
  const cdnBase = `https://cdn.planetmotors.ca/inventory/${stockNumber}`
  
  return {
    primary: `${cdnBase}/photo-1.jpg`,
    gallery: Array.from({ length: 50 }, (_, i) => `${cdnBase}/photo-${i + 1}.jpg`),
    // 360 spin URL if available
    spin360Url: `${cdnBase}/360/spin.xml`
  }
}

async function scrapeVehicleImages() {
  console.log('Starting vehicle image scraper...')
  
  // Fetch all vehicles with VDP URLs
  const { data: vehicles, error } = await supabase
    .from('vehicles')
    .select('id, stock_number, vin, primary_image_url')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching vehicles:', error)
    return
  }
  
  console.log(`Found ${vehicles.length} vehicles to process`)
  
  for (const vehicle of vehicles as Vehicle[]) {
    const vdpUrl = vehicle.primary_image_url
    const vehicleId = extractVehicleId(vdpUrl)
    
    if (!vehicleId) {
      console.log(`Skipping ${vehicle.stock_number}: Could not extract vehicle ID from ${vdpUrl}`)
      continue
    }
    
    // Construct image URLs
    const imageUrls = constructImageUrls(vehicleId, 30)
    const primaryImage = imageUrls[0]
    
    // Check if primary image exists (quick HEAD request)
    try {
      const response = await fetch(primaryImage, { method: 'HEAD' })
      
      if (response.ok) {
        // Update vehicle with proper image URLs
        const { error: updateError } = await supabase
          .from('vehicles')
          .update({
            primary_image_url: primaryImage,
            image_urls: imageUrls.slice(0, 10) // Store first 10 images
          })
          .eq('id', vehicle.id)
        
        if (updateError) {
          console.error(`Error updating ${vehicle.stock_number}:`, updateError)
        } else {
          console.log(`Updated ${vehicle.stock_number} with ${imageUrls.length} images`)
        }
      } else {
        console.log(`No images found for ${vehicle.stock_number} at ${primaryImage}`)
      }
    } catch (err) {
      console.error(`Error checking image for ${vehicle.stock_number}:`, err)
    }
    
    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  console.log('Scraping complete!')
}

// Run the scraper
scrapeVehicleImages().catch(console.error)
