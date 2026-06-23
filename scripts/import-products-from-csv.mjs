/**
 * Import product stories from CSV into Storyblok (Management API).
 *
 * Usage:
 *   node scripts/import-products-from-csv.mjs --csv path/to/file.csv
 *   node scripts/import-products-from-csv.mjs --csv path/to/file.csv --dry-run
 *   node scripts/import-products-from-csv.mjs --csv path/to/file.csv --limit 5
 *   node scripts/import-products-from-csv.mjs --csv path/to/file.csv --parent-path it/demo/prodotti
 *   node scripts/import-products-from-csv.mjs --csv path/to/file.csv --update
 *
 * Env (.env.local):
 *   STORYBLOK_MANAGEMENT_TOKEN
 *   NEXT_PUBLIC_STORYBLOK_SPACE_ID
 */

import { readFileSync, existsSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { parse } from 'csv-parse/sync'
import {
  loadDatasourceRegistryFromApi,
  getDatasourceRegistry,
  resolveSingleOptionId,
  resolveMultiOptionIds,
} from './lib/storyblok-datasource-map.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')

// ─── Env ─────────────────────────────────────────────────────────────────────
const envPath = join(ROOT, '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const match = line.match(/^\s*([^#=]+?)\s*=\s*(.*)$/)
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '')
    }
  }
}

const TOKEN = process.env.STORYBLOK_MANAGEMENT_TOKEN || ''
const SPACE_ID = process.env.NEXT_PUBLIC_STORYBLOK_SPACE_ID || ''
const BASE_URL = `https://mapi.storyblok.com/v1/spaces/${SPACE_ID}`

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const ensureFolders = args.includes('--ensure-folders')
const updateExisting = args.includes('--update')
const csvArg = args.find((a) => a.startsWith('--csv='))?.replace('--csv=', '')
const csvPath = csvArg || args[args.indexOf('--csv') + 1]
const parentPath =
  args.find((a) => a.startsWith('--parent-path='))?.replace('--parent-path=', '') ||
  (args.includes('--parent-path') ? args[args.indexOf('--parent-path') + 1] : null) ||
  'it/demo/prodotti'
const parentIdArg = args.find((a) => a.startsWith('--parent-id='))?.replace('--parent-id=', '')
const parentIdOverride = parentIdArg ? Number(parentIdArg) : 0
const limitArg = args.find((a) => a.startsWith('--limit='))?.replace('--limit=', '')
const limit = limitArg ? Number(limitArg) : args.includes('--limit')
  ? Number(args[args.indexOf('--limit') + 1])
  : 0
let datasourceRegistry = null

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ─── Value helpers ───────────────────────────────────────────────────────────
function cleanValue(value) {
  if (value == null) return undefined
  const s = String(value).trim()
  if (!s || s.toLowerCase() === 'nan') return undefined
  return s
}

function splitList(value, separator = ',') {
  const cleaned = cleanValue(value)
  if (!cleaned) return undefined
  const parts = cleaned.split(separator).map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return undefined
  return parts
}

function buildProductContent(row) {
  const content = {
    component: 'product',
    title: cleanValue(row.title) || cleanValue(row.slug) || 'Untitled',
  }

  const secondaryTitle = cleanValue(row.secondary_title)
  if (secondaryTitle) content.secondary_title = secondaryTitle

  const shortDescription = cleanValue(row.short_description)
  if (shortDescription) content.short_description = shortDescription

  const features = textToRichtext(row.features)
  if (features) content.features = features

  const formulazione = resolveSingleOptionId(
    row.formulazione,
    getDatasourceRegistry(datasourceRegistry, 'formulazione')
  )
  if (formulazione) content.formulazione = formulazione

  const productType = resolveSingleOptionId(
    row.product_type,
    getDatasourceRegistry(datasourceRegistry, 'product_type')
  )
  if (productType) content.product_type = productType

  const category = resolveSingleOptionId(
    row.category,
    getDatasourceRegistry(datasourceRegistry, 'category')
  )
  if (category) content.category = category

  const applicationAreas = resolveMultiOptionIds(
    row.application_areas,
    getDatasourceRegistry(datasourceRegistry, 'application_areas')
  )
  if (applicationAreas) content.application_areas = applicationAreas

  const applicationAreasSub = resolveMultiOptionIds(
    row.application_areas_sub,
    getDatasourceRegistry(datasourceRegistry, 'application_areas_sub')
  )
  if (applicationAreasSub) content.application_areas_sub = applicationAreasSub

  const applicationAreasText = textToRichtext(row.application_areas_text)
  if (applicationAreasText) content.application_areas_text = applicationAreasText

  const targetPests = resolveMultiOptionIds(
    row.target_pests,
    getDatasourceRegistry(datasourceRegistry, 'target_pests')
  )
  if (targetPests) content.target_pests = targetPests

  const targetPestsSub = resolveMultiOptionIds(
    row.target_pests_sub,
    getDatasourceRegistry(datasourceRegistry, 'target_pests_sub')
  )
  if (targetPestsSub) content.target_pests_sub = targetPestsSub

  const composition = textToRichtext(row.composition)
  if (composition) content.composition = composition

  const dosage = textToRichtext(row.dosage_and_application)
  if (dosage) content.dosage_and_application = dosage

  const unitsPerCarton = textToRichtext(row.units_per_carton)
  if (unitsPerCarton) content.units_per_carton = unitsPerCarton

  const registration = htmlToPlainText(row.registration)
  if (registration) content.registration = registration

  const video = cleanValue(row.video)
  if (video) content.video = video

  return content
}

function decodeHtmlEntities(text) {
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&sup2;/gi, '²')
    .replace(/&sup3;/gi, '³')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
}

function htmlToParagraphs(html) {
  const normalized = decodeHtmlEntities(html)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
    .replace(/<\/div>\s*<div[^>]*>/gi, '\n\n')

  const withoutTags = normalized.replace(/<[^>]+>/g, '')
  return withoutTags
    .split(/\n\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

function textToRichtext(value) {
  const cleaned = cleanValue(value)
  if (!cleaned) return undefined

  const paragraphs = cleaned.includes('<')
    ? htmlToParagraphs(cleaned)
    : cleaned.split(/\n\n+/).map((p) => p.trim()).filter(Boolean)

  if (paragraphs.length === 0) return undefined

  return {
    type: 'doc',
    content: paragraphs.map((text) => ({
      type: 'paragraph',
      content: [{ type: 'text', text }],
    })),
  }
}

function htmlToPlainText(value) {
  const cleaned = cleanValue(value)
  if (!cleaned) return undefined
  if (!cleaned.includes('<')) return cleaned
  return htmlToParagraphs(cleaned).join('\n')
}

// ─── API ─────────────────────────────────────────────────────────────────────
async function api(path, options = {}, retries = 5) {
  if (dryRun && options.method && options.method !== 'GET') {
    console.log(`    [dry-run] ${options.method} ${path}`)
    return { story: { id: 0 }, stories: [] }
  }

  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: TOKEN,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (res.status === 429 && retries > 0) {
    const wait = 1500 * (6 - retries)
    console.log(`    ⏳ Rate limit, attendo ${wait}ms...`)
    await sleep(wait)
    return api(path, options, retries - 1)
  }

  if (res.status === 204) return {}

  const body = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status} ${options.method || 'GET'} ${path}: ${JSON.stringify(body)}`
    )
  }
  return body
}

async function getStoryByFullSlug(fullSlug) {
  const data = await api(`/stories?with_slug=${encodeURIComponent(fullSlug)}`)
  return data.stories?.[0] || null
}

async function getStoryById(storyId) {
  const data = await api(`/stories/${storyId}`)
  return data.story || null
}

async function ensureFolderPath(segments) {
  let parentId = 0
  let currentPath = ''

  for (const slug of segments) {
    currentPath = currentPath ? `${currentPath}/${slug}` : slug
    let story = await getStoryByFullSlug(currentPath)

    if (!story) {
      if (!ensureFolders) {
        throw new Error(
          `Cartella mancante: ${currentPath}. Usa --ensure-folders per crearla.`
        )
      }

      console.log(`  📁 Creo cartella: ${currentPath}`)
      const payload = {
        story: {
          name: slug,
          slug,
          parent_id: parentId,
          is_folder: true,
        },
      }
      const created = await api('/stories', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      story = created.story
      await sleep(120)
    }

    parentId = story.id
  }

  return parentId
}

async function createProductStory({ name, slug, parentId, content }) {
  const payload = {
    story: {
      name,
      slug,
      parent_id: parentId,
      content,
    },
  }
  return api('/stories', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

async function updateProductStory(storyId, { name, content }) {
  const existing = await getStoryById(storyId)
  if (!existing) {
    throw new Error(`Story ${storyId} non trovata`)
  }

  const mergedContent = {
    ...existing.content,
    ...content,
    _uid: existing.content._uid,
    component: existing.content.component || 'product',
  }

  const payload = {
    force_update: '1',
    story: {
      id: storyId,
      name,
      slug: existing.slug,
      content: mergedContent,
    },
  }
  return api(`/stories/${storyId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

// ─── CSV ─────────────────────────────────────────────────────────────────────
function loadCsv(filePath) {
  const absolute = resolve(filePath)
  if (!existsSync(absolute)) {
    throw new Error(`File CSV non trovato: ${absolute}`)
  }

  const raw = readFileSync(absolute, 'utf-8')
  const records = parse(raw, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
    trim: true,
  })

  return records.filter((row) => cleanValue(row.slug) && cleanValue(row.title))
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function main() {
  if (!TOKEN || !SPACE_ID) {
    console.error('❌ Mancano STORYBLOK_MANAGEMENT_TOKEN o NEXT_PUBLIC_STORYBLOK_SPACE_ID in .env.local')
    process.exit(1)
  }

  if (!csvPath) {
    console.error('❌ Specifica il CSV: --csv path/to/Prodotti_Storyblok_IT_Completo.csv')
    process.exit(1)
  }

  const rows = loadCsv(csvPath)
  const toProcess = limit > 0 ? rows.slice(0, limit) : rows
  const folderSegments = parentPath.split('/').filter(Boolean)

  console.log('⏳ Caricamento datasource da Storyblok API...')
  datasourceRegistry = await loadDatasourceRegistryFromApi({
    baseUrl: BASE_URL,
    token: TOKEN,
  })
  console.log(`✅ Datasource caricati: ${Object.keys(datasourceRegistry).length}`)

  console.log(`\n📦 Import prodotti Storyblok`)
  console.log(`   CSV: ${resolve(csvPath)}`)
  console.log(`   Righe valide: ${rows.length}${limit > 0 ? ` (limite: ${limit})` : ''}`)
  console.log(`   Destinazione: ${parentPath}`)
  console.log(`   Modalità: ${dryRun ? 'DRY RUN' : updateExisting ? 'create + update' : 'create (skip esistenti)'}`)
  console.log('')

  const parentId = parentIdOverride
    ? parentIdOverride
    : await ensureFolderPath(folderSegments)
  console.log(`✅ Cartella parent_id: ${parentId}\n`)

  let created = 0
  let updated = 0
  let skipped = 0
  let failed = 0

  for (const row of toProcess) {
    const slug = cleanValue(row.slug)
    const name = cleanValue(row.title) || slug
    const fullSlug = `${parentPath}/${slug}`
    const content = buildProductContent(row)

    try {
      const existing = await getStoryByFullSlug(fullSlug)

      if (existing) {
        if (updateExisting) {
          console.log(`  ✏️  Update: ${fullSlug}`)
          if (!dryRun) {
            await updateProductStory(existing.id, { name, content })
            await sleep(120)
          }
          updated++
        } else {
          console.log(`  ⏭️  Skip (esiste): ${fullSlug}`)
          skipped++
        }
        continue
      }

      console.log(`  ➕ Create: ${fullSlug}`)
      if (!dryRun) {
        await createProductStory({ name, slug, parentId, content })
        await sleep(120)
      }
      created++
    } catch (error) {
      console.error(`  ❌ ${fullSlug}: ${error.message}`)
      failed++
    }
  }

  console.log('\n─── Riepilogo ───')
  console.log(`  Creati:   ${created}`)
  console.log(`  Aggiornati: ${updated}`)
  console.log(`  Saltati:  ${skipped}`)
  console.log(`  Errori:   ${failed}`)
  console.log('')
}

main().catch((error) => {
  console.error('❌', error.message)
  process.exit(1)
})
