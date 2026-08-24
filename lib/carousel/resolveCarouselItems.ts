import {
  getStoriesByComponent,
  getStoriesByUuids,
  type Story,
} from '@/lib/api/storyblok/stories'
import { filterListingByVista } from '@/lib/listing/filterListingByVista'
import type { ListingStoryResolved } from '@/lib/listing/types'
import { sortProductStories } from '@/lib/products/filterProducts'
import { parseCarouselVariant } from './parseCarouselVariant'
import { sortStoriesByDate, storyHasTag } from './mapStoryToNewsCard'
import type { CarouselVariantValue } from './types'
import { CAROUSEL_LIMIT } from './types'

function mapStoryToListingResolved(story: Story): ListingStoryResolved {
  return {
    uuid: story.uuid,
    name: story.name,
    slug: story.slug,
    full_slug: story.full_slug,
    published_at: story.published_at ?? null,
    first_published_at: story.first_published_at ?? null,
    content: (story.content ?? {}) as Record<string, unknown>,
  }
}

function orderByUuids(
  stories: ListingStoryResolved[],
  uuids: string[],
): ListingStoryResolved[] {
  const index = new Map(uuids.map((uuid, i) => [uuid, i]))
  return [...stories].sort(
    (a, b) => (index.get(a.uuid) ?? Number.MAX_SAFE_INTEGER) - (index.get(b.uuid) ?? Number.MAX_SAFE_INTEGER),
  )
}

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

  if (parsed.variant === 'story') {
    if (parsed.selection_mode === 'manual') {
      if (parsed.items.length === 0) return []
      const stories = await getStoriesByUuids(parsed.items, locale)
      return orderByUuids(stories.map(mapStoryToListingResolved), parsed.items).slice(
        0,
        CAROUSEL_LIMIT,
      )
    }

    const allStories = (await getStoriesByComponent('story', locale)).map(
      mapStoryToListingResolved,
    )

    if (parsed.selection_mode === 'tag') {
      if (!parsed.tag) return []
      const tagged = allStories.filter((story) => storyHasTag(story, parsed.tag as string))
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
