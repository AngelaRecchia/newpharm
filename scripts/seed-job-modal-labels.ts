#!/usr/bin/env tsx
/**
 * Crea/aggiorna le label modale candidatura nel datasource Storyblok `labels`
 * con traduzioni IT (value), EN e AR (dimension_value).
 *
 * Uso: npm run seed:job-modal-labels
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

const JOB_MODAL_LABELS: LabelSeed[] = [
  {
    name: 'open_position',
    it: 'Posizione aperta',
    en: 'Open position',
    ar: 'وظيفة شاغرة',
  },
  {
    name: 'your_name_here',
    it: 'Il tuo nome qui',
    en: 'Your name here',
    ar: 'اسمك هنا',
  },
  {
    name: 'your_surname_here',
    it: 'Il tuo cognome qui',
    en: 'Your surname here',
    ar: 'اسم العائلة هنا',
  },
  {
    name: 'phone_placeholder',
    it: '+39 333 00 222 50',
    en: '+39 333 00 222 50',
    ar: '+39 333 00 222 50',
  },
  {
    name: 'message_placeholder',
    it: 'Scrivi qui il tuo messaggio',
    en: 'Write your message here',
    ar: 'اكتب رسالتك هنا',
  },
  {
    name: 'upload_file_hint',
    it: 'Trascina i file o <browse>sfoglia</browse>',
    en: 'Drag your file(s) or <browse>browse</browse>',
    ar: 'اسحب ملفاتك أو <browse>تصفح</browse>',
  },
  {
    name: 'recaptcha_error',
    it: 'Verifica reCAPTCHA non riuscita. Riprova.',
    en: 'reCAPTCHA verification failed. Please try again.',
    ar: 'فشل التحقق من reCAPTCHA. حاول مرة أخرى.',
  },
  {
    name: 'accepts_terms',
    it: "Ho letto e accetto i <a>termini e condizioni</a>",
    en: 'I have read and accept the <a>terms and conditions</a>',
    ar: 'لقد قرأت وأوافق على <a>الشروط والأحكام</a>',
  },
  {
    name: 'close_overlay',
    it: 'Chiudi scheda',
    en: 'Close card',
    ar: 'إغلاق البطاقة',
  },
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

async function getExistingEntries(
  datasourceId: number,
): Promise<Map<string, DatasourceEntryRecord>> {
  const response = await storyblok.get(
    `spaces/${SPACE_ID}/datasource_entries`,
    { datasource_id: datasourceId, per_page: 100 } as never,
  )

  const entries = (response as unknown as { data: { datasource_entries: DatasourceEntryRecord[] } })
    .data.datasource_entries

  const map = new Map<string, DatasourceEntryRecord>()
  for (const entry of entries) {
    map.set(entry.name, entry)
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

async function main() {
  if (!SPACE_ID || !MANAGEMENT_TOKEN) {
    console.error('❌ Configura NEXT_PUBLIC_STORYBLOK_SPACE_ID e STORYBLOK_MANAGEMENT_TOKEN')
    process.exit(1)
  }

  console.log('🚀 Seed label modale candidatura su Storyblok...\n')

  const { datasourceId, dimensionIds } = await getLabelsDatasource()
  const existingEntries = await getExistingEntries(datasourceId)

  for (const label of JOB_MODAL_LABELS) {
    const existing = existingEntries.get(label.name)
    const entryId = await upsertEntry(datasourceId, label, existing)
    await upsertDimension(entryId, dimensionIds.en, label, 'en')
    await upsertDimension(entryId, dimensionIds.ar, label, 'ar')

    console.log(`✅ ${label.name}`)
  }

  console.log('\n✅ Completato.')
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error('❌ Errore:', message)
  process.exit(1)
})
