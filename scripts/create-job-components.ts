#!/usr/bin/env tsx
/**
 * Crea/aggiorna i componenti Storyblok `job` e `job_list`
 * e aggiunge `job_list` alla whitelist di `page.body`.
 *
 * Uso: npm run create:job-components
 */

import * as dotenv from 'dotenv'
import StoryblokClient from 'storyblok-js-client'

dotenv.config({ path: '.env.local' })

const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || '289806242201975'
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ''

if (!MANAGEMENT_TOKEN) {
  console.error('❌ STORYBLOK_MANAGEMENT_TOKEN non trovato nel file .env.local')
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

const JOB_BODY_WHITELIST = [
  'article_body',
  'faqs',
  'cta_box',
  'link',
  'divider',
  'hero',
]

const JOB_COMPONENT: Omit<StoryblokComponentRecord, 'id'> = {
  name: 'job',
  display_name: 'Job',
  is_root: true,
  is_nestable: false,
  schema: {
    title: {
      type: 'text',
      pos: 0,
      required: true,
      display_name: 'Titolo',
    },
    short_description: {
      type: 'textarea',
      pos: 1,
      display_name: 'Descrizione breve',
    },
    area: {
      type: 'text',
      pos: 2,
      display_name: 'Area',
    },
    esperienza: {
      type: 'option',
      pos: 3,
      display_name: 'Esperienza',
      options: [
        { name: 'Stage', value: 'stage' },
        { name: 'Junior', value: 'junior' },
        { name: 'Middle', value: 'middle' },
        { name: 'Senior', value: 'senior' },
      ],
    },
    description: {
      type: 'bloks',
      pos: 4,
      display_name: 'Descrizione',
      restrict_components: true,
      component_whitelist: ['article_body'],
    },
    body: {
      type: 'bloks',
      pos: 5,
      display_name: 'Body',
      restrict_components: true,
      component_whitelist: JOB_BODY_WHITELIST,
    },
  },
}

const JOB_LIST_COMPONENT: Omit<StoryblokComponentRecord, 'id'> = {
  name: 'job_list',
  display_name: 'Job List',
  is_root: false,
  is_nestable: true,
  schema: {
    title: {
      type: 'text',
      pos: 0,
      display_name: 'Titolo',
    },
    subtitle: {
      type: 'textarea',
      pos: 1,
      display_name: 'Sottotitolo',
    },
    anchor_id: {
      type: 'text',
      pos: 2,
      display_name: 'Anchor ID',
    },
  },
}

async function getComponents(): Promise<StoryblokComponentRecord[]> {
  const response = await storyblok.get(`spaces/${SPACE_ID}/components`)
  return response.data.components || []
}

async function upsertComponent(
  existing: StoryblokComponentRecord | undefined,
  payload: Omit<StoryblokComponentRecord, 'id'>,
): Promise<void> {
  if (existing?.id) {
    await storyblok.put(`spaces/${SPACE_ID}/components/${existing.id}`, {
      component: payload,
    } as never)
    console.log(`✅ Aggiornato componente: ${payload.name}`)
    return
  }

  await storyblok.post(`spaces/${SPACE_ID}/components`, {
    component: payload,
  } as never)
  console.log(`✅ Creato componente: ${payload.name}`)
}

function mergeWhitelist(
  current: unknown,
  additions: string[],
): string[] {
  const base = Array.isArray(current)
    ? current.filter((item): item is string => typeof item === 'string')
    : []
  return [...new Set([...base, ...additions])]
}

async function patchPageBodyWhitelist(
  components: StoryblokComponentRecord[],
): Promise<void> {
  const page = components.find((component) => component.name === 'page')
  if (!page?.id || !page.schema?.body) {
    console.warn('⚠️  Componente page o campo body non trovato — salto whitelist')
    return
  }

  const bodyField = { ...page.schema.body }
  const nextWhitelist = mergeWhitelist(bodyField.component_whitelist, ['job_list'])

  if (
    Array.isArray(bodyField.component_whitelist) &&
    nextWhitelist.length === bodyField.component_whitelist.length
  ) {
    console.log('ℹ️  job_list già presente in page.body whitelist')
    return
  }

  bodyField.component_whitelist = nextWhitelist
  bodyField.restrict_components = true

  await storyblok.put(`spaces/${SPACE_ID}/components/${page.id}`, {
    component: {
      name: page.name,
      display_name: page.display_name,
      is_root: page.is_root,
      is_nestable: page.is_nestable,
      schema: {
        ...page.schema,
        body: bodyField,
      },
    },
  } as never)

  console.log('✅ Aggiunto job_list alla whitelist di page.body')
}

async function main() {
  console.log('🚀 Creazione componenti Job su Storyblok...\n')

  try {
    const components = await getComponents()
    const existingJob = components.find((component) => component.name === 'job')
    const existingJobList = components.find((component) => component.name === 'job_list')

    await upsertComponent(existingJob, JOB_COMPONENT)
    await upsertComponent(existingJobList, JOB_LIST_COMPONENT)
    await patchPageBodyWhitelist(components)

    console.log('\n✅ Completato. Esegui: npm run generate:types')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error('❌ Errore:', message)
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: unknown } }).response
      if (response?.data) {
        console.error('   Dettagli:', JSON.stringify(response.data, null, 2))
      }
    }
    process.exit(1)
  }
}

main().catch(console.error)
