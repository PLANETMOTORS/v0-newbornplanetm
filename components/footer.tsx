import { FooterContent } from "@/components/footer-content"
import { getSiteData } from "@/lib/sanity/site-data"

export async function Footer() {
  const siteData = await getSiteData()

  return <FooterContent siteSettings={siteData.settings} />
}
