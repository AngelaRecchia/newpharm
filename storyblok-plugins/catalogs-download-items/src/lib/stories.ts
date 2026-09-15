import type { CatalogOption } from '../types'

const LOCALE_FOLDERS = new Set(['it', 'en', 'ar'])
const PER_PAGE = 100
const STORIES_URL = 'https://api.storyblok.com/v2/cdn/stories'

type RawStory = {
  uuid: string
  name: string
  content?: {
    kind?: unknown
    title?: unknown
    file?: { filename?: unknown }
  }
}

export function localeFromPluginStory(story: unknown): string | undefined {
  if (!story || typeof story !== 'object') return undefined
  const fullSlug = (story as { full_slug?: unknown }).full_slug
  if (typeof fullSlug !== 'string') return undefined
  const locale = fullSlug.replace(/^\//, '').split('/')[0]?.toLowerCase()
  return locale && LOCALE_FOLDERS.has(locale) ? locale : undefined
}

function isPdf(file: { filename?: unknown } | undefined): boolean {
  const filename = file?.filename
  if (typeof filename !== 'string') return false
  return /\.pdf(?:$|[?#])/i.test(filename.trim())
}

function mapCatalog(story: RawStory, downloadable: boolean): CatalogOption | null {
  if (!story.uuid || !isPdf(story.content?.file)) return null
  if (
    downloadable &&
    story.content?.kind !== 'catalog' &&
    story.content?.kind !== 'brochure'
  ) {
    return null
  }

  const title = typeof story.content?.title === 'string' ? story.content.title.trim() : ''
  const filename = story.content?.file?.filename
  return {
    uuid: story.uuid,
    name: title || story.name,
    fileName: typeof filename === 'string' ? filename.split('/').pop() ?? filename : '',
  }
}

async function fetchPages(
  token: string,
  contentType: 'catalog' | 'downloadable',
  locale?: string,
): Promise<RawStory[]> {
  const stories: RawStory[] = []
  let page = 1

  while (true) {
    const params = new URLSearchParams({
      token,
      version: 'draft',
      per_page: String(PER_PAGE),
      page: String(page),
      sort_by: 'name:asc',
      content_type: contentType,
    })
    if (locale) params.set('starts_with', `${locale}/`)

    const response = await fetch(`${STORIES_URL}?${params}`)
    if (!response.ok) throw new Error(`CDN ${response.status}`)

    const batch = ((await response.json()) as { stories?: RawStory[] }).stories ?? []
    stories.push(...batch)
    if (batch.length < PER_PAGE) return stories
    page += 1
  }
}

export async function fetchPdfCatalogs(
  token: string,
  locale?: string,
): Promise<CatalogOption[]> {
  if (!token) return []

  const [catalogs, downloadables] = await Promise.all([
    fetchPages(token, 'catalog', locale),
    fetchPages(token, 'downloadable', locale),
  ])
  const byUuid = new Map<string, CatalogOption>()

  for (const story of catalogs) {
    const catalog = mapCatalog(story, false)
    if (catalog) byUuid.set(catalog.uuid, catalog)
  }
  for (const story of downloadables) {
    const catalog = mapCatalog(story, true)
    if (catalog) byUuid.set(catalog.uuid, catalog)
  }

  return [...byUuid.values()].sort((a, b) => a.name.localeCompare(b.name, 'it'))
}
