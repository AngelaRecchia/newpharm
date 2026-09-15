import { algoliasearch } from 'algoliasearch'
import { getStoryblokVersion } from '@/lib/api/storyblok/config'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} is not defined`)
  }
  return value
}

// Client cacheati a livello di modulo per riutilizzare le connessioni
// HTTP/TLS con Algolia tra una richiesta e l'altra.
let cachedAdminClient: ReturnType<typeof algoliasearch> | null = null
let cachedSearchClient: ReturnType<typeof algoliasearch> | null = null

export function getAlgoliaAdminClient() {
  if (cachedAdminClient) return cachedAdminClient
  const appId = requireEnv('ALGOLIA_APP_ID')
  const apiKey = requireEnv('ALGOLIA_ADMIN_API_KEY')
  cachedAdminClient = algoliasearch(appId, apiKey)
  return cachedAdminClient
}

export function getAlgoliaSearchClient() {
  if (cachedSearchClient) return cachedSearchClient
  const appId = requireEnv('ALGOLIA_APP_ID')
  const apiKey = requireEnv('ALGOLIA_SEARCH_API_KEY')
  cachedSearchClient = algoliasearch(appId, apiKey)
  return cachedSearchClient
}

/**
 * Restituisce il nome dell'indice Algolia in base alla versione Storyblok.
 *
 * - draft     → test_<ALGOLIA_INDEX_NAME>
 * - published → prod_<ALGOLIA_INDEX_NAME>
 *
 * Il nome base (es. "SEARCH") va in ALGOLIA_INDEX_NAME.
 */
export function getSearchIndexName(
  version?: 'draft' | 'published',
): string {
  const baseName = process.env.ALGOLIA_INDEX_NAME || 'newpharm_search'
  const resolvedVersion = version || getStoryblokVersion()
  const prefix = resolvedVersion === 'published' ? 'prod' : 'test'
  return `${prefix}_${baseName}`
}
