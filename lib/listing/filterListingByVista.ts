import type { ProductFiltriValue } from '@/lib/product-filtri'
import { getApplicationAreaMatchValues } from '@/lib/products/applicationAreas'
import { isProductBestseller } from '@/lib/products/isProductBestseller'
import type { ListingStoryResolved, ListingVariantValue } from './types'

export function filterListingByVista(
  stories: ListingStoryResolved[],
  variant: Pick<
    ListingVariantValue,
    | 'selection_mode'
    | 'vista'
    | 'category'
    | 'subcategory'
    | 'application_area'
    | 'bestseller'
  >,
): ListingStoryResolved[] {
  if (variant.selection_mode !== 'dynamic') {
    return stories
  }

  let result = stories

  if (variant.bestseller) {
    result = result.filter((story) => isProductBestseller(story.content))
  }

  if (variant.vista === 'categoria') {
    result = result.filter((story) => {
      const productFiltri = story.content?.product_filtri as
        | ProductFiltriValue
        | undefined

      if (variant.category && productFiltri?.category !== variant.category) {
        return false
      }

      if (variant.subcategory) {
        const subs = productFiltri?.subcategories ?? []
        if (!subs.includes(variant.subcategory)) {
          return false
        }
      }

      return true
    })
  }

  if (variant.vista === 'application_area') {
    if (!variant.application_area) return result

    const areaMatchValues = getApplicationAreaMatchValues(variant.application_area)
    result = result.filter((story) => {
      const areas = story.content?.application_areas
      return (
        Array.isArray(areas) &&
        areas.some((area) => areaMatchValues.has(String(area)))
      )
    })
  }

  return result
}
