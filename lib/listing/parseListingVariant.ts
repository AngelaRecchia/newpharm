import type {
  ListingContentComponent,
  ListingImageRatio,
  ListingProductVista,
  ListingSelectionMode,
  ListingVariantSlug,
  ListingVariantValue,
  ListingStoryResolved,
} from './types'
import {
  EMPTY_PROJECTS_HIGHLIGHT_VALUE,
  EMPTY_VARIANT_VALUE,
  VARIANT_TO_COMPONENT,
} from './types'

const VALID_VARIANTS: ListingVariantSlug[] = [
  'prodotto',
  'progetto',
  'insetto',
  'catalogo',
]

const VALID_VISTAS: ListingProductVista[] = ['categoria', 'application_area']

const LEGACY_VARIANT_MAP: Record<string, ListingVariantSlug> = {
  product: 'prodotto',
  project: 'progetto',
  insect: 'insetto',
  catalog: 'catalogo',
}

function normalizeVariant(raw: unknown): ListingVariantSlug {
  if (typeof raw !== 'string') return 'prodotto'
  if (VALID_VARIANTS.includes(raw as ListingVariantSlug)) {
    return raw as ListingVariantSlug
  }
  return LEGACY_VARIANT_MAP[raw] ?? 'prodotto'
}

function normalizeProdottoSelectionMode(
  raw: unknown,
  items: string[],
): 'manual' | 'dynamic' {
  if (raw === 'manual' || raw === 'dynamic') return raw
  if (raw === 'automatic') return 'dynamic'
  return items.length > 0 ? 'manual' : 'dynamic'
}

function normalizeTag(raw: unknown): string {
  return typeof raw === 'string' ? raw : ''
}

function normalizeRefSelectionMode(
  raw: unknown,
  items: string[],
  tag: string,
  allowTag: boolean,
): 'all' | 'manual' | 'tag' {
  if (raw === 'tag' && allowTag) return 'tag'
  if (raw === 'all' || raw === 'manual') return raw
  if (raw === 'automatic' || raw === 'dynamic') {
    return items.length > 0 ? 'manual' : allowTag && tag ? 'tag' : 'all'
  }
  if (allowTag && tag) return 'tag'
  return items.length > 0 ? 'manual' : 'all'
}

function normalizeVista(raw: unknown, legacyCategory: string): ListingProductVista | undefined {
  if (typeof raw === 'string' && VALID_VISTAS.includes(raw as ListingProductVista)) {
    return raw as ListingProductVista
  }
  if (raw === 'bestseller') return undefined
  return legacyCategory ? 'categoria' : undefined
}

function normalizeImageRatio(raw: unknown): ListingImageRatio {
  return raw === 'square' ? 'square' : 'portrait'
}

export function parseListingVariant(raw: unknown): ListingVariantValue {
  if (raw == null || raw === '') {
    return { ...EMPTY_VARIANT_VALUE }
  }

  if (typeof raw === 'object' && raw !== null) {
    const value = raw as Record<string, unknown>
    const variantSource = value.variant ?? value.content_variant
    const variant = normalizeVariant(variantSource)
    const items = Array.isArray(value.items)
      ? value.items.filter((id): id is string => typeof id === 'string' && id.length > 0)
      : []
    const category = typeof value.category === 'string' ? value.category : ''
    const tag = normalizeTag(value.tag)
    const legacyBestsellerVista = value.vista === 'bestseller'

    if (variant === 'prodotto') {
      const selection_mode = normalizeProdottoSelectionMode(value.selection_mode, items)
      return {
        variant,
        selection_mode,
        vista: normalizeVista(value.vista, category),
        category,
        subcategory:
          typeof value.subcategory === 'string' ? value.subcategory : '',
        application_area:
          typeof value.application_area === 'string' ? value.application_area : '',
        bestseller: Boolean(value.bestseller) || legacyBestsellerVista,
        tag: '',
        items: selection_mode === 'manual' ? items : [],
        image_ratio: normalizeImageRatio(value.image_ratio),
      }
    }

    const allowTag = variant === 'progetto'
    const selection_mode = normalizeRefSelectionMode(
      value.selection_mode,
      items,
      tag,
      allowTag,
    )
    return {
      variant,
      selection_mode,
      tag: selection_mode === 'tag' ? tag : '',
      items: selection_mode === 'tag' ? [] : items,
      image_ratio: normalizeImageRatio(value.image_ratio),
    }
  }

  return { ...EMPTY_VARIANT_VALUE }
}

export function variantToComponent(variant: ListingVariantSlug): ListingContentComponent {
  return VARIANT_TO_COMPONENT[variant]
}

function getLastAddedTimestamp(story: ListingStoryResolved): number {
  const raw =
    story.first_published_at ?? story.published_at ?? story.created_at ?? null
  return raw ? Date.parse(raw) : 0
}

export function sortResolvedListingStories(
  stories: ListingStoryResolved[],
): ListingStoryResolved[] {
  return [...stories].sort(
    (a, b) => getLastAddedTimestamp(b) - getLastAddedTimestamp(a),
  )
}

function asPluginObject(raw: unknown): Record<string, unknown> | null {
  if (raw && typeof raw === 'object') return raw as Record<string, unknown>
  if (typeof raw !== 'string' || !raw.trim()) return null
  try {
    const parsed = JSON.parse(raw) as unknown
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
  } catch {
    return null
  }
}

export function parseProjectsHighlightVariant(raw: unknown): ListingVariantValue {
  if (raw == null || raw === '') {
    return { ...EMPTY_PROJECTS_HIGHLIGHT_VALUE }
  }

  const objectValue = asPluginObject(raw)
  const parsed = parseListingVariant(
    objectValue ? { ...objectValue, variant: 'progetto' } : raw,
  )

  const selection_mode: ListingSelectionMode =
    parsed.selection_mode === 'tag' || parsed.selection_mode === 'manual'
      ? parsed.selection_mode
      : 'all'

  return {
    variant: 'progetto',
    selection_mode,
    tag: selection_mode === 'tag' ? parsed.tag ?? '' : '',
    items: selection_mode === 'manual' ? parsed.items : [],
  }
}
