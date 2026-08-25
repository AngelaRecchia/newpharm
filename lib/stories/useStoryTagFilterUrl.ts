'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { usePathname, useRouter } from '@/i18n/navigation'
import {
  buildStoryTagSearchParams,
  parseStoryTagSearchParams,
} from '@/lib/stories/tagFilterQuery'
import { sortStoryTags, type StoryTag } from '@/lib/stories/tags'

function tagsEqual(a: StoryTag[], b: StoryTag[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

export function useStoryTagFilterUrl() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const skipUrlSyncRef = useRef(false)
  const tagsRef = useRef<StoryTag[]>(parseStoryTagSearchParams(searchParams))

  const [tags, setTagsState] = useState(() => tagsRef.current)

  const replaceQuery = useCallback(
    (next: StoryTag[]) => {
      const sorted = sortStoryTags(next)
      tagsRef.current = sorted
      const params = buildStoryTagSearchParams(searchParams, sorted)
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

    const urlTags = parseStoryTagSearchParams(searchParams)
    tagsRef.current = urlTags
    setTagsState((prev) => (tagsEqual(prev, urlTags) ? prev : urlTags))
  }, [searchParams])

  const setTags = useCallback(
    (updater: StoryTag[] | ((prev: StoryTag[]) => StoryTag[])) => {
      const next = sortStoryTags(
        typeof updater === 'function' ? updater(tagsRef.current) : updater,
      )

      if (tagsEqual(tagsRef.current, next)) return

      tagsRef.current = next
      setTagsState(next)
      replaceQuery(next)
    },
    [replaceQuery],
  )

  return {
    tags,
    setTags,
  }
}
