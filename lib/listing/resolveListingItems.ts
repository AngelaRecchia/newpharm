import {
  getStoriesByComponent,
  getStoriesByUuids,
  type Story,
} from '@/lib/api/storyblok/stories'
import { parseListingVariant, sortResolvedListingStories } from './parseListingVariant'
import type { ListingStoryResolved } from './types'

export { parseListingVariant, sortResolvedListingStories, variantToComponent } from './parseListingVariant'

export function mapStoryToListingResolved(story: Story): ListingStoryResolved {
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

export async function resolveListingItems(
  uuids: string[],
  locale?: string,
): Promise<ListingStoryResolved[]> {
  if (!uuids.length) return []
  const stories = await getStoriesByUuids(uuids, locale)
  return stories.map(mapStoryToListingResolved)
}

/**
 * Prefetch SSR di tutti i prodotti (content type `product`) nel locale corrente.
 */
export async function resolveProductStories(
  locale?: string,
): Promise<ListingStoryResolved[]> {
  const stories = await getStoriesByComponent('product', locale)
  return stories.map(mapStoryToListingResolved)
}

type BlokRecord = Record<string, unknown> & {
  component?: string
  variant?: unknown
  listing_items?: unknown
  type?: string
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

export async function enrichListingBloks(
  content: BlokRecord | null | undefined,
  locale?: string,
): Promise<void> {
  if (!content) return

  const listingBloks: BlokRecord[] = []
  walkBloks(content, (blok) => {
    if (blok.component === 'listing' || blok.component === 'products') {
      listingBloks.push(blok)
    }
  })

  await Promise.all(
    listingBloks.map(async (blok) => {
      if (blok.component === 'listing') {
        const listingType = blok.type as string | undefined
        if (listingType !== 'hub' && listingType !== 'highlight') return
      }

      const raw = blok.variant ?? blok.listing_items
      const parsed = parseListingVariant(raw)

      if (blok.component === 'products') {
        parsed.variant = 'prodotto'
        blok.variant = parsed
        delete blok.listing_items

        const resolved = await resolveProductStories(locale)
        blok.resolved_items = sortResolvedListingStories(resolved, parsed)
        return
      }

      blok.variant = parsed
      delete blok.listing_items

      if (parsed.items.length === 0) {
        blok.resolved_items = []
        return
      }

      const resolved = await resolveListingItems(parsed.items, locale)
      blok.resolved_items = sortResolvedListingStories(resolved, parsed)
    }),
  )
}
