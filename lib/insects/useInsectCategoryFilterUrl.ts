'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import {
  buildInsectCategorySearchParams,
  parseInsectCategorySearchParams,
  parseInsectPageSearchParams,
} from './categoryFilterQuery'
import { sortInsectCategories, type InsectCategory } from './categories'

function categoriesEqual(a: InsectCategory[], b: InsectCategory[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

export function useInsectCategoryFilterUrl() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const skipUrlSyncRef = useRef(false)
  const categoriesRef = useRef<InsectCategory[]>(
    parseInsectCategorySearchParams(searchParams),
  )

  const [categories, setCategoriesState] = useState(() => categoriesRef.current)
  const [currentPage, setCurrentPageState] = useState(() =>
    parseInsectPageSearchParams(searchParams),
  )

  const replaceQuery = useCallback(
    (nextCategories: InsectCategory[], nextPage: number) => {
      categoriesRef.current = nextCategories
      const params = buildInsectCategorySearchParams(
        searchParams,
        nextCategories,
        nextPage,
      )
      const query = params.toString()
      skipUrlSyncRef.current = true
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false
      return
    }

    const urlCategories = parseInsectCategorySearchParams(searchParams)
    const urlPage = parseInsectPageSearchParams(searchParams)

    categoriesRef.current = urlCategories
    setCategoriesState((prev) =>
      categoriesEqual(prev, urlCategories) ? prev : urlCategories,
    )
    setCurrentPageState((prev) => (prev === urlPage ? prev : urlPage))
  }, [searchParams])

  const setCategories = useCallback(
    (
      updater:
        | InsectCategory[]
        | ((prev: InsectCategory[]) => InsectCategory[]),
    ) => {
      const next = sortInsectCategories(
        typeof updater === 'function' ? updater(categoriesRef.current) : updater,
      )

      if (categoriesEqual(categoriesRef.current, next) && currentPage === 1) return

      categoriesRef.current = next
      setCategoriesState(next)
      setCurrentPageState(1)
      replaceQuery(next, 1)
    },
    [currentPage, replaceQuery],
  )

  const setCurrentPage = useCallback(
    (page: number) => {
      if (currentPage === page) return

      setCurrentPageState(page)
      replaceQuery(categoriesRef.current, page)
    },
    [currentPage, replaceQuery],
  )

  return {
    categories,
    setCategories,
    currentPage,
    setCurrentPage,
  }
}
