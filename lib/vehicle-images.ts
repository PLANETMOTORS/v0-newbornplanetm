// Vehicle image utilities for Planet Motors
// Images are hosted on carpages.ca CDN based on listing ID

export interface VehicleImageData {
  primaryImage: string
  thumbnails: string[]
  has360: boolean
  galleryImages: string[]
}

// Extract listing ID from VDP URL
// URL format: https://www.planetmotors.ca/inventory/2024-tesla-model-y-13287755/13287755/
export function extractListingId(vdpUrl: string): string | null {
  const match = vdpUrl.match(/(\d{8})(?:\/)?$/)
  return match ? match[1] : null
}

// Construct image URLs from listing ID
// Carpages.ca uses a predictable CDN pattern for vehicle images
export function constructImageUrls(listingId: string, photoCount: number = 20): string[] {
  const images: string[] = []
  
  // Common carpages.ca image CDN patterns
  // Try to construct up to photoCount images
  for (let i = 1; i <= photoCount; i++) {
    const paddedIndex = i.toString()
    images.push(`https://media.carpages.ca/inventory/${listingId}/photo_${paddedIndex}.jpg`)
  }
  
  return images
}

// Generate placeholder based on make
export function getMakePlaceholder(make: string): string {
  const placeholders: Record<string, string> = {
    'Tesla': 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop&q=80',
    'BMW': 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop&q=80',
    'Audi': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
    'Toyota': 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=800&auto=format&fit=crop&q=80',
    'Hyundai': 'https://images.unsplash.com/photo-1629897048514-3dd7414fe72a?w=800&auto=format&fit=crop&q=80',
    'Kia': 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?w=800&auto=format&fit=crop&q=80',
    'Chevrolet': 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=800&auto=format&fit=crop&q=80',
    'Honda': 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?w=800&auto=format&fit=crop&q=80',
    'Volkswagen': 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=800&auto=format&fit=crop&q=80',
    'Jeep': 'https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?w=800&auto=format&fit=crop&q=80',
    'Lexus': 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80',
  }
  
  return placeholders[make] || 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=800&auto=format&fit=crop&q=80'
}

// Check if URL is a valid image URL (not a VDP page URL)
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false
  
  return (
    url.includes('.jpg') ||
    url.includes('.jpeg') ||
    url.includes('.png') ||
    url.includes('.webp') ||
    url.includes('unsplash.com') ||
    url.includes('carpages.ca') ||
    url.includes('cpsimg.com')
  ) && !url.includes('planetmotors.ca/inventory')
}

// Get the best available image for a vehicle
export function getVehicleImage(vehicle: {
  primary_image_url?: string | null
  image_urls?: string[] | null
  make: string
}): string {
  // First try primary_image_url if it's a valid image
  if (isValidImageUrl(vehicle.primary_image_url)) {
    return vehicle.primary_image_url!
  }
  
  // Try image_urls array
  if (vehicle.image_urls && vehicle.image_urls.length > 0) {
    const validImage = vehicle.image_urls.find(isValidImageUrl)
    if (validImage) return validImage
  }
  
  // Try to extract listing ID and construct image URL
  if (vehicle.primary_image_url?.includes('planetmotors.ca')) {
    const listingId = extractListingId(vehicle.primary_image_url)
    if (listingId) {
      // Return carpages CDN URL - this may or may not work depending on their setup
      return `https://media.carpages.ca/inventory/${listingId}/photo_1.jpg`
    }
  }
  
  // Fall back to make-specific placeholder
  return getMakePlaceholder(vehicle.make)
}
