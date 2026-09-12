#!/usr/bin/env tsx
/**
 * Rimuove i blocchi `cta_box` dal campo `body` degli story di tipo Product.
 *
 * Di default esegue in DRY-RUN: stampa quali prodotti verrebbero modificati
 * senza scrivere su Storyblok.
 *
 * Per applicare davvero le modifiche:
 *   DRY_RUN=false npx tsx scripts/remove-product-cta-box.ts
 *
 * Lo script modifica solo la versione draft degli story (non pubblica).
 * Gestisce il rate limit della Management API con un ritardo tra le richieste.
 */

import * as dotenv from 'dotenv'
import StoryblokClient from 'storyblok-js-client'
import { getStoryblokApi } from '../lib/api/storyblok/client'

dotenv.config({ path: '.env.local' })

const DRY_RUN = process.env.DRY_RUN !== 'false'
const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || ''
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ''
const ACCESS_TOKEN = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || ''

const MANAGEMENT_DELAY_MS = 400 // sotto il rate limit Starter (3 req/sec)

if (!SPACE_ID || !MANAGEMENT_TOKEN || !ACCESS_TOKEN) {
  console.error('❌ Variabili d\'ambiente mancanti:')
  console.error('   - NEXT_PUBLIC_STORYBLOK_SPACE_ID')
  console.error('   - STORYBLOK_MANAGEMENT_TOKEN')
  console.error('   - NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN')
  process.exit(1)
}

const managementApi = new StoryblokClient({
  oauthToken: MANAGEMENT_TOKEN,
})

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface ProductStoryContent {
  component: string
  body?: Array<{ component: string; _uid: string; [key: string]: any }> | null
  [key: string]: any
}

interface StoryData {
  id: number
  uuid: string
  name: string
  slug: string
  full_slug: string
  content: ProductStoryContent
  [key: string]: any
}

async function fetchProductStories(): Promise<StoryData[]> {
  const cdnApi = getStoryblokApi()
  const stories: StoryData[] = []
  const perPage = 100
  let page = 1
  let hasMore = true

  console.log('🔍 Recupero gli story di tipo product dalla CDN...')

  while (hasMore) {
    const response = await cdnApi.get('cdn/stories', {
      version: 'draft',
      per_page: perPage,
      page,
    })

    const batch = (response.data?.stories ?? []) as StoryData[]
    stories.push(...batch)
    hasMore = batch.length === perPage
    page += 1
  }

  const products = stories.filter((story) => story.content?.component === 'product')

  console.log(`✅ Trovati ${products.length} story di tipo product (su ${stories.length} totali)`)
  return products
}

function findCtaBoxIndexes(body: ProductStoryContent['body']): number[] {
  if (!Array.isArray(body)) return []
  return body.reduce<number[]>((indexes, item, index) => {
    if (item?.component === 'cta_box') indexes.push(index)
    return indexes
  }, [])
}

async function updateStory(story: StoryData, newBody: ProductStoryContent['body']): Promise<void> {
  await managementApi.put(`spaces/${SPACE_ID}/stories/${story.id}`, {
    story: {
      name: story.name,
      slug: story.slug,
      content: {
        ...story.content,
        body: newBody,
      },
    },
    force_update: '1',
  } as any)
}

async function main() {
  const products = await fetchProductStories()
  const toUpdate: Array<{ story: StoryData; indexes: number[] }> = []

  for (const story of products) {
    const indexes = findCtaBoxIndexes(story.content?.body)
    if (indexes.length > 0) {
      toUpdate.push({ story, indexes })
    }
  }

  if (toUpdate.length === 0) {
    console.log('✅ Nessun blocco cta_box trovato nei body dei product.')
    return
  }

  console.log(`\n⚠️  ${toUpdate.length} product contengono cta_box nel body:`)
  for (const { story, indexes } of toUpdate) {
    console.log(`   - ${story.full_slug || story.slug} (id: ${story.id}, cta_box: ${indexes.length})`)
  }

  if (DRY_RUN) {
    console.log('\n🧪 DRY-RUN: nessuna modifica applicata.')
    console.log('   Per applicare le modifiche esegui:')
    console.log('   DRY_RUN=false npx tsx scripts/remove-product-cta-box.ts')
    return
  }

  console.log('\n📝 Rimozione cta_box in corso...')
  let updated = 0
  let failed = 0

  for (const { story, indexes } of toUpdate) {
    const currentBody = story.content?.body ?? []
    const newBody = currentBody.filter((_, index) => !indexes.includes(index))

    try {
      await updateStory(story, newBody)
      updated += 1
      console.log(`   ✅ ${story.full_slug || story.slug}: rimosse ${indexes.length} cta_box`)
    } catch (error: any) {
      failed += 1
      console.error(`   ❌ ${story.full_slug || story.slug}: ${error.message || error}`)
    }

    await sleep(MANAGEMENT_DELAY_MS)
  }

  console.log(`\n🏁 Completato: ${updated} aggiornati, ${failed} falliti.`)
  if (failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error('❌ Errore imprevisto:', error)
  process.exit(1)
})
