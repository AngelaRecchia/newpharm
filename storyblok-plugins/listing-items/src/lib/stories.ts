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

const LOCALE_FOLDERS = new Set(['it', 'en'])
const PER_PAGE = 100
const STORIES_URL = 'https://api.storyblok.com/v2/cdn/stories'
const SPACE_ME_URL = 'https://api.storyblok.com/v2/cdn/spaces/me'

export function getVariantLabel(variant: PluginVariantSlug): string {
  return VARIANT_LABELS[variant]
}

export function localeFromStorySlug(fullSlug: unknown): string | undefined {
  if (typeof fullSlug !== 'string' || !fullSlug.trim()) return undefined
  const first = fullSlug.replace(/^\//, '').split('/')[0]?.toLowerCase()
  if (first && LOCALE_FOLDERS.has(first)) return first
  return undefined
}

export function localeFromPluginStory(story: unknown): string | undefined {
  if (!story || typeof story !== 'object') return undefined
  return localeFromStorySlug((story as { full_slug?: unknown }).full_slug)
}

type RawStory = {
  uuid: string
  name: string
  full_slug: string
  published_at?: string | null
  created_at?: string | null
  content?: {
    product_filtri?: { category?: string }
  }
}

let cachedCv: number | undefined
let cvFetchPromise: Promise<number | undefined> | null = null

export function resetStoriesCache() {
  cachedCv = undefined
  cvFetchPromise = null
}

function parseCacheVersion(data: unknown): number | undefined {
  if (!data || typeof data !== 'object') return undefined
  const record = data as Record<string, unknown>
  const space =
    record.space && typeof record.space === 'object'
      ? (record.space as Record<string, unknown>)
      : undefined
  const raw = space?.version ?? space?.cache_version ?? space?.cv ?? record.cache_version ?? record.cv
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number(raw)
    if (Number.isFinite(parsed)) return parsed
  }
  return undefined
}

async function getCacheVersion(token: string): Promise<number | undefined> {
  if (cachedCv !== undefined) return cachedCv
  if (cvFetchPromise) return cvFetchPromise

  cvFetchPromise = (async () => {
    try {
      const params = new URLSearchParams({ token })
      const res = await fetch(`${SPACE_ME_URL}?${params}`)
      if (!res.ok) return undefined
      const cv = parseCacheVersion(await res.json())
      if (cv !== undefined) cachedCv = cv
      return cv
    } catch {
      return undefined
    }
  })()

  try {
    return await cvFetchPromise
  } finally {
    cvFetchPromise = null
  }
}

function mapStory(story: RawStory): StoryOption | null {
  if (!story.uuid) return null
  return {
    uuid: story.uuid,
    name: story.name,
    full_slug: story.full_slug,
    published_at: story.published_at ?? null,
    created_at: story.created_at ?? null,
  }
}

export async function searchStories(
  variant: keyof typeof VARIANT_TO_COMPONENT,
  token: string,
  search: string,
  locale?: string,
): Promise<StoryOption[]> {
  if (!token) return []

  const component = VARIANT_TO_COMPONENT[variant]
  const cv = await getCacheVersion(token)
  const byUuid = new Map<string, StoryOption>()
  let page = 1

  while (true) {
    const params = new URLSearchParams({
      token,
      version: 'draft',
      per_page: String(PER_PAGE),
      page: String(page),
      sort_by: 'created_at:desc',
      content_type: component,
    })

    if (cv !== undefined) {
      params.set('cv', String(cv))
    }

    if (locale) {
      params.set('starts_with', `${locale}/`)
    }

    if (search.trim()) {
      params.set('search_term', search.trim())
    }

    const res = await fetch(`${STORIES_URL}?${params}`)
    if (!res.ok) {
      throw new Error(`CDN ${res.status}`)
    }

    const data = (await res.json()) as { stories?: RawStory[] }
    const batch = data.stories ?? []

    for (const story of batch) {
      const mapped = mapStory(story)
      if (!mapped || byUuid.has(mapped.uuid)) continue
      byUuid.set(mapped.uuid, mapped)
    }

    if (batch.length < PER_PAGE) break
    page += 1
  }

  return [...byUuid.values()]
}

function storyTimestamp(story: StoryOption): number {
  const raw = story.created_at ?? story.published_at ?? null
  return raw ? Date.parse(raw) : 0
}

export function sortStoryOptions(items: StoryOption[]): StoryOption[] {
  return [...items].sort((a, b) => {
    const delta = storyTimestamp(b) - storyTimestamp(a)
    if (delta !== 0) return delta
    return a.name.localeCompare(b.name, 'it')
  })
}
