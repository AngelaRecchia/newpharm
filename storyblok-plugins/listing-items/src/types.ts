export type ListingVariantSlug = 'prodotto' | 'progetto' | 'insetto' | 'catalogo'

export type ListingSelectionMode = 'manual' | 'dynamic' | 'all'

export type ListingProductVista = 'categoria' | 'application_area'

export type ListingVariantValue = {
  variant: ListingVariantSlug
  selection_mode: ListingSelectionMode
  vista?: ListingProductVista
  category?: string
  subcategory?: string
  application_area?: string
  bestseller?: boolean
  items: string[]
}

export const EMPTY_VALUE: ListingVariantValue = {
  variant: 'prodotto',
  selection_mode: 'dynamic',
  category: '',
  subcategory: '',
  application_area: '',
  bestseller: false,
  items: [],
}

export const VARIANT_TO_COMPONENT: Record<ListingVariantSlug, string> = {
  prodotto: 'product',
  progetto: 'project',
  insetto: 'insect',
  catalogo: 'catalog',
}

export type StoryOption = {
  uuid: string
  name: string
  full_slug: string
  published_at?: string | null
}

export type FiltriEntry = {
  id?: number
  name: string
  value: string
}

export type ApplicationAreaEntry = {
  name: string
  value: string
  id: string
}
