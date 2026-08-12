import { EMPTY_VALUE, type ListingVariantValue } from '../types'

const VALID = ['prodotto', 'progetto', 'insetto', 'catalogo'] as const
const VALID_VISTAS = ['categoria', 'application_area'] as const

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

    const items = Array.isArray(value.items)
      ? value.items.filter((item): item is string => typeof item === 'string')
      : []
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

      const vistaRaw = value.vista
      const vista =
        typeof vistaRaw === 'string' &&
        VALID_VISTAS.includes(vistaRaw as (typeof VALID_VISTAS)[number])
          ? (vistaRaw as ListingVariantValue['vista'])
          : vistaRaw === 'bestseller'
            ? undefined
            : category
              ? 'categoria'
              : undefined

      return {
        variant,
        selection_mode,
        vista,
        category,
        subcategory: typeof value.subcategory === 'string' ? value.subcategory : '',
        application_area:
          typeof value.application_area === 'string' ? value.application_area : '',
        bestseller: Boolean(value.bestseller) || legacyBestsellerVista,
        items: selection_mode === 'manual' ? items : [],
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
    }
  }

  return { ...EMPTY_VALUE }
}

export function validateContent(content: unknown) {
  return { content: normalizeContent(content) }
}
