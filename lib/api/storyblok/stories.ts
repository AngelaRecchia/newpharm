/**
 * Storyblok Stories API
 * 
 * Functions for fetching stories from Storyblok CDN API.
 */

import { getStoryblokApi } from './client'
import { getStoryblokVersion, getCacheVersion } from './config'

export interface GetStoryOptions {
  version?: "draft" | "published"
  resolve_links?: "url" | "story" | "0" | "1"
  resolve_relations?: string | string[]
  language?: string
  [key: string]: any
}

export interface Story {
  name: string
  created_at: string
  published_at: string | null
  id: number
  uuid: string
  content: any
  slug: string
  full_slug: string
  [key: string]: any
}

/**
 * Recupera una story da Storyblok
 * Funzione centralizzata per fetchare stories con gestione automatica di:
 * - Versione (draft/published) basata su ambiente
 * - Locale nel path
 * - Parametri standard (resolve_links, resolve_relations)
 *
 * @param slug - Slug della story (es: 'home', 'about', 'it/home')
 * @param locale - Locale opzionale (se non incluso nello slug)
 * @param options - Opzioni aggiuntive per la richiesta
 * @returns La story o null se non trovata (404 ritorna null silenziosamente)
 */
export async function getStory(
  slug: string,
  locale?: string,
  options: GetStoryOptions = {}
): Promise<Story | null> {
  const storyPath =
    locale && !slug.startsWith(locale + "/") ? `${locale}/${slug}` : slug

  try {
    const storyblokApi = getStoryblokApi()
    const version = options.version || getStoryblokVersion()
    const cv = await getCacheVersion()

    const params: Record<string, any> = {
      version,
      resolve_links: "url",
      resolve_relations: "*",
      ...options,
    }

    // Add cv parameter if available (omitted in dev to encourage caching)
    if (cv !== undefined) {
      params.cv = cv
    }

    const endpoint = `cdn/stories/${storyPath}`
    const { data } = await storyblokApi.get(endpoint, params)

    return data?.story || null
  } catch (error: any) {
    // 1. Check for 404 specifically
    if (error?.status === 404) {
      return null // Graceful return for notFound()
    }

    console.error(`[Storyblok] Error fetching ${storyPath}}`)

    return null
  }
}

/**
 * Recupera tutte le stories da Storyblok per generateStaticParams
 * Esclude automaticamente le stories in 'layout-components'
 *
 * @param options - Opzioni per la richiesta
 * @param options.version - Versione da usare (default: basata su ambiente)
 * @param options.excludePaths - Path da escludere (default: ['layout-components'])
 * @param options.perPage - Numero di stories per pagina (default: 100)
 * @returns Array di stories
 *
 * @example
 * const stories = await getAllStories()
 * // Returns all published stories (in production) or draft stories (in development)
 */
export async function getAllStories(
  options: {
    version?: "draft" | "published"
    excludePaths?: string[]
    perPage?: number
  } = {}
): Promise<Story[]> {
  const {
    version = getStoryblokVersion(),
    excludePaths = ["layout-components"],
    perPage = 100,
  } = options

  try {
    const storyblokApi = getStoryblokApi()
    const allStories: Story[] = []
    const cv = await getCacheVersion()

    let page = 1
    let hasMore = true

    while (hasMore) {
      const params: Record<string, any> = {
        version,
        per_page: perPage,
        page,
        excluding_fields: "body", // Exclude large fields to speed up fetch
      }

      // Add cv parameter if available (omitted in dev to encourage caching)
      if (cv !== undefined) {
        params.cv = cv
      }

      const { data } = await storyblokApi.get("cdn/stories", params)

      if (!data?.stories || data.stories.length === 0) {
        hasMore = false
        break
      }

      // Filter out excluded paths
      const filteredStories = data.stories.filter((story: Story) => {
        const fullSlug = story.full_slug || ""

        // Skip empty slugs
        if (!fullSlug) {
          return false
        }

        // Check if story is in excluded path
        const segments = fullSlug.split("/")

        // Check first segment (e.g., 'layout-components')
        if (excludePaths.includes(segments[0])) {
          return false
        }

        // Check second segment (e.g., 'en/layout-components')
        if (segments.length > 1 && excludePaths.includes(segments[1])) {
          return false
        }

        return true
      })

      allStories.push(...filteredStories)

      // Check if there are more pages
      if (data.stories.length < perPage) {
        hasMore = false
      } else {
        page++
      }
    }

    return allStories
  } catch (error) {
    return []
  }
}
