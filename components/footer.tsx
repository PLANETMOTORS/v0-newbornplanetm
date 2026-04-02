import { FooterContent } from "@/components/footer-content"
import { getSiteData, DEFAULT_SITE_SETTINGS } from "@/lib/sanity/site-data"

export async function Footer() {
  let siteData
  
  try {
    siteData = await getSiteData()
  } catch (error) {
    console.error("Footer: Failed to fetch site data, using defaults:", error)
    siteData = { settings: DEFAULT_SITE_SETTINGS }
  }

  return <FooterContent siteSettings={siteData.settings} />
}
