import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  localeFromPluginStory,
  localeFromStorySlug,
  resetStoriesCache,
  searchStories,
  sortStoryOptions,
} from './stories'

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function storiesPage(count: number, start = 0) {
  return Array.from({ length: count }, (_, i) => ({
    uuid: `uuid-${start + i}`,
    name: `Story ${start + i}`,
    full_slug: `it/story-${start + i}`,
    published_at: null,
  }))
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

function storyRequestUrls(fetchMock: ReturnType<typeof vi.fn>) {
  return fetchMock.mock.calls
    .map(([input]) => new URL(requestUrl(input as RequestInfo | URL)))
    .filter((url) => url.pathname.endsWith('/stories'))
}

describe('localeFromStorySlug', () => {
  it('estrae it e en dalla cartella lingua', () => {
    expect(localeFromStorySlug('it/prodotti/foo')).toBe('it')
    expect(localeFromStorySlug('en/news/bar')).toBe('en')
    expect(localeFromStorySlug('/it/x')).toBe('it')
  })

  it('ignora slug senza cartella lingua', () => {
    expect(localeFromStorySlug('prodotti/foo')).toBeUndefined()
    expect(localeFromStorySlug('')).toBeUndefined()
    expect(localeFromStorySlug(null)).toBeUndefined()
  })
})

describe('localeFromPluginStory', () => {
  it('legge full_slug dalla story in editing', () => {
    expect(localeFromPluginStory({ full_slug: 'it/page' })).toBe('it')
    expect(localeFromPluginStory(null)).toBeUndefined()
  })
})

describe('searchStories', () => {
  beforeEach(() => {
    resetStoriesCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    resetStoriesCache()
  })

  it('ritorna lista vuota senza token', async () => {
    expect(await searchStories('prodotto', '', '')).toEqual([])
  })

  it('pagina tutte le pagine e passa cv e content_type', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input)
      if (url.includes('/spaces/me')) {
        return jsonResponse({ space: { version: 42 } })
      }
      const parsed = new URL(url)
      const page = Number(parsed.searchParams.get('page'))
      if (page === 1) {
        return jsonResponse({ stories: storiesPage(100, 0) })
      }
      return jsonResponse({ stories: storiesPage(3, 100) })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await searchStories('prodotto', 'preview-token', '')

    expect(result).toHaveLength(103)
    expect(fetchMock.mock.calls.some(([input]) => requestUrl(input as RequestInfo | URL).includes('/spaces/me'))).toBe(
      true,
    )

    const storyCalls = storyRequestUrls(fetchMock)
    expect(storyCalls).toHaveLength(2)
    expect(storyCalls[0].searchParams.get('content_type')).toBe('product')
    expect(storyCalls[0].searchParams.get('cv')).toBe('42')
    expect(storyCalls[0].searchParams.get('per_page')).toBe('100')
    expect(storyCalls[0].searchParams.get('page')).toBe('1')
    expect(storyCalls[1].searchParams.get('page')).toBe('2')
    expect(storyCalls[0].searchParams.has('filter_query[component][in]')).toBe(false)
    expect(storyCalls[0].searchParams.has('starts_with')).toBe(false)
  })

  it('passa starts_with e search_term se presenti', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input)
      if (url.includes('/spaces/me')) {
        return jsonResponse({ space: { version: 1 } })
      }
      return jsonResponse({ stories: storiesPage(1) })
    })
    vi.stubGlobal('fetch', fetchMock)

    await searchStories('story', 'token', 'news', 'it')

    const storyUrl = storyRequestUrls(fetchMock)[0]
    expect(storyUrl.searchParams.get('starts_with')).toBe('it/')
    expect(storyUrl.searchParams.get('search_term')).toBe('news')
    expect(storyUrl.searchParams.get('content_type')).toBe('story')
  })

  it('deduplica le stories per uuid', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input)
      if (url.includes('/spaces/me')) {
        return jsonResponse({ space: { version: 1 } })
      }
      return jsonResponse({
        stories: [
          { uuid: 'same', name: 'Prima', full_slug: 'it/a', published_at: null },
          { uuid: 'same', name: 'Duplicata', full_slug: 'it/b', published_at: null },
          { uuid: 'other', name: 'Altra', full_slug: 'it/c', published_at: null },
        ],
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await searchStories('progetto', 'token', '')
    expect(result.map((story) => story.uuid)).toEqual(['same', 'other'])
    expect(result[0].name).toBe('Prima')
  })

  it('lancia su errore CDN delle stories', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = requestUrl(input)
      if (url.includes('/spaces/me')) {
        return jsonResponse({ space: { version: 1 } })
      }
      return jsonResponse({}, 500)
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(searchStories('catalogo', 'token', '')).rejects.toThrow('CDN 500')
  })
})

describe('sortStoryOptions', () => {
  it('mette in cima le stories più recenti', () => {
    const sorted = sortStoryOptions([
      { uuid: 'a', name: 'Vecchia', full_slug: 'it/a', created_at: '2026-01-01T00:00:00.000Z' },
      { uuid: 'b', name: 'Nuova', full_slug: 'it/b', created_at: '2026-08-27T00:00:00.000Z' },
    ])
    expect(sorted.map((story) => story.uuid)).toEqual(['b', 'a'])
  })
})
