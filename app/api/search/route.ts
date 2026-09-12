import { NextRequest, NextResponse } from 'next/server'
import { getMeilisearchClient, getSearchIndexName } from '@/lib/search/client'
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
  label: string
}> = [
  { key: 'projects', type: 'project', label: 'projects' },
  { key: 'products', type: 'product', label: 'products' },
  { key: 'stories', type: 'story', label: 'stories' },
  { key: 'downloadables', type: 'downloadable', label: 'downloadables' },
]

const DEFAULT_LIMIT = 24

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
  const limit = rawLimit ? parseInt(rawLimit, 10) || DEFAULT_LIMIT : DEFAULT_LIMIT

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
    client = getMeilisearchClient()
  } catch {
    console.warn('[API Search] Meilisearch is not configured; returning empty results')
    return NextResponse.json({ query, results: emptyResults })
  }

  try {
    const indexName = getSearchIndexName()

    const multiSearchResult = await client.multiSearch({
      queries: TYPE_ORDER.map(({ type }) => ({
        indexUid: indexName,
        q: query,
        filter: [`type = ${type}`, `locale = ${locale}`],
        limit,
        sort: ['title:asc'],
      })),
    })

    const results: SearchResults = { ...emptyResults }
    const msResults =
      (multiSearchResult.results as unknown as Array<{
        hits: SearchDocument[]
      }>) || []

    TYPE_ORDER.forEach(({ key }, index) => {
      const result = msResults[index]
      if (!result) return
      results[key] = (result.hits || []).map(hitToResult)
    })

    return NextResponse.json({ query, results })
  } catch (error) {
    console.error('[API Search] error:', error)
    return NextResponse.json({ query, results: emptyResults })
  }
}
