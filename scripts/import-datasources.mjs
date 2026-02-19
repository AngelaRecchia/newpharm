/**
 * Importazione Datasource su Storyblok
 * 
 * Prerequisiti:
 *   node >= 18 (fetch nativo)
 * 
 * Utilizzo:
 *   STORYBLOK_TOKEN=xxx STORYBLOK_SPACE_ID=yyy node import-datasources.mjs
 * 
 * Oppure modifica direttamente le costanti qui sotto.
 */

// Supporta sia le variabili dello script che quelle del progetto
const TOKEN    = process.env.STORYBLOK_TOKEN || process.env.STORYBLOK_MANAGEMENT_TOKEN || 'TUO_MANAGEMENT_TOKEN'
const SPACE_ID = process.env.STORYBLOK_SPACE_ID || process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || 'TUO_SPACE_ID'
const BASE_URL = `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}`

// File da importare in ordine
// I file _sub dipendono dai top-level, ma su Storyblok i datasource sono flat
// quindi l'ordine non è strettamente necessario
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const FILES = [
  'categorie.json',
  'application_areas.json',
  'application_areas_sub.json',
  'infestanti.json',
  'infestanti_sub.json',
  'formulazioni.json',
  'product_type.json',
]

// Utility: pausa tra le chiamate per non superare rate limit
const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Utility: chiamata API con retry su 429
async function apiFetch(url, options, retries = 3) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': TOKEN,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 429 && retries > 0) {
    console.log('  ⏳ Rate limit, attendo 2s...')
    await sleep(2000)
    return apiFetch(url, options, retries - 1)
  }

  if (!res.ok) {
    const body = await res.text()
    throw new Error(`HTTP ${res.status}: ${body}`)
  }

  return res.json()
}

// Crea un datasource e restituisce il suo ID
async function createDatasource(datasource) {
  console.log(`  Creo datasource "${datasource.name}"...`)
  const data = await apiFetch(`${BASE_URL}/datasources/`, {
    method: 'POST',
    body: JSON.stringify({ datasource }),
  })
  return data.datasource.id
}

// Recupera datasource esistenti (per evitare duplicati)
async function getExistingDatasources() {
  const data = await apiFetch(`${BASE_URL}/datasources/`, { method: 'GET' })
  return data.datasources || []
}

// Aggiunge le entries a un datasource
async function importEntries(datasourceId, entries) {
  console.log(`  Importo ${entries.length} entries...`)
  let count = 0

  for (const entry of entries) {
    await apiFetch(`${BASE_URL}/datasource_entries/`, {
      method: 'POST',
      body: JSON.stringify({
        datasource_entry: {
          name: entry.name,
          value: entry.value,
          // dimension_value usato per le sottocategorie (parent slug)
          ...(entry.dimension_value ? { dimension_value: entry.dimension_value } : {}),
          datasource_id: datasourceId,
        },
      }),
    })
    count++
    // Piccola pausa per non stressare il rate limit
    await sleep(100)
  }

  console.log(`  ✅ ${count} entries importate`)
}

// Main
async function main() {
  console.log('🔍 Verifico credenziali...')
  if (TOKEN === 'TUO_MANAGEMENT_TOKEN' || SPACE_ID === 'TUO_SPACE_ID') {
    console.error('❌ Imposta STORYBLOK_TOKEN e STORYBLOK_SPACE_ID prima di eseguire lo script.')
    process.exit(1)
  }

  // Recupera datasource già esistenti
  console.log('📋 Recupero datasource esistenti...')
  const existing = await getExistingDatasources()
  const existingSlugs = new Set(existing.map(d => d.slug))
  console.log(`   Trovati ${existing.length} datasource esistenti`)

  for (const file of FILES) {
    const filePath = join(__dirname, 'files', file)
    let data

    try {
      data = JSON.parse(readFileSync(filePath, 'utf-8'))
    } catch (e) {
      console.warn(`⚠️  File non trovato: ${file}, salto.`)
      continue
    }

    const { datasource, entries } = data
    console.log(`\n📦 ${file}`)

    // Controlla se esiste già
    if (existingSlugs.has(datasource.slug)) {
      console.log(`  ⚠️  Datasource "${datasource.slug}" già esistente, salto creazione.`)
      // Se vuoi aggiornare le entries anche su datasource esistenti,
      // decommenta le righe seguenti:
      // const existing = existing.find(d => d.slug === datasource.slug)
      // await importEntries(existing.id, entries)
      continue
    }

    try {
      const id = await createDatasource(datasource)
      await importEntries(id, entries)
    } catch (e) {
      console.error(`  ❌ Errore: ${e.message}`)
    }

    await sleep(300)
  }

  console.log('\n🎉 Importazione completata!')
  console.log(`\nVerifica su: https://app.storyblok.com/#/me/spaces/${SPACE_ID}/datasources`)
}

main().catch(err => {
  console.error('Errore fatale:', err)
  process.exit(1)
})
