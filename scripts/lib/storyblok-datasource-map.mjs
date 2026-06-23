import { readFileSync, existsSync, readdirSync } from 'fs'
import { join } from 'path'
import { parse } from 'csv-parse/sync'

/** Slug CSV errati → name valido nel datasource Storyblok */
export const SLUG_ALIASES = {
  'rtu---pronto-all-uso': 'rtu-pronto-all-uso',
  "rtu---pronto-all'uso": 'rtu-pronto-all-uso',
  "liquido-pronto-all'uso": 'liquido-pronto-all-uso',
  "granuli-pronti-all'uso": 'granuli-pronti-all-uso',
  "polvere-pronta-all'uso": 'polvere-pronta-all-uso',
  'polveri,-granuli-e-microgranuli': 'polveri-granuli-e-microgranuli',
  '-granuli-e-microgranuli': 'polveri-granuli-e-microgranuli',
  polveri: 'polveri-granuli-e-microgranuli',
  'granular-bait': 'granuli-attrattivi',
  'blocco-paraffinato-con-gancio': 'blocchi-paraffinati',
  'polvere-bagnabile': 'microgranuli-bagnabili',
  'tutti-i-cereali': 'stoccaggio-cereali',
  'powders-and-micro-granules': 'polveri-granuli-e-microgranuli',
  'concentrated-liquids': 'liquido-concentrato',
  'ready-to-use-product': 'liquido-pronto-all-uso',
  'spray-and-aerosol': 'spray-e-aerosol',
  'fumigants-/-smoke-generator': 'fumiganti',
  'paraffin-wax-block': 'blocchi-paraffinati',
  'gel-bait': 'gel',
  'pasta-bait': 'pasta-fresca',
  'granular-bait-en': 'granuli-attrattivi',
}

/** field key → datasource slug (da schema componente product in Storyblok) */
export const FIELD_DATASOURCE_SLUG = {
  formulazione: 'composition',
  product_type: 'product-type',
  category: 'category',
  application_areas: 'application-areas',
  application_areas_sub: 'application-areas-sub',
  target_pests: 'target-pest',
  target_pests_sub: 'target-pest-sub',
}

function normalizeSlug(raw) {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export function loadDatasourceSets(dir) {
  const sets = {}

  if (!dir || !existsSync(dir)) {
    return sets
  }

  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.csv')) continue

    const prefix = file.replace(/_entries_default_.*\.csv$/, '')
    const rows = parse(readFileSync(join(dir, file), 'utf-8'), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    if (!sets[prefix]) sets[prefix] = new Set()
    for (const row of rows) {
      if (row.name) sets[prefix].add(row.name.trim())
    }
  }

  return sets
}

function buildRegistryFromEntries(entries) {
  const byName = new Map()
  const names = new Set()

  for (const entry of entries) {
    const name = entry.name?.trim()
    if (!name) continue
    names.add(name)
    byName.set(name, entry)
  }

  return { names, byName }
}

async function fetchAllDatasourceEntries(baseUrl, token, datasourceId) {
  const entries = []
  let page = 1

  while (true) {
    const res = await fetch(
      `${baseUrl}/datasource_entries/?datasource_id=${datasourceId}&per_page=100&page=${page}`,
      { headers: { Authorization: token } }
    )
    const body = await res.json()
    if (res.status === 429) {
      await new Promise((r) => setTimeout(r, 1200))
      continue
    }
    if (!res.ok) {
      throw new Error(`Datasource entries failed: ${JSON.stringify(body)}`)
    }

    const batch = body.datasource_entries || []
    entries.push(...batch)
    if (batch.length < 100) break
    page++
  }

  return entries
}

/** Carica datasource + entry dall'API Management (fonte autorevole). */
export async function loadDatasourceRegistryFromApi({ baseUrl, token, delayMs = 200 }) {
  const registry = {}
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

  const dsRes = await fetch(`${baseUrl}/datasources/`, {
    headers: { Authorization: token },
  })
  const dsBody = await dsRes.json()
  if (!dsRes.ok) {
    throw new Error(`Datasource list failed: ${JSON.stringify(dsBody)}`)
  }

  for (const ds of dsBody.datasources || []) {
    const entries = await fetchAllDatasourceEntries(baseUrl, token, ds.id)
    registry[ds.slug] = buildRegistryFromEntries(entries)
    if (delayMs > 0) await sleep(delayMs)
  }

  return registry
}

export function getDatasourceRegistry(registry, field) {
  const slug = FIELD_DATASOURCE_SLUG[field]
  return slug ? registry[slug] : undefined
}

function resolveEntryName(raw, ds) {
  if (!raw || !ds) return undefined

  const trimmed = String(raw).trim()
  if (!trimmed) return undefined

  if (SLUG_ALIASES[trimmed] && ds.byName.has(SLUG_ALIASES[trimmed])) {
    return SLUG_ALIASES[trimmed]
  }

  let slug = normalizeSlug(trimmed)
  if (SLUG_ALIASES[slug]) slug = SLUG_ALIASES[slug]
  if (ds.byName.has(slug)) return slug

  const normalized = normalizeSlug(trimmed)
  const candidates = [...ds.names]
    .filter((name) => normalized.includes(name))
    .sort((a, b) => b.length - a.length)
  if (candidates[0]) return candidates[0]

  return undefined
}

/** Single-option: restituisce l'ID numerico dell'entry datasource (formato riconosciuto dall'editor). */
export function resolveSingleOptionId(raw, ds) {
  if (!raw || !ds) return undefined

  const parts = String(raw)
    .split(/[|,]/)
    .map((p) => p.trim())
    .filter(Boolean)

  for (const part of parts) {
    const name = resolveEntryName(part, ds)
    if (name) return ds.byName.get(name).id
  }

  return undefined
}

/** Multi-options: array di ID numerici. */
export function resolveMultiOptionIds(raw, ds) {
  if (!raw || !ds) return undefined

  const parts = String(raw)
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)

  const ids = []
  for (const part of parts) {
    const name = resolveEntryName(part, ds)
    if (!name) continue
    const id = ds.byName.get(name).id
    if (!ids.includes(id)) ids.push(id)
  }

  return ids.length > 0 ? ids : undefined
}

// ─── Fallback CSV (validazione offline) ─────────────────────────────────────
export function resolveSlug(raw, validSet) {
  if (!raw) return undefined
  const trimmed = String(raw).trim()
  if (SLUG_ALIASES[trimmed]) {
    const aliased = SLUG_ALIASES[trimmed]
    if (!validSet || validSet.size === 0 || validSet.has(aliased)) return aliased
    return undefined
  }
  let slug = normalizeSlug(trimmed)
  if (!slug) return undefined
  if (SLUG_ALIASES[slug]) slug = SLUG_ALIASES[slug]
  if (validSet && validSet.size > 0 && !validSet.has(slug)) return undefined
  return slug
}

export function getValidSet(datasourceSets, field) {
  const slug = FIELD_DATASOURCE_SLUG[field]
  if (!slug || !datasourceSets[slug]) {
    const legacy = {
      formulazione: 'formulazione',
      category: 'categoria-prodotto',
      application_areas_sub: 'stoccaggio-cereali',
      target_pests: 'infestanti',
      target_pests_sub: 'infestanti-sottocategorie',
    }
    const prefix = legacy[field] || slug
    return prefix ? datasourceSets[prefix] : undefined
  }
  return datasourceSets[slug]
}
