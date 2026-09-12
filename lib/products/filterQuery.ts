import {
  getBundledFiltriEntries,
  getSubfiltersForCategory,
  parseFiltriEntries,
} from '@/lib/filtri'
import { getApplicationAreaEntries } from '@/lib/products/applicationAreas'
import {
  DEFAULT_PRODUCTS_FILTER,
  type ProductsFilterState,
  type ProductsSortMode,
  type ProductsViewMode,
} from '@/lib/products/types'

const SORT_VALUES = new Set<ProductsSortMode>(['recent', 'alphabetical', 'bestsellers'])
const VIEW_VALUES = new Set<ProductsViewMode>(['grid', 'list'])

type SearchParamsLike = Pick<URLSearchParams, 'get'>

function getValidCategoryValues(): Set<string> {
  const parsed = parseFiltriEntries(getBundledFiltriEntries())
  return new Set(parsed.categories.map((entry) => entry.value))
}

function getValidApplicationAreaNames(): Set<string> {
  return new Set(getApplicationAreaEntries().map((entry) => entry.name))
}

function parseSubcategories(
  raw: string | null,
  category: string | null,
): string[] {
  if (!raw || !category) return []

  const parsed = parseFiltriEntries(getBundledFiltriEntries())
  const validValues = new Set(
    getSubfiltersForCategory(category, parsed).map((entry) => entry.value),
  )

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0 && validValues.has(value))
}

export function parseProductsFilterSearchParams(
  searchParams: SearchParamsLike,
): ProductsFilterState {
  const validCategories = getValidCategoryValues()
  const validAreas = getValidApplicationAreaNames()

  const rawCategory = searchParams.get('category')
  const category =
    rawCategory && validCategories.has(rawCategory) ? rawCategory : null

  const subcategories = parseSubcategories(
    searchParams.get('subcategories'),
    category,
  )

  const rawArea = searchParams.get('area')
  const applicationArea =
    rawArea && validAreas.has(rawArea) ? rawArea : null

  const rawSort = searchParams.get('sort')
  const sort =
    rawSort && SORT_VALUES.has(rawSort as ProductsSortMode)
      ? (rawSort as ProductsSortMode)
      : DEFAULT_PRODUCTS_FILTER.sort

  const rawView = searchParams.get('view')
  const view =
    rawView && VIEW_VALUES.has(rawView as ProductsViewMode)
      ? (rawView as ProductsViewMode)
      : DEFAULT_PRODUCTS_FILTER.view

  return {
    category,
    subcategories,
    applicationArea,
    sort,
    view,
  }
}

export function parseProductsPageSearchParams(searchParams: SearchParamsLike): number {
  const raw = searchParams.get('page')
  if (!raw) return 1

  const page = Number.parseInt(raw, 10)
  if (!Number.isFinite(page) || page < 1) return 1
  return page
}

export function buildProductsFilterSearchParams(
  filters: ProductsFilterState,
  page: number,
): URLSearchParams {
  const params = new URLSearchParams()

  if (filters.category) {
    params.set('category', filters.category)
  }

  if (filters.subcategories.length > 0) {
    params.set('subcategories', filters.subcategories.join(','))
  }

  if (filters.applicationArea) {
    params.set('area', filters.applicationArea)
  }

  if (filters.sort !== DEFAULT_PRODUCTS_FILTER.sort) {
    params.set('sort', filters.sort)
  }

  if (filters.view !== DEFAULT_PRODUCTS_FILTER.view) {
    params.set('view', filters.view)
  }

  if (page > 1) {
    params.set('page', String(page))
  }

  return params
}
