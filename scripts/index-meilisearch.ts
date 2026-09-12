import 'dotenv/config'

import {
  getStoriesByComponent,
  type Story,
} from '@/lib/api/storyblok/stories'
import { richTextToPlainText } from '@/lib/api/utils/richtext'
import { getCoverAsset } from '@/lib/downloadable/assets'
import { getMeilisearchClient, getSearchIndexName } from '@/lib/search/client'
import type { SearchDocument, SearchDocumentType } from '@/lib/search/types'
import localeConfig from '@/i18n/locales.json'

const SEARCHABLE_COMPONENTS: { type: SearchDocumentType; component: string }[] = [
  { type: 'product', component: 'product' },
  { type: 'project', component: 'project' },
  { type: 'story', component: 'story' },
  { type: 'downloadable', component: 'downloadable' },
]

function normalizeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    return richTextToPlainText(value as any)
  }
  return ''
}

function toStringArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : normalizeText(item)))
      .filter(Boolean)
  }
  const text = normalizeText(value)
  return text ? [text] : []
}

function firstAsset(assets: unknown): unknown | undefined {
  if (Array.isArray(assets) && assets.length > 0) return assets[0]
  return undefined
}

function projectAsset(content: Record<string, unknown>): unknown | undefined {
  const image = firstAsset(content.image)
  if (image) return image
  return firstAsset(content.asset)
}

function extractImage(type: SearchDocumentType, content: Record<string, unknown>): unknown {
  switch (type) {
    case 'product':
      return getCoverAsset(content.images) ?? null
    case 'project':
      return projectAsset(content) ?? null
    case 'story':
      return firstAsset(content.asset) ?? null
    case 'downloadable':
      return content.image ?? null
    default:
      return null
  }
}

function extractCategory(
  type: SearchDocumentType,
  content: Record<string, unknown>,
): string | null {
  switch (type) {
    case 'project':
    case 'downloadable':
      return typeof content.division === 'string' ? content.division : null
    case 'story':
      return typeof content.tag === 'string' ? content.tag : null
    case 'product':
      return null
    default:
      return null
  }
}

function extractTags(
  type: SearchDocumentType,
  content: Record<string, unknown>,
): string[] {
  const tags: string[] = []

  if (type === 'product') {
    tags.push(...toStringArray(content.product_type))
    tags.push(...toStringArray(content.formulazione))
  }

  if (type === 'downloadable' && content.kind) {
    tags.push(...toStringArray(content.kind))
  }

  return tags.filter(Boolean)
}

function storyToDocument(
  type: SearchDocumentType,
  story: Story,
  locale: string,
): SearchDocument {
  const content = (story.content ?? {}) as Record<string, unknown>

  return {
    id: `${locale}::${type}::${story.uuid}`,
    uuid: story.uuid,
    type,
    locale,
    slug: story.full_slug,
    name: story.name,
    title: (content.title as string) || story.name,
    secondary_title:
      type === 'product'
        ? (content.secondary_title as string | undefined) || null
        : null,
    description: (content.short_description as string | undefined) || null,
    image: extractImage(type, content),
    category: extractCategory(type, content),
    tags: extractTags(type, content),
  }
}

async function fetchDocumentsForLocale(locale: string): Promise<SearchDocument[]> {
  const documentsByType = await Promise.all(
    SEARCHABLE_COMPONENTS.map(async ({ type, component }) => {
      const stories = await getStoriesByComponent(component, locale, {
        version: 'published',
      })

      return stories.map((story) => storyToDocument(type, story, locale))
    }),
  )

  return documentsByType.flat()
}

async function configureIndex() {
  const client = getMeilisearchClient()
  const indexName = getSearchIndexName()
  const index = client.index(indexName)
  const taskClient = client.tasks

  try {
    const createTask = await client.createIndex(indexName, { primaryKey: 'id' })
    await taskClient.waitForTask(createTask.taskUid)
    console.log(`[Meilisearch] Created index "${indexName}"`)
  } catch (error: any) {
    const code = error?.code || error?.errorCode
    if (code === 'index_already_exists') {
      console.log(`[Meilisearch] Index "${indexName}" already exists`)
    } else {
      throw error
    }
  }

  const settingsTask = await index.updateSettings({
    searchableAttributes: [
      'title',
      'secondary_title',
      'description',
      'category',
      'tags',
    ],
    filterableAttributes: ['type', 'locale', 'category', 'tags'],
    sortableAttributes: ['title'],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
    ],
  })
  await taskClient.waitForTask(settingsTask.taskUid)

  return { client, index }
}

async function main() {
  const { client, index } = await configureIndex()
  const locales = localeConfig.locales

  console.log(`[Meilisearch] Indexing locales: ${locales.join(', ')}`)

  const allDocuments: SearchDocument[] = []

  for (const locale of locales) {
    const docs = await fetchDocumentsForLocale(locale)
    console.log(`[Meilisearch] Fetched ${docs.length} documents for ${locale}`)
    allDocuments.push(...docs)
  }

  console.log(`[Meilisearch] Total documents: ${allDocuments.length}`)

  await index.deleteAllDocuments()

  const BATCH_SIZE = 500
  const taskUids: number[] = []
  for (let i = 0; i < allDocuments.length; i += BATCH_SIZE) {
    const batch = allDocuments.slice(i, i + BATCH_SIZE)
    const { taskUid } = await index.addDocuments(batch)
    taskUids.push(taskUid)
  }

  console.log(`[Meilisearch] Created ${taskUids.length} indexing tasks`)

  const taskClient = client.tasks
  for (const taskUid of taskUids) {
    const task = await taskClient.waitForTask(taskUid)
    if (task.status !== 'succeeded') {
      console.error('[Meilisearch] Indexing task failed:', task.error)
      process.exit(1)
    }
  }

  console.log('[Meilisearch] All indexing tasks succeeded')

  const stats = await index.getStats()
  console.log(`[Meilisearch] Indexed ${stats.numberOfDocuments} documents`)
}

main().catch((error) => {
  console.error('[Meilisearch] Indexing failed:', error)
  process.exit(1)
})
