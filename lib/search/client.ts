import { Meilisearch } from 'meilisearch'

export function getMeilisearchClient() {
  const host = process.env.MEILISEARCH_HOST
  const apiKey = process.env.MEILISEARCH_API_KEY

  if (!host) {
    throw new Error('MEILISEARCH_HOST is not defined')
  }

  return new Meilisearch({
    host,
    apiKey,
  })
}

export function getSearchIndexName(): string {
  return process.env.MEILISEARCH_INDEX_NAME || 'newpharm_search'
}
