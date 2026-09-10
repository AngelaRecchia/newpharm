#!/usr/bin/env tsx
/**
 * Crea/aggiorna la label `prodotti_in_progetto` nel datasource Storyblok `labels`
 * con traduzioni IT, EN e AR.
 *
 * Usata dal titolo del listing highlight "prodotti del progetto" (pagina Project)
 * e dal carousel "stesso progetto" (pagina Product).
 *
 * Uso: npm run seed:prodotti-in-progetto-label
 */

import * as dotenv from 'dotenv'
import StoryblokClient from 'storyblok-js-client'

dotenv.config({ path: '.env.local' })

const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || ''
const MANAGEMENT_TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ''
const DATASOURCE_SLUG = 'labels'

type LabelSeed = {
  name: string
  it: string
  en: string
  ar: string
}

const PRODOTTI_IN_PROGETTO_LABEL: LabelSeed = {
  name: 'prodotti_in_progetto',
  it: 'Prodotti del progetto',
  en: 'Project products',
  ar: 'منتجات المشروع',
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

const storyblok = new StoryblokClient({
  oauthToken: MANAGEMENT_TOKEN,
})

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

async function findEntry(
  datasourceId: number,
  name: string,
): Promise<DatasourceEntryRecord | null> {
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

    const found = entries.find((entry) => entry.name === name)
    if (found) return found

    if (entries.length < 100) break
    page += 1
  }

  return null
}

async function upsertEntry(
  datasourceId: number,
  label: LabelSeed,
  existing?: DatasourceEntryRecord | null,
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

async function main() {
  if (!SPACE_ID || !MANAGEMENT_TOKEN) {
    console.error('❌ Configura NEXT_PUBLIC_STORYBLOK_SPACE_ID e STORYBLOK_MANAGEMENT_TOKEN')
    process.exit(1)
  }

  console.log('🚀 Seed label prodotti_in_progetto su Storyblok...')

  const { datasourceId, dimensionIds } = await getLabelsDatasource()
  const existing = await findEntry(datasourceId, PRODOTTI_IN_PROGETTO_LABEL.name)
  const entryId = await upsertEntry(datasourceId, PRODOTTI_IN_PROGETTO_LABEL, existing)
  await upsertDimension(entryId, dimensionIds.en, PRODOTTI_IN_PROGETTO_LABEL, 'en')
  await upsertDimension(entryId, dimensionIds.ar, PRODOTTI_IN_PROGETTO_LABEL, 'ar')

  console.log(`✅ ${PRODOTTI_IN_PROGETTO_LABEL.name} (${existing ? 'aggiornata' : 'creata'})`)
  console.log('✅ Completato.')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('❌ Errore:', message)
  process.exit(1)
})
