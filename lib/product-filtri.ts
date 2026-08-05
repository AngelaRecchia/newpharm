export type ProductFiltriValue = {
  category?: string
  subcategories?: string[]
}

/** Slug categoria per i18n (es. category__accessori-roditori → accessori-roditori). */
export function getProductCategorySlug(
  productFiltri?: ProductFiltriValue | null,
  legacyCategory?: unknown,
): string | undefined {
  const fromPlugin = productFiltri?.category?.trim()
  if (fromPlugin) {
    return fromPlugin.replace(/^category__/, '')
  }

  if (legacyCategory == null || legacyCategory === '') return undefined

  if (typeof legacyCategory === 'string') {
    if (legacyCategory.startsWith('category__')) {
      return legacyCategory.replace(/^category__/, '')
    }
    return legacyCategory
  }

  if (Array.isArray(legacyCategory) && typeof legacyCategory[0] === 'string') {
    return getProductCategorySlug(null, legacyCategory[0])
  }

  return undefined
}
