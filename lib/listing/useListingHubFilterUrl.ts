'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import {
  buildListingHubFilterSearchParams,
  parseListingHubFilterSearchParams,
  parseListingHubPageSearchParams,
} from '@/lib/listing/listingFilterQuery'
import type { ProductsFilterState } from '@/lib/products/types'

function filtersEqual(a: ProductsFilterState, b: ProductsFilterState): boolean {
  return (
    a.category === b.category &&
    a.applicationArea === b.applicationArea &&
    a.sort === b.sort &&
    a.view === b.view &&
    a.subcategories.length === b.subcategories.length &&
    a.subcategories.every((value, index) => value === b.subcategories[index])
  )
}

export function useListingHubFilterUrl() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const skipUrlSyncRef = useRef(false)
  const filtersRef = useRef<ProductsFilterState>(
    parseListingHubFilterSearchParams(searchParams),
  )

  const [filters, setFiltersState] = useState(() => filtersRef.current)
  const [currentPage, setCurrentPageState] = useState(() =>
    parseListingHubPageSearchParams(searchParams),
  )

  const replaceQuery = useCallback(
    (nextFilters: ProductsFilterState, nextPage: number) => {
      filtersRef.current = nextFilters
      const params = buildListingHubFilterSearchParams(nextFilters, nextPage)
      const query = params.toString()
      skipUrlSyncRef.current = true
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router],
  )

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false
      return
    }

    const urlFilters = parseListingHubFilterSearchParams(searchParams)
    const urlPage = parseListingHubPageSearchParams(searchParams)

    filtersRef.current = urlFilters
    setFiltersState((prev) => (filtersEqual(prev, urlFilters) ? prev : urlFilters))
    setCurrentPageState((prev) => (prev === urlPage ? prev : urlPage))
  }, [searchParams])

  const setFilters = useCallback(
    (
      updater:
        | ProductsFilterState
        | ((prev: ProductsFilterState) => ProductsFilterState),
    ) => {
      const next =
        typeof updater === 'function' ? updater(filtersRef.current) : updater

      if (filtersEqual(filtersRef.current, next)) return

      filtersRef.current = next
      setFiltersState(next)
      setCurrentPageState(1)
      replaceQuery(next, 1)
    },
    [replaceQuery],
  )

  const setCurrentPage = useCallback(
    (page: number) => {
      if (currentPage === page) return

      setCurrentPageState(page)
      replaceQuery(filtersRef.current, page)
    },
    [currentPage, replaceQuery],
  )

  return {
    filters,
    setFilters,
    currentPage,
    setCurrentPage,
  }
}
