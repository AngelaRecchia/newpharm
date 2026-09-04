import type { DownloadableKind } from '@/types/storyblok'
import { RESOURCE_TABS, type ResourceTab } from './types'

const KIND_SET = new Set<DownloadableKind>(['catalog', 'brochure', 'app', 'other'])
const TAB_SET = new Set<string>(RESOURCE_TABS)

export function parseDownloadableKind(raw: unknown): DownloadableKind | null {
  return typeof raw === 'string' && KIND_SET.has(raw as DownloadableKind)
    ? (raw as DownloadableKind)
    : null
}

/** Catalog legacy (`component: catalog`) o downloadable con `kind: catalog`. */
export function isCatalogContent(content: unknown): boolean {
  if (!content || typeof content !== 'object') return false
  const record = content as { component?: unknown; kind?: unknown }
  if (record.component === 'catalog') return true
  return (
    record.component === 'downloadable' &&
    parseDownloadableKind(record.kind) === 'catalog'
  )
}

export function downloadableKindToTab(kind: DownloadableKind): ResourceTab {
  switch (kind) {
    case 'catalog':
      return 'cataloghi'
    case 'app':
      return 'app'
    case 'other':
      return 'altro'
    default:
      return 'brochure'
  }
}

export function parseResourceTab(raw: unknown): ResourceTab | null {
  return typeof raw === 'string' && TAB_SET.has(raw) ? (raw as ResourceTab) : null
}

export function parseResourceTabs(raw: unknown): ResourceTab[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  const seen = new Set<ResourceTab>()
  for (const part of raw.split(',')) {
    const parsed = parseResourceTab(part.trim())
    if (parsed) seen.add(parsed)
  }
  return RESOURCE_TABS.filter((tab) => seen.has(tab))
}

export function sortResourceTabs(tabs: readonly ResourceTab[]): ResourceTab[] {
  const seen = new Set(tabs)
  return RESOURCE_TABS.filter((tab) => seen.has(tab))
}

export function parseYear(raw: unknown, fallbackDate?: string | null): number {
  if (typeof raw === 'number' && Number.isFinite(raw) && raw >= 2000) {
    return Math.trunc(raw)
  }
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Number.parseInt(raw, 10)
    if (Number.isFinite(parsed) && parsed >= 2000) return parsed
  }
  if (fallbackDate) {
    const timestamp = Date.parse(fallbackDate)
    if (!Number.isNaN(timestamp)) return new Date(timestamp).getFullYear()
  }
  return new Date().getFullYear()
}

export function parseTimestamp(raw: unknown, fallbacks: Array<string | null | undefined>): number {
  if (typeof raw === 'string' && raw.trim()) {
    const parsed = Date.parse(raw)
    if (!Number.isNaN(parsed)) return parsed
  }
  for (const fallback of fallbacks) {
    if (!fallback) continue
    const parsed = Date.parse(fallback)
    if (!Number.isNaN(parsed)) return parsed
  }
  return 0
}
