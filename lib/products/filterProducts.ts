import type { ProductFiltriValue } from '@/lib/product-filtri'
import type { ListingStoryResolved } from '@/lib/listing/types'
import { getApplicationAreaMatchValues } from './applicationAreas'
import { isProductBestseller } from './isProductBestseller'
import type { ProductsFilterState } from './types'

function getPublishedTimestamp(story: ListingStoryResolved): number {
  const raw = story.first_published_at ?? story.published_at
  return raw ? Date.parse(raw) : 0
}

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

  if (sort === 'bestsellers') {
    copy.sort((a, b) => {
      const aBest = isProductBestseller(a.content)
      const bBest = isProductBestseller(b.content)
      if (aBest !== bBest) return aBest ? -1 : 1
      return getPublishedTimestamp(b) - getPublishedTimestamp(a)
    })
    return copy
  }

  // Ultimi aggiunti: first_published_at non cambia alle ripubblicazioni
  copy.sort((a, b) => getPublishedTimestamp(b) - getPublishedTimestamp(a))

  return copy
}
