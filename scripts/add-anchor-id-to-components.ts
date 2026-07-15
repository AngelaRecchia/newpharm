#!/usr/bin/env tsx
/**
 * Aggiunge il campo `anchor_id` ai componenti Storyblok principali (Management API).
 *
 * Uso:
 *   npx tsx scripts/add-anchor-id-to-components.ts --dry-run
 *   npx tsx scripts/add-anchor-id-to-components.ts
 *
 * Env (.env.local):
 *   STORYBLOK_MANAGEMENT_TOKEN
 *   NEXT_PUBLIC_STORYBLOK_SPACE_ID
 */

import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import StoryblokClient from 'storyblok-js-client'

dotenv.config({ path: '.env.local' })

const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || ''
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ''
const dryRun = process.argv.includes('--dry-run')

/** Organism / moduli pagina registrati in lib/storyblok.tsx */
const MAIN_COMPONENTS = [
  'hero',
  'division_box',
  'cta_box',
  'full_banner',
  'split_banner',
  'carousel',
  'banner_accordion',
  'sticky_image',
  'text_reveal',
  'video_yt',
  'spec_table',
  'icon_text_highlight',
  'tabs',
  'faqs',
  'gallery',
  'box_image',
  'box_image_carousel',
  'projects_highlight',
  'milestone',
  'partners',
  'slideshow',
  'catalogs_download',
] as const

const ANCHOR_ID_FIELD = {
  type: 'text',
  display_name: 'Anchor ID',
  description:
    'ID HTML per link ancora (es. chi-siamo). Solo minuscole, numeri e trattini.',
  regex: '^[a-z0-9-]*$',
  translatable: false,
  required: false,
}

interface StoryblokComponentRecord {
  id: number
  name: string
  display_name: string
  schema: Record<string, Record<string, unknown>>
  [key: string]: unknown
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextFieldPos(schema: Record<string, Record<string, unknown>>): number {
  const positions = Object.values(schema)
    .map((field) => (typeof field.pos === 'number' ? field.pos : 0))
    .filter((pos) => Number.isFinite(pos))

  const maxPos = positions.length > 0 ? Math.max(...positions) : 0
  return maxPos + 1
}

async function main() {
  if (!MANAGEMENT_TOKEN || !SPACE_ID) {
    console.error('❌ Mancano STORYBLOK_MANAGEMENT_TOKEN o NEXT_PUBLIC_STORYBLOK_SPACE_ID in .env.local')
    process.exit(1)
  }

  const storyblok = new StoryblokClient({ oauthToken: MANAGEMENT_TOKEN })

  console.log(`🚀 Aggiunta campo anchor_id${dryRun ? ' (dry-run)' : ''}`)
  console.log(`📦 Space ID: ${SPACE_ID}\n`)

  const { data } = await storyblok.get(`spaces/${SPACE_ID}/components`)
  const components: StoryblokComponentRecord[] = data.components || []

  const backupDir = path.join(process.cwd(), 'data', 'storyblok-component-backups')
  fs.mkdirSync(backupDir, { recursive: true })
  const backupPath = path.join(
    backupDir,
    `components-before-anchor-id-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
  )

  const toBackup = components.filter((c) =>
    MAIN_COMPONENTS.includes(c.name as (typeof MAIN_COMPONENTS)[number])
  )
  fs.writeFileSync(backupPath, JSON.stringify(toBackup, null, 2), 'utf-8')
  console.log(`💾 Backup salvato: ${backupPath}\n`)

  let updated = 0
  let skipped = 0
  let missing = 0

  for (const name of MAIN_COMPONENTS) {
    const component = components.find((c) => c.name === name)

    if (!component) {
      console.warn(`⚠️  Non trovato: ${name}`)
      missing++
      continue
    }

    if (component.schema?.anchor_id) {
      console.log(`⏭️  ${name} — anchor_id già presente`)
      skipped++
      continue
    }

    const schema = {
      ...component.schema,
      anchor_id: {
        ...ANCHOR_ID_FIELD,
        pos: nextFieldPos(component.schema || {}),
      },
    }

    console.log(`${dryRun ? '🔍' : '✅'} ${name} (${component.display_name})`)

    if (!dryRun) {
      await storyblok.put(`spaces/${SPACE_ID}/components/${component.id}`, {
        component: {
          ...component,
          schema,
        },
      } as any)
      updated++
      await sleep(350)
    }
  }

  console.log('\n---')
  console.log(`Aggiornati: ${dryRun ? 0 : updated}`)
  console.log(`Saltati: ${skipped}`)
  console.log(`Mancanti: ${missing}`)

  if (!dryRun && updated > 0) {
    console.log('\n🔄 Esegui: npm run generate:types')
  }
}

main().catch((error: unknown) => {
  const err = error as { message?: string; response?: { data?: unknown } }
  console.error('❌ Errore:', err.message)
  if (err.response?.data) {
    console.error(JSON.stringify(err.response.data, null, 2))
  }
  process.exit(1)
})
