import { parseCarouselVariant } from '@/lib/carousel/parseCarouselVariant'
import { parseListingVariant } from '@/lib/listing/parseListingVariant'

export type PluginResolveRequest =
  | { id: string; kind: 'carousel'; variant: unknown }
  | { id: string; kind: 'listing'; variant: unknown }
  | { id: string; kind: 'related_products'; variant: unknown; unlimited: boolean }
  | { id: string; kind: 'target_pests'; target_pests: unknown }

export type PluginResolveResult = {
  resolved_items?: unknown[]
  resolved_target_pests?: unknown[]
}

const SKIP_KEYS = new Set([
  'resolved_items',
  'resolved_downloadables',
  'resolved_target_pests',
  'related_projects',
  'related_stories',
  'related_news',
  'related_category_products',
  'latest_stories',
  'auto_cta_box',
])

export function asPluginValue(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  const trimmed = raw.trim()
  if (!trimmed) return raw
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return raw
  }
}

function carouselFingerprint(raw: unknown): string {
  return JSON.stringify(parseCarouselVariant(asPluginValue(raw)))
}

function listingFingerprint(raw: unknown): string {
  const { image_ratio: _imageRatio, ...parsed } = parseListingVariant(asPluginValue(raw))
  return JSON.stringify(parsed)
}

function relatedProductsFingerprint(raw: unknown): string {
  if (!raw || typeof raw !== 'object') return ''
  const record = raw as Record<string, unknown>
  const variant =
    record.variant && typeof record.variant === 'object'
      ? record.variant
      : { ...record, variant: 'related_products' }
  return carouselFingerprint(variant)
}

function targetPestsFingerprint(raw: unknown): string {
  const value = asPluginValue(raw)
  if (!value) return ''
  const items = Array.isArray(value)
    ? value
    : value && typeof value === 'object' && Array.isArray((value as { items?: unknown }).items)
      ? (value as { items: unknown[] }).items
      : []

  return items
    .map((item) => {
      if (!item || typeof item !== 'object') return ''
      const record = item as { uuid?: unknown; insect?: unknown; text?: unknown }
      const uuid =
        typeof record.uuid === 'string'
          ? record.uuid
          : typeof record.insect === 'string'
            ? record.insect
            : ''
      const text = typeof record.text === 'string' ? record.text.trim() : ''
      return uuid ? `${uuid}:${text}` : ''
    })
    .filter(Boolean)
    .join('|')
}

export function pluginRequestCacheKey(request: PluginResolveRequest): string {
  switch (request.kind) {
    case 'carousel':
      return `carousel:${carouselFingerprint(request.variant)}`
    case 'listing':
      return `listing:${listingFingerprint(request.variant)}`
    case 'related_products':
      return `related:${request.unlimited ? 'all' : 'limit'}:${relatedProductsFingerprint(request.variant)}`
    case 'target_pests':
      return `pests:${targetPestsFingerprint(request.target_pests)}`
  }
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

/**
 * Blocchi il cui field plugin è diverso dal render SSR.
 * Quelli invariati continuano a usare `resolved_*` già calcolato.
 */
export function collectChangedPluginRequests(
  source: unknown,
  target: unknown,
  requests: PluginResolveRequest[] = [],
): PluginResolveRequest[] {
  if (!target || typeof target !== 'object') return requests

  if (Array.isArray(target)) {
    const sourceArr = Array.isArray(source) ? source : []
    target.forEach((item, index) => {
      const uid =
        item && typeof item === 'object'
          ? (item as { _uid?: string })._uid
          : undefined
      const match = uid
        ? sourceArr.find(
            (sourceItem) =>
              sourceItem &&
              typeof sourceItem === 'object' &&
              (sourceItem as { _uid?: string })._uid === uid,
          )
        : sourceArr[index]
      collectChangedPluginRequests(match, item, requests)
    })
    return requests
  }

  const sourceRecord = asRecord(source)
  const targetRecord = asRecord(target)
  if (!targetRecord) return requests

  const uid = typeof targetRecord._uid === 'string' ? targetRecord._uid : undefined
  const component = targetRecord.component

  if (uid && component === 'carousel') {
    if (carouselFingerprint(sourceRecord?.variant) !== carouselFingerprint(targetRecord.variant)) {
      requests.push({ id: uid, kind: 'carousel', variant: targetRecord.variant })
    }
  }

  if (
    uid &&
    component === 'listing' &&
    (targetRecord.type === 'hub' || targetRecord.type === 'highlight')
  ) {
    const sourceVariant = sourceRecord?.variant ?? sourceRecord?.listing_items
    const targetVariant = targetRecord.variant ?? targetRecord.listing_items
    if (listingFingerprint(sourceVariant) !== listingFingerprint(targetVariant)) {
      requests.push({ id: uid, kind: 'listing', variant: targetVariant })
    }
  }

  if (uid && component === 'project' && targetRecord.related_products) {
    if (
      relatedProductsFingerprint(sourceRecord?.related_products) !==
      relatedProductsFingerprint(targetRecord.related_products)
    ) {
      requests.push({
        id: `${uid}:related_products`,
        kind: 'related_products',
        variant: targetRecord.related_products,
        unlimited: true,
      })
    }
  }

  if (uid && component === 'product') {
    if (
      targetPestsFingerprint(sourceRecord?.target_pests) !==
      targetPestsFingerprint(targetRecord.target_pests)
    ) {
      requests.push({
        id: `${uid}:target_pests`,
        kind: 'target_pests',
        target_pests: targetRecord.target_pests,
      })
    }
  }

  for (const key of Object.keys(targetRecord)) {
    if (SKIP_KEYS.has(key)) continue
    const child = targetRecord[key]
    if (!child || typeof child !== 'object') continue
    collectChangedPluginRequests(sourceRecord?.[key], child, requests)
  }

  return requests
}

export function applyPluginOverrides<T>(
  content: T,
  overrides: Record<string, PluginResolveResult>,
): T {
  if (!content || typeof content !== 'object') return content
  if (Object.keys(overrides).length === 0) return content

  const visit = (node: unknown): unknown => {
    if (!node || typeof node !== 'object') return node

    if (Array.isArray(node)) return node.map((item) => visit(item))

    const record = { ...(node as Record<string, unknown>) }
    const uid = typeof record._uid === 'string' ? record._uid : undefined

    if (uid && overrides[uid] && 'resolved_items' in overrides[uid]) {
      record.resolved_items = overrides[uid].resolved_items
    }

    const pests = uid ? overrides[`${uid}:target_pests`] : undefined
    if (pests && 'resolved_target_pests' in pests) {
      record.resolved_target_pests = pests.resolved_target_pests
    }

    const related = uid ? overrides[`${uid}:related_products`] : undefined
    if (
      related &&
      'resolved_items' in related &&
      record.related_products &&
      typeof record.related_products === 'object'
    ) {
      record.related_products = {
        ...(record.related_products as Record<string, unknown>),
        resolved_items: related.resolved_items,
      }
    }

    for (const key of Object.keys(record)) {
      if (SKIP_KEYS.has(key) || key === 'related_products') continue
      const child = record[key]
      if (child && typeof child === 'object') {
        record[key] = visit(child)
      }
    }

    return record
  }

  return visit(content) as T
}
