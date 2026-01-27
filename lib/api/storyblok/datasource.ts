/**
 * Storyblok Datasource API
 * 
 * Functions for fetching and transforming datasource entries from Storyblok.
 */

import { getStoryblokApi } from './client'
import { getStoryblokVersion, getCacheVersion } from './config'

export interface DatasourceEntry {
  id: number
  name: string
  value: string
  dimension_value: string | null
  [key: string]: any
}

export interface DatasourceEntries {
  datasource_entries: DatasourceEntry[]
}

/**
 * Fetch all entries from a Storyblok datasource
 *
 * @param datasource - The datasource slug (e.g., 'translations', 'labels')
 * @param dimension - Optional dimension value (e.g., locale: 'en', 'it')
 * @returns Array of datasource entries
 *
 * @example
 * // Get all translations for Italian
 * const entries = await getDatasourceEntries('translations', 'it')
 *
 * @example
 * // Get all entries without filtering by dimension
 * const entries = await getDatasourceEntries('translations')
 */
export async function getDatasourceEntries(
  datasource: string,
  dimension?: string
): Promise<DatasourceEntry[]> {
  try {
    const storyblokApi = getStoryblokApi()
    const version = getStoryblokVersion()
    const cv = await getCacheVersion()

    const params: Record<string, any> = {
      datasource,
      version,
      per_page: 100, // Max per page
    }

    if (dimension) {
      params.dimension = dimension
    }

    // Add cv parameter if available (omitted in dev to encourage caching)
    if (cv !== undefined) {
      params.cv = cv
    }

    const allEntries: DatasourceEntry[] = []
    let page = 1
    let hasMore = true

    // Fetch all pages
    while (hasMore) {
      const { data } = await storyblokApi.get("cdn/datasource_entries", {
        ...params,
        page,
      })

      if (!data?.datasource_entries || data.datasource_entries.length === 0) {
        hasMore = false
        break
      }

      allEntries.push(...data.datasource_entries)

      // Check if there are more pages
      if (data.datasource_entries.length < params.per_page) {
        hasMore = false
      } else {
        page++
      }
    }

    return allEntries
  } catch (error) {
    console.error("Error fetching datasource entries from Storyblok:", {
      datasource,
      dimension,
      error: error instanceof Error ? error.message : error,
    })
    return []
  }
}

/**
 * Transform datasource entries into a nested messages object
 *
 * Converts entries with dot-notation names (e.g., "common.loading", "nav.home")
 * into a nested object structure for next-intl
 *
 * @param entries - Array of datasource entries
 * @returns Nested messages object
 *
 * @example
 * const entries = [
 *   { name: 'common.loading', value: 'Caricamento...' },
 *   { name: 'nav.home', value: 'Home' }
 * ]
 * const messages = transformDatasourceToMessages(entries)
 * // Result: { common: { loading: 'Caricamento...' }, nav: { home: 'Home' } }
 */
export function transformDatasourceToMessages(
  entries: DatasourceEntry[]
): Record<string, any> {
  const messages: Record<string, any> = {}

  for (const entry of entries) {
    const keys = entry.name.split(".")
    const value = entry.value || entry.name

    let current = messages

    // Navigate/create nested structure
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i]
      if (!current[key]) {
        current[key] = {}
      }
      current = current[key]
    }

    // Set the final value
    const lastKey = keys[keys.length - 1]
    current[lastKey] = value
  }

  return messages
}

/**
 * Get translation messages from a Storyblok datasource for a specific locale
 *
 * @param datasource - The datasource slug (default: 'labels')
 * @param locale - The locale dimension (e.g., 'it', 'en')
 * @returns Nested messages object for next-intl
 *
 * @example
 * const messages = await getMessagesFromDatasource('labels', 'it')
 * // Returns: { common: { loading: 'Caricamento...' }, ... }
 */
export async function getMessagesFromDatasource(
  datasource: string = "labels",
  locale: string
): Promise<Record<string, any>> {
  const entries = await getDatasourceEntries(datasource, locale)

  if (entries.length === 0) {
    console.warn(
      `No datasource entries found for "${datasource}" with locale "${locale}". Using empty messages.`
    )
    return {}
  }

  return transformDatasourceToMessages(entries)
}
