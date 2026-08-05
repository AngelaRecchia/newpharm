import type {
  ListingContentComponent,
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

export function parseListingVariant(raw: unknown): ListingVariantValue {
  if (raw == null || raw === '') {
    return { ...EMPTY_VARIANT_VALUE }
  }

  if (typeof raw === 'object' && raw !== null) {
    const value = raw as Record<string, unknown>
    const variantSource = value.variant ?? value.content_variant

    return {
      variant: normalizeVariant(variantSource),
      items: Array.isArray(value.items)
        ? value.items.filter((id): id is string => typeof id === 'string' && id.length > 0)
        : [],
      category: typeof value.category === 'string' ? value.category : '',
      piu_recente: Boolean(value.piu_recente),
      alfabetico: Boolean(value.alfabetico),
    }
  }

  return { ...EMPTY_VARIANT_VALUE }
}

export function variantToComponent(variant: ListingVariantSlug): ListingContentComponent {
  return VARIANT_TO_COMPONENT[variant]
}

export function sortResolvedListingStories(
  stories: ListingStoryResolved[],
  options: Pick<ListingVariantValue, 'piu_recente' | 'alfabetico'>,
): ListingStoryResolved[] {
  const sorted = [...stories]
  if (options.piu_recente) {
    sorted.sort((a, b) => {
      const aTime = a.published_at ? Date.parse(a.published_at) : 0
      const bTime = b.published_at ? Date.parse(b.published_at) : 0
      return bTime - aTime
    })
    return sorted
  }
  if (options.alfabetico) {
    sorted.sort((a, b) => a.name.localeCompare(b.name, 'it'))
  }
  return sorted
}
