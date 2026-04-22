// DEPRECATED: The primary sitemap is now served by app/sitemap.ts (Next.js native MetadataRoute.Sitemap).
// This API route is kept for backwards compatibility and can be removed once confirmed unnecessary.
import { NextResponse } from 'next/server'
import { getPublicSiteUrl } from '@/lib/site-url'
import {
  buildPagesSitemap,
  buildVehiclesSitemap,
  buildBlogSitemap,
} from '@/lib/sitemap-builders'

// Force runtime generation — sitemap must read live data from Supabase.
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const baseUrl = getPublicSiteUrl()
    const currentDate = new Date().toISOString()

    const [pages, vehicles, blog] = await Promise.all([
      buildPagesSitemap(baseUrl, currentDate),
      buildVehiclesSitemap(baseUrl, currentDate),
      buildBlogSitemap(baseUrl, currentDate),
    ])

    const entries = [...pages, ...vehicles, ...blog]

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map(e => `<url>
<loc>${escapeXml(e.url)}</loc>
<lastmod>${e.lastModified}</lastmod>
<changefreq>${e.changeFrequency}</changefreq>
<priority>${e.priority}</priority>
</url>`).join('\n')}
</urlset>`

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('Sitemap generation error:', err)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
