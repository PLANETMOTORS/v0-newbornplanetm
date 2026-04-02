export const SITE_SETTINGS_QUERY = `*[_type == "siteSettings"][0]`
export const NAVIGATION_QUERY = `*[_type == "navigation"][0]`
export const HOMEPAGE_QUERY = `*[_type == "homepage"][0]`
export const SELL_YOUR_CAR_PAGE_QUERY = `*[_type == "sellYourCar" || _type == "sellYourCarPage"][0]`
export const FINANCING_PAGE_QUERY = `*[_type == "financing" || _type == "financingPage"][0]`
export const INVENTORY_SETTINGS_QUERY = `*[_type == "inventorySettings"][0]`
export const VEHICLES_QUERY = `*[_type == "vehicle" && status == "available"] | order(_createdAt desc)`
export const VEHICLE_BY_SLUG_QUERY = `*[_type == "vehicle" && slug.current == $slug][0]`
export const FEATURED_VEHICLES_QUERY = `*[_type == "vehicle" && featured == true][0...8]`
export const VEHICLES_BY_STOCK_NUMBERS_QUERY = `*[_type == "vehicle" && stockNumber in $stockNumbers]`
export const BLOG_LIST_QUERY = `*[_type == "blogPost"] | order(publishedAt desc)[$start...$end]`
export const BLOG_COUNT_QUERY = `count(*[_type == "blogPost"])`
export const BLOG_POST_QUERY = `*[_type == "blogPost" && slug.current == $slug][0]`
export const FAQ_QUERY = `*[_type == "faqItem" || _type == "faqEntry"] | order(order asc)`
export const ACTIVE_PROMOS_QUERY = `*[_type == "promotion" && active == true]`
export const TESTIMONIALS_QUERY = `*[_type == "testimonial"] | order(_createdAt desc)`
export const FEATURED_TESTIMONIALS_QUERY = `*[_type == "testimonial" && featured == true][0...6]`
export const PROTECTION_PLANS_QUERY = `*[_type == "protectionPlan"] | order(order asc)`
export const LENDERS_QUERY = `*[_type == "lender"] | order(order asc)`
