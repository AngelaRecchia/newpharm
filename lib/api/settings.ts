/**
 * Global Settings API
 * 
 * High-level API for fetching global settings (header, footer, etc.)
 * from Storyblok layout-components story.
 */

import { getStory } from './storyblok/stories'
import { getLangs } from './storyblok/languages'

export interface GlobalSettings {
  header?: any
  footer?: any
  locales: string[]
  [key: string]: any
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
  const story = await getStory("layout-components", locale)

  if (story?.content) {
    // Fetch available locales and add to settings
    const locales = (await getLangs()) || []

    return {
      ...story.content,
      locales,
    }
  }
  
  return null
}
