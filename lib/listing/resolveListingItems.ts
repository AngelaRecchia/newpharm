import {
  parseListingVariant,
  parseProjectsHighlightVariant,
  sortResolvedListingStories,
  variantToComponent,
} from './parseListingVariant'
import { filterListingByVista } from './filterListingByVista'
import type { ListingVariantValue, ListingContentComponent } from './types'

export {
  parseListingVariant,
  parseProjectsHighlightVariant,
  sortResolvedListingStories,
  variantToComponent,
} from './parseListingVariant'

import {
  getStoriesByComponent,
  getStoriesByUuids,
  type Story,
} from '@/lib/api/storyblok/stories'
import { sortStoriesByDate } from '@/lib/carousel/mapStoryToNewsCard'
import { filterProjectsByDivisions } from '@/lib/projects/filterProjects'
import { parseProjectDivisions } from '@/lib/projects/divisions'
import { isListingVisible } from '@/lib/insects/visibility'
import { enrichProductsTargetPests } from '@/lib/products/targetPests'
import type { ListingStoryResolved } from './types'

export function mapStoryToListingResolved(story: Story): ListingStoryResolved {
  return {
    uuid: story.uuid,
    name: story.name,
    slug: story.slug,
    full_slug: story.full_slug,
    created_at: story.created_at ?? null,
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

export async function resolveStoriesByComponent(
  component: ListingContentComponent,
  locale?: string,
): Promise<ListingStoryResolved[]> {
  const stories = await getStoriesByComponent(component, locale)
  return stories.map(mapStoryToListingResolved)
}

export async function resolveProductStories(
  locale?: string,
): Promise<ListingStoryResolved[]> {
  return resolveStoriesByComponent('product', locale)
}

export async function resolveProjectStories(
  locale?: string,
): Promise<ListingStoryResolved[]> {
  return resolveStoriesByComponent('project', locale)
}

export async function resolveStoryStories(
  locale?: string,
): Promise<ListingStoryResolved[]> {
  const stories = await getStoriesByComponent('story', locale)
  return stories.map(mapStoryToListingResolved)
}

export async function resolveInsectStories(
  locale?: string,
): Promise<ListingStoryResolved[]> {
  const stories = await resolveStoriesByComponent('insect', locale)
  return sortResolvedListingStories(
    stories.filter((story) => isListingVisible(story.content.visibility)),
  )
}

export async function resolveJobStories(
  locale?: string,
): Promise<ListingStoryResolved[]> {
  return resolveStoriesByComponent('job', locale)
}

export async function resolveListingProductItems(
  parsed: ListingVariantValue,
  locale?: string,
): Promise<ListingStoryResolved[]> {
  if (parsed.selection_mode === 'manual') {
    if (parsed.items.length === 0) return []
    return resolveListingItems(parsed.items, locale)
  }

  const allProducts = await resolveProductStories(locale)
  const filtered = filterListingByVista(allProducts, parsed)
  return sortResolvedListingStories(filtered)
}

export async function resolveListingRefItems(
  parsed: ListingVariantValue,
  locale?: string,
): Promise<ListingStoryResolved[]> {
  const component = variantToComponent(parsed.variant)
  const allStories = await resolveStoriesByComponent(component, locale)
  const visibleStories =
    parsed.variant === 'insetto'
      ? allStories.filter((story) => isListingVisible(story.content.visibility))
      : allStories

  if (parsed.selection_mode === 'manual') {
    if (parsed.items.length === 0) return []
    const included = new Set(parsed.items)
    return sortResolvedListingStories(visibleStories.filter((story) => included.has(story.uuid)))
  }

  if (parsed.selection_mode === 'tag') {
    const tag = parsed.tag
    if (!tag) return []
    const tagged =
      parsed.variant === 'progetto'
        ? filterProjectsByDivisions(visibleStories, parseProjectDivisions(tag))
        : visibleStories
    return sortResolvedListingStories(tagged)
  }

  const excluded = new Set(parsed.items)
  return sortResolvedListingStories(visibleStories.filter((story) => !excluded.has(story.uuid)))
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
    if (
      blok.component === 'listing' ||
      blok.component === 'products' ||
      blok.component === 'projects' ||
      blok.component === 'stories' ||
      blok.component === 'compare' ||
      blok.component === 'projects_highlight' ||
      blok.component === 'job_list' ||
      blok.component === 'infestanti'
    ) {
      listingBloks.push(blok)
    }
  })

  await Promise.all(
    listingBloks.map(async (blok) => {
      if (blok.component === 'products' || blok.component === 'compare') {
        if (blok.component === 'products' && process.env.NODE_ENV !== 'production') {
          console.log('[enrichListingBloks] products blok keys', Object.keys(blok))
          console.log(
            '[enrichListingBloks] products_comparison_page',
            blok.products_comparison_page,
          )
        }
        const resolved = await resolveProductStories(locale)
        if (blok.component === 'compare') {
          await enrichProductsTargetPests(resolved, locale)
        }
        blok.resolved_items = sortResolvedListingStories(resolved)
        delete blok.variant
        delete blok.listing_items
        return
      }

      if (blok.component === 'projects') {
        const resolved = await resolveProjectStories(locale)
        blok.resolved_items = sortResolvedListingStories(resolved)
        return
      }

      if (blok.component === 'projects_highlight') {
        const parsed = parseProjectsHighlightVariant(blok.variant)
        blok.variant = parsed
        delete blok.cards
        // Pool completo: il componente filtra in base a variant (serve anche al visual editor).
        const resolved = await resolveProjectStories(locale)
        blok.resolved_items = sortResolvedListingStories(resolved)
        return
      }

      if (blok.component === 'stories') {
        const resolved = await resolveStoryStories(locale)
        blok.resolved_items = sortStoriesByDate(resolved)
        return
      }

      if (blok.component === 'job_list') {
        const resolved = await resolveJobStories(locale)
        blok.resolved_items = sortResolvedListingStories(resolved)
        return
      }

      if (blok.component === 'infestanti') {
        blok.resolved_items = await resolveInsectStories(locale)
        return
      }

      const listingType = blok.type as string | undefined
      if (listingType !== 'hub' && listingType !== 'highlight') return

      const raw = blok.variant ?? blok.listing_items
      const parsed = parseListingVariant(raw)

      blok.variant = parsed
      delete blok.listing_items

      if (parsed.variant === 'prodotto') {
        blok.resolved_items = await resolveListingProductItems(parsed, locale)
        return
      }

      blok.resolved_items = await resolveListingRefItems(parsed, locale)
    }),
  )
}
