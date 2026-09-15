import { config } from 'dotenv'
config({ path: '.env.local' })

import {
  getStoriesByComponent,
  type Story,
} from '@/lib/api/storyblok/stories'
import { getAlgoliaAdminClient, getSearchIndexName } from '@/lib/search/client'
import {
  storyToSearchDocument,
  buildProductNameIndex,
  buildInsectNameIndex,
} from '@/lib/search/document'
import type { SearchDocument, SearchDocumentType } from '@/lib/search/types'
import localeConfig from '@/i18n/locales.json'

const SEARCHABLE_COMPONENTS: { type: SearchDocumentType; component: string }[] = [
  { type: 'product', component: 'product' },
  { type: 'project', component: 'project' },
  { type: 'story', component: 'story' },
  { type: 'downloadable', component: 'downloadable' },
]

async function fetchDocumentsForLocale(
  locale: string,
  version: 'draft' | 'published',
): Promise<SearchDocument[]> {
  const [productByUuid, insectByUuid] = await Promise.all([
    buildProductNameIndex(locale, version),
    buildInsectNameIndex(locale, version),
  ])

  const context = { productByUuid, insectByUuid }

  const documentsByType = await Promise.all(
    SEARCHABLE_COMPONENTS.map(async ({ type, component }) => {
      const stories = await getStoriesByComponent(component, locale, { version })
      return stories.map((story) => storyToSearchDocument(type, story, locale, context))
    }),
  )

  return documentsByType.flat()
}

async function configureIndex(version: 'draft' | 'published') {
  const client = getAlgoliaAdminClient()
  const indexName = getSearchIndexName(version)

  await client.setSettings({
    indexName,
    indexSettings: {
      searchableAttributes: [
        'title',
        'secondary_title',
        'description',
        'body_text',
        'category',
        'tags',
        'divisions',
        'related_product_names',
        'related_category_tag',
        'features',
        'formulation',
        'product_type',
        'application_areas',
        'application_areas_text',
        'dosage_and_application',
        'usage',
        'composition',
        'registration',
        'target_pests',
        'kind',
      ],
      attributesForFaceting: [
        'filterOnly(slug)',
        'type',
        'locale',
        'category',
        'tags',
        'kind',
        'divisions',
        'product_type',
        'formulation',
        'application_areas',
      ],
      typoTolerance: 'true',
      removeStopWords: false,
      distinct: false,
    },
  })

  console.log(`[Algolia] Configured index "${indexName}"`)
}

async function indexVersion(version: 'draft' | 'published') {
  await configureIndex(version)
  const client = getAlgoliaAdminClient()
  const indexName = getSearchIndexName(version)
  const locales = localeConfig.locales

  console.log(`[Algolia] Indexing into "${indexName}"`)
  console.log(`[Algolia] Indexing locales: ${locales.join(', ')}`)

  const allDocuments: SearchDocument[] = []

  for (const locale of locales) {
    const docs = await fetchDocumentsForLocale(locale, version)
    console.log(`[Algolia] Fetched ${docs.length} documents for ${locale}`)
    allDocuments.push(...docs)
  }

  console.log(`[Algolia] Total documents: ${allDocuments.length}`)

  const response = await client.replaceAllObjects({
    indexName,
    objects: allDocuments as unknown as Record<string, unknown>[],
  })
  console.log(`[Algolia] Replaced objects, batch responses: ${response.batchResponses.length}`)
}

async function main() {
  const versions: Array<'draft' | 'published'> = ['draft', 'published']

  for (const version of versions) {
    console.log('')
    await indexVersion(version)
  }
}

main().catch((error) => {
  console.error('[Algolia] Indexing failed:', error)
  process.exit(1)
})
