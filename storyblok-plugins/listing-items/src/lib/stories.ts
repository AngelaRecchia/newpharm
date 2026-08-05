import type { ListingVariantSlug, ListingVariantValue, StoryOption } from '../types'
import { VARIANT_TO_COMPONENT } from '../types'

const VARIANT_LABELS: Record<ListingVariantSlug, string> = {
  prodotto: 'Prodotto',
  progetto: 'Progetto',
  insetto: 'Insetto',
  catalogo: 'Catalogo',
}

export function getVariantLabel(variant: ListingVariantSlug): string {
  return VARIANT_LABELS[variant]
}

export type StorySearchOptions = Pick<
  ListingVariantValue,
  'category' | 'piu_recente' | 'alfabetico'
>

function getSortBy(options: StorySearchOptions): string {
  if (options.piu_recente) return 'published_at:desc'
  if (options.alfabetico) return 'name:asc'
  return 'name:asc'
}

type RawStory = {
  uuid: string
  name: string
  full_slug: string
  published_at?: string | null
  content?: {
    product_filtri?: { category?: string }
  }
}

export async function searchStories(
  variant: ListingVariantSlug,
  token: string,
  search: string,
  options: StorySearchOptions = {},
): Promise<StoryOption[]> {
  if (!token) return []

  const component = VARIANT_TO_COMPONENT[variant]
  const params = new URLSearchParams({
    token,
    version: 'draft',
    per_page: '50',
    sort_by: getSortBy(options),
    [`filter_query[component][in]`]: component,
  })

  if (search.trim()) {
    params.set('search_term', search.trim())
  }

  if (variant === 'prodotto' && options.category) {
    params.set('filter_query[product_filtri.category][in]', options.category)
  }

  const res = await fetch(`https://api.storyblok.com/v2/cdn/stories?${params}`)
  if (!res.ok) {
    throw new Error(`CDN ${res.status}`)
  }

  const data = (await res.json()) as { stories?: RawStory[] }
  let stories = data.stories ?? []

  if (variant === 'prodotto' && options.category) {
    stories = stories.filter(
      (story) => story.content?.product_filtri?.category === options.category,
    )
  }

  return stories.map((story) => ({
    uuid: story.uuid,
    name: story.name,
    full_slug: story.full_slug,
    published_at: story.published_at ?? null,
  }))
}

export function sortStoryOptions(
  items: StoryOption[],
  options: StorySearchOptions,
): StoryOption[] {
  const sorted = [...items]
  if (options.piu_recente) {
    sorted.sort((a, b) => {
      const aTime = a.published_at ? Date.parse(a.published_at) : 0
      const bTime = b.published_at ? Date.parse(b.published_at) : 0
      return bTime - aTime
    })
    return sorted
  }
  if (options.alfabetico) {
    sorted.sort((a, b) => a.name.localeCompare(b.name, 'it'))
  }
  return sorted
}
