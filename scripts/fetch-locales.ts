/**
 * Fetch available locales from Storyblok and write to i18n/locales.json
 *
 * Run before `next build` or `next dev` to keep locales in sync.
 * Uses getLangs(): root folders only, with at least one story
 * (draft in dev, published in prod — see NEXT_PUBLIC_STORYBLOK_VERSION).
 *
 * Usage:
 *   npx tsx scripts/fetch-locales.ts
 *
 * Requires env vars (from .env.local):
 *   STORYBLOK_MANAGEMENT_TOKEN
 *   NEXT_PUBLIC_STORYBLOK_SPACE_ID
 *   NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN
 */

import { config } from 'dotenv'
import { writeFileSync } from 'fs'
import { join } from 'path'
import { getLangs } from '../lib/api/storyblok/languages'

config({ path: join(process.cwd(), '.env.local') })

const DEFAULT_LOCALE = 'it'
const FALLBACK_LOCALES = ['it', 'en']
const EXCLUDE_FOLDERS = ['layout-components', 'news', 'prodotti']
const OUTPUT_PATH = join(process.cwd(), 'i18n', 'locales.json')

async function main() {
  let locales: string[]

  if (
    !process.env.STORYBLOK_MANAGEMENT_TOKEN ||
    !process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID
  ) {
    console.warn(
      '⚠ Missing STORYBLOK_MANAGEMENT_TOKEN or NEXT_PUBLIC_STORYBLOK_SPACE_ID — using fallback locales'
    )
    locales = [...FALLBACK_LOCALES]
  } else {
    try {
      locales = await getLangs({
        excludePaths: EXCLUDE_FOLDERS,
        checkForContent: true,
        skipCache: true,
      })
    } catch (error) {
      console.warn(
        '⚠ Failed to fetch locales from Storyblok:',
        error instanceof Error ? error.message : error
      )
      locales = []
    }

    if (locales.length === 0) {
      console.warn('⚠ No locale folders with content found — using fallback locales')
      locales = [...FALLBACK_LOCALES]
    }
  }

  if (!locales.includes(DEFAULT_LOCALE)) {
    locales.unshift(DEFAULT_LOCALE)
  }

  const uniqueLocales = [...new Set(locales)]

  writeFileSync(
    OUTPUT_PATH,
    JSON.stringify({ locales: uniqueLocales, defaultLocale: DEFAULT_LOCALE }, null, 2) + '\n'
  )
  console.log(
    `✅ Wrote ${uniqueLocales.length} locales to i18n/locales.json:`,
    uniqueLocales.join(', ')
  )
}

main()
