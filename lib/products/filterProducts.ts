import type { ProductFiltriValue } from '@/lib/product-filtri'
import type { ListingStoryResolved } from '@/lib/listing/types'
import { getApplicationAreaMatchValues } from './applicationAreas'
import type { ProductsFilterState } from './types'

export function filterProductStories(
  stories: ListingStoryResolved[],
  filters: ProductsFilterState,
): ListingStoryResolved[] {
  const areaMatchValues = getApplicationAreaMatchValues(filters.applicationArea)

  return stories.filter((story) => {
    const content = story.content ?? {}
    const productFiltri = content.product_filtri as ProductFiltriValue | undefined

    if (filters.category && productFiltri?.category !== filters.category) {
      return false
    }

    if (filters.subcategories.length > 0) {
      const subs = productFiltri?.subcategories ?? []
      if (!filters.subcategories.some((slug) => subs.includes(slug))) {
        return false
      }
    }

    if (filters.applicationArea) {
      const areas = content.application_areas
      // Gli id possono essere numerici (script d'import) o stringhe: String()
      // normalizza il confronto in entrambi i casi.
      const match =
        Array.isArray(areas) &&
        areas.some((area) => areaMatchValues.has(String(area)))
      if (!match) {
        return false
      }
    }

    return true
  })
}

export function sortProductStories(
  stories: ListingStoryResolved[],
  sort: ProductsFilterState['sort'],
): ListingStoryResolved[] {
  const copy = [...stories]

  if (sort === 'alphabetical') {
    copy.sort((a, b) => a.name.localeCompare(b.name, 'it'))
    return copy
  }

  // "Ultimi aggiunti": first_published_at non cambia alle ripubblicazioni
  copy.sort((a, b) => {
    const aRaw = a.first_published_at ?? a.published_at
    const bRaw = b.first_published_at ?? b.published_at
    const aDate = aRaw ? Date.parse(aRaw) : 0
    const bDate = bRaw ? Date.parse(bRaw) : 0
    return bDate - aDate
  })

  return copy
}
