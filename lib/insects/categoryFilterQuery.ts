import {
  parseInsectCategories,
  sortInsectCategories,
  type InsectCategory,
} from './categories'

export const INSECT_CATEGORY_QUERY_PARAM = 'category'
export const INSECT_PAGE_QUERY_PARAM = 'page'

type SearchParamsLike = Pick<URLSearchParams, 'get' | 'toString'>

export function parseInsectCategorySearchParams(
  searchParams: SearchParamsLike,
): InsectCategory[] {
  return parseInsectCategories(searchParams.get(INSECT_CATEGORY_QUERY_PARAM))
}

export function parseInsectPageSearchParams(searchParams: SearchParamsLike): number {
  const raw = searchParams.get(INSECT_PAGE_QUERY_PARAM)
  if (!raw) return 1

  const page = Number.parseInt(raw, 10)
  if (!Number.isFinite(page) || page < 1) return 1
  return page
}

export function buildInsectCategorySearchParams(
  current: SearchParamsLike,
  categories: InsectCategory[],
  page: number,
): URLSearchParams {
  const params = new URLSearchParams(current.toString())
  const sorted = sortInsectCategories(categories)

  params.delete(INSECT_CATEGORY_QUERY_PARAM)
  params.delete(INSECT_PAGE_QUERY_PARAM)

  if (sorted.length > 0) {
    params.set(INSECT_CATEGORY_QUERY_PARAM, sorted.join(','))
  }
  if (page > 1) {
    params.set(INSECT_PAGE_QUERY_PARAM, String(page))
  }

  return params
}
