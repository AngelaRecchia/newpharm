import { EMPTY_VALUE, type ListingVariantValue } from '../types'

const VALID = ['prodotto', 'progetto', 'insetto', 'catalogo'] as const

const LEGACY: Record<string, ListingVariantValue['variant']> = {
  product: 'prodotto',
  project: 'progetto',
  insect: 'insetto',
  catalog: 'catalogo',
}

export function normalizeContent(content: unknown): ListingVariantValue {
  if (content == null || content === '') {
    return { ...EMPTY_VALUE }
  }

  if (typeof content === 'object' && content !== null) {
    const value = content as Record<string, unknown>
    const raw = value.variant ?? value.content_variant
    const variant =
      typeof raw === 'string' && VALID.includes(raw as (typeof VALID)[number])
        ? (raw as ListingVariantValue['variant'])
        : typeof raw === 'string' && LEGACY[raw]
          ? LEGACY[raw]
          : 'prodotto'

    return {
      variant,
      items: Array.isArray(value.items)
        ? value.items.filter((item): item is string => typeof item === 'string')
        : [],
      category: typeof value.category === 'string' ? value.category : '',
      piu_recente: Boolean(value.piu_recente),
      alfabetico: Boolean(value.alfabetico),
    }
  }

  return { ...EMPTY_VALUE }
}

export function validateContent(content: unknown) {
  return { content: normalizeContent(content) }
}
