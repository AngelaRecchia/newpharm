import type { ProductFiltersValue } from '@/components/molecules/ProductFilters'

export type ProductsSortMode = 'recent' | 'alphabetical' | 'bestsellers'

export type ProductsViewMode = 'grid' | 'list'

export type ProductsFilterState = ProductFiltersValue & {
  applicationArea: string | null
  sort: ProductsSortMode
  view: ProductsViewMode
}

export const DEFAULT_PRODUCTS_FILTER: ProductsFilterState = {
  category: null,
  subcategories: [],
  applicationArea: null,
  sort: 'recent',
  view: 'grid',
}
