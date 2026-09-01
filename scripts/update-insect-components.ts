#!/usr/bin/env tsx
/**
 * Aggiorna il content type `insect` (icon, visibility, image, image_hover, gallery),
 * migra le story esistenti image → icon, e imposta `product.target_pests` sul plugin.
 *
 * Uso: npm run update:insect-components
 */

import * as dotenv from 'dotenv'
import StoryblokClient from 'storyblok-js-client'

dotenv.config({ path: '.env.local' })

const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || ''
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ''
const CDN_TOKEN = process.env.NEXT_PUBLIC_STORYBLOK_ACCESS_TOKEN || ''

if (!MANAGEMENT_TOKEN || !SPACE_ID) {
  console.error('❌ Configura NEXT_PUBLIC_STORYBLOK_SPACE_ID e STORYBLOK_MANAGEMENT_TOKEN')
  process.exit(1)
}

const storyblok = new StoryblokClient({
  oauthToken: MANAGEMENT_TOKEN,
})

type StoryblokField = Record<string, unknown>
type StoryblokComponentRecord = {
  id?: number
  name: string
  display_name?: string
  is_root?: boolean
  is_nestable?: boolean
  schema?: Record<string, StoryblokField>
}

const ASSET_IMAGE: StoryblokField = {
  type: 'asset',
  filetypes: ['images'],
}

function nextPos(schema: Record<string, StoryblokField>): number {
  const positions = Object.values(schema).map((field) => Number(field.pos) || 0)
  return Math.max(0, ...positions) + 1
}

function upsertField(
  schema: Record<string, StoryblokField>,
  key: string,
  field: StoryblokField,
) {
  if (schema[key]) {
    schema[key] = { ...schema[key], ...field }
    return
  }
  schema[key] = { ...field, pos: nextPos(schema) }
}

async function getComponents(): Promise<StoryblokComponentRecord[]> {
  const response = await storyblok.get(`spaces/${SPACE_ID}/components`)
  return response.data.components || []
}

async function updateInsectComponent(existing: StoryblokComponentRecord): Promise<void> {
  if (!existing.id) return

  const schema: Record<string, StoryblokField> = { ...(existing.schema ?? {}) }

  if (schema.image && !schema.icon) {
    schema.icon = {
      ...schema.image,
      display_name: 'Icona',
      pos: schema.image.pos ?? 1,
    }
  }

  upsertField(schema, 'icon', {
    ...ASSET_IMAGE,
    display_name: 'Icona',
  })
  upsertField(schema, 'visibility', {
    type: 'option',
    display_name: 'Visibilità',
    options: [
      { name: 'Infestante prodotto', value: 'product' },
      { name: 'Listing', value: 'listing' },
      { name: 'Entrambi', value: 'both' },
    ],
    default_value: 'product',
  })
  upsertField(schema, 'image', {
    ...ASSET_IMAGE,
    display_name: 'Immagine',
  })
  upsertField(schema, 'image_hover', {
    ...ASSET_IMAGE,
    display_name: 'Immagine hover',
  })
  upsertField(schema, 'gallery', {
    type: 'multiasset',
    filetypes: ['images'],
    display_name: 'Gallery',
  })

  await storyblok.put(`spaces/${SPACE_ID}/components/${existing.id}`, {
    component: {
      name: existing.name,
      display_name: existing.display_name ?? 'Insect',
      is_root: existing.is_root ?? true,
      is_nestable: existing.is_nestable ?? false,
      schema,
    },
  } as never)

  console.log('✅ Aggiornato content type insect')
}

async function patchProductTargetPests(product: StoryblokComponentRecord): Promise<void> {
  if (!product.id || !product.schema) return

  const current = product.schema.target_pests ?? {}
  const nextField: StoryblokField = {
    ...current,
    type: 'custom',
    field_type: 'target-pests',
    display_name: (current.display_name as string) || 'Infestanti target',
    options: [
      { name: 'cdn_token', value: CDN_TOKEN },
    ],
  }

  await storyblok.put(`spaces/${SPACE_ID}/components/${product.id}`, {
    component: {
      name: product.name,
      display_name: product.display_name,
      is_root: product.is_root,
      is_nestable: product.is_nestable,
      schema: {
        ...product.schema,
        target_pests: nextField,
      },
    },
  } as never)

  console.log('✅ Campo product.target_pests impostato sul plugin target-pests')
}

type ManagementStory = {
  id: number
  name: string
  slug: string
  published?: boolean
  is_folder?: boolean
  content?: Record<string, unknown>
}

async function migrateInsectStories(): Promise<void> {
  let page = 1
  let migrated = 0

  while (true) {
    const response = await storyblok.get(`spaces/${SPACE_ID}/stories`, {
      contain_component: 'insect',
      per_page: 100,
      page,
    } as never)
    const stories = (response.data.stories ?? []) as ManagementStory[]
    if (stories.length === 0) break

    for (const summary of stories) {
      if (summary.is_folder) continue
      const full = await storyblok.get(`spaces/${SPACE_ID}/stories/${summary.id}`)
      const story = full.data.story as ManagementStory
      const content = { ...(story.content ?? {}) }
      let changed = false

      const hasIcon = Boolean(
        content.icon && typeof content.icon === 'object' && (content.icon as { filename?: string }).filename,
      )
      const hasImage = Boolean(
        content.image && typeof content.image === 'object' && (content.image as { filename?: string }).filename,
      )

      if (!hasIcon && hasImage) {
        content.icon = content.image
        content.image = null
        changed = true
      }

      if (!content.visibility) {
        content.visibility = 'product'
        changed = true
      }

      if (!changed) continue

      await storyblok.put(`spaces/${SPACE_ID}/stories/${story.id}`, {
        force_update: 1,
        publish: story.published ? 1 : 0,
        story: {
          name: story.name,
          slug: story.slug,
          content,
        },
      } as never)
      migrated += 1
      console.log(`   migrata: ${story.name}`)
    }

    if (stories.length < 100) break
    page += 1
  }

  console.log(`✅ Migrazione story insect: ${migrated} aggiornate`)
}

async function main() {
  console.log('🚀 Aggiornamento componenti insect / target_pests...\n')

  try {
    const components = await getComponents()
    const insect = components.find((component) => component.name === 'insect')
    const product = components.find((component) => component.name === 'product')

    if (!insect) {
      console.error('❌ Content type insect non trovato')
      process.exit(1)
    }

    await updateInsectComponent(insect)
    await migrateInsectStories()

    if (product) {
      try {
        await patchProductTargetPests(product)
      } catch (error: unknown) {
        console.warn(
          '⚠️  Impossibile impostare product.target_pests sul plugin (installare target-pests nello space e rilanciare).',
        )
        const details =
          error && typeof error === 'object' && 'response' in error
            ? JSON.stringify(
                (error as { response?: { data?: unknown } }).response?.data,
                null,
                2,
              )
            : JSON.stringify(error, null, 2)
        console.warn(details)
      }
    } else {
      console.warn('⚠️  Content type product non trovato — salto target_pests')
    }

    console.log('\n✅ Completato. Esegui: npm run generate:types')
    console.log('   Se il plugin non è ancora installato nello space, deploya target-pests e reinstalla il campo.')
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : JSON.stringify(error, null, 2)
    console.error('❌ Errore:', message)
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: unknown; status?: number } }).response
      if (response?.status) console.error('   Status:', response.status)
      if (response?.data) {
        console.error('   Dettagli:', JSON.stringify(response.data, null, 2))
      }
    }
    process.exit(1)
  }
}

main().catch(console.error)
