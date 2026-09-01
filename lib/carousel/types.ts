import type { ListingProductVista } from '@/lib/listing/types'

export const CAROUSEL_LIMIT = 8

export type CarouselVariantSlug = 'story' | 'prodotto' | 'editorial' | 'insetto'

export type CarouselStoryMode = 'dynamic' | 'tag' | 'manual'

/** insetto: all | manual — come listing */
export type CarouselInsectMode = 'all' | 'manual'

export type CarouselSelectionMode = CarouselStoryMode | CarouselInsectMode

export type CarouselVariantValue = {
  variant: CarouselVariantSlug
  selection_mode: CarouselSelectionMode
  tag?: string
  items: string[]
  vista?: ListingProductVista
  category?: string
  subcategory?: string
  application_area?: string
  bestseller?: boolean
}

export const EMPTY_CAROUSEL_VARIANT: CarouselVariantValue = {
  variant: 'story',
  selection_mode: 'dynamic',
  tag: '',
  items: [],
  category: '',
  subcategory: '',
  application_area: '',
  bestseller: false,
}
