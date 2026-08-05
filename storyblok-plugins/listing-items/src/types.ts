export type ListingVariantSlug = 'prodotto' | 'progetto' | 'insetto' | 'catalogo'

export type ListingVariantValue = {
  variant: ListingVariantSlug
  items: string[]
  /** Solo prodotto: category__... dal datasource filtri */
  category?: string
  piu_recente?: boolean
  alfabetico?: boolean
}

export const EMPTY_VALUE: ListingVariantValue = {
  variant: 'prodotto',
  items: [],
  category: '',
  piu_recente: false,
  alfabetico: false,
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
