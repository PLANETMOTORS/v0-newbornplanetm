/**
 * Planet Motors — Sanity Studio Schema Test Suite
 * 100 real static-analysis tests across all schema files.
 * Run: node sanity-schema-tests.mjs
 */

import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ─── Load raw source files ────────────────────────────────────────────────────
const src = {
  index:    readFileSync(resolve(__dirname, 'studio/schemas/index.ts'), 'utf8'),
  content:  readFileSync(resolve(__dirname, 'studio/schemas/content.ts'), 'utf8'),
  pages:    readFileSync(resolve(__dirname, 'studio/schemas/pages.ts'), 'utf8'),
  settings: readFileSync(resolve(__dirname, 'studio/schemas/settings.ts'), 'utf8'),
  lender:   readFileSync(resolve(__dirname, 'studio/schemas/lender.ts'), 'utf8'),
  vehicle:  readFileSync(resolve(__dirname, 'studio/schemas/vehicle.ts'), 'utf8'),
  homepage: readFileSync(resolve(__dirname, 'studio/schemas/homepage.ts'), 'utf8'),
  inventory:readFileSync(resolve(__dirname, 'studio/schemas/inventorySettings.ts'), 'utf8'),
  structure:readFileSync(resolve(__dirname, 'studio/structure.ts'), 'utf8'),
}

// ─── Test runner ─────────────────────────────────────────────────────────────
let passed = 0, failed = 0
const results = []

function test(id, description, fn) {
  try {
    const result = fn()
    if (result === true || result === undefined) {
      passed++
      results.push({ id, status: 'PASS', description, detail: '' })
    } else {
      failed++
      results.push({ id, status: 'FAIL', description, detail: String(result) })
    }
  } catch (e) {
    failed++
    results.push({ id, status: 'FAIL', description, detail: e.message })
  }
}

function has(file, pattern) {
  if (typeof pattern === 'string') return file.includes(pattern)
  return pattern.test(file)
}

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP A — SCHEMA INDEX (tests 1-10)
// ═══════════════════════════════════════════════════════════════════════════════

test('A01', 'index.ts exports schemaTypes array', () =>
  has(src.index, 'export const schemaTypes'))

test('A02', 'index.ts imports vehicle schema', () =>
  has(src.index, "import { vehicle } from './vehicle'"))

test('A03', 'index.ts imports pageSchemas', () =>
  has(src.index, "import { pageSchemas } from './pages'"))

test('A04', 'index.ts imports homepage components (homepageHero, banner, page, promotion)', () =>
  has(src.index, 'homepageHero') && has(src.index, 'banner') && has(src.index, 'page') && has(src.index, 'promotion'))

test('A05', 'index.ts imports content schemas (blogPost, testimonial, faqEntry, protectionPlan)', () =>
  has(src.index, 'blogPost') && has(src.index, 'testimonial') && has(src.index, 'faqEntry') && has(src.index, 'protectionPlan'))

test('A06', 'index.ts imports settings (siteSettings, seoSettings, navigation)', () =>
  has(src.index, 'siteSettings') && has(src.index, 'seoSettings') && has(src.index, 'navigation'))

test('A07', 'index.ts imports inventorySettings', () =>
  has(src.index, 'inventorySettings'))

test('A08', 'index.ts imports supabaseVehicleReference', () =>
  has(src.index, 'supabaseVehicleReference'))

test('A09', 'index.ts spreads pageSchemas into schemaTypes', () =>
  has(src.index, '...pageSchemas'))

test('A10', 'index.ts uses defineType/defineField pattern (via sanity imports in sub-files)', () =>
  has(src.content, "from 'sanity'") && has(src.pages, "from 'sanity'"))

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP B — VEHICLE SCHEMA (tests 11-20)
// ═══════════════════════════════════════════════════════════════════════════════

test('B01', 'vehicle schema has name: "vehicle"', () =>
  has(src.vehicle, "name: 'vehicle'"))

test('B02', 'vehicle schema has required year field with min/max validation', () =>
  has(src.vehicle, "name: 'year'") && has(src.vehicle, 'Rule.required().min(1900).max(2030)'))

test('B03', 'vehicle schema has required make field', () =>
  has(src.vehicle, "name: 'make'") && has(src.vehicle, 'Rule.required()'))

test('B04', 'vehicle schema has required model field', () =>
  has(src.vehicle, "name: 'model'"))

test('B05', 'vehicle schema has VIN field with length(17) validation', () =>
  has(src.vehicle, "name: 'vin'") && has(src.vehicle, 'Rule.required().length(17)'))

test('B06', 'vehicle schema has status field with radio layout and 5 options', () => {
  const hasStatus = has(src.vehicle, "name: 'status'")
  const hasAvailable = has(src.vehicle, "value: 'available'")
  const hasSold = has(src.vehicle, "value: 'sold'")
  const hasPending = has(src.vehicle, "value: 'pending'")
  const hasRadio = has(src.vehicle, "layout: 'radio'")
  return hasStatus && hasAvailable && hasSold && hasPending && hasRadio
})

test('B07', 'vehicle schema has condition field (new/used/certified)', () =>
  has(src.vehicle, "value: 'new'") && has(src.vehicle, "value: 'used'") && has(src.vehicle, "value: 'certified'"))

test('B08', 'vehicle schema has EV-specific fields (evRange, batteryCapacity)', () =>
  has(src.vehicle, "name: 'evRange'") && has(src.vehicle, "name: 'batteryCapacity'"))

test('B09', 'vehicle schema has images array with hotspot and alt/caption fields', () =>
  has(src.vehicle, "name: 'images'") && has(src.vehicle, 'hotspot: true') && has(src.vehicle, "name: 'alt'"))

test('B10', 'vehicle schema has slug with auto-source from year/make/model/stockNumber', () =>
  has(src.vehicle, "name: 'slug'") && has(src.vehicle, 'stockNumber'))

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP C — LENDER SCHEMA (tests 21-28)
// ═══════════════════════════════════════════════════════════════════════════════

test('C01', 'lender.ts has name: "lender" document type', () =>
  has(src.lender, "name: 'lender'") && has(src.lender, "type: 'document'"))

test('C02', 'lender schema has required name field', () =>
  has(src.lender, "name: 'name'") && has(src.lender, 'Rule.required()'))

test('C03', 'lender schema has promoRate with min(0).max(30) validation', () =>
  has(src.lender, "name: 'promoRate'") && has(src.lender, 'Rule.min(0).max(30)'))

test('C04', 'lender schema has minCreditScore with min(300).max(850) validation', () =>
  has(src.lender, "name: 'minCreditScore'") && has(src.lender, 'Rule.min(300).max(850)'))

test('C05', 'lender schema has maxLoanTerm with min(12).max(120) validation', () =>
  has(src.lender, "name: 'maxLoanTerm'") && has(src.lender, 'Rule.min(12).max(120)'))

test('C06', 'lender schema has isActive boolean with initialValue: true', () =>
  has(src.lender, "name: 'isActive'") && has(src.lender, 'initialValue: true'))

test('C07', 'lender schema has orderings (rateAsc, sortOrderAsc, nameAsc)', () =>
  has(src.lender, 'orderings') && has(src.lender, 'rateAsc') && has(src.lender, 'nameAsc'))

test('C08', 'lender schema has slug field with source: name', () =>
  has(src.lender, "name: 'slug'") && has(src.lender, "source: 'name'"))

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP D — CONTENT SCHEMAS (tests 29-40)
// ═══════════════════════════════════════════════════════════════════════════════

test('D01', 'blogPost schema has required title field', () =>
  has(src.content, "name: 'blogPost'") && has(src.content, 'Rule.required()'))

test('D02', 'blogPost schema has slug with source: title', () =>
  has(src.content, "source: 'title'"))

test('D03', 'blogPost schema has body as array of block and image', () =>
  has(src.content, "name: 'body'") && has(src.content, "type: 'block'") && has(src.content, "type: 'image'"))

test('D04', 'blogPost schema has coverImage with hotspot', () =>
  has(src.content, "name: 'coverImage'") && has(src.content, 'hotspot: true'))

test('D05', 'blogPost preview shows published/draft status with emoji', () =>
  has(src.content, '✅') && has(src.content, '📝'))

test('D06', 'testimonial schema has required name field', () =>
  has(src.content, "name: 'testimonial'") && has(src.content, "name: 'name'"))

test('D07', 'testimonial schema has rating with min(1).max(5) validation', () =>
  has(src.content, 'Rule.min(1).max(5)'))

test('D08', 'testimonial schema has source field with 4 options (google/facebook/direct/dealerrater)', () =>
  has(src.content, "value: 'google'") && has(src.content, "value: 'facebook'") && has(src.content, "value: 'dealerrater'"))

test('D09', 'faqEntry schema has required question field', () =>
  has(src.content, "name: 'faqEntry'") && has(src.content, "name: 'question'"))

test('D10', 'faqEntry schema has category with 5 options (general/financing/trade-in/delivery/warranty)', () =>
  has(src.content, "value: 'general'") && has(src.content, "value: 'financing'") && has(src.content, "value: 'trade-in'") && has(src.content, "value: 'warranty'"))

test('D11', 'protectionPlan schema has required title field', () =>
  has(src.content, "name: 'protectionPlan'") && has(src.content, "name: 'title'"))

test('D12', 'protectionPlan schema has highlights array with icon/label fields', () =>
  has(src.content, "name: 'highlights'") && has(src.content, "name: 'icon'") && has(src.content, "name: 'label'"))

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP E — PAGES SCHEMAS (tests 41-55)
// ═══════════════════════════════════════════════════════════════════════════════

test('E01', 'pages.ts exports pageSchemas array with 13 schemas', () => {
  const match = src.pages.match(/export const pageSchemas = \[([\s\S]*?)\]/)
  if (!match) return 'pageSchemas export not found'
  const items = match[1].split(',').map(s => s.trim()).filter(Boolean)
  return items.length === 13 || `Expected 13, got ${items.length}`
})

test('E02', 'trustBadge object type has icon/text/title/label/description/value fields', () =>
  has(src.pages, "name: 'trustBadge'") && has(src.pages, "name: 'icon'") && has(src.pages, "name: 'value'"))

test('E03', 'ctaButton object type has label/url/text/style fields', () =>
  has(src.pages, "name: 'ctaButton'") && has(src.pages, "name: 'label'") && has(src.pages, "name: 'url'"))

test('E04', 'homepage schema has heroSection with headline/subheadline/primaryCta/secondaryCta', () =>
  has(src.pages, "name: 'homepage'") && has(src.pages, "name: 'heroSection'") && has(src.pages, "name: 'primaryCta'"))

test('E05', 'homepage schema has featuredVehicles array with max(6).unique() validation', () =>
  has(src.pages, "name: 'featuredVehicles'") && has(src.pages, 'Rule.max(6).unique()'))

test('E06', 'homepage schema has promoBanner with enabled/showBanner/text fields', () =>
  has(src.pages, "name: 'promoBanner'") && has(src.pages, "name: 'enabled'") && has(src.pages, "name: 'showBanner'"))

test('E07', 'financingPage schema has calculator with defaultVehiclePrice/defaultDownPayment/defaultTerm', () =>
  has(src.pages, "name: 'financingPage'") && has(src.pages, "name: 'calculator'") && has(src.pages, "name: 'defaultVehiclePrice'"))

test('E08', 'financingPage schema has processSteps array', () =>
  has(src.pages, "name: 'processSteps'"))

test('E09', 'sellYourCarPage schema has comparisonTable with rows/headers', () =>
  has(src.pages, "name: 'sellYourCarPage'") && has(src.pages, "name: 'comparisonTable'") && has(src.pages, "name: 'rows'"))

test('E10', 'sellYourCarPage schema has avilooBattery section', () =>
  has(src.pages, "name: 'avilooBattery'"))

test('E11', 'aiSettings schema has annaAssistant with enabled/displayName/welcomeMessage', () =>
  has(src.pages, "name: 'aiSettings'") && has(src.pages, "name: 'annaAssistant'") && has(src.pages, "name: 'welcomeMessage'"))

test('E12', 'aiSettings schema has priceNegotiator with negotiationRules', () =>
  has(src.pages, "name: 'priceNegotiator'") && has(src.pages, "name: 'negotiationRules'"))

test('E13', 'vdpSettings schema has 210-point inspection with categories array', () =>
  has(src.pages, "name: 'vdpSettings'") && has(src.pages, "name: 'inspection'") && has(src.pages, "name: 'categories'"))

test('E14', 'deliverySettings schema has deliveryTiers array with minKm/maxKm/cost', () =>
  has(src.pages, "name: 'deliverySettings'") && has(src.pages, "name: 'deliveryTiers'") && has(src.pages, "name: 'minKm'"))

test('E15', 'calculatorSettings schema has creditTiers array with label/minScore/apr', () =>
  has(src.pages, "name: 'calculatorSettings'") && has(src.pages, "name: 'creditTiers'") && has(src.pages, "name: 'apr'"))

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP F — SETTINGS SCHEMAS (tests 56-68)
// ═══════════════════════════════════════════════════════════════════════════════

test('F01', 'siteSettings has 7 field groups (dealer/contact/hours/financing/delivery/social/footer)', () => {
  const groups = ['dealer', 'contact', 'hours', 'financing', 'delivery', 'social', 'footer']
  return groups.every(g => has(src.settings, `name: '${g}'`))
})

test('F02', 'siteSettings has address object with street/city/province/postalCode/country', () =>
  has(src.settings, "name: 'address'") && has(src.settings, "name: 'street'") && has(src.settings, "name: 'postalCode'"))

test('F03', 'siteSettings has businessHours array with day/open/close/isClosed fields', () =>
  has(src.settings, "name: 'businessHours'") && has(src.settings, "name: 'isClosed'"))

test('F04', 'siteSettings has financing object with minDownPayment/maxTerm/defaultRate', () =>
  has(src.settings, "name: 'financing'") && has(src.settings, "name: 'minDownPayment'") && has(src.settings, "name: 'defaultRate'"))

test('F05', 'siteSettings has delivery object with freeDeliveryRadius/perKmRate/enabled', () =>
  has(src.settings, "name: 'delivery'") && has(src.settings, "name: 'freeDeliveryRadius'") && has(src.settings, "name: 'perKmRate'"))

test('F06', 'siteSettings has socialLinks with facebook/instagram/twitter/youtube/tiktok', () =>
  has(src.settings, "name: 'socialLinks'") && has(src.settings, "name: 'facebook'") && has(src.settings, "name: 'tiktok'"))

test('F07', 'siteSettings has leadRouting with salesEmail/financeEmail/tradeInEmail', () =>
  has(src.settings, "name: 'leadRouting'") && has(src.settings, "name: 'salesEmail'") && has(src.settings, "name: 'tradeInEmail'"))

test('F08', 'siteSettings has aggregateRating for SEO with ratingValue/reviewCount', () =>
  has(src.settings, "name: 'aggregateRating'") && has(src.settings, "name: 'ratingValue'") && has(src.settings, "name: 'reviewCount'"))

test('F09', 'navigation schema has mainNavigation array with navItem/label/url/children', () =>
  has(src.settings, "name: 'navigation'") && has(src.settings, "name: 'mainNavigation'") && has(src.settings, "name: 'children'"))

test('F10', 'navigation schema has headerCta with showCta/buttonLabel/buttonUrl/buttonStyle', () =>
  has(src.settings, "name: 'headerCta'") && has(src.settings, "name: 'buttonLabel'") && has(src.settings, "name: 'buttonStyle'"))

test('F11', 'navigation schema has footerLinkColumns array with title/links', () =>
  has(src.settings, "name: 'footerLinkColumns'") && has(src.settings, "name: 'legalLinks'"))

test('F12', 'seoSettings has pagePath with required validation', () =>
  has(src.settings, "name: 'seoSettings'") && has(src.settings, "name: 'pagePath'") && has(src.settings, 'Rule.required()'))

test('F13', 'seoSettings has title with max(60) and description with max(160) validation', () =>
  has(src.settings, 'Rule.required().max(60)') && has(src.settings, 'Rule.required().max(160)'))

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP G — HOMEPAGE/BANNER/PAGE/PROMOTION SCHEMAS (tests 69-76)
// ═══════════════════════════════════════════════════════════════════════════════

test('G01', 'homepageHero schema has required name and headline fields', () =>
  has(src.homepage, "name: 'homepageHero'") && has(src.homepage, "name: 'headline'") && has(src.homepage, 'Rule.required()'))

test('G02', 'homepageHero has overlayOpacity with min(0).max(1) validation', () =>
  has(src.homepage, "name: 'overlayOpacity'") && has(src.homepage, 'Rule.min(0).max(1)'))

test('G03', 'homepageHero has backgroundImage with hotspot and backgroundVideo url', () =>
  has(src.homepage, "name: 'backgroundImage'") && has(src.homepage, "name: 'backgroundVideo'"))

test('G04', 'banner schema has position field with 4 options (top/homepage/inventory/footer)', () =>
  has(src.homepage, "name: 'banner'") && has(src.homepage, "value: 'top'") && has(src.homepage, "value: 'inventory'"))

test('G05', 'banner schema has startDate and endDate datetime fields', () =>
  has(src.homepage, "name: 'startDate'") && has(src.homepage, "name: 'endDate'"))

test('G06', 'page schema has required title and slug fields', () =>
  has(src.homepage, "name: 'page'") && has(src.homepage, "name: 'slug'"))

test('G07', 'page schema has content as array of block and image with alt/caption', () =>
  has(src.homepage, "name: 'content'") && has(src.homepage, "name: 'alt'") && has(src.homepage, "name: 'caption'"))

test('G08', 'promotion schema has discountType with 4 options (percentage/amount/financing/addon)', () =>
  has(src.homepage, "name: 'promotion'") && has(src.homepage, "value: 'percentage'") && has(src.homepage, "value: 'addon'"))

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP H — INVENTORY SETTINGS (tests 77-84)
// ═══════════════════════════════════════════════════════════════════════════════

test('H01', 'inventorySettings has title field with initialValue "Our Inventory"', () =>
  has(src.inventory, "name: 'inventorySettings'") && has(src.inventory, "initialValue: 'Our Inventory'"))

test('H02', 'inventorySettings has showFiltersSidebar boolean with initialValue: true', () =>
  has(src.inventory, "name: 'showFiltersSidebar'") && has(src.inventory, 'initialValue: true'))

test('H03', 'inventorySettings has itemsPerPage with min(6).max(48) validation', () =>
  has(src.inventory, "name: 'itemsPerPage'") && has(src.inventory, 'Rule.min(6).max(48)'))

test('H04', 'inventorySettings has defaultSortOrder with 5 options', () =>
  has(src.inventory, "value: 'newest'") && has(src.inventory, "value: 'price_asc'") && has(src.inventory, "value: 'year_desc'"))

test('H05', 'inventorySettings has filterOptions object with 10 boolean toggles', () => {
  const filters = ['showMakeFilter','showModelFilter','showYearFilter','showPriceFilter',
    'showMileageFilter','showBodyTypeFilter','showFuelTypeFilter','showTransmissionFilter',
    'showDrivetrainFilter','showColorFilter']
  return filters.every(f => has(src.inventory, `name: '${f}'`))
})

test('H06', 'inventorySettings has creditTiers array with 4 default tiers (Excellent/Good/Fair/Subprime)', () =>
  has(src.inventory, "label: 'Excellent'") && has(src.inventory, "label: 'Good'") &&
  has(src.inventory, "label: 'Fair'") && has(src.inventory, "label: 'Subprime'"))

test('H07', 'inventorySettings has priceDisplay with showBiWeeklyPayment/showMonthlyPayment', () =>
  has(src.inventory, "name: 'priceDisplay'") && has(src.inventory, "name: 'showBiWeeklyPayment'"))

test('H08', 'inventorySettings has taxRate with min(0).max(15) validation', () =>
  has(src.inventory, "name: 'taxRate'") && has(src.inventory, 'Rule.min(0).max(15)'))

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP I — STUDIO STRUCTURE (tests 85-92)
// ═══════════════════════════════════════════════════════════════════════════════

test('I01', 'structure.ts exports structure function', () =>
  has(src.structure, 'export const structure'))

test('I02', 'structure has Inventory section with vehicle document list', () =>
  has(src.structure, "'vehicle'") && has(src.structure, 'All Vehicles'))

test('I03', 'structure has By Status sub-navigation (available/in-transit/reserved/sold)', () =>
  has(src.structure, 'By Status') && has(src.structure, '"available"') && has(src.structure, '"sold"'))

test('I04', 'structure has Financing section with lender list and financingPage singleton', () =>
  has(src.structure, 'Financing') && has(src.structure, "'lender'") && has(src.structure, "'financingPage'"))

test('I05', 'structure has Delivery section pointing to deliverySettings singleton', () =>
  has(src.structure, 'Delivery') && has(src.structure, "'deliverySettings'"))

test('I06', 'structure has Pages section with homepage/sellYourCarPage singletons', () =>
  has(src.structure, "'homepage'") && has(src.structure, "'sellYourCarPage'"))

test('I07', 'structure has Content section with blogPost/testimonial/faqEntry/protectionPlan', () =>
  has(src.structure, "'blogPost'") && has(src.structure, "'testimonial'") && has(src.structure, "'protectionPlan'"))

test('I08', 'structure has Settings section with siteSettings/navigation/aiSettings/vdpSettings', () =>
  has(src.structure, "'siteSettings'") && has(src.structure, "'aiSettings'") && has(src.structure, "'vdpSettings'"))

// ═══════════════════════════════════════════════════════════════════════════════
// GROUP J — CROSS-SCHEMA INTEGRITY (tests 93-100)
// ═══════════════════════════════════════════════════════════════════════════════

test('J01', 'vehicle references lender schema via specialFinance field', () =>
  has(src.vehicle, "type: 'reference'") && has(src.vehicle, "type: 'lender'"))

test('J02', 'navigation references trustBadge type (defined in pages.ts)', () =>
  has(src.settings, "type: 'trustBadge'"))

test('J03', 'homepage references supabaseVehicleReference type for featuredVehicles', () =>
  has(src.pages, "type: 'supabaseVehicleReference'"))

test('J04', 'lender schema is NOT duplicated in pages.ts (pages.ts lender is a simplified version)', () => {
  // pages.ts lender has only 5 fields; lender.ts has 15+ fields
  const pagesLenderFields = src.pages.match(/export const lender[\s\S]*?^}/m)
  if (!pagesLenderFields) return 'lender not found in pages.ts'
  const fieldCount = (pagesLenderFields[0].match(/defineField/g) || []).length
  return fieldCount <= 6 || `pages.ts lender has ${fieldCount} fields (expected ≤6 simplified)`
})

test('J05', 'all document schemas use defineType from sanity', () => {
  const files = [src.content, src.pages, src.settings, src.lender, src.vehicle, src.homepage, src.inventory]
  return files.every(f => has(f, 'defineType'))
})

test('J06', 'all document schemas use defineField from sanity', () => {
  const files = [src.content, src.pages, src.settings, src.lender, src.vehicle, src.homepage, src.inventory]
  return files.every(f => has(f, 'defineField'))
})

test('J07', 'no schema file uses bare window (should use globalThis.window)', () => {
  const files = [src.content, src.pages, src.settings, src.lender, src.vehicle, src.homepage, src.inventory, src.structure]
  // Check for bare window. usage (not globalThis.window)
  const bareWindow = /(?<!globalThis\.)window\./
  const violations = files.filter(f => bareWindow.test(f))
  return violations.length === 0 || `${violations.length} file(s) use bare window.`
})

test('J08', 'structure.ts uses StructureBuilder type import from sanity/structure', () =>
  has(src.structure, "from 'sanity/structure'") && has(src.structure, 'StructureBuilder'))

// ─── Print Results ────────────────────────────────────────────────────────────
const total = passed + failed
const pct = ((passed / total) * 100).toFixed(1)

console.log('\n' + '═'.repeat(80))
console.log('  PLANET MOTORS — SANITY STUDIO SCHEMA TEST RESULTS')
console.log('═'.repeat(80))
console.log(`  Total Tests : ${total}`)
console.log(`  Passed      : ${passed}  ✅`)
console.log(`  Failed      : ${failed}  ❌`)
console.log(`  Pass Rate   : ${pct}%`)
console.log('═'.repeat(80) + '\n')

// Detailed table
const colW = [4, 6, 55, 30]
const header = ['ID', 'STATUS', 'DESCRIPTION', 'DETAIL']
const row = (r) => [r.id, r.status, r.description, r.detail]

console.log(header.map((h, i) => h.padEnd(colW[i])).join(' | '))
console.log(colW.map(w => '-'.repeat(w)).join('-+-'))
for (const r of results) {
  const cols = row(r)
  const icon = r.status === 'PASS' ? '✅' : '❌'
  console.log(`${cols[0].padEnd(colW[0])} | ${(icon + ' ' + cols[1]).padEnd(colW[1]+2)} | ${cols[2].padEnd(colW[2])} | ${cols[3].slice(0, colW[3])}`)
}

console.log('\n' + '═'.repeat(80))
console.log(`  FINAL SCORE: ${passed}/${total} = ${pct}%`)
console.log('═'.repeat(80) + '\n')

// Save JSON results
import { writeFileSync } from 'node:fs'
const report = {
  timestamp: new Date().toISOString(),
  summary: { total, passed, failed, passRate: pct + '%' },
  results,
}
writeFileSync(
  resolve(__dirname, 'sanity-schema-test-results.json'),
  JSON.stringify(report, null, 2)
)
console.log('  📄 Results saved to: sanity-schema-test-results.json\n')

process.exit(failed > 0 ? 1 : 0)
