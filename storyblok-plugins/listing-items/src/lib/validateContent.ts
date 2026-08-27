import {
  EMPTY_CAROUSEL_VALUE,
  EMPTY_VALUE,
  PROJECT_DIVISIONS,
  STORY_TAGS,
  type CarouselStoryMode,
  type ListingImageRatio,
  type ListingProductVista,
  type PluginVariantValue,
  type ProjectDivision,
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
  if (typeof value === 'string' && value.length > 0) return [value]
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.length > 0)
    : []
}

function sameStringList(a: string[] | undefined, b: string[] | undefined): boolean {
  const left = a ?? []
  const right = b ?? []
  if (left.length !== right.length) return false
  return left.every((item, index) => item === right[index])
}

function sameToken(raw: unknown, normalized: unknown): boolean {
  return (raw ?? '') === (normalized ?? '')
}

/** Chiave assente sul raw = accetta il default del normalizer (non riscrivere il campo). */
function sameDefaultable(raw: unknown, normalized: unknown): boolean {
  if (raw == null || raw === '') return true
  return sameToken(raw, normalized)
}

export function coercePluginContent(content: unknown): unknown {
  if (typeof content !== 'string') return content
  const trimmed = content.trim()
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return ''
  try {
    return JSON.parse(trimmed)
  } catch {
    return content
  }
}

export function isSamePluginContent(raw: unknown, normalized: PluginVariantValue): boolean {
  if (!raw || typeof raw !== 'object') return false
  const value = raw as PluginVariantValue

  if (normalized.context === 'projects_highlight') {
    return (
      sameDefaultable(value.variant, 'progetto') &&
      sameToken(value.selection_mode, normalized.selection_mode) &&
      sameToken(value.tag, normalized.tag) &&
      sameDefaultable(value.context, 'projects_highlight') &&
      sameStringList(asItems(value.items), normalized.items)
    )
  }

  return (
    sameToken(value.variant, normalized.variant) &&
    sameToken(value.selection_mode, normalized.selection_mode) &&
    sameToken(value.tag, normalized.tag) &&
    sameDefaultable(value.context, normalized.context) &&
    sameDefaultable(value.image_ratio, normalized.image_ratio) &&
    sameDefaultable(value.vista, normalized.vista) &&
    sameDefaultable(value.category, normalized.category) &&
    sameDefaultable(value.subcategory, normalized.subcategory) &&
    sameDefaultable(value.application_area, normalized.application_area) &&
    Boolean(value.bestseller) === Boolean(normalized.bestseller) &&
    sameStringList(asItems(value.items), normalized.items)
  )
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
  if (PROJECT_DIVISIONS.includes(raw as ProjectDivision)) return raw
  return raw
}

function normalizeProjectsHighlight(
  value: Record<string, unknown>,
  items: string[],
): PluginVariantValue {
  const tag = normalizeTag(value.tag)
  const rawMode = value.selection_mode
  const selection_mode =
    rawMode === 'tag' || rawMode === 'manual' || rawMode === 'all'
      ? rawMode
      : tag
        ? 'tag'
        : items.length > 0
          ? 'manual'
          : 'all'

  return {
    variant: 'progetto',
    selection_mode,
    tag: selection_mode === 'tag' ? tag : '',
    items: selection_mode === 'manual' ? items : [],
    context: 'projects_highlight',
  }
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
  const coerced = coercePluginContent(content)

  if (coerced == null || coerced === '') {
    return EMPTY_VALUE
  }

  if (typeof coerced !== 'object') {
    return EMPTY_VALUE
  }

  const value = coerced as Record<string, unknown>
  const raw = value.variant ?? value.content_variant
  const items = asItems(value.items)
  const isProjectsHighlightContext = value.context === 'projects_highlight'
  const isCarouselContext = value.context === 'carousel' || raw === 'story' || raw === 'editorial'

  if (isProjectsHighlightContext) {
    return normalizeProjectsHighlight(value, items)
  }

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

  const tag = normalizeTag(value.tag)
  const allowTag = variant === 'progetto'
  const rawMode = value.selection_mode
  const selection_mode =
    rawMode === 'tag' && allowTag
      ? 'tag'
      : rawMode === 'all' || rawMode === 'manual'
        ? rawMode
        : rawMode === 'automatic' || rawMode === 'dynamic'
          ? items.length > 0
            ? 'manual'
            : allowTag && tag
              ? 'tag'
              : 'all'
          : allowTag && tag
            ? 'tag'
            : items.length > 0
              ? 'manual'
              : 'all'

  return {
    variant,
    selection_mode,
    tag: selection_mode === 'tag' ? tag : '',
    items: selection_mode === 'tag' ? [] : items,
    image_ratio: normalizeImageRatio(value.image_ratio),
  }
}

export function validateContent(content: unknown) {
  const coerced = coercePluginContent(content)

  // Come link-action: non riscrivere mai il payload highlight, altrimenti
  // Storyblok rimanda indietro un oggetto nuovo e il plugin entra in loop.
  if (coerced && typeof coerced === 'object') {
    const value = coerced as Record<string, unknown>
    if (value.context === 'projects_highlight') {
      return { content: coerced as PluginVariantValue }
    }
  }

  const normalized = normalizeContent(coerced)
  if (isSamePluginContent(coerced, normalized)) {
    return { content: coerced as PluginVariantValue }
  }
  return { content: normalized }
}
