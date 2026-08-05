export type ListingVariantSlug = 'prodotto' | 'progetto' | 'insetto' | 'catalogo'

export type ListingContentComponent = 'product' | 'project' | 'insect' | 'catalog'

export type ListingVariantValue = {
  variant: ListingVariantSlug
  items: string[]
  category?: string
  piu_recente?: boolean
  alfabetico?: boolean
}

export const EMPTY_VARIANT_VALUE: ListingVariantValue = {
  variant: 'prodotto',
  items: [],
  category: '',
  piu_recente: false,
  alfabetico: false,
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
  published_at?: string | null
  first_published_at?: string | null
  content: Record<string, unknown>
}
