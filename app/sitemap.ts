import type { MetadataRoute } from 'next'
import { getPublicSiteUrl } from '@/lib/site-url'
import {
  buildPagesSitemap,
  buildVehiclesSitemap,
  buildBlogSitemap,
  type SitemapEntry,
} from '@/lib/sitemap-builders'

type ChangeFrequency = MetadataRoute.Sitemap[number]['changeFrequency']

function toMetadataEntry(entry: SitemapEntry): MetadataRoute.Sitemap[number] {
  // Next.js' MetadataRoute.Sitemap supports an `images` array; when present
  // it emits `<image:image>` tags so Google Images can index vehicle photos.
  const base: MetadataRoute.Sitemap[number] = {
    url: entry.url,
    lastModified: entry.lastModified,
    changeFrequency: entry.changeFrequency as ChangeFrequency,
    priority: entry.priority,
  }
  if (entry.images && entry.images.length > 0) {
    base.images = entry.images
  }
  return base
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicSiteUrl()
  const currentDate = new Date().toISOString()

  const pages = buildPagesSitemap(baseUrl, currentDate)
  const [vehicles, blog] = await Promise.all([
    buildVehiclesSitemap(baseUrl, currentDate),
    Promise.resolve(buildBlogSitemap(baseUrl, currentDate)),
  ])

  return [...pages, ...vehicles, ...blog].map(toMetadataEntry)
}
