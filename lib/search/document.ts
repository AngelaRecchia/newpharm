import { getStoriesByComponent, type Story } from '@/lib/api/storyblok/stories'
import { richTextToPlainText } from '@/lib/api/utils/richtext'
import { getCoverAsset } from '@/lib/downloadable/assets'
import { parseCarouselVariant } from '@/lib/carousel/parseCarouselVariant'
import { getApplicationAreaEntries } from '@/lib/products/applicationAreas'
import type { SearchDocument, SearchDocumentType } from './types'

const SEARCHABLE_COMPONENTS: Record<string, SearchDocumentType> = {
  product: 'product',
  project: 'project',
  story: 'story',
  downloadable: 'downloadable',
}

/** Trasforma stringhe o richtext in testo puro. */
export function normalizeText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object') {
    return richTextToPlainText(value as any)
  }
  return ''
}

/** Converte un valore in array di stringhe non vuote. */
export function toStringArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : normalizeText(item)))
      .filter(Boolean)
  }
  const text = normalizeText(value)
  return text ? [text] : []
}

function firstAsset(assets: unknown): unknown | undefined {
  if (Array.isArray(assets) && assets.length > 0) return assets[0]
  return undefined
}

function projectAsset(content: Record<string, unknown>): unknown | undefined {
  return firstAsset(content.image) ?? firstAsset(content.asset)
}

function extractImage(
  type: SearchDocumentType,
  content: Record<string, unknown>,
): unknown {
  switch (type) {
    case 'product':
      return getCoverAsset(content.images) ?? null
    case 'project':
      return projectAsset(content) ?? null
    case 'story':
      return firstAsset(content.asset) ?? null
    case 'downloadable':
      return content.image ?? null
    default:
      return null
  }
}

function extractCategory(
  type: SearchDocumentType,
  content: Record<string, unknown>,
): string | null {
  switch (type) {
    case 'project':
    case 'downloadable':
      return typeof content.division === 'string' ? content.division : null
    case 'story':
      return typeof content.tag === 'string' ? content.tag : null
    case 'product':
      return null
    default:
      return null
  }
}

function extractTags(
  type: SearchDocumentType,
  content: Record<string, unknown>,
): string[] {
  const tags: string[] = []

  if (type === 'product') {
    tags.push(...toStringArray(content.product_type))
    tags.push(...toStringArray(content.formulazione))
  }

  if (type === 'downloadable' && content.kind) {
    tags.push(...toStringArray(content.kind))
  }

  return tags.filter(Boolean)
}

function extractDivisions(content: Record<string, unknown>): string[] {
  const raw = content.divisions
  if (!raw) return []
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string')
  if (typeof raw === 'string') return [raw]
  return []
}

/** Estrae testo puro da un singolo campo di un blok del body. */
function extractBodyFieldText(value: unknown, visited: WeakSet<object> = new WeakSet()): string {
  if (typeof value === 'string') return value

  if (value && typeof value === 'object') {
    if (visited.has(value)) return ''
    visited.add(value)

    // Riconosci un richtext ProseMirror per struttura.
    const obj = value as Record<string, unknown>
    if (typeof obj.type === 'string' && (Array.isArray(obj.content) || typeof obj.text === 'string')) {
      return normalizeText(value)
    }

    if (Array.isArray(value)) {
      return value
        .map((item) => extractBodyFieldText(item, visited))
        .filter(Boolean)
        .join(' ')
    }

    // Scansiona oggetti generici escludendo chiavi tecniche.
    const skipKeys = new Set([
      '_uid',
      'component',
      '_editable',
      'id',
      'uuid',
      'slug',
      'name',
      'filename',
      'url',
      'cached_url',
      'linktype',
      'fieldtype',
      'focus',
      'copyright',
      'alt',
      'title',
    ])

    return Object.entries(obj)
      .filter(([key]) => !skipKeys.has(key))
      .map(([, v]) => extractBodyFieldText(v, visited))
      .filter(Boolean)
      .join(' ')
  }

  return ''
}

/** Estrae testo puro da tutti i moduli nel body di una story. */
function extractBodyText(body: unknown): string {
  if (!Array.isArray(body)) return ''
  return body
    .map((blok) => extractBodyFieldText(blok))
    .filter(Boolean)
    .join(' ')
}

function isResolvedInsect(value: unknown): value is { content?: { title?: string } | null } {
  return value !== null && typeof value === 'object'
}

function resolveInsectName(
  insectRef: unknown,
  insectByUuid: Map<string, string>,
): string | null {
  if (!insectRef) return null

  // Già risolto dal CDN in un oggetto story/insect.
  if (isResolvedInsect(insectRef)) {
    const content = insectRef.content
    if (content && typeof content.title === 'string' && content.title) {
      return content.title
    }
  }

  // UUID da risolvere nella mappa precaricata.
  if (typeof insectRef === 'string') {
    return insectByUuid.get(insectRef) || null
  }

  return null
}

/** Estrae nomi insetti + testo custom dal campo target_pests. */
export function extractTargetPests(
  targetPests: unknown,
  insectByUuid: Map<string, string> = new Map(),
): string[] {
  if (!targetPests) return []

  const results = new Set<string>()

  const addText = (text: unknown) => {
    const plain = normalizeText(text)
    if (plain) results.add(plain)
  }

  // Plugin listing-items: { items: [{ uuid, text? }] }
  if (typeof targetPests === 'object' && !Array.isArray(targetPests)) {
    const plugin = targetPests as { items?: unknown[] }
    if (Array.isArray(plugin.items)) {
      for (const item of plugin.items) {
        if (item && typeof item === 'object') {
          const entry = item as { uuid?: unknown; text?: unknown }
          const name = resolveInsectName(entry.uuid, insectByUuid)
          if (name) results.add(name)
          addText(entry.text)
        }
      }
    }
    return Array.from(results)
  }

  // Array di blok target_pest_item.
  if (Array.isArray(targetPests)) {
    for (const item of targetPests) {
      if (!item || typeof item !== 'object') continue
      const entry = item as { insect?: unknown; text?: unknown }
      const name = resolveInsectName(entry.insect, insectByUuid)
      if (name) results.add(name)
      addText(entry.text)
    }
  }

  return Array.from(results)
}

/** Ritorna true se il campo related_products ha selezione manuale di prodotti. */
export function hasManualRelatedProducts(relatedProducts: unknown): boolean {
  if (!relatedProducts || typeof relatedProducts !== 'object') return false
  const parsed = parseCarouselVariant(relatedProducts)
  return parsed.variant === 'related_products' && parsed.selection_mode === 'manual'
}

/** Estrae titoli prodotti correlati o tag categoria dal plugin related_products. */
export function extractRelatedProducts(
  relatedProducts: unknown,
  productByUuid: Map<string, string> = new Map(),
): { names: string[]; categoryTag: string | null } {
  const empty = { names: [] as string[], categoryTag: null as string | null }
  if (!relatedProducts || typeof relatedProducts !== 'object') return empty

  const parsed = parseCarouselVariant(relatedProducts)
  if (parsed.variant !== 'related_products') return empty

  // Modo manuale: risolve gli UUID con i titoli dei prodotti.
  if (parsed.selection_mode === 'manual') {
    const names = parsed.items
      .map((uuid) => productByUuid.get(uuid))
      .filter((name): name is string => Boolean(name))
    return { names, categoryTag: null }
  }

  // Modo dinamico: indicizza solo il tag categoria.
  const categoryTag = parsed.category || parsed.application_area || null
  return { names: [], categoryTag }
}

type NameIndexKey = `${string}:${'draft' | 'published'}`

const productNameCache = new Map<NameIndexKey, Map<string, string>>()
const insectNameCache = new Map<NameIndexKey, Map<string, string>>()

function nameIndexKey(locale: string, version: 'draft' | 'published'): NameIndexKey {
  return `${locale}:${version}`
}

function getCachedProductNameIndex(locale: string, version: 'draft' | 'published') {
  return productNameCache.get(nameIndexKey(locale, version))
}

function setCachedProductNameIndex(
  locale: string,
  version: 'draft' | 'published',
  index: Map<string, string>,
) {
  productNameCache.set(nameIndexKey(locale, version), index)
}

function getCachedInsectNameIndex(locale: string, version: 'draft' | 'published') {
  return insectNameCache.get(nameIndexKey(locale, version))
}

function setCachedInsectNameIndex(
  locale: string,
  version: 'draft' | 'published',
  index: Map<string, string>,
) {
  insectNameCache.set(nameIndexKey(locale, version), index)
}

/** Invalida le cache degli indici di nome (da chiamare da webhook/cache invalidation). */
export function invalidateSearchNameCaches(
  locale?: string,
  version?: 'draft' | 'published',
) {
  if (locale && version) {
    const key = nameIndexKey(locale, version)
    productNameCache.delete(key)
    insectNameCache.delete(key)
  } else {
    productNameCache.clear()
    insectNameCache.clear()
  }
}

/** Carica tutti i prodotti di un locale e restituisce uuid → nome. */
export async function buildProductNameIndex(
  locale: string,
  version: 'draft' | 'published',
): Promise<Map<string, string>> {
  const cached = getCachedProductNameIndex(locale, version)
  if (cached) return cached

  const stories = await getStoriesByComponent('product', locale, { version })
  const index = new Map<string, string>()
  for (const story of stories) {
    const content = (story.content ?? {}) as Record<string, unknown>
    const name = typeof content.title === 'string' ? content.title : story.name
    if (name) index.set(story.uuid, name)
  }

  setCachedProductNameIndex(locale, version, index)
  return index
}

/** Carica tutti gli insetti di un locale e restituisce uuid → titolo. */
export async function buildInsectNameIndex(
  locale: string,
  version: 'draft' | 'published',
): Promise<Map<string, string>> {
  const cached = getCachedInsectNameIndex(locale, version)
  if (cached) return cached

  try {
    const stories = await getStoriesByComponent('insect', locale, { version })
    const index = new Map<string, string>()
    for (const story of stories) {
      const content = (story.content ?? {}) as Record<string, unknown>
      const title = typeof content.title === 'string' ? content.title : story.name
      if (title) index.set(story.uuid, title)
    }

    setCachedInsectNameIndex(locale, version, index)
    return index
  } catch (error) {
    console.warn('[Search] Failed to build insect index:', error)
    return new Map()
  }
}

export function getSearchDocumentType(
  component: string | undefined,
): SearchDocumentType | null {
  if (!component) return null
  return SEARCHABLE_COMPONENTS[component] || null
}

const applicationAreaEntries = getApplicationAreaEntries()
const applicationAreaById = new Map(
  applicationAreaEntries.flatMap((entry) => [
    [entry.id, entry.value],
    [entry.name, entry.value],
    [entry.value, entry.value],
  ]),
)

/** Converte gli id/slug salvati in `application_areas` nelle label leggibili. */
function resolveApplicationAreas(raw: unknown): string[] {
  if (!raw) return []
  const values = Array.isArray(raw) ? raw : [raw]
  const labels = new Set<string>()

  for (const value of values) {
    const key = String(value).trim()
    if (!key) continue
    const label = applicationAreaById.get(key)
    if (label) {
      labels.add(label)
    } else {
      // Fallback: se non c'è nel datasource, indicizza il valore raw
      // (utile durante transizioni di import).
      labels.add(key)
    }
  }

  return Array.from(labels)
}

export interface SearchDocumentContext {
  productByUuid?: Map<string, string>
  insectByUuid?: Map<string, string>
}

export function storyToSearchDocument(
  type: SearchDocumentType,
  story: Story,
  locale: string,
  context: SearchDocumentContext = {},
): SearchDocument {
  const content = (story.content ?? {}) as Record<string, unknown>
  const { productByUuid = new Map(), insectByUuid = new Map() } = context

  const doc: SearchDocument = {
    objectID: `${locale}::${type}::${story.uuid}`,
    uuid: story.uuid,
    type,
    locale,
    slug: story.full_slug,
    name: story.name,
    title: (content.title as string) || story.name,
    secondary_title:
      type === 'product'
        ? (content.secondary_title as string | undefined) || null
        : null,
    description: (content.short_description as string | undefined) || null,
    image: extractImage(type, content),
    category: extractCategory(type, content),
    tags: extractTags(type, content),
  }

  if (type === 'project') {
    doc.divisions = extractDivisions(content)
    const related = extractRelatedProducts(content.related_products, productByUuid)
    doc.related_product_names = related.names
    doc.related_category_tag = related.categoryTag
  }

  if (type === 'story') {
    doc.body_text = extractBodyText(content.body) || null
    const related = extractRelatedProducts(content.related_products, productByUuid)
    doc.related_product_names = related.names
    doc.related_category_tag = related.categoryTag
  }

  if (type === 'product') {
    doc.composition = normalizeText(content.composition) || null
    doc.features = (content.features as string | undefined) || null
    doc.formulation = toStringArray(content.formulazione).join(' ') || null
    doc.product_type = toStringArray(content.product_type).join(' ') || null
    doc.application_areas = resolveApplicationAreas(content.application_areas)
    doc.application_areas_text = (content.application_areas_text as string | undefined) || null
    doc.dosage_and_application = (content.dosage_and_application as string | undefined) || null
    doc.usage = (content.usage as string | undefined) || null
    doc.registration = (content.registration as string | undefined) || null
    doc.target_pests = extractTargetPests(content.target_pests, insectByUuid)

    const related = extractRelatedProducts(content.related_products, productByUuid)
    doc.related_product_names = related.names
    doc.related_category_tag = related.categoryTag
  }

  if (type === 'downloadable') {
    doc.kind = typeof content.kind === 'string' ? content.kind : null
    doc.divisions = extractDivisions(content)
  }

  return doc
}
