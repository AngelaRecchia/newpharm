/**
 * Fetch filtri taxonomy from Storyblok datasource and write data/filtri-entries.json
 *
 * Run before `next build` or `next dev` to keep filter labels in sync with CMS.
 *
 * Usage:
 *   npx tsx scripts/fetch-filtri.ts
 *
 * Requires env vars (from .env.local):
 *   NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN
 */

import { config } from 'dotenv'
import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { getDatasourceEntries } from '../lib/api/storyblok/datasource'

config({ path: join(process.cwd(), '.env.local') })

const DATASOURCE_SLUG = 'filtri'
const OUTPUT_PATH = join(process.cwd(), 'data', 'filtri-entries.json')

type FiltriEntry = {
  name: string
  value: string
}

function readExistingEntries(): FiltriEntry[] {
  if (!existsSync(OUTPUT_PATH)) return []

  try {
    const parsed = JSON.parse(readFileSync(OUTPUT_PATH, 'utf-8')) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is FiltriEntry =>
        !!entry &&
        typeof entry === 'object' &&
        typeof (entry as FiltriEntry).name === 'string' &&
        typeof (entry as FiltriEntry).value === 'string',
    )
  } catch {
    return []
  }
}

async function main() {
  let entries: FiltriEntry[] = []

  if (!process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN) {
    console.warn(
      '⚠ Missing NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN — keeping existing filtri-entries.json',
    )
  } else {
    try {
      const raw = await getDatasourceEntries(DATASOURCE_SLUG)
      entries = raw.map(({ name, value }) => ({ name, value }))
    } catch (error) {
      console.warn(
        '⚠ Failed to fetch filtri datasource from Storyblok:',
        error instanceof Error ? error.message : error,
      )
    }
  }

  if (entries.length === 0) {
    entries = readExistingEntries()
    if (entries.length === 0) {
      console.warn('⚠ No filtri entries available — wrote empty array')
    } else {
      console.warn(`⚠ Using ${entries.length} existing filtri entries as fallback`)
    }
  }

  writeFileSync(OUTPUT_PATH, `${JSON.stringify(entries, null, 2)}\n`)
  console.log(`✅ Wrote ${entries.length} filtri entries to data/filtri-entries.json`)
}

main()
