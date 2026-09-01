export type InsectVisibility = 'product' | 'listing' | 'both'

export function parseInsectVisibility(raw: unknown): InsectVisibility | null {
  if (raw === 'product' || raw === 'listing' || raw === 'both') return raw
  return null
}

/** Picker prodotto: product, both, o campo assente (story legacy). */
export function isProductPestVisible(raw: unknown): boolean {
  const visibility = parseInsectVisibility(raw)
  return visibility === null || visibility === 'product' || visibility === 'both'
}

/** Listing insetti: solo listing o both. */
export function isListingVisible(raw: unknown): boolean {
  const visibility = parseInsectVisibility(raw)
  return visibility === 'listing' || visibility === 'both'
}
