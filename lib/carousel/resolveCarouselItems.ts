import { getStoriesByComponent, getStoriesByUuids } from '@/lib/api/storyblok/stories'
import { isListingVisible } from '@/lib/insects/visibility'
import { filterListingByVista } from '@/lib/listing/filterListingByVista'
import { sortResolvedListingStories } from '@/lib/listing/parseListingVariant'
import { mapStoryToListingResolved } from '@/lib/listing/resolveListingItems'
import type { ListingStoryResolved } from '@/lib/listing/types'
import { sortProductStories } from '@/lib/products/filterProducts'
import { parseCarouselVariant } from './parseCarouselVariant'
import { sortStoriesByDate, storyHasTag } from './mapStoryToNewsCard'
import type { CarouselVariantValue } from './types'
import { CAROUSEL_LIMIT } from './types'

type BlokRecord = Record<string, unknown> & {
  component?: string
  variant?: unknown
  resolved_items?: ListingStoryResolved[]
}

function walkBloks(node: unknown, visit: (blok: BlokRecord) => void): void {
  if (!node || typeof node !== 'object') return

  if (Array.isArray(node)) {
    for (const item of node) {
      walkBloks(item, visit)
    }
    return
  }

  const record = node as BlokRecord
  if (typeof record.component === 'string') {
    visit(record)
  }

  for (const value of Object.values(record)) {
    if (Array.isArray(value) || (value && typeof value === 'object')) {
      walkBloks(value, visit)
    }
  }
}

export async function resolveCarouselItems(
  parsed: CarouselVariantValue,
  locale?: string,
): Promise<ListingStoryResolved[]> {
  if (parsed.variant === 'editorial') return []

  if (parsed.variant === 'insetto') {
    const allStories = (await getStoriesByComponent('insect', locale)).map(
      mapStoryToListingResolved,
    )
    const visibleStories = allStories.filter((story) =>
      isListingVisible(story.content.visibility),
    )

    if (parsed.selection_mode === 'manual') {
      if (parsed.items.length === 0) return []
      const included = new Set(parsed.items)
      return sortResolvedListingStories(
        visibleStories.filter((story) => included.has(story.uuid)),
      )
    }

    const excluded = new Set(parsed.items)
    return sortResolvedListingStories(
      visibleStories.filter((story) => !excluded.has(story.uuid)),
    )
  }

  if (parsed.variant === 'story') {
    if (parsed.selection_mode === 'manual') {
      if (parsed.items.length === 0) return []
      const stories = await getStoriesByUuids(parsed.items.slice(0, CAROUSEL_LIMIT), locale)
      return stories.map(mapStoryToListingResolved)
    }

    const allStories = (await getStoriesByComponent('story', locale)).map(
      mapStoryToListingResolved,
    )

    if (parsed.selection_mode === 'tag') {
      const tag = parsed.tag
      if (!tag) return []
      const tagged = allStories.filter((story) => storyHasTag(story, tag))
      return sortStoriesByDate(tagged).slice(0, CAROUSEL_LIMIT)
    }

    return sortStoriesByDate(allStories).slice(0, CAROUSEL_LIMIT)
  }

  const allProducts = (await getStoriesByComponent('product', locale)).map(
    mapStoryToListingResolved,
  )
  const filtered = filterListingByVista(allProducts, {
    selection_mode: 'dynamic',
    vista: parsed.vista,
    category: parsed.category,
    subcategory: parsed.subcategory,
    application_area: parsed.application_area,
    bestseller: parsed.bestseller,
  })
  return sortProductStories(filtered, 'recent').slice(0, CAROUSEL_LIMIT)
}

export async function enrichCarouselBloks(
  content: BlokRecord | null | undefined,
  locale?: string,
): Promise<void> {
  if (!content) return

  const carouselBloks: BlokRecord[] = []
  walkBloks(content, (blok) => {
    if (blok.component === 'carousel') {
      carouselBloks.push(blok)
    }
  })

  await Promise.all(
    carouselBloks.map(async (blok) => {
      const parsed = parseCarouselVariant(blok.variant)
      blok.variant = parsed
      blok.resolved_items = await resolveCarouselItems(parsed, locale)
    }),
  )
}
