#!/usr/bin/env tsx
/**
 * Aggiorna il nestable `box_image`: picker prodotto/progetto (senza campo sorgente).
 * La modalità è guidata dal valore compilato (ref oppure campi editoriali).
 *
 * Uso: npm run update:box-image-component
 */

import * as dotenv from 'dotenv'
import StoryblokClient from 'storyblok-js-client'

dotenv.config({ path: '.env.local' })

const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || ''
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ''

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

function stripConditionals(field: StoryblokField): StoryblokField {
  const { conditional_settings: _conditional, ...rest } = field
  return rest
}

function upsertField(
  schema: Record<string, StoryblokField>,
  key: string,
  field: StoryblokField,
) {
  if (schema[key]) {
    const { pos: _pos, ...rest } = field
    schema[key] = { ...stripConditionals(schema[key]), ...rest }
    return
  }
  schema[key] = { ...field }
}

async function getComponents(): Promise<StoryblokComponentRecord[]> {
  const response = await storyblok.get(`spaces/${SPACE_ID}/components`)
  return response.data.components || []
}

async function updateBoxImageComponent(existing: StoryblokComponentRecord): Promise<void> {
  if (!existing.id) return

  const schema: Record<string, StoryblokField> = { ...(existing.schema ?? {}) }

  delete schema.source

  upsertField(schema, 'product', {
    type: 'option',
    pos: 0,
    display_name: 'Prodotto',
    description: 'Se selezionato, titolo/sottotitolo/immagine arrivano dalla story (i campi sotto restano override).',
    source: 'internal_stories',
    filter_content_type: ['product'],
    use_uuid: true,
    allow_advanced_search: true,
    entry_appearance: 'card',
  })

  upsertField(schema, 'project', {
    type: 'option',
    pos: 1,
    display_name: 'Progetto',
    description: 'Se selezionato (e non c’è un prodotto), titolo/sottotitolo/immagine arrivano dalla story.',
    source: 'internal_stories',
    filter_content_type: ['project'],
    use_uuid: true,
    allow_advanced_search: true,
    entry_appearance: 'card',
  })

  if (schema.title) {
    schema.title = {
      ...schema.title,
      description:
        'Con un prodotto/progetto collegato, se compilato sostituisce il titolo della story.',
    }
  }
  if (schema.subtitle) {
    schema.subtitle = {
      ...schema.subtitle,
      description:
        'Con un prodotto/progetto collegato, se compilato sostituisce la descrizione breve della story.',
    }
  }
  if (schema.asset) {
    schema.asset = {
      ...schema.asset,
      description:
        'Con un prodotto/progetto collegato, se compilato sostituisce l’immagine della story.',
    }
  }
  if (schema.link) {
    schema.link = stripConditionals(schema.link)
  }

  await storyblok.put(`spaces/${SPACE_ID}/components/${existing.id}`, {
    component: {
      name: existing.name,
      display_name: existing.display_name ?? 'Box Image',
      is_root: existing.is_root ?? false,
      is_nestable: existing.is_nestable ?? true,
      schema,
    },
  } as never)

  console.log('✅ Aggiornato componente box_image (senza campo sorgente)')
}

async function main() {
  console.log('🚀 Aggiornamento componente box_image...\n')

  try {
    const components = await getComponents()
    const boxImage = components.find((component) => component.name === 'box_image')

    if (!boxImage) {
      console.error('❌ Componente box_image non trovato')
      process.exit(1)
    }

    await updateBoxImageComponent(boxImage)

    console.log('\n✅ Completato. Esegui: npm run generate:types')
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : JSON.stringify(error, null, 2)
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
