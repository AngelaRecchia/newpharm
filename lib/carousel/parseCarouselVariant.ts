import type { ListingProductVista } from '@/lib/listing/types'
import {
  EMPTY_CAROUSEL_VARIANT,
  type CarouselInsectMode,
  type CarouselStoryMode,
  type CarouselVariantSlug,
  type CarouselVariantValue,
} from './types'

const VALID_VARIANTS: CarouselVariantSlug[] = ['story', 'prodotto', 'editorial', 'insetto']
const VALID_STORY_MODES: CarouselStoryMode[] = ['dynamic', 'tag', 'manual']
const VALID_INSECT_MODES: CarouselInsectMode[] = ['all', 'manual']
const VALID_VISTAS: ListingProductVista[] = ['categoria', 'application_area']

function normalizeVariant(raw: unknown): CarouselVariantSlug {
  if (raw === 'product') return 'prodotto'
  if (raw === 'insect') return 'insetto'
  if (typeof raw === 'string' && VALID_VARIANTS.includes(raw as CarouselVariantSlug)) {
    return raw as CarouselVariantSlug
  }
  return 'story'
}

function normalizeStoryMode(raw: unknown, items: string[], tag: string): CarouselStoryMode {
  if (typeof raw === 'string' && VALID_STORY_MODES.includes(raw as CarouselStoryMode)) {
    return raw as CarouselStoryMode
  }
  if (raw === 'automatic') return 'dynamic'
  if (tag) return 'tag'
  if (items.length > 0) return 'manual'
  return 'dynamic'
}

function normalizeInsectMode(raw: unknown, items: string[]): CarouselInsectMode {
  if (typeof raw === 'string' && VALID_INSECT_MODES.includes(raw as CarouselInsectMode)) {
    return raw as CarouselInsectMode
  }
  return items.length > 0 ? 'manual' : 'all'
}

function normalizeVista(raw: unknown, legacyCategory: string): ListingProductVista | undefined {
  if (typeof raw === 'string' && VALID_VISTAS.includes(raw as ListingProductVista)) {
    return raw as ListingProductVista
  }
  if (raw === 'bestseller') return undefined
  return legacyCategory ? 'categoria' : undefined
}

function normalizeTag(raw: unknown): string {
  return typeof raw === 'string' ? raw : ''
}

export function parseCarouselVariant(raw: unknown): CarouselVariantValue {
  if (raw == null || raw === '') {
    return { ...EMPTY_CAROUSEL_VARIANT }
  }

  if (typeof raw !== 'object') {
    return { ...EMPTY_CAROUSEL_VARIANT }
  }

  const value = raw as Record<string, unknown>
  const variant = normalizeVariant(value.variant ?? value.content_variant)
  const items = Array.isArray(value.items)
    ? value.items.filter((id): id is string => typeof id === 'string' && id.length > 0)
    : []
  const tag = normalizeTag(value.tag)
  const category = typeof value.category === 'string' ? value.category : ''
  const legacyBestsellerVista = value.vista === 'bestseller'

  if (variant === 'story') {
    const selection_mode = normalizeStoryMode(value.selection_mode, items, tag)
    return {
      variant,
      selection_mode,
      tag: selection_mode === 'tag' ? tag : '',
      items: selection_mode === 'manual' ? items : [],
      bestseller: false,
      category: '',
      subcategory: '',
      application_area: '',
    }
  }

  if (variant === 'prodotto') {
    return {
      variant,
      selection_mode: 'dynamic',
      tag: '',
      items: [],
      vista: normalizeVista(value.vista, category),
      category,
      subcategory: typeof value.subcategory === 'string' ? value.subcategory : '',
      application_area:
        typeof value.application_area === 'string' ? value.application_area : '',
      bestseller: Boolean(value.bestseller) || legacyBestsellerVista,
    }
  }

  if (variant === 'insetto') {
    const selection_mode = normalizeInsectMode(value.selection_mode, items)
    return {
      variant,
      selection_mode,
      tag: '',
      items,
      bestseller: false,
      category: '',
      subcategory: '',
      application_area: '',
    }
  }

  return {
    variant: 'editorial',
    selection_mode: 'dynamic',
    tag: '',
    items: [],
    bestseller: false,
    category: '',
    subcategory: '',
    application_area: '',
  }
}
