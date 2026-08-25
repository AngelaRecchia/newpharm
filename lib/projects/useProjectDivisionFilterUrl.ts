'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import {
  buildDivisionSearchParams,
  parseDivisionSearchParams,
} from '@/lib/projects/divisionFilterQuery'
import {
  sortProjectDivisions,
  type ProjectDivision,
} from '@/lib/projects/divisions'

function divisionsEqual(a: ProjectDivision[], b: ProjectDivision[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

export function useProjectDivisionFilterUrl() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const skipUrlSyncRef = useRef(false)
  const divisionsRef = useRef<ProjectDivision[]>(
    parseDivisionSearchParams(searchParams),
  )

  const [divisions, setDivisionsState] = useState(() => divisionsRef.current)

  const replaceQuery = useCallback(
    (next: ProjectDivision[]) => {
      const sorted = sortProjectDivisions(next)
      divisionsRef.current = sorted
      const params = buildDivisionSearchParams(searchParams, sorted)
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

    const urlDivisions = parseDivisionSearchParams(searchParams)
    divisionsRef.current = urlDivisions
    setDivisionsState((prev) =>
      divisionsEqual(prev, urlDivisions) ? prev : urlDivisions,
    )
  }, [searchParams])

  const setDivisions = useCallback(
    (
      updater:
        | ProjectDivision[]
        | ((prev: ProjectDivision[]) => ProjectDivision[]),
    ) => {
      const next = sortProjectDivisions(
        typeof updater === 'function' ? updater(divisionsRef.current) : updater,
      )

      if (divisionsEqual(divisionsRef.current, next)) return

      divisionsRef.current = next
      setDivisionsState(next)
      replaceQuery(next)
    },
    [replaceQuery],
  )

  return {
    divisions,
    setDivisions,
  }
}
