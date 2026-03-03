/**
 * Fetch available locales from Storyblok and write to i18n/locales.json
 *
 * Run before `next build` or `next dev` to keep locales in sync.
 * Uses the Management API to list root-level folders (each folder = one locale).
 *
 * Usage:
 *   node scripts/fetch-locales.mjs
 *
 * Requires env vars (from .env.local):
 *   STORYBLOK_MANAGEMENT_TOKEN
 *   NEXT_PUBLIC_STORYBLOK_SPACE_ID
 */

import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ''
const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || ''
const DEFAULT_LOCALE = 'it'
const FALLBACK_LOCALES = ['it', 'en']
const EXCLUDE_FOLDERS = ['layout-components', 'news', 'prodotti']
const OUTPUT_PATH = join(__dirname, '..', 'i18n', 'locales.json')

async function fetchLocales() {
  if (!TOKEN || !SPACE_ID) {
    console.warn('⚠ Missing STORYBLOK_MANAGEMENT_TOKEN or NEXT_PUBLIC_STORYBLOK_SPACE_ID — using fallback locales')
    return FALLBACK_LOCALES
  }

  try {
    const res = await fetch(
      `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}/stories?folder_only=true&level=0`,
      { headers: { Authorization: TOKEN } }
    )

    if (!res.ok) {
      throw new Error(`Management API responded ${res.status}: ${res.statusText}`)
    }

    const data = await res.json()
    const stories = data.stories || []

    const locales = stories
      .filter((s) => !EXCLUDE_FOLDERS.includes(s.slug || s.name))
      .map((s) => s.slug || s.name)
      .sort()

    if (locales.length === 0) {
      console.warn('⚠ No locale folders found — using fallback locales')
      return FALLBACK_LOCALES
    }

    // Ensure default locale is included
    if (!locales.includes(DEFAULT_LOCALE)) {
      locales.unshift(DEFAULT_LOCALE)
    }

    return locales
  } catch (error) {
    console.warn('⚠ Failed to fetch locales from Storyblok:', error.message)
    return FALLBACK_LOCALES
  }
}

const locales = await fetchLocales()

writeFileSync(OUTPUT_PATH, JSON.stringify({ locales, defaultLocale: DEFAULT_LOCALE }, null, 2) + '\n')
console.log(`✅ Wrote ${locales.length} locales to i18n/locales.json:`, locales.join(', '))
