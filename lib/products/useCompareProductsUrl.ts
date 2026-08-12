'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import {
  buildCompareProductsSearchParams,
  parseCompareProductsSearchParams,
  slotsEqual,
} from '@/lib/products/compareQuery'

type CompareSlots = [string | null, string | null]

export function useCompareProductsUrl() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const skipUrlSyncRef = useRef(false)
  const slotsRef = useRef<CompareSlots>(
    parseCompareProductsSearchParams(searchParams),
  )

  const [slots, setSlotsState] = useState<CompareSlots>(() => slotsRef.current)

  const replaceQuery = useCallback(
    (nextSlots: CompareSlots) => {
      slotsRef.current = nextSlots
      const params = buildCompareProductsSearchParams(nextSlots)
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

    const urlSlots = parseCompareProductsSearchParams(searchParams)
    slotsRef.current = urlSlots
    setSlotsState((prev) => (slotsEqual(prev, urlSlots) ? prev : urlSlots))
  }, [searchParams])

  const setSlots = useCallback(
    (updater: CompareSlots | ((prev: CompareSlots) => CompareSlots)) => {
      const next =
        typeof updater === 'function' ? updater(slotsRef.current) : updater

      if (slotsEqual(slotsRef.current, next)) return

      slotsRef.current = next
      setSlotsState(next)
      replaceQuery(next)
    },
    [replaceQuery],
  )

  const setSlotUuid = useCallback(
    (index: 0 | 1, uuid: string | null) => {
      setSlots((prev) => {
        const next: CompareSlots = [...prev] as CompareSlots
        next[index] = uuid
        return next
      })
    },
    [setSlots],
  )

  return {
    slots,
    setSlots,
    setSlotUuid,
  }
}

export type { CompareSlots }
