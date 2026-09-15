import { getStory, type Story } from '@/lib/api/storyblok/stories'
import { getStoryblokVersion } from '@/lib/api/storyblok/config'
import { getAlgoliaAdminClient, getSearchIndexName } from './client'
import {
  storyToSearchDocument,
  getSearchDocumentType,
  buildProductNameIndex,
  buildInsectNameIndex,
  hasManualRelatedProducts,
} from './document'
import type { SearchDocumentType } from './types'

export { storyToSearchDocument, getSearchDocumentType }

export async function syncStoryToSearchIndex(
  story: Story,
  locale: string,
  version: 'draft' | 'published' = getStoryblokVersion(),
) {
  const type = getSearchDocumentType(story.content?.component)
  if (!type) return

  const content = (story.content ?? {}) as Record<string, unknown>

  const needsProductIndex =
    type === 'project' ||
    type === 'story' ||
    (type === 'product' && hasManualRelatedProducts(content.related_products))

  const needsInsectIndex =
    type === 'product' &&
    Array.isArray(content.target_pests) &&
    content.target_pests.length > 0

  const [productByUuid, insectByUuid] = await Promise.all([
    needsProductIndex
      ? buildProductNameIndex(locale, version)
      : new Map<string, string>(),
    needsInsectIndex
      ? buildInsectNameIndex(locale, version)
      : new Map<string, string>(),
  ])

  const client = getAlgoliaAdminClient()
  const indexName = getSearchIndexName(version)
  const document = storyToSearchDocument(type, story, locale, {
    productByUuid,
    insectByUuid,
  })

  await client.saveObject({
    indexName,
    body: document,
  })
}

/** Escape per valori usati nei filtri Algolia (virgolette e backslash). */
function escapeAlgoliaFilterValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

export async function deleteStoryFromSearchIndex(
  fullSlug: string,
  version: 'draft' | 'published' = getStoryblokVersion(),
) {
  if (!fullSlug) return

  const client = getAlgoliaAdminClient()
  const indexName = getSearchIndexName(version)

  // Richiede `filterOnly(slug)` in attributesForFaceting (vedi scripts/index-search.ts)
  await client.deleteBy({
    indexName,
    deleteByParams: {
      filters: `slug:"${escapeAlgoliaFilterValue(fullSlug)}"`,
    },
  })
}

export async function syncStoryBySlug(
  slug: string,
  locale: string,
  version: 'draft' | 'published' = getStoryblokVersion(),
) {
  const story = await getStory(slug, locale, { version })
  if (!story) return
  await syncStoryToSearchIndex(story, locale, version)
}
