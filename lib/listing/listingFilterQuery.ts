import {
  buildProductsFilterSearchParams,
  parseProductsFilterSearchParams,
} from '@/lib/products/filterQuery'
import type { ProductsFilterState } from '@/lib/products/types'

const PREFIX = 'listing_'

type SearchParamsLike = Pick<URLSearchParams, 'get' | 'forEach'>

function toUnprefixedParams(searchParams: SearchParamsLike): URLSearchParams {
  const mapped = new URLSearchParams()

  searchParams.forEach((value, key) => {
    if (key.startsWith(PREFIX)) {
      mapped.set(key.slice(PREFIX.length), value)
    }
  })

  return mapped
}

export function parseListingHubFilterSearchParams(
  searchParams: SearchParamsLike,
): ProductsFilterState {
  return parseProductsFilterSearchParams(toUnprefixedParams(searchParams))
}

export function parseListingHubPageSearchParams(searchParams: SearchParamsLike): number {
  const raw = searchParams.get(`${PREFIX}page`)
  if (!raw) return 1

  const page = Number.parseInt(raw, 10)
  if (!Number.isFinite(page) || page < 1) return 1
  return page
}

export function buildListingHubFilterSearchParams(
  filters: ProductsFilterState,
  page: number,
): URLSearchParams {
  const base = buildProductsFilterSearchParams(filters, page)
  const prefixed = new URLSearchParams()

  base.forEach((value, key) => {
    prefixed.set(`${PREFIX}${key}`, value)
  })

  return prefixed
}
