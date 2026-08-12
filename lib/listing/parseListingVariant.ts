import type {
  ListingContentComponent,
  ListingProductVista,
  ListingVariantSlug,
  ListingVariantValue,
  ListingStoryResolved,
} from './types'
import { EMPTY_VARIANT_VALUE, VARIANT_TO_COMPONENT } from './types'

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

function normalizeRefSelectionMode(raw: unknown, items: string[]): 'all' | 'manual' {
  if (raw === 'all' || raw === 'manual') return raw
  if (raw === 'automatic' || raw === 'dynamic') return items.length > 0 ? 'manual' : 'all'
  return items.length > 0 ? 'manual' : 'all'
}

function normalizeVista(raw: unknown, legacyCategory: string): ListingProductVista | undefined {
  if (typeof raw === 'string' && VALID_VISTAS.includes(raw as ListingProductVista)) {
    return raw as ListingProductVista
  }
  if (raw === 'bestseller') return undefined
  return legacyCategory ? 'categoria' : undefined
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
        items: selection_mode === 'manual' ? items : [],
      }
    }

    const selection_mode = normalizeRefSelectionMode(value.selection_mode, items)
    return {
      variant,
      selection_mode,
      items,
    }
  }

  return { ...EMPTY_VARIANT_VALUE }
}

export function variantToComponent(variant: ListingVariantSlug): ListingContentComponent {
  return VARIANT_TO_COMPONENT[variant]
}

export function sortResolvedListingStories(
  stories: ListingStoryResolved[],
): ListingStoryResolved[] {
  return [...stories]
}
