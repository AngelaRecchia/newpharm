/**
 * Import Datasource Storyblok - v2
 *
 * Struttura:
 *   name  = slug fisso (chiave invariabile, es. "insettici-e-acaricidi")
 *   value = traduzione nella lingua corrente
 *     - dimensione default (IT): valore italiano
 *     - dimensione EN: valore inglese
 *     - dimensione AR: valore arabo
 *
 * Lo script:
 *   1. Recupera i datasource esistenti per slug
 *   2. Elimina TUTTE le entries esistenti
 *   3. Elimina le dimensioni esistenti (EN, AR)
 *   4. Ricrea le dimensioni EN e AR
 *   5. Importa le entries con value IT (default)
 *   6. Importa le traduzioni EN e AR come dimension entries
 *
 * Utilizzo:
 *   STORYBLOK_TOKEN=xxx STORYBLOK_SPACE_ID=yyy node import-datasources-v2.mjs
 *
 * Flags:
 *   --lang=it,en,ar   Lingue da importare (default: tutte)
 *   --dry-run         Mostra cosa farebbe senza modifiche
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Supporta sia le variabili dello script che quelle del progetto
const TOKEN    = process.env.STORYBLOK_TOKEN || process.env.STORYBLOK_MANAGEMENT_TOKEN || 'TUO_MANAGEMENT_TOKEN'
const SPACE_ID = process.env.STORYBLOK_SPACE_ID || process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || 'TUO_SPACE_ID'
const BASE_URL = `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}`
const __dirname = dirname(fileURLToPath(import.meta.url))

const args     = process.argv.slice(2)
const dryRun   = args.includes('--dry-run')
const langArg  = args.find(a => a.startsWith('--lang='))
const LANGS    = langArg ? langArg.replace('--lang=','').split(',') : ['it','en','ar']

const LANG_LABELS = { it: 'Italiano', en: 'English', ar: 'العربية' }

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ─── API ─────────────────────────────────────────────────────────────────────
async function api(path, options = {}, retries = 5) {
  if (dryRun && ['POST','PUT','DELETE'].includes(options.method)) {
    console.log(`    [dry-run] ${options.method} ${path}`)
    return { datasource: { id: 0, dimensions: [] }, datasource_dimension: { id: 0 }, datasource_entry: { id: 0 }, datasource_entries: [] }
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': TOKEN, 'Content-Type': 'application/json', ...options.headers },
  })

  if (res.status === 429) {
    const wait = 1500 * (6 - retries)
    console.log(`    ⏳ Rate limit, attendo ${wait}ms...`)
    await sleep(wait)
    return api(path, options, retries - 1)
  }

  // 204 No Content (DELETE)
  if (res.status === 204) return {}

  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`HTTP ${res.status} ${options.method || 'GET'} ${path}: ${JSON.stringify(body)}`)
  return body
}

// ─── Datasource lookup ────────────────────────────────────────────────────────
async function getExistingDatasources() {
  const data = await api('/datasources/')
  return data.datasources || []
}

async function getDatasourceDetail(dsId) {
  const data = await api(`/datasources/${dsId}/`)
  return data.datasource || {}
}

// ─── Entries: elimina tutto ───────────────────────────────────────────────────
async function deleteAllEntries(dsId) {
  let page = 1
  let deleted = 0

  while (true) {
    const data = await api(`/datasource_entries/?datasource_id=${dsId}&per_page=1000&page=${page}`)
    const entries = data.datasource_entries || []
    if (entries.length === 0) break

    for (const entry of entries) {
      await api(`/datasource_entries/${entry.id}`, { method: 'DELETE' })
      await sleep(60)
      deleted++
    }

    if (entries.length < 1000) break
    page++
  }

  return deleted
}

// ─── Dimensioni: elimina e ricrea ────────────────────────────────────────────
async function deleteAllDimensions(dsId) {
  const ds = await getDatasourceDetail(dsId)
  const dims = ds.dimensions || []
  let deleted = 0
  for (const dim of dims) {
    try {
      await api(`/datasource_dimensions/${dim.id}`, { method: 'DELETE' })
      deleted++
      await sleep(100)
    } catch (err) {
      // Ignora errori 404 (dimensione già eliminata)
      if (!err.message.includes('404')) {
        throw err
      }
    }
  }
  return deleted
}

async function createDimension(dsId, lang) {
  const res = await api(`/datasource_dimensions/`, {
    method: 'POST',
    body: JSON.stringify({
      datasource_dimension: {
        name: LANG_LABELS[lang] || lang.toUpperCase(),
        entry_value: lang,
        datasource_id: dsId,
      }
    })
  })
  return res.datasource_dimension?.id || 0
}

// ─── Import entries ───────────────────────────────────────────────────────────
async function importDefaultEntries(dsId, entries) {
  // entries default = IT (value = traduzione italiana)
  const created = []
  for (const entry of entries) {
    const payload = {
      name: entry.name,           // slug fisso
      value: entry.value_it,      // traduzione IT
      datasource_id: dsId,
      ...(entry.dimension_value ? { dimension_value: entry.dimension_value } : {}),
    }
    const res = await api(`/datasource_entries/`, {
      method: 'POST',
      body: JSON.stringify({ datasource_entry: payload }),
    })
    created.push({ slug: entry.name, id: res.datasource_entry?.id || 0 })
    await sleep(80)
  }
  return created
}

async function importDimensionEntries(dsId, entries, createdEntries, lang) {
  // Mappa slug → id entry appena creata
  const idBySlug = {}
  for (const e of createdEntries) idBySlug[e.slug] = e.id

  let created = 0
  for (const entry of entries) {
    const value = lang === 'en' ? entry.value_en : entry.value_ar

    // Crea una nuova entry con dimension_value invece di dimension_id
    const payload = {
      name: entry.name,
      value: value,
      datasource_id: dsId,
      dimension_value: lang,  // Usa dimension_value invece di dimension_id
      ...(entry.dimension_value ? { dimension_value: entry.dimension_value } : {}),
    }

    try {
      await api(`/datasource_entries/`, {
        method: 'POST',
        body: JSON.stringify({ datasource_entry: payload }),
      })
      created++
      await sleep(80)
    } catch (err) {
      // Se fallisce perché esiste già, prova ad aggiornare
      if (err.message.includes('already been taken') || err.message.includes('422')) {
        // Cerca l'entry esistente
        const allExisting = await getExistingEntries(dsId)
        const match = allExisting.find(e => {
          const eDim = e.dimension_value || null
          return e.name === entry.name && eDim === lang
        })
        if (match) {
          await api(`/datasource_entries/${match.id}`, {
            method: 'PUT',
            body: JSON.stringify({ datasource_entry: { ...payload, id: match.id } }),
          })
          created++
          await sleep(80)
        } else {
          console.warn(`    ⚠️  Non posso creare/aggiornare "${entry.name}" (${value})`)
        }
      } else {
        throw err
      }
    }
  }
  return created
}

async function getExistingEntries(dsId) {
  const data = await api(`/datasource_entries/?datasource_id=${dsId}&per_page=1000`)
  return data.datasource_entries || []
}

// ─── Import datasources ───────────────────────────────────────────────────────
async function importDatasources() {
  console.log('\n📦 IMPORTAZIONE DATASOURCE')
  console.log('─'.repeat(55))

  const filePath = join(__dirname, 'files', 'datasources_v2.json')
  const allDS = JSON.parse(readFileSync(filePath, 'utf-8'))

  // Mappatura vecchi slug -> nuovi slug
  const slugMapping = {
    'categoria-prodotto': 'category',
    'application-area': 'application-areas',
    'application-area-sub': 'application-areas-sub',
    'infestanti': 'target-pest',
    'infestanti-sub': 'target-pest-sub',
    'formulazione': 'composition',
    'product-type': 'product_type'
  }

  const existing = await getExistingDatasources()
  const existingBySlug = {}
  for (const d of existing) existingBySlug[d.slug] = d

  for (const [key, data] of Object.entries(allDS)) {
    const { datasource, entries } = data
    // Usa il nuovo slug se disponibile nella mappatura
    const newSlug = slugMapping[datasource.slug] || datasource.slug
    console.log(`\n🗂  ${datasource.name} (${newSlug}) — ${entries.length} entries`)

    let dsId

    // Recupera il datasource esistente
    if (existingBySlug[newSlug]) {
      dsId = existingBySlug[newSlug].id
      console.log(`  Esiste già (id: ${dsId})`)
    } else {
      console.log(`  ⚠️  Datasource "${newSlug}" non trovato. Assicurati che sia stato creato su Storyblok.`)
      continue
    }

    // 1. Elimina tutte le entries esistenti
    console.log(`  🗑  Elimino entries esistenti...`)
    const deleted = await deleteAllEntries(dsId)
    console.log(`     ${deleted} entries eliminate`)

    // 2. Elimina dimensioni esistenti
    console.log(`  🗑  Elimino dimensioni esistenti...`)
    const deletedDims = await deleteAllDimensions(dsId)
    console.log(`     ${deletedDims} dimensioni eliminate`)

    await sleep(300)

    // 3. Importa entries default (IT)
    console.log(`  📝 Importo IT (default)...`)
    const createdEntries = await importDefaultEntries(dsId, entries)
    console.log(`     ✅ ${createdEntries.length} entries create`)

    // 4. Importa traduzioni (usando dimension_value invece di dimension_id)
    for (const lang of LANGS.filter(l => l !== 'it')) {
      console.log(`  🌐 Importo ${lang.toUpperCase()} (${LANG_LABELS[lang]})...`)
      const created = await importDimensionEntries(dsId, entries, createdEntries, lang)
      console.log(`     ✅ ${created} traduzioni importate`)
      await sleep(200)
    }

    await sleep(400)
  }

  console.log('\n✅ Datasource completati!')
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═'.repeat(55))
  console.log('  STORYBLOK DATASOURCE IMPORT v2')
  console.log('═'.repeat(55))

  if (TOKEN === 'TUO_MANAGEMENT_TOKEN' || SPACE_ID === 'TUO_SPACE_ID') {
    console.error('\n❌ Imposta STORYBLOK_TOKEN e STORYBLOK_SPACE_ID')
    console.error('   Esempio:')
    console.error('   STORYBLOK_TOKEN=xxx STORYBLOK_SPACE_ID=yyy node import-datasources-v2.mjs')
    process.exit(1)
  }

  console.log(`  Space ID : ${SPACE_ID}`)
  console.log(`  Lingue   : ${LANGS.join(', ')}`)
  console.log(`  Dry run  : ${dryRun ? 'SÌ' : 'no'}`)

  try {
    await importDatasources()
  } catch (err) {
    console.error('\n❌ Errore fatale:', err.message)
    process.exit(1)
  }

  console.log('\n🎉 Importazione completata!')
  console.log(`\n👉 Verifica: https://app.storyblok.com/#/me/spaces/${SPACE_ID}/datasources`)
}

main()
