import type { InsectOption } from '../types'

const LOCALE_FOLDERS = new Set(['it', 'en'])
const PER_PAGE = 100
const STORIES_URL = 'https://api.storyblok.com/v2/cdn/stories'
const SPACE_ME_URL = 'https://api.storyblok.com/v2/cdn/spaces/me'

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
  content?: {
    title?: string
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

function mapStory(story: RawStory): InsectOption | null {
  if (!story.uuid) return null
  return {
    uuid: story.uuid,
    name: story.content?.title || story.name,
  }
}

export async function fetchInsectStories(
  token: string,
  locale?: string,
): Promise<InsectOption[]> {
  if (!token) return []

  const cv = await getCacheVersion(token)
  const byUuid = new Map<string, InsectOption>()
  let page = 1

  while (true) {
    const params = new URLSearchParams({
      token,
      version: 'draft',
      per_page: String(PER_PAGE),
      page: String(page),
      sort_by: 'name:asc',
      content_type: 'insect',
    })

    if (cv !== undefined) params.set('cv', String(cv))
    if (locale) params.set('starts_with', `${locale}/`)

    const res = await fetch(`${STORIES_URL}?${params}`)
    if (!res.ok) throw new Error(`CDN ${res.status}`)

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

  return [...byUuid.values()].sort((a, b) => a.name.localeCompare(b.name, 'it'))
}
