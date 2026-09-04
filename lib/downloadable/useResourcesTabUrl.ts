'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import { parseResourceTab, parseResourceTabs } from './parse'
import { RESOURCE_QUERY_PARAM, type ResourceTab } from './types'

function buildKindSearchParams(
  current: Pick<URLSearchParams, 'get' | 'toString'>,
  kind: ResourceTab | null,
  available: readonly ResourceTab[],
): URLSearchParams {
  const params = new URLSearchParams(current.toString())
  params.delete(RESOURCE_QUERY_PARAM)

  if (kind && available.includes(kind) && kind !== available[0]) {
    params.set(RESOURCE_QUERY_PARAM, kind)
  }

  return params
}

export function useResourcesTabUrl(available: readonly ResourceTab[]) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const skipUrlSyncRef = useRef(false)

  const resolveKind = useCallback(
    (raw: string | null): ResourceTab | null => {
      const parsed = parseResourceTab(raw) ?? parseResourceTabs(raw)[0]
      if (parsed && available.includes(parsed)) return parsed
      return available[0] ?? null
    },
    [available],
  )

  const [kind, setKindState] = useState(() =>
    resolveKind(searchParams.get(RESOURCE_QUERY_PARAM)),
  )

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false
      return
    }

    const next = resolveKind(searchParams.get(RESOURCE_QUERY_PARAM))
    setKindState((prev) => (prev === next ? prev : next))
  }, [resolveKind, searchParams])

  const setKind = useCallback(
    (next: ResourceTab) => {
      if (!available.includes(next) || next === kind) return

      setKindState(next)
      const params = buildKindSearchParams(searchParams, next, available)
      const query = params.toString()
      skipUrlSyncRef.current = true
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [available, kind, pathname, router, searchParams],
  )

  return { kind, setKind }
}
