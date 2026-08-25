import type { ProductFiltriValue } from '@/lib/product-filtri'
import type { ListingStoryResolved } from '@/lib/listing/types'
import { CAROUSEL_LIMIT } from '@/lib/carousel/types'
import { isProductBestseller } from './isProductBestseller'

function getFiltri(
  content: Record<string, unknown> | null | undefined,
): ProductFiltriValue {
  const raw = content?.product_filtri
  if (!raw || typeof raw !== 'object') return {}
  return raw as ProductFiltriValue
}

function getTimestamp(story: ListingStoryResolved): number {
  const raw = story.first_published_at ?? story.published_at
  return raw ? Date.parse(raw) : 0
}

function sharesSubcategory(current: string[], other: string[]): boolean {
  if (current.length === 0 || other.length === 0) return false
  const otherSet = new Set(other)
  return current.some((sub) => otherSet.has(sub))
}

/** `it/prodotti/nome-prodotto` → `it/prodotti` */
export function getParentFullSlug(fullSlug: string): string {
  const parts = fullSlug.split('/').filter(Boolean)
  if (parts.length <= 1) return fullSlug
  parts.pop()
  return parts.join('/')
}

export function getRelatedCategoryProducts(
  products: ListingStoryResolved[],
  currentUuid: string,
  currentContent: Record<string, unknown>,
  limit = CAROUSEL_LIMIT,
): ListingStoryResolved[] {
  const currentFiltri = getFiltri(currentContent)
  const category = currentFiltri.category?.trim()
  if (!category) return []

  const currentSubs = currentFiltri.subcategories ?? []

  return products
    .filter((story) => {
      if (story.uuid === currentUuid) return false
      return getFiltri(story.content).category?.trim() === category
    })
    .sort((a, b) => {
      const aSub = sharesSubcategory(
        currentSubs,
        getFiltri(a.content).subcategories ?? [],
      )
      const bSub = sharesSubcategory(
        currentSubs,
        getFiltri(b.content).subcategories ?? [],
      )
      if (aSub !== bSub) return aSub ? -1 : 1

      const aBest = isProductBestseller(a.content)
      const bBest = isProductBestseller(b.content)
      if (aBest !== bBest) return aBest ? -1 : 1

      return getTimestamp(b) - getTimestamp(a)
    })
    .slice(0, limit)
}
