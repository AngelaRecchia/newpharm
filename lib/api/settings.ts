/**
 * Global Settings API
 * 
 * High-level API for fetching global settings (header, footer, etc.)
 * from Storyblok layout-components story.
 */

import { getStory } from './storyblok/stories'
import { getLangs } from './storyblok/languages'

const SEARCH_SLUGS: Record<string, string> = {
  it: 'cerca',
  en: 'search',
  ar: 'search',
}

export interface GlobalSettings {
  header?: any
  footer?: any
  locales: string[]
  search_suggestions?: string[]
  [key: string]: any
}

function parseSuggestedSearches(value: unknown): string[] {
  if (typeof value !== 'string' || !value) return []
  return value.split(',').map((s) => s.trim()).filter(Boolean)
}

/**
 * Carica i global settings da Storyblok
 * Cerca la story con slug "layout-components" per il locale specificato
 *
 * @param locale - Locale per cui caricare i settings (default: 'it')
 * @returns Global settings object o null se non trovato
 */
export async function getGlobalSettings(
  locale: string = "it",
): Promise<GlobalSettings | null> {
  const [story, searchStory] = await Promise.all([
    getStory("layout-components", locale),
    getStory(SEARCH_SLUGS[locale] ?? 'search', locale).catch(() => null),
  ])

  if (story?.content) {
    // Fetch available locales and add to settings
    const locales = (await getLangs()) || []

    return {
      ...story.content,
      locales,
      search_suggestions: parseSuggestedSearches(
        (searchStory?.content as Record<string, unknown>)?.suggested_searches,
      ),
    }
  }
  
  return null
}
