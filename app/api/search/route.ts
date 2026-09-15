import { NextRequest, NextResponse } from 'next/server'
import { getAlgoliaSearchClient, getSearchIndexName } from '@/lib/search/client'
import type { SearchDocument } from '@/lib/search/types'
import localeConfig from '@/i18n/locales.json'

export const dynamic = 'force-dynamic'

type SearchResultItem = {
  uuid: string
  title: string
  subtitle?: string
  href: string
  image?: unknown
}

type SearchResults = {
  projects: SearchResultItem[]
  products: SearchResultItem[]
  stories: SearchResultItem[]
  downloadables: SearchResultItem[]
}

const TYPE_ORDER: Array<{
  key: keyof SearchResults
  type: SearchDocument['type']
}> = [
  { key: 'projects', type: 'project' },
  { key: 'products', type: 'product' },
  { key: 'stories', type: 'story' },
  { key: 'downloadables', type: 'downloadable' },
]

const DEFAULT_LIMIT = 24
const MAX_LIMIT = 100

function hitToResult(hit: SearchDocument): SearchResultItem {
  return {
    uuid: hit.uuid,
    title: hit.title || hit.name,
    subtitle: hit.description || hit.secondary_title || undefined,
    href: `/${hit.slug}`,
    image: hit.image,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')?.trim() ?? ''
  const locale = searchParams.get('locale')?.trim() || localeConfig.defaultLocale
  const rawLimit = searchParams.get('limit')
  const parsedLimit = rawLimit ? parseInt(rawLimit, 10) : DEFAULT_LIMIT
  const limit = Math.min(
    Math.max(Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : DEFAULT_LIMIT, 1),
    MAX_LIMIT,
  )

  const emptyResults: SearchResults = {
    projects: [],
    products: [],
    stories: [],
    downloadables: [],
  }

  if (!query) {
    return NextResponse.json({ query, results: emptyResults })
  }

  let client
  try {
    client = getAlgoliaSearchClient()
  } catch {
    console.warn('[API Search] Algolia is not configured; returning empty results')
    return NextResponse.json({ query, results: emptyResults })
  }

  try {
    const indexName = getSearchIndexName()

    const { results } = await client.search<SearchDocument>({
      requests: TYPE_ORDER.map(({ type }) => ({
        indexName,
        query,
        filters: `type:${type} AND locale:${locale}`,
        hitsPerPage: limit,
        attributesToRetrieve: [
          'uuid',
          'slug',
          'name',
          'title',
          'secondary_title',
          'description',
          'image',
        ],
      })),
    })

    const resultsArray = results as unknown as Array<{
      hits: SearchDocument[]
    }>

    const searchResults: SearchResults = { ...emptyResults }
    TYPE_ORDER.forEach(({ key }, index) => {
      const result = resultsArray[index]
      if (!result) return
      searchResults[key] = (result.hits || []).map(hitToResult)
    })

    return NextResponse.json({ query, results: searchResults })
  } catch (error) {
    console.error('[API Search] error:', error)
    return NextResponse.json({ query, results: emptyResults })
  }
}
