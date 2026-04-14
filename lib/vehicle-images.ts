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

// Returns null — UI components should use gradient fallback when no image is available
export function getMakePlaceholder(_make: string): null {
  return null
}

// Check if URL is a valid hosted image (not Unsplash or VDP page URL)
export function isValidImageUrl(url: string | null | undefined): boolean {
  if (!url) return false

  // Reject Unsplash URLs — they're unreliable placeholders
  if (url.includes('unsplash.com')) return false

  return (
    url.includes('.jpg') ||
    url.includes('.jpeg') ||
    url.includes('.png') ||
    url.includes('.webp') ||
    url.includes('cdn.planetmotors.ca') ||
    url.includes('imgix.net') ||
    url.includes('homenetiol.com') ||
    url.includes('cpsimg.com')
  ) && !url.includes('planetmotors.ca/inventory')
}

// Get the best available image for a vehicle — returns null when no real image exists
export function getVehicleImage(vehicle: {
  primary_image_url?: string | null
  image_urls?: string[] | null
  make: string
}): string | null {
  // First try primary_image_url if it's a valid image
  if (isValidImageUrl(vehicle.primary_image_url)) {
    return vehicle.primary_image_url as string
  }

  // Try image_urls array
  if (vehicle.image_urls && vehicle.image_urls.length > 0) {
    const validImage = vehicle.image_urls.find(isValidImageUrl)
    if (validImage) return validImage
  }

  // No valid image — return null (UI should show gradient fallback)
  return null
}
