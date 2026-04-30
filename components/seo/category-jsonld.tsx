/**
 * components/seo/category-jsonld.tsx
 *
 * Emits an `ItemList` schema.org block listing the vehicles shown on a
 * category landing page, plus a `BreadcrumbList` for the trail. Lets
 * Google show category pages as rich-result lists and lets AI search
 * agents (Perplexity, ChatGPT, Bing Chat) parse the full match set
 * even when JS isn't executed.
 *
 * The component is server-only — it only emits markup; no client
 * runtime cost.
 */

import { getPublicSiteUrl } from '@/lib/site-url'
import type { CategoryFilter } from '@/lib/seo/category-slug-parser'
import type { CategoryVehicle } from '@/lib/vehicles/fetch-by-filter'

const SITE_URL = getPublicSiteUrl()

interface Props {
  filter: CategoryFilter
  vehicles: CategoryVehicle[]
}

function vehicleListItem(v: CategoryVehicle, position: number) {
  const url = `${SITE_URL}/vehicles/${v.id}`
  const name = `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ''}`
  return {
    '@type': 'ListItem',
    position,
    url,
    item: {
      '@type': 'Vehicle',
      '@id': url,
      name,
      url,
      image: v.primaryImageUrl ?? undefined,
      vehicleModelDate: String(v.year),
      brand: { '@type': 'Brand', name: v.make },
      model: v.model,
      mileageFromOdometer: {
        '@type': 'QuantitativeValue',
        value: v.mileage,
        unitCode: 'KMT',
      },
      offers: {
        '@type': 'Offer',
        url,
        priceCurrency: 'CAD',
        price: v.price,
        availability:
          v.status === 'available'
            ? 'https://schema.org/InStock'
            : v.status === 'reserved'
              ? 'https://schema.org/PreOrder'
              : 'https://schema.org/SoldOut',
        seller: { '@type': 'AutoDealer', name: 'Planet Motors' },
      },
    },
  }
}

export function CategoryJsonLd({ filter, vehicles }: Props) {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${SITE_URL}${filter.canonicalPath}#itemlist`,
    name: filter.h1,
    description: filter.shortDescription,
    numberOfItems: vehicles.length,
    itemListOrder: 'https://schema.org/ItemListOrderDescending',
    url: `${SITE_URL}${filter.canonicalPath}`,
    itemListElement: vehicles.map((v, i) => vehicleListItem(v, i + 1)),
  }

  const breadcrumbs = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Inventory',
        item: `${SITE_URL}/inventory`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: filter.h1,
        item: `${SITE_URL}${filter.canonicalPath}`,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />
    </>
  )
}
