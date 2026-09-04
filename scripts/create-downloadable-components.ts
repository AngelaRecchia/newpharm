#!/usr/bin/env tsx
/**
 * Crea/aggiorna i componenti Storyblok per l’hub risorse:
 * - campo `year` su `catalog`
 * - content type `downloadable` (kind catalog/brochure/app/other + flag form)
 * - catalogs_download.items accetta anche downloadable
 * - blok nestable `downloadable_resources`
 * - whitelist su `page.body`
 * - label i18n (tab, tag, store)
 *
 * Uso: npm run create:downloadable-components
 */

import * as dotenv from 'dotenv'
import StoryblokClient from 'storyblok-js-client'

dotenv.config({ path: '.env.local' })

const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || ''
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ''
const DATASOURCE_SLUG = 'labels'

if (!SPACE_ID || !MANAGEMENT_TOKEN) {
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

const PROJECT_DIVISION_OPTIONS = [
  { name: 'Cereals Storage', value: 'cereals-storage' },
  { name: 'Pest Control', value: 'pest-control' },
  { name: 'Zootech', value: 'zootech' },
  { name: 'Home & Garden', value: 'home-garden' },
  { name: 'Medical', value: 'medical' },
]

function hideUnlessKind(
  allowed: Array<'catalog' | 'brochure' | 'app' | 'other'>,
): Pick<StoryblokField, 'conditional_settings'> {
  const disallowed = (['catalog', 'brochure', 'app', 'other'] as const).filter(
    (kind) => !allowed.includes(kind),
  )

  return {
    conditional_settings: [
      {
        modifications: [{ display: 'hide' }],
        rule_match: 'any',
        rule_conditions: disallowed.map((value) => ({
          validation: 'equals',
          value,
          validated_object: { field_key: 'kind' },
        })),
      },
    ],
  }
}

function stripConditionals(
  schema: Record<string, StoryblokField>,
): Record<string, StoryblokField> {
  const next: Record<string, StoryblokField> = {}
  for (const [key, field] of Object.entries(schema)) {
    const { conditional_settings: _ignored, ...rest } = field
    next[key] = rest
  }
  return next
}

const DOWNLOADABLE_SCHEMA: Record<string, StoryblokField> = {
  kind: {
    type: 'option',
    pos: 0,
    required: true,
    display_name: 'Tipo',
    default_value: 'brochure',
    exclude_empty_option: true,
    options: [
      { name: 'Catalogo', value: 'catalog' },
      { name: 'Brochure', value: 'brochure' },
      { name: 'App', value: 'app' },
      { name: 'Altro', value: 'other' },
    ],
  },
  title: {
    type: 'text',
    pos: 1,
    required: true,
    display_name: 'Titolo',
    translatable: true,
  },
  image: {
    type: 'asset',
    pos: 2,
    display_name: 'Cover',
    filetypes: ['images'],
  },
  short_description: {
    type: 'textarea',
    pos: 3,
    display_name: 'Descrizione breve',
    translatable: true,
  },
  year: {
    type: 'number',
    pos: 4,
    required: true,
    display_name: 'Anno',
    decimals: 0,
    min_value: 2000,
    max_value: 2100,
  },
  file: {
    type: 'asset',
    pos: 5,
    display_name: 'File PDF',
    ...hideUnlessKind(['catalog', 'brochure', 'other']),
  },
  division: {
    type: 'options',
    pos: 6,
    display_name: 'Divisioni',
    options: PROJECT_DIVISION_OPTIONS,
    ...hideUnlessKind(['brochure']),
  },
  ios_url: {
    type: 'multilink',
    pos: 7,
    display_name: 'App Store',
    allow_target_blank: true,
    ...hideUnlessKind(['app']),
  },
  android_url: {
    type: 'multilink',
    pos: 8,
    display_name: 'Google Play',
    allow_target_blank: true,
    ...hideUnlessKind(['app']),
  },
  require_download_form: {
    type: 'boolean',
    pos: 9,
    display_name: 'Compilare form per download',
    default_value: false,
    ...hideUnlessKind(['other']),
  },
}

const DOWNLOADABLE_COMPONENT: Omit<StoryblokComponentRecord, 'id'> = {
  name: 'downloadable',
  display_name: 'Downloadable',
  is_root: true,
  is_nestable: false,
  schema: DOWNLOADABLE_SCHEMA,
}

const DOWNLOADABLE_RESOURCES_COMPONENT: Omit<StoryblokComponentRecord, 'id'> = {
  name: 'downloadable_resources',
  display_name: 'Downloadable Resources',
  is_root: false,
  is_nestable: true,
  schema: {
    title: {
      type: 'text',
      pos: 0,
      display_name: 'Titolo',
      translatable: true,
    },
    image: {
      type: 'bloks',
      pos: 1,
      display_name: 'Immagine',
      restrict_components: true,
      component_whitelist: ['asset'],
      maximum: 1,
    },
    anchor_id: {
      type: 'text',
      pos: 2,
      display_name: 'Anchor ID',
    },
  },
}

type LabelSeed = {
  name: string
  it: string
  en: string
  ar: string
}

const RESOURCE_LABELS: LabelSeed[] = [
  { name: 'resources_catalogs', it: 'Cataloghi', en: 'Catalogues', ar: 'الكتالوجات' },
  { name: 'resources_brochures', it: 'Brochure', en: 'Brochures', ar: 'كتيبات' },
  { name: 'resources_apps', it: 'App', en: 'Apps', ar: 'تطبيقات' },
  { name: 'resources_other', it: 'Altro', en: 'Other', ar: 'أخرى' },
  { name: 'resources_tablist', it: 'Categorie risorse', en: 'Resource categories', ar: 'فئات الموارد' },
  { name: 'google_play', it: 'Google Play', en: 'Google Play', ar: 'Google Play' },
  { name: 'app_store', it: 'App Store', en: 'App Store', ar: 'App Store' },
  { name: 'surname', it: 'Cognome', en: 'Surname', ar: 'اللقب' },
]

type DatasourceRecord = {
  id: number
  slug: string
  dimensions?: Array<{ id: number; entry_value: string }>
}

type DatasourceEntryRecord = {
  id: number
  name: string
  value: string
}

async function getComponents(): Promise<StoryblokComponentRecord[]> {
  const response = await storyblok.get(`spaces/${SPACE_ID}/components`)
  return response.data.components || []
}

async function upsertComponent(
  existing: StoryblokComponentRecord | undefined,
  payload: Omit<StoryblokComponentRecord, 'id'>,
): Promise<void> {
  const body = { component: payload }

  try {
    if (existing?.id) {
      await storyblok.put(`spaces/${SPACE_ID}/components/${existing.id}`, body as never)
      console.log(`✅ Aggiornato componente: ${payload.name}`)
      return
    }

    await storyblok.post(`spaces/${SPACE_ID}/components`, body as never)
    console.log(`✅ Creato componente: ${payload.name}`)
  } catch (error) {
    if (!payload.schema || payload.name !== 'downloadable') throw error

    console.warn('⚠️  Campi condizionali non supportati — riprovo senza conditional_settings')
    const fallback = { ...payload, schema: stripConditionals(payload.schema) }
    const fallbackBody = { component: fallback }

    if (existing?.id) {
      await storyblok.put(
        `spaces/${SPACE_ID}/components/${existing.id}`,
        fallbackBody as never,
      )
      console.log(`✅ Aggiornato componente: ${payload.name} (senza conditionals)`)
      return
    }

    await storyblok.post(`spaces/${SPACE_ID}/components`, fallbackBody as never)
    console.log(`✅ Creato componente: ${payload.name} (senza conditionals)`)
  }
}

function mergeWhitelist(current: unknown, additions: string[]): string[] {
  const base = Array.isArray(current)
    ? current.filter((item): item is string => typeof item === 'string')
    : typeof current === 'string' && current.trim()
      ? current.split(',').map((item) => item.trim()).filter(Boolean)
      : []
  return [...new Set([...base, ...additions])]
}

function sameStringSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false
  const rightSet = new Set(right)
  return left.every((item) => rightSet.has(item))
}

async function patchCatalogsDownloadItems(
  existing: StoryblokComponentRecord | undefined,
): Promise<void> {
  if (!existing?.id || !existing.schema?.items) {
    console.warn('⚠️  catalogs_download.items non trovato — salto whitelist cataloghi')
    return
  }

  const itemsField = { ...existing.schema.items }
  const nextTypes = mergeWhitelist(itemsField.filter_content_type, [
    'catalog',
    'downloadable',
  ])
  const currentTypes = mergeWhitelist(itemsField.filter_content_type, [])

  if (sameStringSet(currentTypes, nextTypes) && itemsField.restrict_content_types === true) {
    console.log('ℹ️  catalogs_download.items già include catalog e downloadable')
    return
  }

  itemsField.filter_content_type = nextTypes
  itemsField.restrict_content_types = true

  await storyblok.put(`spaces/${SPACE_ID}/components/${existing.id}`, {
    component: {
      name: existing.name,
      display_name: existing.display_name,
      is_root: existing.is_root,
      is_nestable: existing.is_nestable,
      schema: {
        ...existing.schema,
        items: itemsField,
      },
    },
  } as never)

  console.log('✅ catalogs_download.items accetta catalog e downloadable')
}

async function addYearToCatalog(
  existing: StoryblokComponentRecord | undefined,
): Promise<void> {
  if (!existing?.id || !existing.schema) {
    console.warn('⚠️  Componente catalog non trovato — salto campo year')
    return
  }

  if (existing.schema.year) {
    console.log('ℹ️  Campo year già presente su catalog')
    return
  }

  const positions = Object.values(existing.schema).map((field) =>
    typeof field.pos === 'number' ? field.pos : 0,
  )
  const maxPos = positions.length > 0 ? Math.max(...positions) : 0

  await storyblok.put(`spaces/${SPACE_ID}/components/${existing.id}`, {
    component: {
      name: existing.name,
      display_name: existing.display_name,
      is_root: existing.is_root,
      is_nestable: existing.is_nestable,
      schema: {
        ...existing.schema,
        year: {
          type: 'number',
          pos: maxPos + 1,
          required: true,
          display_name: 'Anno',
          decimals: 0,
          min_value: 2000,
          max_value: 2100,
        },
      },
    },
  } as never)

  console.log('✅ Aggiunto campo year a catalog')
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
  const nextWhitelist = mergeWhitelist(bodyField.component_whitelist, [
    'downloadable_resources',
  ])

  if (
    Array.isArray(bodyField.component_whitelist) &&
    nextWhitelist.length === bodyField.component_whitelist.length
  ) {
    console.log('ℹ️  downloadable_resources già presente in page.body whitelist')
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

  console.log('✅ Aggiunto downloadable_resources alla whitelist di page.body')
}

async function getLabelsDatasource(): Promise<{
  datasourceId: number
  dimensionIds: { en: number; ar: number }
}> {
  const response = await storyblok.get(`spaces/${SPACE_ID}/datasources`)
  const datasource = (response.data.datasources as DatasourceRecord[]).find(
    (item) => item.slug === DATASOURCE_SLUG,
  )

  if (!datasource?.id) {
    throw new Error(`Datasource "${DATASOURCE_SLUG}" non trovato`)
  }

  const en = datasource.dimensions?.find((d) => d.entry_value === 'en')
  const ar = datasource.dimensions?.find((d) => d.entry_value === 'ar')

  if (!en?.id || !ar?.id) {
    throw new Error('Dimensioni en/ar non trovate sul datasource labels')
  }

  return {
    datasourceId: datasource.id,
    dimensionIds: { en: en.id, ar: ar.id },
  }
}

async function getExistingEntries(
  datasourceId: number,
): Promise<Map<string, DatasourceEntryRecord>> {
  const map = new Map<string, DatasourceEntryRecord>()
  let page = 1

  while (true) {
    const response = await storyblok.get(
      `spaces/${SPACE_ID}/datasource_entries`,
      { datasource_id: datasourceId, per_page: 100, page } as never,
    )

    const entries = (
      response as unknown as { data: { datasource_entries: DatasourceEntryRecord[] } }
    ).data.datasource_entries

    if (!entries?.length) break

    for (const entry of entries) {
      map.set(entry.name, entry)
    }

    if (entries.length < 100) break
    page += 1
  }

  return map
}

async function upsertEntry(
  datasourceId: number,
  label: LabelSeed,
  existing?: DatasourceEntryRecord,
): Promise<number> {
  if (existing?.id) {
    await storyblok.put(`spaces/${SPACE_ID}/datasource_entries/${existing.id}`, {
      datasource_entry: {
        name: label.name,
        value: label.it,
      },
    } as never)
    return existing.id
  }

  const response = await storyblok.post(`spaces/${SPACE_ID}/datasource_entries`, {
    datasource_entry: {
      datasource_id: datasourceId,
      name: label.name,
      value: label.it,
    },
  } as never)

  return (response as unknown as { data: { datasource_entry: { id: number } } }).data
    .datasource_entry.id
}

async function upsertDimension(
  entryId: number,
  dimensionId: number,
  label: LabelSeed,
  locale: 'en' | 'ar',
): Promise<void> {
  const dimensionValue = locale === 'en' ? label.en : label.ar

  await storyblok.put(`spaces/${SPACE_ID}/datasource_entries/${entryId}`, {
    datasource_entry: {
      name: label.name,
      value: label.it,
      dimension_value: dimensionValue,
    },
    dimension_id: dimensionId,
  } as never)
}

async function seedLabels(): Promise<void> {
  const { datasourceId, dimensionIds } = await getLabelsDatasource()
  const existingEntries = await getExistingEntries(datasourceId)

  for (const label of RESOURCE_LABELS) {
    const existing = existingEntries.get(label.name)
    const entryId = await upsertEntry(datasourceId, label, existing)
    await upsertDimension(entryId, dimensionIds.en, label, 'en')
    await upsertDimension(entryId, dimensionIds.ar, label, 'ar')
    console.log(`✅ Label ${label.name}`)
  }
}

async function main() {
  console.log('🚀 Creazione componenti risorse scaricabili su Storyblok...\n')

  try {
    const components = await getComponents()
    const existingCatalog = components.find((component) => component.name === 'catalog')
    const existingDownloadable = components.find(
      (component) => component.name === 'downloadable',
    )
    const existingHub = components.find(
      (component) => component.name === 'downloadable_resources',
    )
    const existingCatalogsDownload = components.find(
      (component) => component.name === 'catalogs_download',
    )

    await addYearToCatalog(existingCatalog)
    await upsertComponent(existingDownloadable, DOWNLOADABLE_COMPONENT)
    await upsertComponent(existingHub, DOWNLOADABLE_RESOURCES_COMPONENT)
    await patchCatalogsDownloadItems(existingCatalogsDownload)
    await patchPageBodyWhitelist(components)
    await seedLabels()

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
