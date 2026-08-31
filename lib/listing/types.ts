export type ListingVariantSlug = 'prodotto' | 'progetto' | 'insetto' | 'catalogo'

export type ListingContentComponent = 'product' | 'project' | 'insect' | 'catalog' | 'job'

export type ListingImageRatio = 'square' | 'portrait'

/** prodotto: manual | dynamic — progetto: all | tag | manual — altre: all | manual */
export type ListingSelectionMode = 'manual' | 'dynamic' | 'all' | 'tag'

export type ListingProductVista = 'categoria' | 'application_area'

export type ListingVariantValue = {
  variant: ListingVariantSlug
  selection_mode: ListingSelectionMode
  vista?: ListingProductVista
  category?: string
  subcategory?: string
  application_area?: string
  /** Solo prodotto dynamic: filtra prodotti flaggati bestseller */
  bestseller?: boolean
  /** progetto tag: slug divisione */
  tag?: string
  /** prodotto/progetto manual: UUID inclusi — altre varianti all: UUID esclusi */
  items: string[]
  /** Solo listing editorial: square (1:1, dark) | portrait (259/340, light) */
  image_ratio?: ListingImageRatio
}

export const EMPTY_VARIANT_VALUE: ListingVariantValue = {
  variant: 'prodotto',
  selection_mode: 'dynamic',
  category: '',
  subcategory: '',
  application_area: '',
  bestseller: false,
  tag: '',
  items: [],
  image_ratio: 'portrait',
}

export const EMPTY_PROJECTS_HIGHLIGHT_VALUE: ListingVariantValue = {
  variant: 'progetto',
  selection_mode: 'all',
  tag: '',
  items: [],
}

export const VARIANT_TO_COMPONENT: Record<ListingVariantSlug, ListingContentComponent> = {
  prodotto: 'product',
  progetto: 'project',
  insetto: 'insect',
  catalogo: 'catalog',
}

export type ListingCardData = {
  uuid?: string
  title: string
  description?: string
  image: import('@/types/storyblok').AssetStoryblok | null
  href?: string
  safetySheetHref?: string
}

export type ListingStoryResolved = {
  uuid: string
  name: string
  slug: string
  full_slug: string
  created_at?: string | null
  published_at?: string | null
  first_published_at?: string | null
  content: Record<string, unknown>
}

export function isProdottoSelectionMode(
  mode: ListingSelectionMode,
): mode is 'manual' | 'dynamic' {
  return mode === 'manual' || mode === 'dynamic'
}

export function isRefAllSelectionMode(mode: ListingSelectionMode): mode is 'all' {
  return mode === 'all'
}

export function isRefTagSelectionMode(mode: ListingSelectionMode): mode is 'tag' {
  return mode === 'tag'
}
