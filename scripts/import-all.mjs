/**
 * Import completo Storyblok:
 *   1. Crea/aggiorna datasource
 *   2. Popola entries IT (nome visibile default)
 *   3. Aggiunge traduzioni EN e AR come dimensioni
 *   4. Crea/aggiorna content type Prodotto
 *
 * Prerequisiti:
 *   node >= 18
 *   File nella stessa cartella:
 *     - datasources_multilang.json
 *     - content-type-prodotto-it.json
 *
 * Utilizzo:
 *   STORYBLOK_TOKEN=xxx STORYBLOK_SPACE_ID=yyy node import-all.mjs
 *
 * Flags opzionali:
 *   --only-datasources   Importa solo i datasource
 *   --only-content-type  Importa solo il content type
 *   --lang it,en,ar      Lingue da importare (default: tutte)
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Supporta sia le variabili dello script che quelle del progetto
const TOKEN    = process.env.STORYBLOK_TOKEN || process.env.STORYBLOK_MANAGEMENT_TOKEN || 'TUO_MANAGEMENT_TOKEN'
const SPACE_ID = process.env.STORYBLOK_SPACE_ID || process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || 'TUO_SPACE_ID'
const BASE_URL = `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}`
const __dirname = dirname(fileURLToPath(import.meta.url))

// Parse flags
const args = process.argv.slice(2)
const onlyDS  = args.includes('--only-datasources')
const onlyCT  = args.includes('--only-content-type')
const langArg = args.find(a => a.startsWith('--lang='))
const LANGS   = langArg ? langArg.replace('--lang=','').split(',') : ['it','en','ar']

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ─── API helper ─────────────────────────────────────────────────────────────
async function api(path, options = {}, retries = 4) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      'Authorization': TOKEN,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 429) {
    const wait = 2000 * (5 - retries)
    console.log(`  ⏳ Rate limit, attendo ${wait}ms...`)
    await sleep(wait)
    return api(path, options, retries - 1)
  }

  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`HTTP ${res.status} ${path}: ${JSON.stringify(body)}`)
  return body
}

// ─── Datasource helpers ──────────────────────────────────────────────────────
async function getExistingDatasources() {
  const data = await api('/datasources/')
  return data.datasources || []
}

// Le dimensioni devono essere create manualmente su Storyblok
// Usiamo dimension_value direttamente nelle entries
async function ensureDimension(dsId, lang) {
  // Le dimensioni devono essere abilitate e create manualmente su Storyblok
  // Per ora usiamo dimension_value nelle entries
  return null
}

async function getExistingEntries(dsId) {
  // Storyblok pagina a 1000
  const data = await api(`/datasource_entries/?datasource_id=${dsId}&per_page=1000`)
  return data.datasource_entries || []
}

async function deleteEntry(entryId) {
  await api(`/datasource_entries/${entryId}`, {
    method: 'DELETE',
  })
}

async function importEntries(dsId, entries, dimensionValue = null, slugMap = null) {
  const existing = await getExistingEntries(dsId)
  // Crea mappe per trovare entries esistenti
  // Su Storyblok attualmente: name = traduzione italiana, value = slug italiano
  // Dobbiamo cercare per name (traduzione) per IT, per value (slug) per EN/AR
  const existingByNameAndDim = new Map()   // name (traduzione) + dimension - per IT
  const existingByValueAndDim = new Map()  // value (slug) + dimension - per EN/AR
  for (const e of existing) {
    const dimKey = e.dimension_value || null
    // Mappa per name (traduzione) - formato attuale su Storyblok
    const keyByName = `${e.name}:${dimKey}`
    existingByNameAndDim.set(keyByName, e)
    // Mappa per value (slug) - per cercare EN/AR
    const keyByValue = `${e.value}:${dimKey}`
    existingByValueAndDim.set(keyByValue, e)
  }

  let created = 0, updated = 0

  for (const entry of entries) {
    // name sarà = slug italiano (dal value nel JSON)
    // value sarà = traduzione (dal name nel JSON)
    const entryName = entry.name  // name = slug italiano (es. "blatte-e-scarafaggi")
    const entryValue = entry.value  // value = traduzione (es. "Blatte e scarafaggi" per IT, "Cockroaches" per EN)
    
    // Per IT (default): dimension_value = null
    // Per EN/AR: dimension_value = lang
    const finalDimensionValue = dimensionValue || entry.dimension_value || null
    
    // Cerco entry esistente:
    let found = null
    if (finalDimensionValue === null) {
      // Per IT: cerco per name (traduzione italiana) - formato attuale su Storyblok
      found = existingByNameAndDim.get(`${entryValue}:${finalDimensionValue}`)
    } else {
      // Per EN/AR: cerco prima per value (slug) + dimension
      found = existingByValueAndDim.get(`${entryName}:${finalDimensionValue}`)
      // Se non trovato, cerco per name (slug) + dimension (potrebbe essere già corretto)
      if (!found) {
        for (const e of existing) {
          const eDim = e.dimension_value || null
          if (e.name === entryName && eDim === finalDimensionValue) {
            found = e
            break
          }
        }
      }
    }
    
    const payload = {
      name: entryName,  // name fisso = slug (es. "blatte-e-scarafaggi")
      value: entryValue,  // value = traduzione (es. "Blatte e scarafaggi" per IT, "Cockroaches" per EN)
      datasource_id: dsId,
    }
    
    // Aggiungi dimension_value solo se non è null (per EN/AR)
    if (finalDimensionValue !== null) {
      payload.dimension_value = finalDimensionValue
    }

    if (found) {
      // Aggiorna entry esistente invertendo name e value
      // Da: name = traduzione, value = slug
      // A: name = slug, value = traduzione
      try {
        await api(`/datasource_entries/${found.id}`, {
          method: 'PUT',
          body: JSON.stringify({ datasource_entry: payload }),
        })
        updated++
      } catch (err) {
        // Se fallisce perché il nuovo name (slug) esiste già, cerca quella entry
        if (err.message.includes('already been taken') || err.message.includes('422')) {
          const allExisting = await getExistingEntries(dsId)
          const match = allExisting.find(e => {
            const eDim = e.dimension_value || null
            return e.name === entryName && eDim === finalDimensionValue
          })
          if (match && match.id !== found.id) {
            // Aggiorna l'entry con il name corretto (slug)
            await api(`/datasource_entries/${match.id}`, {
              method: 'PUT',
              body: JSON.stringify({ datasource_entry: payload }),
            })
            updated++
          } else {
            console.warn(`    ⚠️  Non posso aggiornare "${entryName}" (${entryValue}) - conflitto`)
          }
        } else {
          throw err
        }
      }
    } else {
      // Crea nuova entry
      try {
        await api(`/datasource_entries/`, {
          method: 'POST',
          body: JSON.stringify({ datasource_entry: payload }),
        })
        created++
      } catch (err) {
        // Se fallisce per "Name has already been taken", cerca per value (slug) e dimensione
        if (err.message.includes('already been taken') || err.message.includes('422')) {
          const allExisting = await getExistingEntries(dsId)
          const dimKey = finalDimensionValue || null
          // Cerca per value (slug) e dimension_value
          const match = allExisting.find(e => {
            const eDim = e.dimension_value || null
            return e.value === entryName && eDim === dimKey
          })
          if (match) {
            await api(`/datasource_entries/${match.id}`, {
              method: 'PUT',
              body: JSON.stringify({ datasource_entry: payload }),
            })
            updated++
          } else {
            console.warn(`    ⚠️  Non posso creare/aggiornare "${entryName}" (${entryValue})`)
          }
        } else {
          throw err
        }
      }
    }

    await sleep(80)
  }

  console.log(`    ✅ ${created} create, ${updated} aggiornate`)
}

// ─── Import datasources ──────────────────────────────────────────────────────
async function importDatasources() {
  console.log('\n📦 IMPORTAZIONE DATASOURCE')
  console.log('─'.repeat(50))

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
  const existingMap = {}
  for (const d of existing) existingMap[d.slug] = d

  for (const [key, data] of Object.entries(allDS)) {
    const { datasource, entries } = data
    // Usa il nuovo slug se disponibile nella mappatura
    const newSlug = slugMapping[datasource.slug] || datasource.slug
    console.log(`\n🗂  ${datasource.name} (${newSlug}) — ${entries.length} entries`)

    let dsId

    if (existingMap[newSlug]) {
      dsId = existingMap[newSlug].id
      console.log(`  Esiste già (id: ${dsId})`)
    } else {
      console.log(`  Creo datasource...`)
      const res = await api('/datasources/', {
        method: 'POST',
        body: JSON.stringify({ datasource: { ...datasource, slug: newSlug } }),
      })
      dsId = res.datasource?.id || 0
      console.log(`  Creato (id: ${dsId})`)
    }

    // Lingua default = IT (name = slug, value = traduzione italiana)
    if (LANGS.includes('it')) {
      console.log(`  📝 Importo IT (default, senza dimensione)...`)
      // Per IT: name = slug (fisso), value = value_it (traduzione italiana)
      const itEntries = entries.map(entry => ({
        name: entry.name,  // name = slug fisso (es. "blatte-e-scarafaggi")
        value: entry.value_it,   // value = traduzione italiana (es. "Blatte e scarafaggi")
        dimension_value: entry.dimension_value || null
      }))
      await importEntries(dsId, itEntries, null, null)
    }

    // Altre lingue come dimensioni (name = slug fisso, value = traduzione della lingua)
    for (const lang of LANGS.filter(l => l !== 'it')) {
      console.log(`  🌐 Importo ${lang.toUpperCase()} (dimensione ${lang})...`)
      // Per EN/AR: name = slug (fisso), value = value_en/value_ar, dimension_value = lang
      const langEntries = entries.map(entry => ({
        name: entry.name,  // name = slug fisso (es. "blatte-e-scarafaggi")
        value: lang === 'en' ? entry.value_en : entry.value_ar,  // value = traduzione della lingua
        dimension_value: entry.dimension_value || null
      }))
      await importEntries(dsId, langEntries, lang, null)
    }

    await sleep(300)
  }

  console.log('\n✅ Tutti i datasource importati!')
}

// ─── Import content type ─────────────────────────────────────────────────────
async function importContentType() {
  console.log('\n📋 IMPORTAZIONE CONTENT TYPE')
  console.log('─'.repeat(50))

  const filePath = join(__dirname, 'files', 'content-type-prodotto-it.json')
  const { component } = JSON.parse(readFileSync(filePath, 'utf-8'))

  const data = await api('/components/')
  const existing = (data.components || []).find(c => c.name === component.name)

  if (existing) {
    console.log(`  ⚠️  "${component.name}" esiste (id: ${existing.id}), aggiorno...`)
    await api(`/components/${existing.id}`, {
      method: 'PUT',
      body: JSON.stringify({ component }),
    })
  } else {
    console.log(`  Creo componente "${component.name}"...`)
    await api('/components/', {
      method: 'POST',
      body: JSON.stringify({ component }),
    })
  }

  console.log('  ✅ Content type pronto!')
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Verifico credenziali...')
  if (TOKEN === 'TUO_MANAGEMENT_TOKEN' || SPACE_ID === 'TUO_SPACE_ID') {
    console.error('❌ Imposta STORYBLOK_TOKEN e STORYBLOK_SPACE_ID prima di eseguire.')
    console.error('   Esempio: STORYBLOK_TOKEN=xxx STORYBLOK_SPACE_ID=yyy node import-all.mjs')
    process.exit(1)
  }

  console.log(`   Space: ${SPACE_ID}`)
  console.log(`   Lingue: ${LANGS.join(', ')}`)

  try {
    if (!onlyCT)  await importDatasources()
    if (!onlyDS)  await importContentType()
  } catch (err) {
    console.error('\n❌ Errore:', err.message)
    process.exit(1)
  }

  console.log('\n🎉 Importazione completata!')
  console.log(`\n👉 Verifica datasource: https://app.storyblok.com/#/me/spaces/${SPACE_ID}/datasources`)
  console.log(`👉 Verifica componenti: https://app.storyblok.com/#/me/spaces/${SPACE_ID}/components`)
}

main()
