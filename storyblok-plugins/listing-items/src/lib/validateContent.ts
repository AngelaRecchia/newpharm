import {
  EMPTY_CAROUSEL_VALUE,
  EMPTY_VALUE,
  STORY_TAGS,
  type CarouselStoryMode,
  type ListingImageRatio,
  type ListingProductVista,
  type PluginVariantValue,
  type StoryTag,
} from '../types'

const LISTING_VARIANTS = ['prodotto', 'progetto', 'insetto', 'catalogo'] as const
const VALID_VISTAS = ['categoria', 'application_area'] as const
const STORY_MODES: CarouselStoryMode[] = ['dynamic', 'tag', 'manual']

const LEGACY: Record<string, 'prodotto' | 'progetto' | 'insetto' | 'catalogo'> = {
  product: 'prodotto',
  project: 'progetto',
  insect: 'insetto',
  catalog: 'catalogo',
}

function normalizeImageRatio(raw: unknown): ListingImageRatio {
  return raw === 'square' ? 'square' : 'portrait'
}

function asItems(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
}

function normalizeVista(raw: unknown, category: string): ListingProductVista | undefined {
  if (typeof raw === 'string' && VALID_VISTAS.includes(raw as (typeof VALID_VISTAS)[number])) {
    return raw as ListingProductVista
  }
  if (raw === 'bestseller') return undefined
  return category ? 'categoria' : undefined
}

function normalizeTag(raw: unknown): string {
  if (typeof raw !== 'string' || !raw) return ''
  if (STORY_TAGS.includes(raw as StoryTag)) return raw
  return raw
}

function normalizeCarouselProdotto(value: Record<string, unknown>, items: string[]): PluginVariantValue {
  const category = typeof value.category === 'string' ? value.category : ''
  const legacyBestsellerVista = value.vista === 'bestseller'

  return {
    variant: 'prodotto',
    selection_mode: 'dynamic',
    vista: normalizeVista(value.vista, category),
    category,
    subcategory: typeof value.subcategory === 'string' ? value.subcategory : '',
    application_area: typeof value.application_area === 'string' ? value.application_area : '',
    bestseller: Boolean(value.bestseller) || legacyBestsellerVista,
    tag: '',
    items: [],
    image_ratio: normalizeImageRatio(value.image_ratio),
    context: 'carousel',
  }
}

function normalizeCarouselStory(value: Record<string, unknown>, items: string[]): PluginVariantValue {
  const tag = normalizeTag(value.tag)
  const rawMode = value.selection_mode
  const selection_mode: CarouselStoryMode =
    typeof rawMode === 'string' && STORY_MODES.includes(rawMode as CarouselStoryMode)
      ? (rawMode as CarouselStoryMode)
      : rawMode === 'automatic'
        ? 'dynamic'
        : tag
          ? 'tag'
          : items.length > 0
            ? 'manual'
            : 'dynamic'

  return {
    variant: 'story',
    selection_mode,
    tag: selection_mode === 'tag' ? tag : '',
    items: selection_mode === 'manual' ? items.slice(0, 8) : [],
    category: '',
    subcategory: '',
    application_area: '',
    bestseller: false,
    image_ratio: normalizeImageRatio(value.image_ratio),
    context: 'carousel',
  }
}

export function normalizeContent(content: unknown): PluginVariantValue {
  if (content == null || content === '') {
    return { ...EMPTY_VALUE }
  }

  if (typeof content !== 'object') {
    return { ...EMPTY_VALUE }
  }

  const value = content as Record<string, unknown>
  const raw = value.variant ?? value.content_variant
  const items = asItems(value.items)
  const isCarouselContext = value.context === 'carousel' || raw === 'story' || raw === 'editorial'

  if (isCarouselContext) {
    if (raw === 'editorial') {
      return {
        ...EMPTY_CAROUSEL_VALUE,
        variant: 'editorial',
        image_ratio: normalizeImageRatio(value.image_ratio),
      }
    }
    if (raw === 'prodotto' || raw === 'product') {
      return normalizeCarouselProdotto(value, items)
    }
    return normalizeCarouselStory(value, items)
  }

  const variant =
    typeof raw === 'string' && LISTING_VARIANTS.includes(raw as (typeof LISTING_VARIANTS)[number])
      ? (raw as (typeof LISTING_VARIANTS)[number])
      : typeof raw === 'string' && LEGACY[raw]
        ? LEGACY[raw]
        : 'prodotto'

  const category = typeof value.category === 'string' ? value.category : ''
  const legacyBestsellerVista = value.vista === 'bestseller'

  if (variant === 'prodotto') {
    const rawMode = value.selection_mode
    const selection_mode =
      rawMode === 'manual' || rawMode === 'dynamic'
        ? rawMode
        : rawMode === 'automatic'
          ? 'dynamic'
          : items.length > 0
            ? 'manual'
            : 'dynamic'

    return {
      variant,
      selection_mode,
      vista: normalizeVista(value.vista, category),
      category,
      subcategory: typeof value.subcategory === 'string' ? value.subcategory : '',
      application_area: typeof value.application_area === 'string' ? value.application_area : '',
      bestseller: Boolean(value.bestseller) || legacyBestsellerVista,
      items: selection_mode === 'manual' ? items : [],
      image_ratio: normalizeImageRatio(value.image_ratio),
    }
  }

  const rawMode = value.selection_mode
  const selection_mode =
    rawMode === 'all' || rawMode === 'manual'
      ? rawMode
      : rawMode === 'automatic' || rawMode === 'dynamic'
        ? items.length > 0
          ? 'manual'
          : 'all'
        : items.length > 0
          ? 'manual'
          : 'all'

  return {
    variant,
    selection_mode,
    items,
    image_ratio: normalizeImageRatio(value.image_ratio),
  }
}

export function validateContent(content: unknown) {
  return { content: normalizeContent(content) }
}
