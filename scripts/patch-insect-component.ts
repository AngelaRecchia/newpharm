#!/usr/bin/env tsx
/**
 * Aggiorna il content type Storyblok `insect`:
 * - display_name → Target Pest
 * - rimuove `visibility` e `icon`
 * - aggiunge `famiglia` (option: blatte, mosche, vespe, zanzare, formiche)
 * - seed label i18n per le 5 famiglie
 *
 * Uso: npm run patch:insect-component
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

type LabelSeed = {
  name: string
  it: string
  en: string
  ar: string
}

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

const FAMILY_OPTIONS = [
  { name: 'Blatte', value: 'blatte' },
  { name: 'Mosche', value: 'mosche' },
  { name: 'Vespe', value: 'vespe' },
  { name: 'Zanzare', value: 'zanzare' },
  { name: 'Formiche', value: 'formiche' },
]

const FAMILY_LABELS: LabelSeed[] = [
  { name: 'blatte', it: 'Blatte', en: 'Cockroaches', ar: 'صراصير' },
  { name: 'mosche', it: 'Mosche', en: 'Flies', ar: 'ذباب' },
  { name: 'vespe', it: 'Vespe', en: 'Wasps', ar: 'دبابير' },
  { name: 'zanzare', it: 'Zanzare', en: 'Mosquitoes', ar: 'بعوض' },
  { name: 'formiche', it: 'Formiche', en: 'Ants', ar: 'نمل' },
]

function nextPos(schema: Record<string, StoryblokField>): number {
  const positions = Object.values(schema).map((field) => Number(field.pos) || 0)
  return (positions.length ? Math.max(...positions) : 0) + 1
}

async function getComponents(): Promise<StoryblokComponentRecord[]> {
  const response = await storyblok.get(`spaces/${SPACE_ID}/components`)
  return response.data.components || []
}

async function patchInsectComponent(components: StoryblokComponentRecord[]): Promise<void> {
  const insect = components.find((component) => component.name === 'insect')
  if (!insect?.id) {
    throw new Error('Componente insect non trovato')
  }

  const schema: Record<string, StoryblokField> = { ...(insect.schema ?? {}) }
  delete schema.visibility
  delete schema.icon

  const famigliaPos =
    typeof schema.category?.pos === 'number' ? schema.category.pos + 1 : nextPos(schema)

  schema.famiglia = {
    type: 'option',
    pos: famigliaPos,
    display_name: 'Famiglia',
    options: FAMILY_OPTIONS,
  }

  await storyblok.put(`spaces/${SPACE_ID}/components/${insect.id}`, {
    component: {
      name: insect.name,
      display_name: 'Target Pest',
      is_root: insect.is_root,
      is_nestable: insect.is_nestable,
      schema,
    },
  } as never)

  console.log('✅ Aggiornato componente insect → Target Pest (senza visibility/icon, con famiglia)')
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

async function seedFamilyLabels(): Promise<void> {
  const { datasourceId, dimensionIds } = await getLabelsDatasource()
  const existingEntries = await getExistingEntries(datasourceId)

  for (const label of FAMILY_LABELS) {
    const existing = existingEntries.get(label.name)
    const entryId = await upsertEntry(datasourceId, label, existing)
    await upsertDimension(entryId, dimensionIds.en, label, 'en')
    await upsertDimension(entryId, dimensionIds.ar, label, 'ar')
    console.log(`✅ Label ${label.name}`)
  }
}

async function main() {
  console.log('🚀 Patch componente insect → Target Pest...\n')

  const components = await getComponents()
  await patchInsectComponent(components)
  await seedFamilyLabels()

  console.log('\n✅ Completato.')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('❌ Errore:', message)
  process.exit(1)
})
