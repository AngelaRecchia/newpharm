import type { PluginVariantSlug, StoryOption } from '../types'
import { VARIANT_TO_COMPONENT } from '../types'

const VARIANT_LABELS: Record<PluginVariantSlug, string> = {
  prodotto: 'Prodotto',
  progetto: 'Progetto',
  insetto: 'Insetto',
  catalogo: 'Catalogo',
  story: 'Story',
  editorial: 'Editorial',
}

export function getVariantLabel(variant: PluginVariantSlug): string {
  return VARIANT_LABELS[variant]
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
  variant: keyof typeof VARIANT_TO_COMPONENT,
  token: string,
  search: string,
): Promise<StoryOption[]> {
  if (!token) return []

  const component = VARIANT_TO_COMPONENT[variant]
  const params = new URLSearchParams({
    token,
    version: 'draft',
    per_page: '50',
    sort_by: 'name:asc',
    [`filter_query[component][in]`]: component,
  })

  if (search.trim()) {
    params.set('search_term', search.trim())
  }

  const res = await fetch(`https://api.storyblok.com/v2/cdn/stories?${params}`)
  if (!res.ok) {
    throw new Error(`CDN ${res.status}`)
  }

  const data = (await res.json()) as { stories?: RawStory[] }
  const stories = data.stories ?? []

  return stories.map((story) => ({
    uuid: story.uuid,
    name: story.name,
    full_slug: story.full_slug,
    published_at: story.published_at ?? null,
  }))
}

export function sortStoryOptions(items: StoryOption[]): StoryOption[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name, 'it'))
}
